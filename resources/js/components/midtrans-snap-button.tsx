import * as React from 'react';
import { router } from '@inertiajs/react';
import { CreditCard, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MidtransSnapButtonProps {
    /** ID record di tabel `returns` */
    returnId: number;
    /** Total denda dalam rupiah */
    totalFine: number;
    /** Status pembayaran saat ini */
    paymentStatus: 'paid' | 'unpaid' | string;
    /** Callback setelah pembayaran sukses */
    onSuccess?: () => void;
    /** Callback yang dipanggil sesaat sebelum popup Midtrans terbuka */
    onBeforeSnap?: () => void;
    className?: string;
}

// Extend window untuk Midtrans Snap
declare global {
    interface Window {
        snap?: {
            pay: (
                token: string,
                options: {
                    onSuccess?: (result: any) => void;
                    onPending?: (result: any) => void;
                    onError?:   (result: any) => void;
                    onClose?:   () => void;
                }
            ) => void;
        };
    }
}

/**
 * Tombol Bayar Denda dengan integrasi Midtrans Snap (popup).
 * Otomatis load Snap.js dari CDN Midtrans berdasarkan environment.
 */
export function MidtransSnapButton({
    returnId,
    totalFine,
    paymentStatus,
    onSuccess,
    onBeforeSnap,
    className,
}: MidtransSnapButtonProps) {
    const [loading,   setLoading]   = React.useState(false);
    const [snapReady, setSnapReady] = React.useState(false);
    const [error,     setError]     = React.useState<string | null>(null);

    // Load Midtrans Snap.js sekali saat komponen mount
    React.useEffect(() => {
        if (window.snap) {
            setSnapReady(true);
            return;
        }

        const isProduction = import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === 'true';
        const clientKey    = import.meta.env.VITE_MIDTRANS_CLIENT_KEY as string;
        const snapUrl      = isProduction
            ? 'https://app.midtrans.com/snap/snap.js'
            : 'https://app.sandbox.midtrans.com/snap/snap.js';

        const script = document.createElement('script');
        script.src             = snapUrl;
        script.dataset.clientKey = clientKey;
        script.async           = true;
        script.onload          = () => setSnapReady(true);
        script.onerror         = () => setError('Gagal memuat Midtrans Snap.js');
        document.head.appendChild(script);

        return () => {
            // Jangan hapus script saat unmount (biarkan di-cache browser)
        };
    }, []);

    const handlePay = async () => {
        if (!snapReady) {
            setError('Midtrans belum siap, coba beberapa saat lagi.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`/payment/${returnId}/snap-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
                },
            });

            const data = await res.json();

            if (!res.ok || data.error) {
                setError(data.error ?? 'Gagal mendapatkan token pembayaran.');
                return;
            }

            // Panggil callback sebelum membuka popup (misal: untuk menutup Modal/Dialog agar tidak bentrok focus trap)
            onBeforeSnap?.();

            window.snap!.pay(data.snap_token, {
                onSuccess: async (result) => {
                    console.log('Midtrans success:', result);
                    // Paksa backend cek status ke Midtrans API secara synchronous
                    // Ini berguna jika webhook lambat atau tidak jalan di local
                    try {
                        await fetch(`/payment/${returnId}/status`);
                    } catch (e) {
                        console.error('Failed to sync status', e);
                    }
                    
                    // Reload halaman agar status di tabel terupdate
                    router.reload({ only: [] });
                    onSuccess?.();
                },
                onPending: async (result) => {
                    console.log('Midtrans pending:', result);
                    try {
                        await fetch(`/payment/${returnId}/status`);
                    } catch (e) {}
                    router.reload({ only: [] });
                },
                onError: (result) => {
                    console.error('Midtrans error:', result);
                    setError('Pembayaran gagal. Coba lagi.');
                },
                onClose: () => {
                    // User tutup popup tanpa bayar
                    setLoading(false);
                },
            });
        } catch (err) {
            setError('Terjadi kesalahan. Periksa koneksi internet kamu.');
        } finally {
            setLoading(false);
        }
    };

    // Sudah lunas
    if (paymentStatus === 'paid') {
        return (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-4" />
                Lunas
            </span>
        );
    }

    // Tidak ada denda
    if (totalFine <= 0) {
        return (
            <span className="text-sm text-muted-foreground">Tidak ada denda</span>
        );
    }

    return (
        <div className="flex flex-col gap-1">
            <Button
                onClick={handlePay}
                disabled={loading || !snapReady}
                size="sm"
                className={className}
            >
                {loading ? (
                    <Loader2 className="size-4 animate-spin" />
                ) : (
                    <CreditCard className="size-4" />
                )}
                {loading ? 'Memproses...' : `Bayar Rp ${totalFine.toLocaleString('id-ID')}`}
            </Button>

            {error && (
                <p className="flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="size-3" />
                    {error}
                </p>
            )}
        </div>
    );
}
