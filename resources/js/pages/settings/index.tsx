import { router, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { toast } from 'sonner';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Settings2, Save } from 'lucide-react';

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

export default function SettingsIndex({ settings }: Props) {
    const [isSaving, setIsSaving] = useState(false);

    // Initial state dari props settings
    const initialSettings = settings.reduce(
        (acc, curr) => {
            acc[curr.key] = { id: curr.id, value: curr.value };
            return acc;
        },
        {} as Record<string, { id: number; value: string }>,
    );

    const form = useForm({
        fine_late_percentage_per_hour:
            initialSettings['fine_late_percentage_per_hour']?.value || '1',
        fine_damage_percentage:
            initialSettings['fine_damage_percentage']?.value || '50',
        fine_lost_percentage:
            initialSettings['fine_lost_percentage']?.value || '100',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const payload = {
            settings: [
                {
                    id: initialSettings['fine_late_percentage_per_hour'].id,
                    value: form.data.fine_late_percentage_per_hour,
                },
                {
                    id: initialSettings['fine_damage_percentage'].id,
                    value: form.data.fine_damage_percentage,
                },
                {
                    id: initialSettings['fine_lost_percentage'].id,
                    value: form.data.fine_lost_percentage,
                },
            ],
        };

        router.put('/denda', payload, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Pengaturan denda berhasil disimpan.');
            },
            onError: (errors) => {
                toast.error('Gagal menyimpan pengaturan.');
                console.error(errors);
            },
            onFinish: () => setIsSaving(false),
        });
    };

    return (
        <div className="w-full max-w-full space-y-6 overflow-hidden p-4 md:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <Heading
                    title="Kelola Denda"
                    description="Atur persentase denda keterlambatan, kerusakan, dan kehilangan alat."
                />
            </div>

            <Card className="max-w-2xl border-border bg-card shadow-sm">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-primary/10 p-2">
                            <Settings2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle>Persentase Denda</CardTitle>
                            <CardDescription>
                                Denda akan dikalkulasikan secara otomatis
                                berdasarkan harga alat yang dipinjam.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2 rounded-lg border bg-muted/20 p-4">
                            <Label>Persentase Denda Telat (per jam)</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={
                                        form.data.fine_late_percentage_per_hour
                                    }
                                    onChange={(e) =>
                                        form.setData(
                                            'fine_late_percentage_per_hour',
                                            e.target.value,
                                        )
                                    }
                                    className="max-w-[150px]"
                                />
                                <span className="font-semibold">
                                    % dari harga alat
                                </span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Contoh: Jika harga alat Rp 1.000.000 dan diisi
                                1%, maka denda telat Rp 10.000 / jam.
                            </p>
                        </div>

                        <div className="space-y-2 rounded-lg border bg-muted/20 p-4">
                            <Label>Persentase Denda Kerusakan</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.data.fine_damage_percentage}
                                    onChange={(e) =>
                                        form.setData(
                                            'fine_damage_percentage',
                                            e.target.value,
                                        )
                                    }
                                    className="max-w-[150px]"
                                />
                                <span className="font-semibold">
                                    % dari harga alat
                                </span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Denda yang dihitung saat alat dikembalikan dalam
                                kondisi rusak.
                            </p>
                        </div>

                        <div className="space-y-2 rounded-lg border bg-muted/20 p-4">
                            <Label>Persentase Denda Kehilangan</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.data.fine_lost_percentage}
                                    onChange={(e) =>
                                        form.setData(
                                            'fine_lost_percentage',
                                            e.target.value,
                                        )
                                    }
                                    className="max-w-[150px]"
                                />
                                <span className="font-semibold">
                                    % dari harga alat
                                </span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Denda yang dihitung saat peminjam menghilangkan
                                alat (100% berarti mengganti seharga alat).
                            </p>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button
                                type="submit"
                                disabled={isSaving}
                                className="gap-2"
                            >
                                {isSaving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                {isSaving
                                    ? 'Menyimpan...'
                                    : 'Simpan Pengaturan'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

SettingsIndex.layout = {
    breadcrumbs: [{ title: 'Kelola Denda', href: '/settings' }],
};