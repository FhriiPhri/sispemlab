import { router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    Archive,
    BadgeCheck,
    Banknote,
    CheckCircle2,
    CircleDollarSign,
    Clock,
    Loader2,
    Receipt,
    Search,
    X,
} from 'lucide-react';
import { FormEvent, useState } from 'react';
import { toast } from 'sonner';
import Heading from '@/components/heading';
import TablePagination, { type PaginatedData } from '@/components/table-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
    damage_fine: number;
    payment_status: 'paid' | 'unpaid';
    condition_note: string | null;
    loan: {
        loan_code: string | null;
        borrower_name: string;
        return_due_date: string | null;
        purpose: string;
    } | null;
    processed_by: {
        name: string;
    } | null;
};

type Stats = {
    total: number;
    unpaid: number;
    total_fine_unpaid: number;
};

type Props = {
    returns: PaginatedData<ReturnRecord>;
    stats: Stats;
    filters: { search?: string; payment_status?: string };
};

function formatRupiah(amount: number) {
    return 'Rp ' + amount.toLocaleString('id-ID');
}

function formatDate(dateStr: string | null) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function isLate(dueDate: string | null, returnDate: string): boolean {
    if (!dueDate) return false;
    return new Date(returnDate) > new Date(dueDate);
}

export default function ReturnsIndex({ returns, stats, filters }: Props) {
    const { auth } = usePage<SharedData>().props;
    const isAdminOrPetugas = ['admin', 'petugas'].includes(auth.user?.role ?? '');

    const [search, setSearch] = useState(filters.search ?? '');
    const [paymentFilter, setPaymentFilter] = useState(filters.payment_status ?? 'all');
    const [payTarget, setPayTarget] = useState<ReturnRecord | null>(null);
    const [paying, setPaying] = useState(false);

    // ---------- Filter / Search ----------
    const applyFilters = (overrides: Record<string, string | undefined> = {}) => {
        router.get('/returns', {
            search: overrides.search ?? (search || undefined),
            payment_status: overrides.payment_status ?? (paymentFilter !== 'all' ? paymentFilter : undefined),
        }, { preserveState: true, replace: true });
    };

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const handlePaymentFilter = (val: string) => {
        setPaymentFilter(val);
        applyFilters({ payment_status: val !== 'all' ? val : undefined });
    };

    const clearFilters = () => {
        setSearch('');
        setPaymentFilter('all');
        router.get('/returns', {}, { preserveState: false, replace: true });
    };

    // ---------- Lunasi Denda ----------
    const handlePayFine = () => {
        if (!payTarget) return;
        setPaying(true);
        router.patch(`/returns/${payTarget.id}/pay-fine`, {}, {
            onSuccess: () => {
                toast.success('Denda berhasil dilunasi!');
                setPayTarget(null);
            },
            onError: (errs) => {
                toast.error(Object.values(errs)[0] as string ?? 'Gagal melunasi denda.');
            },
            onFinish: () => setPaying(false),
        });
    };

    const hasActiveFilters = search || paymentFilter !== 'all';

    return (
        <div className="space-y-6 p-4 md:p-6 w-full max-w-full overflow-hidden">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <Heading
                    title="Riwayat Pengembalian"
                    description="Pengembalian alat, denda keterlambatan, dan status pelunasan."
                />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-border/60 bg-card/50">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-sky-100 dark:bg-sky-500/10">
                            <Archive className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Total Pengembalian</p>
                            <p className="text-2xl font-bold">{stats.total}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/60 bg-card/50">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-500/10">
                            <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Denda Belum Lunas</p>
                            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{stats.unpaid}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/60 bg-card/50">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-500/10">
                            <CircleDollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Total Denda Tertunggak</p>
                            <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                                {formatRupiah(stats.total_fine_unpaid)}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari nama peminjam / kode..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Button type="submit" size="sm" variant="outline">Cari</Button>
                </form>

                <Select value={paymentFilter} onValueChange={handlePaymentFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Filter Status Denda" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Status</SelectItem>
                        <SelectItem value="unpaid">Belum Lunas</SelectItem>
                        <SelectItem value="paid">Sudah Lunas</SelectItem>
                    </SelectContent>
                </Select>

                {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 text-muted-foreground">
                        <X className="h-4 w-4" /> Reset
                    </Button>
                )}
            </div>

            {/* Table */}
            <Card className="overflow-hidden border-border/60 bg-card/50 backdrop-blur-xl shadow-md">
                <div className="overflow-x-auto">
                    <Table className="min-w-[900px]">
                        <TableHeader className="bg-muted/30">
                            <TableRow>
                                <TableHead className="w-[130px]">Kode Pinjam</TableHead>
                                <TableHead className="min-w-[180px]">Peminjam</TableHead>
                                <TableHead>Tgl Kembali</TableHead>
                                <TableHead>Keterlambatan</TableHead>
                                <TableHead>Denda Lambat</TableHead>
                                <TableHead>Denda Kerusakan</TableHead>
                                <TableHead>Total & Status</TableHead>
                                <TableHead>Diproses Oleh</TableHead>
                                {isAdminOrPetugas && <TableHead className="text-right">Aksi</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {returns.data?.map((ret) => {
                                const totalFine = (ret.fine ?? 0) + (ret.damage_fine ?? 0);
                                const late = isLate(ret.loan?.return_due_date ?? null, ret.return_date);
                                const unpaid = ret.payment_status === 'unpaid' && totalFine > 0;

                                return (
                                    <TableRow key={ret.id} className={`group transition-colors ${unpaid ? 'bg-rose-50/30 dark:bg-rose-500/5' : ''}`}>
                                        {/* Kode */}
                                        <TableCell className="align-top">
                                            <span className="font-mono text-xs text-muted-foreground">
                                                {ret.loan?.loan_code ?? `#${ret.loan_id}`}
                                            </span>
                                        </TableCell>

                                        {/* Peminjam */}
                                        <TableCell className="align-top">
                                            <div className="flex items-center gap-2 font-medium">
                                                <Receipt className="h-4 w-4 text-muted-foreground shrink-0" />
                                                <span>{ret.loan?.borrower_name ?? 'Data terhapus'}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-0.5 ml-6 line-clamp-1">
                                                {ret.loan?.purpose ?? '-'}
                                            </p>
                                        </TableCell>

                                        {/* Tgl Kembali */}
                                        <TableCell className="align-top text-sm">
                                            <div className="flex flex-col gap-0.5">
                                                <span>{formatDate(ret.return_date)}</span>
                                                {ret.loan?.return_due_date && (
                                                    <span className="text-xs text-muted-foreground">
                                                        Batas: {formatDate(ret.loan.return_due_date)}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>

                                        {/* Keterlambatan */}
                                        <TableCell className="align-top">
                                            {late ? (
                                                <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 gap-1 text-xs">
                                                    <Clock className="h-3 w-3" />
                                                    Terlambat
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 gap-1 text-xs">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    Tepat Waktu
                                                </Badge>
                                            )}
                                        </TableCell>

                                        {/* Denda Keterlambatan */}
                                        <TableCell className="align-top font-mono text-sm">
                                            {ret.fine > 0 ? (
                                                <span className="text-rose-600">{formatRupiah(ret.fine)}</span>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </TableCell>

                                        {/* Denda Kerusakan */}
                                        <TableCell className="align-top font-mono text-sm">
                                            {(ret.damage_fine ?? 0) > 0 ? (
                                                <span className="text-orange-600">{formatRupiah(ret.damage_fine)}</span>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </TableCell>

                                        {/* Total & Status Bayar */}
                                        <TableCell className="align-top">
                                            <div className="flex flex-col gap-1">
                                                {totalFine > 0 ? (
                                                    <span className="font-bold font-mono text-sm text-rose-600">
                                                        {formatRupiah(totalFine)}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground font-mono text-sm">—</span>
                                                )}

                                                {totalFine > 0 && (
                                                    ret.payment_status === 'paid' ? (
                                                        <Badge className="w-fit gap-1 text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                                                            <BadgeCheck className="h-3 w-3" /> Lunas
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="w-fit gap-1 text-xs bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                                                            <AlertTriangle className="h-3 w-3" /> Belum Lunas
                                                        </Badge>
                                                    )
                                                )}
                                            </div>
                                        </TableCell>

                                        {/* Diproses Oleh */}
                                        <TableCell className="align-top text-sm text-muted-foreground">
                                            {ret.processed_by?.name ?? '-'}
                                        </TableCell>

                                        {/* Aksi */}
                                        {isAdminOrPetugas && (
                                            <TableCell className="align-top text-right">
                                                {unpaid ? (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 text-xs gap-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-500/30 dark:hover:bg-emerald-500/10"
                                                        onClick={() => setPayTarget(ret)}
                                                    >
                                                        <CircleDollarSign className="h-3.5 w-3.5" />
                                                        Lunasi
                                                    </Button>
                                                ) : totalFine > 0 ? (
                                                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center justify-end gap-1">
                                                        <BadgeCheck className="h-3.5 w-3.5" /> Lunas
                                                    </span>
                                                ) : null}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                );
                            })}

                            {(!returns.data || returns.data.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={isAdminOrPetugas ? 9 : 8} className="h-32 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Archive className="h-8 w-8 text-muted-foreground/40" />
                                            <span>Belum ada data pengembalian.</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {returns.last_page > 1 && (
                    <div className="border-t border-border/60 p-4">
                        <TablePagination data={returns} />
                    </div>
                )}
            </Card>

            {/* Dialog Konfirmasi Lunasi Denda */}
            <Dialog open={!!payTarget} onOpenChange={(open) => !open && setPayTarget(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CircleDollarSign className="h-5 w-5 text-emerald-600" />
                            Konfirmasi Pelunasan Denda
                        </DialogTitle>
                        <DialogDescription>
                            Pastikan pembayaran telah diterima sebelum mengkonfirmasi.
                        </DialogDescription>
                    </DialogHeader>

                    {payTarget && (
                        <div className="space-y-4">
                            {/* Banner Pembayaran Cash */}
                            <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/30 p-3 flex items-start gap-3">
                                <Banknote className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Pembayaran Tunai (Cash)</p>
                                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                                        Pastikan peminjam sudah menyerahkan uang tunai secara langsung sebelum mengkonfirmasi pelunasan ini.
                                    </p>
                                </div>
                            </div>

                            {/* Rincian Denda */}
                            <div className="rounded-xl border border-dashed border-border p-4 space-y-2 bg-muted/30">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Peminjam</span>
                                    <span className="font-medium">{payTarget.loan?.borrower_name}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Kode Pinjam</span>
                                    <span className="font-mono text-xs">{payTarget.loan?.loan_code ?? `#${payTarget.loan_id}`}</span>
                                </div>
                                <div className="border-t border-border/50 my-1" />
                                {payTarget.fine > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Denda Keterlambatan</span>
                                        <span className="font-mono text-rose-600">{formatRupiah(payTarget.fine)}</span>
                                    </div>
                                )}
                                {(payTarget.damage_fine ?? 0) > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Denda Kerusakan/Hilang</span>
                                        <span className="font-mono text-orange-600">{formatRupiah(payTarget.damage_fine)}</span>
                                    </div>
                                )}
                                <div className="border-t border-border pt-2 flex justify-between">
                                    <span className="font-semibold">Total yang Harus Dibayar</span>
                                    <span className="font-bold text-xl font-mono text-rose-600">
                                        {formatRupiah((payTarget.fine ?? 0) + (payTarget.damage_fine ?? 0))}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setPayTarget(null)} disabled={paying}>
                            Batal
                        </Button>
                        <Button
                            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={handlePayFine}
                            disabled={paying}
                        >
                            {paying ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Banknote className="h-4 w-4" />
                            )}
                            {paying ? 'Memproses...' : 'Konfirmasi Pembayaran Cash'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

ReturnsIndex.layout = {
    breadcrumbs: [{ title: 'Pengembalian', href: '/returns' }],
};
