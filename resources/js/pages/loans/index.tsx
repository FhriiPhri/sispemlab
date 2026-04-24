import { router, useForm, usePage } from '@inertiajs/react';
import { AlertTriangle, Banknote, CircleDollarSign, ClipboardList, CreditCard, Loader2, Plus, RotateCcw, Send, ShieldCheck, X } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';
import Heading from '@/components/heading';
import TablePagination, { type PaginatedData } from '@/components/table-pagination';
import { Badge } from '@/components/ui/badge';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import type { SharedData } from '@/types';
import { MidtransSnapButton } from '@/components/midtrans-snap-button';

type Loan = {
    id: number;
    loan_code: string | null;
    borrower_name: string;
    borrower_identifier: string | null;
    borrower_phone: string | null;
    purpose: string;
    loan_date: string | null;
    return_due_date: string | null;
    returned_at: string | null;
    status: string;
    notes: string | null;
    requested_by: string | null;
    fine: number | null;
    damage_fine: number | null;
    total_fine: number | null;
    return_id: number | null;
    payment_status: 'paid' | 'unpaid' | null;
    items: Array<{
        tool_id: number;
        tool_name: string | null;
        tool_code: string | null;
        quantity: number;
        condition_out: string | null;
        condition_in: string | null;
    }>;
};

type ToolOption = {
    id: number;
    label: string;
    code: string;
    category_name: string | null;
    stock_available: number;
    condition_status: string;
    price: number;
};

type Props = {
    loans: PaginatedData<Loan>;
    tools: ToolOption[];
    fineSettings?: { late_percent: number; damage_percent: number; lost_percent: number };
    hasUnpaidFine?: boolean;
    stats: {
        pending: number;
        active: number;
        returned: number;
    };
};

const textareaClass =
    'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]';

const statusClasses: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300',
    approved: 'bg-sky-100 text-sky-800 dark:bg-sky-500/10 dark:text-sky-300',
    borrowed: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-300',
    returned: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300',
    rejected: 'bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-300',
};

