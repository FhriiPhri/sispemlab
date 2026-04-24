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
import TablePagination, {
    type PaginatedData,
} from '@/components/table-pagination';
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
    const isAdminOrPetugas = ['admin', 'petugas'].includes(
        auth.user?.role ?? '',
    );

    const [search, setSearch] = useState(filters.search ?? '');
    const [paymentFilter, setPaymentFilter] = useState(
        filters.payment_status ?? 'all',
    );
    const [payTarget, setPayTarget] = useState<ReturnRecord | null>(null);
    const [paying, setPaying] = useState(false);

    // ---------- Filter / Search ----------
    const applyFilters = (
        overrides: Record<string, string | undefined> = {},
    ) => {
        router.get(
            '/returns',
            {
                search: overrides.search ?? (search || undefined),
                payment_status:
                    overrides.payment_status ??
                    (paymentFilter !== 'all' ? paymentFilter : undefined),
            },
            { preserveState: true, replace: true },
        );
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
        router.patch(
            `/returns/${payTarget.id}/pay-fine`,
            {},
            {
                onSuccess: () => {
                    toast.success('Denda berhasil dilunasi!');
                    setPayTarget(null);
                },
                onError: (errs) => {
                    toast.error(
                        (Object.values(errs)[0] as string) ??
                            'Gagal melunasi denda.',
                    );
                },
                onFinish: () => setPaying(false),
            },
        );
    };

    const hasActiveFilters = search || paymentFilter !== 'all';

    return (
        <div className="w-full max-w-full space-y-6 overflow-hidden p-4 md:p-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <Heading
                    title="Riwayat Pengembalian"
                    description="Pengembalian alat, denda keterlambatan, dan status pelunasan."
                />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Card className="border-border/60 bg-card/50">
                    <CardContent className="flex items-center gap-3 p-4">
                        <div className="rounded-xl bg-sky-100 p-2.5 dark:bg-sky-500/10">
                            <Archive className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">
                                Total Pengembalian
                            </p>
                            <p className="text-2xl font-bold">{stats.total}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/60 bg-card/50">
                    <CardContent className="flex items-center gap-3 p-4">
                        <div className="rounded-xl bg-rose-100 p-2.5 dark:bg-rose-500/10">
                            <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">
                                Denda Belum Lunas
                            </p>
                            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                                {stats.unpaid}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/60 bg-card/50">
                    <CardContent className="flex items-center gap-3 p-4">
                        <div className="rounded-xl bg-amber-100 p-2.5 dark:bg-amber-500/10">
                            <CircleDollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">
                                Total Denda Tertunggak
                            </p>
                            <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                                {formatRupiah(stats.total_fine_unpaid)}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row">
                <form
                    onSubmit={handleSearch}
                    className="flex max-w-sm flex-1 gap-2"
                >
                    <div className="relative flex-1">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Cari nama peminjam / kode..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Button type="submit" size="sm" variant="outline">
                        Cari
                    </Button>
                </form>

                <Select
                    value={paymentFilter}
                    onValueChange={handlePaymentFilter}
                >
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
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="gap-1.5 text-muted-foreground"
                    >
                        <X className="h-4 w-4" /> Reset
                    </Button>
                )}
            </div>

            {/* Table */}
            <Card className="overflow-hidden border-border/60 bg-card/50 shadow-md backdrop-blur-xl">
                <div className="overflow-x-auto">
                    <Table className="min-w-[900px]">
                        <TableHeader className="bg-muted/30">
                            <TableRow>
                                <TableHead className="w-[130px]">
                                    Kode Pinjam
                                </TableHead>
                                <TableHead className="min-w-[180px]">
                                    Peminjam
                                </TableHead>
                                <TableHead>Tgl Kembali</TableHead>
                                <TableHead>Keterlambatan</TableHead>
                                <TableHead>Denda Lambat</TableHead>
                                <TableHead>Denda Kerusakan</TableHead>
                                <TableHead>Total & Status</TableHead>
                                <TableHead>Diproses Oleh</TableHead>
                                {isAdminOrPetugas && (
                                    <TableHead className="text-right">
                                        Aksi
                                    </TableHead>
                                )}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {returns.data?.map((ret) => {
                                const totalFine =
                                    (ret.fine ?? 0) + (ret.damage_fine ?? 0);
                                const late = isLate(
                                    ret.loan?.return_due_date ?? null,
                                    ret.return_date,
                                );
                                const unpaid =
                                    ret.payment_status === 'unpaid' &&
                                    totalFine > 0;

                                return (
                                    <TableRow
                                        key={ret.id}
                                        className={`group transition-colors ${unpaid ? 'bg-rose-50/30 dark:bg-rose-500/5' : ''}`}
                                    >
                                        {/* Kode */}
                                        <TableCell className="align-top">
                                            <span className="font-mono text-xs text-muted-foreground">
                                                {ret.loan?.loan_code ??
                                                    `#${ret.loan_id}`}
                                            </span>
                                        </TableCell>

                                        {/* Peminjam */}
                                        <TableCell className="align-top">
                                            <div className="flex items-center gap-2 font-medium">
                                                <Receipt className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                <span>
                                                    {ret.loan?.borrower_name ??
                                                        'Data terhapus'}
                                                </span>
                                            </div>
                                            <p className="mt-0.5 ml-6 line-clamp-1 text-xs text-muted-foreground">
                                                {ret.loan?.purpose ?? '-'}
                                            </p>
                                        </TableCell>

                                        {/* Tgl Kembali */}
                                        <TableCell className="align-top text-sm">
                                            <div className="flex flex-col gap-0.5">
                                                <span>
                                                    {formatDate(
                                                        ret.return_date,
                                                    )}
                                                </span>
                                                {ret.loan?.return_due_date && (
                                                    <span className="text-xs text-muted-foreground">
                                                        Batas:{' '}
                                                        {formatDate(
                                                            ret.loan
                                                                .return_due_date,
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>

                                        {/* Keterlambatan */}
                                        <TableCell className="align-top">
                                            {late ? (
                                                <Badge className="gap-1 bg-rose-100 text-xs text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                                                    <Clock className="h-3 w-3" />
                                                    Terlambat
                                                </Badge>
                                            ) : (
                                                <Badge className="gap-1 bg-emerald-100 text-xs text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    Tepat Waktu
                                                </Badge>
                                            )}
                                        </TableCell>

                                        {/* Denda Keterlambatan */}
                                        <TableCell className="align-top font-mono text-sm">
                                            {ret.fine > 0 ? (
                                                <span className="text-rose-600">
                                                    {formatRupiah(ret.fine)}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    —
                                                </span>
                                            )}
                                        </TableCell>

                                        {/* Denda Kerusakan */}
                                        <TableCell className="align-top font-mono text-sm">
                                            {(ret.damage_fine ?? 0) > 0 ? (
                                                <span className="text-orange-600">
                                                    {formatRupiah(
                                                        ret.damage_fine,
                                                    )}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    —
                                                </span>
                                            )}
                                        </TableCell>

                                        {/* Total & Status Bayar */}
                                        <TableCell className="align-top">
                                            {totalFine > 0 ? (
                                                <div className="flex flex-col items-start gap-1">
                                                    <span
                                                        className={`font-mono text-base font-bold ${ret.payment_status === 'paid' ? 'text-muted-foreground' : 'text-rose-600 dark:text-rose-400'}`}
                                                    >
                                                        {formatRupiah(
                                                            totalFine,
                                                        )}
                                                    </span>
                                                    {ret.payment_status ===
                                                    'paid' ? (
                                                        <Badge
                                                            variant="outline"
                                                            className="border-transparent bg-emerald-100 text-xs font-semibold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300"
                                                        >
                                                            ✓ Lunas
                                                        </Badge>
                                                    ) : (
                                                        <span className="rounded border border-rose-100 bg-rose-50 px-2 py-0.5 text-[10px] font-bold tracking-wider text-rose-500 uppercase dark:border-rose-500/20 dark:bg-rose-500/10">
                                                            Tertunggak
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="font-mono text-sm text-muted-foreground">
                                                    —
                                                </span>
                                            )}
                                        </TableCell>

                                        {/* Diproses Oleh */}
                                        <TableCell className="align-top text-sm text-muted-foreground">
                                            {ret.processed_by?.name ?? '-'}
                                        </TableCell>

                                        {/* Aksi */}
                                        {isAdminOrPetugas && (
                                            <TableCell className="text-right align-top">
                                                {unpaid ? (
                                                    <Button
                                                        size="sm"
                                                        className="h-8 gap-1.5 bg-emerald-600 text-xs text-white shadow-sm hover:bg-emerald-700"
                                                        onClick={() =>
                                                            setPayTarget(ret)
                                                        }
                                                    >
                                                        <CircleDollarSign className="h-3.5 w-3.5" />
                                                        Proses Pelunasan
                                                    </Button>
                                                ) : totalFine > 0 ? (
                                                    <span className="flex items-center justify-end gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                                        <BadgeCheck className="h-4 w-4" />{' '}
                                                        Telah Lunas
                                                    </span>
                                                ) : null}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                );
                            })}

                            {(!returns.data || returns.data.length === 0) && (
                                <TableRow>
                                    <TableCell
                                        colSpan={isAdminOrPetugas ? 9 : 8}
                                        className="h-32 text-center text-muted-foreground"
                                    >
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Archive className="h-8 w-8 text-muted-foreground/40" />
                                            <span>
                                                Belum ada data pengembalian.
                                            </span>
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
            <Dialog
                open={!!payTarget}
                onOpenChange={(open) => !open && setPayTarget(null)}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CircleDollarSign className="h-5 w-5 text-emerald-600" />
                            Konfirmasi Pelunasan Denda
                        </DialogTitle>
                        <DialogDescription>
                            Pastikan pembayaran telah diterima sebelum
                            mengkonfirmasi.
                        </DialogDescription>
                    </DialogHeader>

                    {payTarget && (
                        <div className="space-y-4">
                            {/* Banner Pembayaran Cash */}
                            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/30 dark:bg-amber-500/10">
                                <Banknote className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                                <div>
                                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                                        Pembayaran Tunai (Cash)
                                    </p>
                                    <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
                                        Pastikan peminjam sudah menyerahkan uang
                                        tunai secara langsung sebelum
                                        mengkonfirmasi pelunasan ini.
                                    </p>
                                </div>
                            </div>

                            {/* Rincian Denda */}
                            <div className="space-y-2 rounded-xl border border-dashed border-border bg-muted/30 p-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Peminjam
                                    </span>
                                    <span className="font-medium">
                                        {payTarget.loan?.borrower_name}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Kode Pinjam
                                    </span>
                                    <span className="font-mono text-xs">
                                        {payTarget.loan?.loan_code ??
                                            `#${payTarget.loan_id}`}
                                    </span>
                                </div>
                                <div className="my-1 border-t border-border/50" />
                                {payTarget.fine > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Denda Keterlambatan
                                        </span>
                                        <span className="font-mono text-rose-600">
                                            {formatRupiah(payTarget.fine)}
                                        </span>
                                    </div>
                                )}
                                {(payTarget.damage_fine ?? 0) > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Denda Kerusakan/Hilang
                                        </span>
                                        <span className="font-mono text-orange-600">
                                            {formatRupiah(
                                                payTarget.damage_fine,
                                            )}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between border-t border-border pt-2">
                                    <span className="font-semibold">
                                        Total yang Harus Dibayar
                                    </span>
                                    <span className="font-mono text-xl font-bold text-rose-600">
                                        {formatRupiah(
                                            (payTarget.fine ?? 0) +
                                                (payTarget.damage_fine ?? 0),
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setPayTarget(null)}
                            disabled={paying}
                        >
                            Batal
                        </Button>
                        <Button
                            className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                            onClick={handlePayFine}
                            disabled={paying}
                        >
                            {paying ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Banknote className="h-4 w-4" />
                            )}
                            {paying ? 'Memproses...' : 'Konfirmasi Cash'}
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