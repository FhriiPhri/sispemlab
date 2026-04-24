import { useState } from 'react';
import { CalendarIcon, Download, FileOutput, Filter, Info } from 'lucide-react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

// Tipe yang butuh filter tanggal
const DATE_FILTERED_TYPES = ['peminjaman', 'pengembalian', 'semua'];

export default function ReportsIndex() {
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
        .toISOString()
        .split('T')[0];
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0)
        .toISOString()
        .split('T')[0];

    const [startDate, setStartDate] = useState(firstDay);
    const [endDate, setEndDate] = useState(lastDay);
    const [type, setType] = useState('semua');

    const needsDateFilter = DATE_FILTERED_TYPES.includes(type);

    const buildParams = () => {
        const p = new URLSearchParams({ type });
        if (needsDateFilter) {
            p.set('start_date', startDate);
            p.set('end_date', endDate);
        }
        return p.toString();
    };

    const handlePrint = () =>
        window.open(`/reports/print?${buildParams()}`, '_blank');
    const handleExport = () =>
        (window.location.href = `/reports/export?${buildParams()}`);

    return (
        <div className="w-full max-w-full space-y-6 overflow-hidden p-4 md:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <Heading
                    title="Cetak & Ekspor Laporan"
                    description="Pusat rekapitulasi data peminjaman, pengembalian, user, kategori, dan alat."
                />
            </div>

            <Card className="max-w-2xl border-border bg-card shadow-sm">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-primary/10 p-2">
                            <Filter className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle>Filter Laporan</CardTitle>
                            <CardDescription>
                                Tentukan parameter sebelum mencetak atau
                                mengekspor laporan.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Jenis Laporan */}
                    <div className="grid gap-2">
                        <Label>Jenis Laporan</Label>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih Jenis Laporan" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="semua">
                                    Semua Data
                                </SelectItem>
                                <SelectItem value="peminjaman">
                                    Data Peminjaman
                                </SelectItem>
                                <SelectItem value="pengembalian">
                                    Data Pengembalian
                                </SelectItem>
                                <SelectItem value="user">Data User</SelectItem>
                                <SelectItem value="kategori">
                                    Data Kategori
                                </SelectItem>
                                <SelectItem value="alat">Data Alat</SelectItem>
                                <SelectItem value="log">
                                    Log Aktivitas
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Filter Tanggal */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label
                                className={
                                    !needsDateFilter
                                        ? 'text-muted-foreground'
                                        : ''
                                }
                            >
                                Tanggal Awal
                            </Label>
                            <div className="relative">
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) =>
                                        setStartDate(e.target.value)
                                    }
                                    disabled={!needsDateFilter}
                                    className={`pl-10 ${!needsDateFilter ? 'cursor-not-allowed opacity-50' : ''}`}
                                />
                                <CalendarIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label
                                className={
                                    !needsDateFilter
                                        ? 'text-muted-foreground'
                                        : ''
                                }
                            >
                                Tanggal Akhir
                            </Label>
                            <div className="relative">
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    disabled={!needsDateFilter}
                                    className={`pl-10 ${!needsDateFilter ? 'cursor-not-allowed opacity-50' : ''}`}
                                />
                                <CalendarIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            </div>
                        </div>
                    </div>

                    {/* Info tanggal dinonaktifkan */}
                    {!needsDateFilter && (
                        <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 dark:border-blue-800 dark:bg-blue-900/20">
                            <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                                Filter tanggal tidak berlaku untuk jenis laporan
                                ini. Semua data akan ditampilkan.
                            </p>
                        </div>
                    )}

                    {/* Tombol Aksi */}
                    <div className="grid grid-cols-1 gap-3 border-t pt-4 sm:grid-cols-2">
                        <Button
                            onClick={handleExport}
                            size="lg"
                            variant="outline"
                            className="w-full gap-2 border-emerald-400 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-600 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                        >
                            <Download className="h-4 w-4" />
                            Export Excel (.xlsx)
                        </Button>

                        <Button
                            onClick={handlePrint}
                            size="lg"
                            className="w-full gap-2"
                        >
                            <FileOutput className="h-4 w-4" />
                            Cetak Laporan (PDF)
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Info format */}
            <div className="max-w-2xl">
                <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-4 py-3">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <p className="text-xs leading-relaxed text-muted-foreground">
                        <strong>Export Excel:</strong> File berformat{' '}
                        <code>.xlsx</code> dengan beberapa sheet sesuai jenis
                        laporan, langsung bisa dibuka di Microsoft Excel atau
                        Google Sheets. Untuk <strong>Semua Data</strong>, file
                        berisi 5 sheet: Peminjaman, Pengembalian, User,
                        Kategori, dan Alat.
                    </p>
                </div>
            </div>
        </div>
    );
}

ReportsIndex.layout = {
    breadcrumbs: [{ title: 'Cetak Laporan', href: '/reports' }],
};