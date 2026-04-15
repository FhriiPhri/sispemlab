import { Head, useForm, router } from '@inertiajs/react';
import { LoaderCircle, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

type Props = {
    email: string;
    status?: string;
};

export default function VerifyOtp({ email, status }: Props) {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [processing, setProcessing] = useState(false);
    const [resending, setResending] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const inputs = useRef<Array<HTMLInputElement | null>>([]);

    // Countdown timer
    useEffect(() => {
        if (countdown <= 0) return;
        const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [countdown]);

    const handleChange = (idx: number, val: string) => {
        if (!/^\d?$/.test(val)) return;
        const next = [...otp];
        next[idx] = val;
        setOtp(next);
        if (val && idx < 5) inputs.current[idx + 1]?.focus();
    };

    const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
            inputs.current[idx - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        const next = paste.split('');
        setOtp(next.concat(Array(6 - next.length).fill('')));
        inputs.current[Math.min(paste.length, 5)]?.focus();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const code = otp.join('');
        if (code.length < 6) {
            toast.error('Masukkan 6 digit kode OTP terlebih dahulu.');
            return;
        }

        setProcessing(true);
        router.post('/forgot-password/verify', { email, otp: code }, {
            onError: (errs) => {
                toast.error(errs.otp ?? 'OTP tidak valid atau kadaluarsa.');
                setOtp(['', '', '', '', '', '']);
                inputs.current[0]?.focus();
            },
            onFinish: () => setProcessing(false),
        });
    };

    const handleResend = () => {
        setResending(true);
        router.post('/forgot-password/resend', { email }, {
            onSuccess: () => {
                toast.success('OTP baru telah dikirim!');
                setCountdown(60);
                setOtp(['', '', '', '', '', '']);
            },
            onError: () => toast.error('Gagal mengirim ulang OTP.'),
            onFinish: () => setResending(false),
        });
    };

    return (
        <>
            <Head title="Verifikasi OTP" />

            <div className="space-y-6">
                {status && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300 text-center">
                        {status}
                    </div>
                )}

                <div className="text-center space-y-1">
                    <p className="text-sm text-muted-foreground">
                        Kode OTP dikirim ke:
                    </p>
                    <p className="font-semibold text-foreground">{email}</p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div className="grid gap-6">
                        {/* OTP Input Boxes */}
                        <div
                            className="flex justify-center gap-3"
                            onPaste={handlePaste}
                        >
                            {otp.map((digit, idx) => (
                                <input
                                    key={idx}
                                    ref={(el) => { inputs.current[idx] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleChange(idx, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(idx, e)}
                                    className={`
                                        w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 bg-background
                                        focus:outline-none transition-all duration-150
                                        ${digit
                                            ? 'border-primary text-primary shadow-sm shadow-primary/20'
                                            : 'border-border text-foreground'
                                        }
                                        focus:border-primary focus:ring-2 focus:ring-primary/20
                                    `}
                                />
                            ))}
                        </div>

                        <Button type="submit" className="w-full gap-2 mt-4" disabled={processing}>
                            {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                            {processing ? 'Memverifikasi...' : 'Verifikasi OTP'}
                        </Button>
                    </div>
                </form>

                {/* Resend */}
                <div className="text-center text-sm text-muted-foreground mt-4">
                    Tidak menerima kode?{' '}
                    {countdown > 0 ? (
                        <span className="font-medium text-foreground">
                            Kirim ulang dalam {countdown}s
                        </span>
                    ) : (
                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={resending}
                            className="inline-flex items-center gap-1 font-medium text-primary hover:underline disabled:opacity-50"
                        >
                            {resending && <RotateCcw className="h-3 w-3 animate-spin" />}
                            Kirim ulang OTP
                        </button>
                    )}
                </div>

                <div className="text-center text-sm">
                    <a href="/forgot-password" className="text-muted-foreground hover:text-foreground">
                        ← Ganti email
                    </a>
                </div>
            </div>
        </>
    );
}

VerifyOtp.layout = {
    title: 'Verifikasi OTP',
    description: 'Masukkan kode 6-digit yang dikirim ke email Anda',
};
