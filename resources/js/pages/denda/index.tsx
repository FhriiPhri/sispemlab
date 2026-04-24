import { router } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { toast } from 'sonner';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
    AlertCircle,
    Calculator,
    Clock,
    Loader2,
    Save,
    ShieldAlert,
    Wrench,
} from 'lucide-react';

type Setting = {
    id: number;
    key: string;
    value: string;
    type: string;
    description: string | null;
};

type Props = {
    settings: Setting[];
};

function formatRupiah(n: number) {
    return 'Rp ' + Math.round(n).toLocaleString('id-ID');
}

export default function DendaIndex({ settings }: Props) {
    const [isSaving, setIsSaving] = useState(false);

    const getVal = (key: string, fallback: string) =>
        settings.find((s) => s.key === key)?.value ?? fallback;

    const getId = (key: string) =>
        settings.find((s) => s.key === key)?.id ?? 0;

    const [latePercent, setLatePercent] = useState(getVal('fine_late_percentage_per_hour', '1'));
    const [damagePercent, setDamagePercent] = useState(getVal('fine_damage_percentage', '50'));
    const [lostPercent, setLostPercent] = useState(getVal('fine_lost_percentage', '100'));

    // Preview simulation
    const [previewPrice, setPreviewPrice] = useState('1000000');
    const [previewHours, setPreviewHours] = useState('3');

    const price = parseFloat(previewPrice) || 0;
    const hours = parseFloat(previewHours) || 0;
    const lateFine = price * (parseFloat(latePercent) / 100) * hours;
    const damageFine = price * (parseFloat(damagePercent) / 100);
    const lostFine = price * (parseFloat(lostPercent) / 100);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        router.put('/denda', {
            settings: [
                { id: getId('fine_late_percentage_per_hour'), value: latePercent },
                { id: getId('fine_damage_percentage'), value: damagePercent },
                { id: getId('fine_lost_percentage'), value: lostPercent },
            ],
        }, {
            preserveScroll: true,
            onSuccess: () => toast.success('Pengaturan denda berhasil disimpan.'),
            onError: () => toast.error('Gagal menyimpan pengaturan.'),
            onFinish: () => setIsSaving(false),
        });
    };

    return (
        <div className="space-y-6 p-4 md:p-6 w-full max-w-full overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <Heading
                    title="Kelola Denda"
                    description="Tentukan persentase denda berdasarkan harga alat yang dipinjam."
                />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Form Pengaturan */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Denda Telat */}
                    <Card className="border-border bg-card shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-500/10">
                                    <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-base">Denda Keterlambatan</CardTitle>
                                    <CardDescription className="text-xs">Per jam dari harga alat</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-3">
                                <Input
                                    id="late-percent"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={latePercent}
                                    onChange={(e) => setLatePercent(e.target.value)}
                                    className="max-w-[130px] font-mono text-lg font-semibold"
                                />
                                <span className="text-muted-foreground font-medium">% / jam dari harga alat</span>
                            </div>
                            <p className="text-xs text-muted-foreground bg-muted/40 rounded-md p-2">
                                Contoh: Harga alat <strong>Rp 1.000.000</strong>, telat <strong>3 jam</strong> → Denda = 
                                <strong className="text-amber-600"> {formatRupiah(1000000 * (parseFloat(latePercent) / 100) * 3)}</strong>
                            </p>
                        </CardContent>
                    </Card>

                    {/* Denda Kerusakan */}
                    <Card className="border-border bg-card shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-500/10">
                                    <Wrench className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-base">Denda Kerusakan</CardTitle>
                                    <CardDescription className="text-xs">Sekali bayar dari harga alat yang rusak</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-3">
                                <Input
                                    id="damage-percent"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={damagePercent}
                                    onChange={(e) => setDamagePercent(e.target.value)}
                                    className="max-w-[130px] font-mono text-lg font-semibold"
                                />
                                <span className="text-muted-foreground font-medium">% dari harga alat</span>
                            </div>
                            <p className="text-xs text-muted-foreground bg-muted/40 rounded-md p-2">
                                Contoh: Harga alat <strong>Rp 1.000.000</strong> rusak → Denda = 
                                <strong className="text-orange-600"> {formatRupiah(1000000 * (parseFloat(damagePercent) / 100))}</strong>
                            </p>
                        </CardContent>
                    </Card>

                    {/* Denda Kehilangan */}
                    <Card className="border-border bg-card shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-500/10">
                                    <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-base">Denda Kehilangan</CardTitle>
                                    <CardDescription className="text-xs">Sekali bayar dari harga alat yang hilang</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-3">
                                <Input
                                    id="lost-percent"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={lostPercent}
                                    onChange={(e) => setLostPercent(e.target.value)}
                                    className="max-w-[130px] font-mono text-lg font-semibold"
                                />
                                <span className="text-muted-foreground font-medium">% dari harga alat</span>
                            </div>
                            <p className="text-xs text-muted-foreground bg-muted/40 rounded-md p-2">
                                Contoh: Harga alat <strong>Rp 1.000.000</strong> hilang → Denda = 
                                <strong className="text-rose-600"> {formatRupiah(1000000 * (parseFloat(lostPercent) / 100))}</strong>
                            </p>
                        </CardContent>
                    </Card>

                    <Button type="submit" disabled={isSaving} className="w-full gap-2">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan Denda'}
                    </Button>
                </form>

                {/* Preview Kalkulator */}
                <div className="space-y-4">
                    <Card className="border-primary/20 bg-primary/5 shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Calculator className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-base">Simulasi Kalkulator Denda</CardTitle>
                                    <CardDescription className="text-xs">Coba masukkan harga alat dan durasi telat</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Harga Alat (Rp)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={previewPrice}
                                        onChange={(e) => setPreviewPrice(e.target.value)}
                                        className="font-mono"
                                        placeholder="1000000"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Jam Terlambat</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={previewHours}
                                        onChange={(e) => setPreviewHours(e.target.value)}
                                        className="font-mono"
                                        placeholder="3"
                                    />
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-3">
                                <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-3.5 w-3.5 text-amber-600" />
                                        <span className="text-sm font-medium">Denda Telat</span>
                                        <span className="text-xs text-muted-foreground">({latePercent}% × {previewHours} jam)</span>
                                    </div>
                                    <span className="font-bold font-mono text-amber-700 dark:text-amber-400">
                                        {formatRupiah(lateFine)}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                                    <div className="flex items-center gap-2">
                                        <Wrench className="h-3.5 w-3.5 text-orange-600" />
                                        <span className="text-sm font-medium">Denda Kerusakan</span>
                                        <span className="text-xs text-muted-foreground">({damagePercent}%)</span>
                                    </div>
                                    <span className="font-bold font-mono text-orange-700 dark:text-orange-400">
                                        {formatRupiah(damageFine)}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800">
                                    <div className="flex items-center gap-2">
                                        <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
                                        <span className="text-sm font-medium">Denda Kehilangan</span>
                                        <span className="text-xs text-muted-foreground">({lostPercent}%)</span>
                                    </div>
                                    <span className="font-bold font-mono text-rose-700 dark:text-rose-400">
                                        {formatRupiah(lostFine)}
                                    </span>
                                </div>
                            </div>

                            <Separator />

                            <div className="flex items-start gap-2 bg-muted/40 rounded-lg p-3">
                                <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Denda telat dihitung otomatis saat petugas memproses pengembalian. Denda kerusakan dan kehilangan diinput manual oleh petugas saat pengembalian.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

DendaIndex.layout = {
    breadcrumbs: [{ title: 'Kelola Denda', href: '/denda' }],
};
