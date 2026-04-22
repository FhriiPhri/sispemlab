import { router, useForm, usePage } from '@inertiajs/react';
import { AlertTriangle, CircleDollarSign, ClipboardList, Loader2, Plus, RotateCcw, Send, ShieldCheck, X } from 'lucide-react';
import { FormEvent, useState } from 'react';
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
};

type Props = {
    loans: PaginatedData<Loan>;
    tools: ToolOption[];
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

export default function LoansIndex({ loans, tools, stats }: Props) {
    const { auth } = usePage<SharedData>().props;
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [detailLoan, setDetailLoan] = useState<Loan | null>(null);
    const [returnLoan, setReturnLoan] = useState<Loan | null>(null);
    const [returning, setReturning] = useState(false);
    const [returnForm, setReturnForm] = useState({
        return_datetime: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
        condition_note: '',
        damage_fine: '',
    });
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
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Buat Pengajuan
                        </Button>
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
                                                                onClick={() => router.patch(`/loans/${loan.id}/status`, { status: 'approved' }, { preserveScroll: true })}
                                                            >
                                                                <ShieldCheck className="mr-1 h-3 w-3" /> Setujui
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="destructive"
                                                                className="h-8"
                                                                onClick={() => router.patch(`/loans/${loan.id}/status`, { status: 'rejected' }, { preserveScroll: true })}
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
                                                                onClick={() => router.patch(`/loans/${loan.id}/status`, { status: 'borrowed' }, { preserveScroll: true })}
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
                                                            onClick={(e) => { e.stopPropagation(); setReturnLoan(loan); setReturnForm({ return_datetime: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16), condition_note: '', damage_fine: '' }); }}
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
                                                    onClick={() => router.post(`/loans/${loan.id}/return-request`, {}, { preserveScroll: true })}
                                                >
                                                    <RotateCcw className="mr-1 h-3 w-3" />
                                                    Kembalikan Alat
                                                </Button>
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
                <DialogContent className="sm:max-w-3xl max-w-[96vw] p-0 overflow-hidden max-h-[92vh] flex flex-col">
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
                                <div className={`relative bg-gradient-to-br ${statusGradients[detailLoan.status] ?? 'from-muted/30 to-transparent'} px-7 pt-8 pb-6 border-b border-border/40`}>
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
                                <div className="overflow-y-auto flex-1 p-6 space-y-6">
                                    {/* 2 kolom: Identitas + Jadwal */}
                                    <div className="grid grid-cols-2 gap-6">
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
                        {/* Waktu Pengembalian - pakai datetime-local */}
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
                                        <span>
                                            Batas kembali: <strong>{due.replace('T', ' ')}</strong>
                                            {isLate && ' — Terlambat! Denda akan dihitung (Rp 5.000/hari, dibulatkan ke atas).'}
                                            {!isLate && ' — Tepat waktu, tidak ada denda keterlambatan.'}
                                        </span>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Denda Kerusakan */}
                        <div className="grid gap-2">
                            <Label htmlFor="damage_fine" className="flex items-center gap-1.5">
                                <CircleDollarSign className="h-4 w-4 text-orange-500" />
                                Denda Kerusakan / Kehilangan (Rp)
                                <span className="text-muted-foreground font-normal text-xs">(opsional)</span>
                            </Label>
                            <Input
                                id="damage_fine"
                                type="number"
                                min="0"
                                step="1000"
                                placeholder="0"
                                value={returnForm.damage_fine}
                                onChange={(e) => setReturnForm(f => ({ ...f, damage_fine: e.target.value }))}
                            />
                            <p className="text-xs text-muted-foreground">Isi jika ada kerusakan atau kehilangan alat. Denda keterlambatan dihitung otomatis.</p>
                        </div>

                        {/* Catatan Kondisi */}
                        <div className="grid gap-2">
                            <Label htmlFor="condition_note">Catatan Kondisi Alat</Label>
                            <textarea
                                id="condition_note"
                                className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-20 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                                placeholder="Contoh: Alat dikembalikan dalam kondisi baik. Kabel ada lecet kecil."
                                value={returnForm.condition_note}
                                onChange={(e) => setReturnForm(f => ({ ...f, condition_note: e.target.value }))}
                            />
                        </div>

                        {/* Summary denda kerusakan */}
                        {(returnForm.damage_fine && Number(returnForm.damage_fine) > 0) && (
                            <div className="rounded-xl border border-orange-200 bg-orange-50 dark:bg-orange-500/10 dark:border-orange-500/30 p-3 flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                                <p className="text-sm text-orange-700 dark:text-orange-400">
                                    Denda kerusakan <span className="font-bold">Rp {Number(returnForm.damage_fine).toLocaleString('id-ID')}</span> akan ditambahkan ke total denda.
                                </p>
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
                                    loan_id: returnLoan.id,
                                    return_datetime: returnForm.return_datetime.replace('T', ' ') + ':00',
                                    condition_note: returnForm.condition_note,
                                    damage_fine: returnForm.damage_fine || 0,
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
        </div>
    );
}

LoansIndex.layout = {
    breadcrumbs: [{ title: 'Peminjaman', href: '/loans' }],
};