export default function LoansIndex({ loans, tools, stats, fineSettings = { late_percent: 1, damage_percent: 50, lost_percent: 100 }, hasUnpaidFine = false }: Props) {
    const { auth } = usePage<SharedData>().props;
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [detailLoan, setDetailLoan] = useState<Loan | null>(null);
    const [returnLoan, setReturnLoan] = useState<Loan | null>(null);
    const [userPayTarget, setUserPayTarget] = useState<Loan | null>(null);
    const [returning, setReturning] = useState(false);

    const nowLocal = () =>
        new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    const [returnForm, setReturnForm] = useState({
        return_datetime:  nowLocal(),
        condition_status: 'baik',
        hours_late:       0,
        condition_note:   '',
    });

    // Hitung preview denda live
    const loanTotalPrice = (returnLoan?.items ?? []).reduce((sum, item) => {
        const tool = tools.find((t) => t.id === item.tool_id);
        return sum + (tool?.price ?? 0) * item.quantity;
    }, 0);

    const previewLateFine   = Math.round(loanTotalPrice * (fineSettings.late_percent   / 100) * returnForm.hours_late);
    const previewDamageFine = returnForm.condition_status === 'rusak'  ? Math.round(loanTotalPrice * (fineSettings.damage_percent / 100)) : 0;
    const previewLostFine   = returnForm.condition_status === 'hilang' ? Math.round(loanTotalPrice * (fineSettings.lost_percent   / 100)) : 0;
    const previewTotal      = previewLateFine + previewDamageFine + previewLostFine;

    const openReturnDialog = (loan: Loan) => {
        const dt = nowLocal();
        // Hitung jam telat otomatis jika due_date sudah lewat
        let hoursLate = 0;
        if (loan.return_due_date) {
            const due = new Date(loan.return_due_date.replace(' ', 'T'));
            const now = new Date();
            if (now > due) {
                hoursLate = Math.ceil((now.getTime() - due.getTime()) / 3600000);
            }
        }
        setReturnForm({ return_datetime: dt, condition_status: 'baik', hours_late: hoursLate, condition_note: '' });
        setReturnLoan(loan);
    };


    const loansList = loans.data;
    
    const form = useForm({
        borrower_name: auth.user.name || '',
        borrower_identifier: auth.user.identifier || '',
        borrower_phone: auth.user.phone || '',
        purpose: '',
        loan_date: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
        return_due_date: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000 + 3600000).toISOString().slice(0, 16),
        notes: '',
        items: [{ tool_id: '', quantity: 1, condition_out: 'baik' }],
    });

    // Baca ?tool_id dari URL → pre-fill form dan buka dialog otomatis
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const toolId = params.get('tool_id');
        if (toolId && auth.user.role === 'peminjam' && !hasUnpaidFine) {
            form.setData('items', [{ tool_id: toolId, quantity: 1, condition_out: 'baik' }]);
            setIsCreateOpen(true);
            // Bersihkan query string agar tidak re-trigger saat navigasi
            window.history.replaceState({}, '', '/loans');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        form.transform((data) => ({
            ...data,
            items: data.items.map((item) => ({
                ...item,
                tool_id: Number(item.tool_id),
            })),
        }));

        form.post('/loans', {
            preserveScroll: true,
            onSuccess: () => {
                form.reset(
                    'borrower_name',
                    'borrower_identifier',
                    'borrower_phone',
                    'purpose',
                    'notes',
                    'items',
                );
                setIsCreateOpen(false);
                toast.success('Pengajuan peminjaman berhasil dibuat!');
            },
            onError: (errors) => {
                const messages = Object.values(errors);
                if (messages.length > 0) {
                    toast.error(messages[0], {
                        description: messages.length > 1
                            ? `${messages.length - 1} field lain juga bermasalah.`
                            : undefined,
                    });
                }
            },
        });
    };

    const addItem = () => {
        form.setData('items', [
            ...form.data.items,
            { tool_id: '', quantity: 1, condition_out: 'baik' },
        ]);
    };

    const removeItem = (index: number) => {
        form.setData(
            'items',
            form.data.items.filter((_, itemIndex) => itemIndex !== index),
        );
    };

    return (
        <div className="space-y-6 p-4 md:p-6 w-full max-w-full overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <Heading
                    title="Riwayat Peminjaman"
                    description="Kelola pengajuan peminjaman dan pantau status barang."
                />

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        {hasUnpaidFine && auth.user.role === 'peminjam' ? (
                            <Button disabled className="gap-2 opacity-60 cursor-not-allowed">
                                <Banknote className="h-4 w-4" />
                                Denda Belum Lunas
                            </Button>
                        ) : (
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Buat Pengajuan
                            </Button>
                        )}
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-4xl max-w-[95vw] w-full max-h-[92vh] overflow-y-auto sm:p-8">
                        <DialogHeader>
                            <DialogTitle>Buat Pengajuan Baru</DialogTitle>
                            <DialogDescription>
                                Pengajuan baru otomatis masuk status pending. Peminjam dan staf dapat membuat pengajuan.
                            </DialogDescription>
                        </DialogHeader>
                        <form className="space-y-4 py-2" onSubmit={submit}>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label>Nama peminjam</Label>
                                    <Input
                                        value={form.data.borrower_name}
                                        className={form.errors.borrower_name ? 'border-red-500' : ''}
                                        onChange={(event) =>
                                            form.setData('borrower_name', event.target.value)
                                        }
                                        autoComplete="off"
                                        disabled
                                        readOnly
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Identitas (NIP/NIS)</Label>
                                    <Input
                                        value={form.data.borrower_identifier}
                                        className={form.errors.borrower_identifier ? 'border-red-500' : ''}
                                        onChange={(event) =>
                                            form.setData('borrower_identifier', event.target.value)
                                        }
                                        disabled
                                        readOnly
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label>No. telepon</Label>
                                    <Input
                                        value={form.data.borrower_phone}
                                        className={form.errors.borrower_phone ? 'border-red-500' : ''}
                                        onChange={(event) =>
                                            form.setData('borrower_phone', event.target.value)
                                        }
                                        disabled
                                        readOnly
                                        placeholder="Terisi otomatis dari profil..."
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Keperluan</Label>
                                    <Input
                                        value={form.data.purpose}
                                        className={form.errors.purpose ? 'border-red-500' : ''}
                                        onChange={(event) =>
                                            form.setData('purpose', event.target.value)
                                        }
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label>Waktu Pinjam</Label>
                                    <Input
                                        type="datetime-local"
                                        value={form.data.loan_date}
                                        className={form.errors.loan_date ? 'border-red-500' : ''}
                                        onChange={(event) =>
                                            form.setData('loan_date', event.target.value)
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Batas Waktu Pengembalian</Label>
                                    <Input
                                        type="datetime-local"
                                        value={form.data.return_due_date}
                                        className={form.errors.return_due_date ? 'border-red-500' : ''}
                                        onChange={(event) =>
                                            form.setData('return_due_date', event.target.value)
                                        }
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label>Catatan Tambahan</Label>
                                <textarea
                                    className={textareaClass}
                                    value={form.data.notes}
                                    onChange={(event) =>
                                        form.setData('notes', event.target.value)
                                    }
                                />
                            </div>

                            <div className="space-y-3 pt-4 border-t">
                                <div className="flex items-center justify-between">
                                    <Label>Item Peminjaman</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addItem}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Tambah Alokasi
                                    </Button>
                                </div>

                                {form.data.items.map((item, index) => (
                                    <div
                                        key={`item-${index}`}
                                        className="relative rounded-xl border border-border p-4 bg-muted/20"
                                    >
                                        {form.data.items.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-2 top-2 h-6 w-6 p-0 text-muted-foreground hover:text-rose-500"
                                                onClick={() => removeItem(index)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <div className="grid gap-4 md:grid-cols-[1.6fr_0.7fr_1fr] mt-2">
                                            <div className="grid gap-2">
                                                <Label className="text-xs text-muted-foreground">Pilih Alat</Label>
                                                <Select
                                                    value={item.tool_id}
                                                    onValueChange={(value) =>
                                                        form.setData(
                                                            'items',
                                                            form.data.items.map((current, itemIndex) =>
                                                                itemIndex === index
                                                                    ? { ...current, tool_id: value }
                                                                    : current
                                                            )
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger className="w-full bg-background">
                                                        <SelectValue placeholder="Cari..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {tools.map((tool) => (
                                                            <SelectItem key={tool.id} value={tool.id.toString()}>
                                                                {tool.label} ({tool.code}) - Stok: {tool.stock_available}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="grid gap-2">
                                                <Label className="text-xs text-muted-foreground">Kuantitas</Label>
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    value={item.quantity}
                                                    className="bg-background"
                                                    onChange={(event) =>
                                                        form.setData(
                                                            'items',
                                                            form.data.items.map((current, itemIndex) =>
                                                                itemIndex === index
                                                                    ? { ...current, quantity: Number(event.target.value) }
                                                                    : current
                                                            )
                                                        )
                                                    }
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label className="text-xs text-muted-foreground">Kondisi Saat Ini</Label>
                                                <Input
                                                    value={item.condition_out}
                                                    className="bg-background"
                                                    onChange={(event) =>
                                                        form.setData(
                                                            'items',
                                                            form.data.items.map((current, itemIndex) =>
                                                                itemIndex === index
                                                                    ? { ...current, condition_out: event.target.value }
                                                                    : current
                                                            )
                                                        )
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t mt-6">
                                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                                    Batal
                                </Button>
                                <Button disabled={form.processing}>
                                    <Send className="mr-2 h-4 w-4" />
                                    Kirim Pengajuan
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="py-4">
                        <CardDescription>Menunggu persetujuan</CardDescription>
                        <CardTitle className="text-3xl text-amber-500">{stats.pending}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="py-4">
                        <CardDescription>Pinjaman aktif</CardDescription>
                        <CardTitle className="text-3xl text-indigo-500">{stats.active}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="py-4">
                        <CardDescription>Selesai dikembalikan</CardDescription>
                        <CardTitle className="text-3xl text-emerald-600">{stats.returned}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Banner peringatan denda belum lunas untuk peminjam */}
            {auth.user.role === 'peminjam' && loansList.some(l => l.payment_status === 'unpaid' && (l.total_fine ?? 0) > 0) && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-500/10 dark:border-rose-500/30 p-4 flex items-start gap-3">
                    <Banknote className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-rose-800 dark:text-rose-300">Anda Memiliki Denda yang Belum Dibayar</p>
                        <p className="text-xs text-rose-700 dark:text-rose-400 mt-1">
                            Klik tombol <strong>"Bayar Denda"</strong> di kolom aksi untuk membayar secara online via Midtrans (GoPay, QRIS, Transfer Bank, dll).
                            Setelah pembayaran berhasil, status akan diperbarui secara otomatis.
                        </p>
                    </div>
                </div>
            )}

            <Card className="overflow-hidden border-border/60 bg-card/50 backdrop-blur-xl shadow-md">
                <div className="overflow-x-auto pb-4">
                    <Table className="min-w-[1000px]">
                        <TableHeader className="bg-muted/30">
                            <TableRow>
                                <TableHead className="min-w-[200px]">Data Peminjam</TableHead>
                                <TableHead className="w-[120px]">Status</TableHead>
                                <TableHead className="min-w-[250px]">Keterangan Item</TableHead>
                                <TableHead className="min-w-[150px]">Durasi Pinjam</TableHead>
                                <TableHead className="text-right min-w-[200px]">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loansList.map((loan) => (
                                <TableRow
                                    key={loan.id}
                                    className="group transition-colors cursor-pointer hover:bg-muted/50"
                                    onClick={() => setDetailLoan(loan)}
                                >
                                    <TableCell className="align-top">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 font-medium">
                                                <ClipboardList className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                {loan.borrower_name}
                                            </div>
                                            {(loan.loan_code || loan.purpose) && (
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                                    {loan.loan_code && (
                                                        <Badge variant="outline" className="font-mono text-[10px] px-1 py-0 border-primary/20 text-primary">
                                                            {loan.loan_code}
                                                        </Badge>
                                                    )}
                                                    <span>{loan.purpose}</span>
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="align-top">
                                        <Badge variant="outline" className={`font-medium border-transparent ${statusClasses[loan.status] ?? statusClasses.pending}`}>
                                            {loan.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="align-top">
                                        <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                                            {loan.items.map((item, idx) => (
                                                <li key={idx} className="line-clamp-1">
                                                    <span className="font-medium text-foreground">{item.tool_name ?? 'Alat'}</span> (x{item.quantity})
                                                </li>
                                            ))}
                                        </ul>
                                    </TableCell>
                                    <TableCell className="align-top whitespace-nowrap">
                                        <div className="text-xs flex flex-col gap-1">
                                            <span className="font-semibold">{loan.loan_date}</span>
                                            <span className="text-muted-foreground">s.d {loan.return_due_date}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="align-top text-right">
                                        <div className="flex flex-wrap items-center justify-end gap-2">
                                            {(auth.user.role === 'admin' || auth.user.role === 'petugas') && (
                                                <>
                                                    {loan.status === 'pending' && (
                                                        <>
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                className="h-8"
                                                                onClick={(e) => { e.stopPropagation(); router.patch(`/loans/${loan.id}/status`, { status: 'approved' }, { preserveScroll: true }); }}
                                                            >
                                                                <ShieldCheck className="mr-1 h-3 w-3" /> Setujui
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="destructive"
                                                                className="h-8"
                                                                onClick={(e) => { e.stopPropagation(); router.patch(`/loans/${loan.id}/status`, { status: 'rejected' }, { preserveScroll: true }); }}
                                                            >
                                                                Tolak
                                                            </Button>
                                                        </>
                                                    )}
                                                    {loan.status === 'approved' && (
                                                        <>
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-8 shadow-none"
                                                                onClick={(e) => { e.stopPropagation(); router.patch(`/loans/${loan.id}/status`, { status: 'borrowed' }, { preserveScroll: true }); }}
                                                            >
                                                                Beri Akses Pinjam
                                                            </Button>
                                                        </>
                                                    )}
                                                    {loan.status === 'borrowed' && (
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 shadow-none border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-500/30 dark:hover:bg-emerald-500/10"
                                                            onClick={(e) => { e.stopPropagation(); openReturnDialog(loan); }}
                                                        >
                                                            <RotateCcw className="mr-1 h-3 w-3" />
                                                            Proses Kembali
                                                        </Button>
                                                    )}
                                                </>
                                            )}
                                            {auth.user.role === 'peminjam' && loan.status === 'borrowed' && (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    className="h-8"
                                                    onClick={(e) => { e.stopPropagation(); router.post(`/loans/${loan.id}/return-request`, {}, { preserveScroll: true }); }}
                                                >
                                                    <RotateCcw className="mr-1 h-3 w-3" />
                                                    Kembalikan Alat
                                                </Button>
                                            )}
                                            {/* Badge / Tombol denda untuk peminjam pada status returned */}
                                            {auth.user.role === 'peminjam' && loan.status === 'returned' && loan.total_fine !== null && (
                                                <div className="text-right" onClick={(e) => e.stopPropagation()}>
                                                    {loan.total_fine > 0 ? (
                                                        <div className="inline-flex flex-col items-end gap-1.5">
                                                            {loan.payment_status === 'unpaid' ? (
                                                                <div className="flex flex-col items-end gap-2">
                                                                    <div className="flex flex-col items-end">
                                                                        <span className="text-[10px] uppercase font-bold tracking-wider text-rose-500">Denda Tertunggak</span>
                                                                        <span className="text-base font-bold font-mono text-rose-600 dark:text-rose-400">
                                                                            Rp {loan.total_fine.toLocaleString('id-ID')}
                                                                        </span>
                                                                    </div>
                                                                    <Button
                                                                        size="sm"
                                                                        className="h-8 gap-1.5 bg-rose-600 hover:bg-rose-700 text-white shadow-sm w-full sm:w-auto"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setUserPayTarget(loan);
                                                                        }}
                                                                    >
                                                                        <Banknote className="h-3.5 w-3.5" />
                                                                        Pilih Pembayaran
                                                                    </Button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col items-end gap-1">
                                                                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Total Denda</span>
                                                                    <span className="text-sm font-bold font-mono text-muted-foreground">
                                                                        Rp {loan.total_fine.toLocaleString('id-ID')}
                                                                    </span>
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="mt-0.5 text-xs font-semibold border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300"
                                                                    >
                                                                        ✓ Lunas
                                                                    </Badge>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <Badge variant="outline" className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300 border-transparent">
                                                            ✓ Tidak Ada Denda
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {loansList.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        Belum ada history peminjaman.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                <TablePagination
                    current_page={loans.current_page}
                    last_page={loans.last_page}
                    from={loans.from}
                    to={loans.to}
                    total={loans.total}
                    next_page_url={loans.next_page_url}
                    prev_page_url={loans.prev_page_url}
                    first_page_url={loans.first_page_url}
                    last_page_url={loans.last_page_url}
                    links={loans.links}
                />
            </Card>

            {/* Detail Dialog */}
            <Dialog open={!!detailLoan} onOpenChange={(open) => !open && setDetailLoan(null)}>
                <DialogContent className="sm:max-w-3xl max-w-[96vw] p-0 overflow-hidden max-h-[92vh] flex flex-col rounded-2xl">
                    {detailLoan && (() => {
                        const statusGradients: Record<string, string> = {
                            pending:  'from-amber-500/20 via-amber-500/10 to-transparent',
                            approved: 'from-sky-500/20 via-sky-500/10 to-transparent',
                            borrowed: 'from-indigo-500/20 via-indigo-500/10 to-transparent',
                            returned: 'from-emerald-500/20 via-emerald-500/10 to-transparent',
                            rejected: 'from-rose-500/20 via-rose-500/10 to-transparent',
                        };
                        const statusLabels: Record<string, string> = {
                            pending: 'Menunggu Persetujuan',
                            approved: 'Disetujui',
                            borrowed: 'Sedang Dipinjam',
                            returned: 'Sudah Dikembalikan',
                            rejected: 'Ditolak',
                        };
                        return (
                            <>
                                {/* Hero Header */}
                                <div className={`relative bg-gradient-to-br ${statusGradients[detailLoan.status] ?? 'from-muted/30 to-transparent'} px-4 sm:px-7 pt-6 sm:pt-8 pb-5 sm:pb-6 border-b border-border/40`}>
                                    <div className="flex items-start justify-between gap-4 pr-8">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                {detailLoan.loan_code && (
                                                    <span className="font-mono text-xs bg-background/80 border border-border/60 px-2.5 py-1 rounded-full text-foreground/70">
                                                        {detailLoan.loan_code}
                                                    </span>
                                                )}
                                                <Badge variant="outline" className={`font-semibold border-transparent capitalize text-xs ${statusClasses[detailLoan.status] ?? ''}`}>
                                                    {statusLabels[detailLoan.status] ?? detailLoan.status}
                                                </Badge>
                                            </div>
                                            <h2 className="text-2xl font-bold text-foreground leading-tight">{detailLoan.borrower_name}</h2>
                                            <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{detailLoan.purpose}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-6">
                                    {/* 2 kolom: Identitas + Jadwal */}
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        {/* Identitas */}
                                        <div className="space-y-1">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Identitas Peminjam</p>
                                            <div className="space-y-3 text-sm">
                                                <div className="flex justify-between border-b border-border/40 pb-2.5">
                                                    <span className="text-muted-foreground">NIP / NIS</span>
                                                    <span className="font-semibold">{detailLoan.borrower_identifier ?? '—'}</span>
                                                </div>
                                                <div className="flex justify-between border-b border-border/40 pb-2.5">
                                                    <span className="text-muted-foreground">No. Telepon</span>
                                                    <span className="font-semibold">{detailLoan.borrower_phone ?? '—'}</span>
                                                </div>
                                                <div className="flex justify-between pb-2.5">
                                                    <span className="text-muted-foreground">Diajukan oleh</span>
                                                    <span className="font-semibold">{detailLoan.requested_by ?? '—'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Jadwal */}
                                        <div className="space-y-1">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Jadwal</p>
                                            <div className="space-y-3 text-sm">
                                                <div className="flex justify-between border-b border-border/40 pb-2.5">
                                                    <span className="text-muted-foreground">Waktu Pinjam</span>
                                                    <span className="font-semibold">{detailLoan.loan_date ?? '—'}</span>
                                                </div>
                                                <div className="flex justify-between border-b border-border/40 pb-2.5">
                                                    <span className="text-muted-foreground">Batas Kembali</span>
                                                    <span className="font-semibold">{detailLoan.return_due_date ?? '—'}</span>
                                                </div>
                                                <div className="flex justify-between pb-2.5">
                                                    <span className="text-muted-foreground">Dikembalikan</span>
                                                    <span className={`font-semibold ${detailLoan.returned_at ? 'text-emerald-600' : 'text-muted-foreground/50'}`}>
                                                        {detailLoan.returned_at ?? 'Belum'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Item Pinjaman */}
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                                            Item Pinjaman
                                            <span className="ml-2 normal-case font-normal text-muted-foreground/70">({detailLoan.items.length} item)</span>
                                        </p>
                                        <div className="grid gap-3">
                                            {detailLoan.items.map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-4 py-3 hover:bg-muted/40 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                                            <span className="text-primary font-bold text-sm">{idx + 1}</span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-foreground">{item.tool_name ?? 'Alat'}</p>
                                                            <p className="text-xs text-muted-foreground font-mono">{item.tool_code}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-right">
                                                        {item.condition_out && (
                                                            <span className="text-xs text-muted-foreground bg-muted rounded-full px-2.5 py-1">
                                                                {item.condition_out}
                                                            </span>
                                                        )}
                                                        <div className="rounded-lg bg-primary/10 text-primary px-3 py-1.5 text-sm font-bold">
                                                            {item.quantity} unit
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Rincian Denda & Pembayaran (Tampil jika ada denda) */}
                                    {(detailLoan.total_fine ?? 0) > 0 && (
                                        <div>
                                            <Separator className="mb-6" />
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Rincian Denda & Status</p>
                                            <div className={`rounded-xl border p-4 space-y-3 ${detailLoan.payment_status === 'paid' ? 'bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20' : 'bg-rose-50/50 dark:bg-rose-500/5 border-rose-200 dark:border-rose-500/20'}`}>
                                                {detailLoan.fine && detailLoan.fine > 0 ? (
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-muted-foreground">Denda Keterlambatan</span>
                                                        <span className="font-mono">{detailLoan.fine.toLocaleString('id-ID')}</span>
                                                    </div>
                                                ) : null}
                                                
                                                {detailLoan.damage_fine && detailLoan.damage_fine > 0 ? (
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-muted-foreground">Denda Kerusakan/Hilang</span>
                                                        <span className="font-mono">{detailLoan.damage_fine.toLocaleString('id-ID')}</span>
                                                    </div>
                                                ) : null}

                                                <div className="border-t border-border/50 my-1 pt-2 flex justify-between items-center">
                                                    <span className="font-semibold">Total Denda</span>
                                                    <span className={`font-bold text-lg font-mono ${detailLoan.payment_status === 'unpaid' ? 'text-rose-600' : ''}`}>Rp {detailLoan.total_fine?.toLocaleString('id-ID')}</span>
                                                </div>

                                                <div className="flex justify-between items-center mt-2 pt-2 border-t border-border/50">
                                                    <span className="text-sm font-medium">Status Pembayaran</span>
                                                    {detailLoan.payment_status === 'paid' ? (
                                                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 hover:bg-emerald-200 gap-1 border-transparent">
                                                            <ShieldCheck className="h-3 w-3" /> Lunas
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300 hover:bg-rose-200 gap-1 border-transparent">
                                                            <AlertTriangle className="h-3 w-3" /> Belum Lunas
                                                        </Badge>
                                                    )}
                                                </div>

                                                {detailLoan.payment_status === 'unpaid' && auth.user.role === 'peminjam' && (
                                                    <div className="pt-3 flex justify-end">
                                                        <Button
                                                            size="sm"
                                                            className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
                                                            onClick={() => {
                                                                setDetailLoan(null);
                                                                setUserPayTarget(detailLoan);
                                                            }}
                                                        >
                                                            <Banknote className="h-3.5 w-3.5 mr-1.5" />
                                                            Lunasi Sekarang
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {detailLoan.notes && (
                                        <div>
                                            <Separator className="mb-6" />
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Catatan</p>
                                            <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 rounded-xl p-4 border border-border/50 whitespace-pre-wrap">
                                                {detailLoan.notes}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </>
                        );
                    })()}
                </DialogContent>
            </Dialog>

            {/* ===== Dialog Proses Pengembalian ===== */}
            <Dialog open={!!returnLoan} onOpenChange={(open) => !open && setReturnLoan(null)}>
                <DialogContent className="sm:max-w-lg max-w-[95vw]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <RotateCcw className="h-5 w-5 text-emerald-600" />
                            Proses Pengembalian Alat
                        </DialogTitle>
                        <DialogDescription>
                            {returnLoan?.borrower_name} — {returnLoan?.loan_code ?? `#${returnLoan?.id}`}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {/* Waktu Pengembalian */}
                        <div className="grid gap-2">
                            <Label htmlFor="return_datetime">Waktu Pengembalian</Label>
                            <Input
                                id="return_datetime"
                                type="datetime-local"
                                value={returnForm.return_datetime}
                                onChange={(e) => setReturnForm(f => ({ ...f, return_datetime: e.target.value }))}
                            />
                            {returnLoan?.return_due_date && (() => {
                                const due = returnLoan.return_due_date.replace(' ', 'T').slice(0, 16);
                                const isLate = returnForm.return_datetime > due;
                                return (
                                    <div className={`rounded-lg px-3 py-2 text-xs flex items-center gap-2 ${
                                        isLate
                                            ? 'bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-400'
                                            : 'bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-400'
                                    }`}>
                                        <span>{isLate ? '⚠' : '✓'}</span>
                                        <span>Batas kembali: <strong>{due.replace('T', ' ')}</strong>
                                            {isLate && ' — Terlambat!'}
                                            {!isLate && ' — Tepat waktu.'}
                                        </span>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Jam Keterlambatan */}
                        <div className="grid gap-2">
                            <Label htmlFor="hours_late">Jam Keterlambatan</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="hours_late"
                                    type="number"
                                    min="0"
                                    className="max-w-[120px]"
                                    value={returnForm.hours_late}
                                    onChange={(e) => setReturnForm(f => ({ ...f, hours_late: Number(e.target.value) }))}
                                />
                                <span className="text-sm text-muted-foreground">jam (0 = tidak telat)</span>
                            </div>
                            {returnForm.hours_late > 0 && (
                                <p className="text-xs text-amber-600 dark:text-amber-400">
                                    Denda telat: <strong>Rp {previewLateFine.toLocaleString('id-ID')}</strong>
                                    &nbsp;({fineSettings.late_percent}% × {returnForm.hours_late} jam × total harga alat)
                                </p>
                            )}
                        </div>

                        {/* Kondisi Alat Dikembalikan */}
                        <div className="grid gap-2">
                            <Label>Kondisi Alat</Label>
                            <Select
                                value={returnForm.condition_status}
                                onValueChange={(v) => setReturnForm(f => ({ ...f, condition_status: v }))}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="baik">✅ Baik — tidak ada denda tambahan</SelectItem>
                                    <SelectItem value="rusak">🔧 Rusak — denda {fineSettings.damage_percent}% dari harga alat</SelectItem>
                                    <SelectItem value="hilang">❌ Hilang — denda {fineSettings.lost_percent}% dari harga alat</SelectItem>
                                </SelectContent>
                            </Select>
                            {returnForm.condition_status !== 'baik' && (
                                <p className="text-xs text-orange-600 dark:text-orange-400">
                                    Denda {returnForm.condition_status}: <strong>Rp {(previewDamageFine + previewLostFine).toLocaleString('id-ID')}</strong>
                                </p>
                            )}
                        </div>

                        {/* Catatan Kondisi */}
                        <div className="grid gap-2">
                            <Label htmlFor="condition_note">Catatan Kondisi <span className="text-muted-foreground font-normal text-xs">(opsional)</span></Label>
                            <textarea
                                id="condition_note"
                                className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-20 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                                placeholder="Catatan kondisi alat saat dikembalikan..."
                                value={returnForm.condition_note}
                                onChange={(e) => setReturnForm(f => ({ ...f, condition_note: e.target.value }))}
                            />
                        </div>


                        {previewTotal > 0 && (
                            <div className="rounded-xl border border-orange-200 bg-orange-50 dark:bg-orange-500/10 dark:border-orange-500/30 p-4 space-y-2">
                                <p className="text-sm font-semibold text-orange-800 dark:text-orange-300 flex items-center gap-1.5">
                                    <AlertTriangle className="h-4 w-4" />
                                    Ringkasan Denda
                                </p>
                                {previewLateFine > 0 && (
                                    <div className="flex justify-between text-sm text-orange-700 dark:text-orange-400">
                                        <span>Keterlambatan ({returnForm.hours_late} jam)</span>
                                        <span className="font-semibold">Rp {previewLateFine.toLocaleString('id-ID')}</span>
                                    </div>
                                )}
                                {previewDamageFine > 0 && (
                                    <div className="flex justify-between text-sm text-orange-700 dark:text-orange-400">
                                        <span>Kerusakan ({fineSettings.damage_percent}%)</span>
                                        <span className="font-semibold">Rp {previewDamageFine.toLocaleString('id-ID')}</span>
                                    </div>
                                )}
                                {previewLostFine > 0 && (
                                    <div className="flex justify-between text-sm text-orange-700 dark:text-orange-400">
                                        <span>Kehilangan ({fineSettings.lost_percent}%)</span>
                                        <span className="font-semibold">Rp {previewLostFine.toLocaleString('id-ID')}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm font-bold text-orange-900 dark:text-orange-200 border-t border-orange-200 dark:border-orange-500/30 pt-2 mt-1">
                                    <span>Total Denda</span>
                                    <span>Rp {previewTotal.toLocaleString('id-ID')}</span>
                                </div>
                            </div>
                        )}
                        {previewTotal === 0 && (
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-500/30 p-3 text-center text-sm text-emerald-700 dark:text-emerald-400">
                                ✅ Tidak ada denda untuk pengembalian ini.
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setReturnLoan(null)} disabled={returning}>Batal</Button>
                        <Button
                            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                            disabled={returning}
                            onClick={() => {
                                if (!returnLoan) return;
                                setReturning(true);
                                router.post('/returns/process', {
                                    loan_id:          returnLoan.id,
                                    return_datetime:  returnForm.return_datetime.replace('T', ' ') + ':00',
                                    condition_status: returnForm.condition_status,
                                    hours_late:       returnForm.hours_late,
                                    condition_note:   returnForm.condition_note,
                                }, {
                                    preserveScroll: true,
                                    onSuccess: () => { setReturnLoan(null); toast.success('Pengembalian berhasil diproses!'); },
                                    onError: (errs) => toast.error(Object.values(errs)[0] as string ?? 'Gagal memproses pengembalian.'),
                                    onFinish: () => setReturning(false),
                                });
                            }}
                        >
                            {returning ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                            {returning ? 'Memproses...' : 'Konfirmasi Pengembalian'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ===== Dialog Opsi Pembayaran (User) ===== */}
            <Dialog open={!!userPayTarget} onOpenChange={(open) => !open && setUserPayTarget(null)}>
                <DialogContent className="sm:max-w-md max-w-[95vw]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Banknote className="h-5 w-5 text-emerald-600" />
                            Pilih Metode Pembayaran
                        </DialogTitle>
                        <DialogDescription>
                            Denda untuk peminjaman {userPayTarget?.loan_code ?? `#${userPayTarget?.id}`} sebesar <strong className="text-foreground">Rp {userPayTarget?.total_fine?.toLocaleString('id-ID')}</strong>
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="flex flex-col gap-4 py-4">
                        <div className="rounded-xl border p-4 bg-card hover:bg-muted/50 transition-colors flex flex-col items-center justify-center gap-3 text-center">
                            <div className="p-3 bg-sky-100 dark:bg-sky-500/10 rounded-full">
                                <CreditCard className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm">Pembayaran Online (Midtrans)</h4>
                                <p className="text-xs text-muted-foreground mt-1 mb-3">Otomatis lunas menggunakan GoPay, QRIS, Transfer Bank, dll.</p>
                                {userPayTarget && (
                                    <MidtransSnapButton
                                        returnId={userPayTarget.return_id!}
                                        totalFine={userPayTarget.total_fine ?? 0}
                                        paymentStatus={userPayTarget.payment_status ?? 'unpaid'}
                                        onBeforeSnap={() => setUserPayTarget(null)}
                                        onSuccess={() => {
                                            setUserPayTarget(null);
                                            router.reload();
                                        }}
                                        className="w-full bg-sky-600 hover:bg-sky-700 text-white"
                                    />
                                )}
                            </div>
                        </div>

                        <div className="rounded-xl border border-amber-200 p-4 bg-amber-50/50 dark:bg-amber-500/5 dark:border-amber-500/20 transition-colors flex flex-col items-center justify-center gap-3 text-center">
                            <div className="p-3 bg-amber-100 dark:bg-amber-500/20 rounded-full">
                                <Banknote className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm text-amber-900 dark:text-amber-100">Pembayaran Tunai (Cash)</h4>
                                <p className="text-xs text-amber-800/80 dark:text-amber-200/80 mt-1">
                                    Silahkan temui Petugas/Admin Lab dan serahkan uang tunai secara langsung. Status akan diubah menjadi lunas oleh Admin setelah uang diterima.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button variant="outline" onClick={() => setUserPayTarget(null)}>Tutup</Button>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
}

LoansIndex.layout = {
    breadcrumbs: [{ title: 'Peminjaman', href: '/loans' }],
};

