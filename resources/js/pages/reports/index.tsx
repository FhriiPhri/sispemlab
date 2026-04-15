import { useState } from 'react';
import { CalendarIcon, FileOutput, Filter } from 'lucide-react';
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

export default function ReportsIndex() {
    // Default dates: first and last day of current month
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(firstDay);
    const [endDate, setEndDate] = useState(lastDay);
    const [type, setType] = useState('semua');

    const handlePrint = () => {
        const url = `/reports/print?start_date=${startDate}&end_date=${endDate}&type=${type}`;
        window.open(url, '_blank');
    };

    return (
        <div className="space-y-6 p-4 md:p-6 w-full max-w-full overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <Heading
                    title="Cetak Laporan"
                    description="Pusat rekapitulasi data peminjaman dan pengembalian."
                />
            </div>

            <Card className="max-w-2xl border-border bg-card shadow-sm">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Filter className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle>Filter Laporan</CardTitle>
                            <CardDescription>
                                Tentukan parameter sebelum melakukan pencetakan laporan.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Tanggal Awal</Label>
                            <div className="relative">
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="pl-10"
                                />
                                <CalendarIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Tanggal Akhir</Label>
                            <div className="relative">
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="pl-10"
                                />
                                <CalendarIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Jenis Laporan</Label>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih Jenis Laporan" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="semua">Semua (Peminjaman & Pengembalian)</SelectItem>
                                <SelectItem value="peminjaman">Hanya Peminjaman</SelectItem>
                                <SelectItem value="pengembalian">Hanya Pengembalian</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="pt-4 border-t flex justify-end">
                        <Button onClick={handlePrint} size="lg" className="w-full sm:w-auto">
                            <FileOutput className="w-4 h-4 mr-2" />
                            Cetak Laporan (PDF)
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

ReportsIndex.layout = {
    breadcrumbs: [{ title: 'Cetak Laporan', href: '/reports' }],
};
