import { usePage } from '@inertiajs/react';
import { Archive, Receipt } from 'lucide-react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { SharedData } from '@/types';

type ReturnRecord = {
    id: number;
    loan_id: number;
    return_date: string;
    fine: number;
    condition_note: string | null;
    loan: {
        borrower_name: string;
        purpose: string;
    } | null;
    processed_by: {
        name: string;
    } | null;
};

type Props = {
    returns: ReturnRecord[];
};

export default function ReturnsIndex({ returns }: Props) {
    const { auth } = usePage<SharedData>().props;

    return (
        <div className="space-y-6 p-4 md:p-6 w-full max-w-full overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <Heading
                    title="Riwayat Pengembalian"
                    description="Catatan komprehensif logistik pengembalian dan denda."
                />
            </div>

            <Card className="overflow-hidden border-border/60 bg-card/50 backdrop-blur-xl shadow-md">
                <div className="overflow-x-auto pb-4">
                    <Table className="min-w-[1000px]">
                        <TableHeader className="bg-muted/30">
                            <TableRow>
                                <TableHead className="w-[100px]">Loan ID</TableHead>
                                <TableHead className="min-w-[200px]">Identitas Peminjam</TableHead>
                                <TableHead className="min-w-[150px]">Tgl Pengembalian</TableHead>
                                <TableHead>Denda (Rp)</TableHead>
                                <TableHead className="min-w-[200px]">Catatan Kondisi</TableHead>
                                <TableHead className="min-w-[150px]">Diproses Oleh</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {returns?.map((ret) => (
                                <TableRow key={ret.id} className="group transition-colors">
                                    <TableCell className="font-mono text-xs text-muted-foreground align-top">
                                        #{ret.loan_id}
                                    </TableCell>
                                    <TableCell className="align-top">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 font-medium">
                                                <Receipt className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                {ret.loan?.borrower_name ?? 'Data Terhapus'}
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                {ret.loan?.purpose ?? '-'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="align-top">
                                        <span className="text-sm">
                                            {ret.return_date}
                                        </span>
                                    </TableCell>
                                    <TableCell className="align-top">
                                        {ret.fine > 0 ? (
                                            <Badge variant="destructive" className="font-mono">
                                                Rp {ret.fine.toLocaleString('id-ID')}
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
                                                -
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="align-top">
                                        <div className="text-sm text-balance max-w-xs">
                                            {ret.condition_note || '-'}
                                        </div>
                                    </TableCell>
                                    <TableCell className="align-top text-sm">
                                        {ret.processed_by?.name ?? '-'}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(!returns || returns.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Archive className="h-8 w-8 text-muted-foreground/50" />
                                            Belum ada pengembalian alat.
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
}

ReturnsIndex.layout = {
    breadcrumbs: [{ title: 'Pengembalian', href: '/returns' }],
};
