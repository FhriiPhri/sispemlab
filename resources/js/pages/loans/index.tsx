import { router, useForm, usePage } from '@inertiajs/react';
import { ClipboardList, Plus, RotateCcw, Send, ShieldCheck, X } from 'lucide-react';
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
    const loansList = loans.data;
    
    const form = useForm({
        borrower_name: '',
        borrower_identifier: '',
        borrower_phone: '',
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
                                <TableRow key={loan.id} className="group transition-colors">
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
                                                            className="h-8 shadow-none"
                                                            onClick={() => router.patch(`/loans/${loan.id}/status`, { status: 'returned' }, { preserveScroll: true })}
                                                        >
                                                            <RotateCcw className="mr-1 h-3 w-3" />
                                                            Cek Pengembalian
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
        </div>
    );
}

LoansIndex.layout = {
    breadcrumbs: [{ title: 'Peminjaman', href: '/loans' }],
};
