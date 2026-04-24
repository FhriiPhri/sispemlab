import { router, useForm, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    Download,
    FileSpreadsheet,
    Loader2,
    Package,
    Pencil,
    Plus,
    Send,
    Trash2,
    Upload,
    X,
} from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';
import Heading from '@/components/heading';
import TablePagination, {
    type PaginatedData,
} from '@/components/table-pagination';
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

type CategoryOption = {
    id: number;
    name: string;
};

type Tool = {
    id: number;
    category_id: number | null;
    category_name: string | null;
    code: string;
    name: string;
    brand: string | null;
    serial_number: string | null;
    condition_status: string;
    location: string | null;
    stock_total: number;
    stock_available: number;
    description: string | null;
    image: string | null;
    image_url: string | null;
    price: number;
};

type Props = {
    tools: PaginatedData<Tool>;
    categories: CategoryOption[];
    fineSettings?: {
        late_percent: number;
        damage_percent: number;
        loss_percent: number;
    };
    authUser?: { name: string; identifier: string; phone: string };
    stats: {
        total_tools: number;
        available_units: number;
        need_attention: number;
    };
};

const textareaClass =
    'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]';

const conditionOptions = [
    { value: 'baik', label: 'Baik' },
    { value: 'perlu-servis', label: 'Perlu servis' },
    { value: 'rusak-ringan', label: 'Rusak ringan' },
    { value: 'rusak-berat', label: 'Rusak berat' },
];

export default function ToolsIndex({
    tools,
    categories,
    stats,
    fineSettings = { late_percent: 0, damage_percent: 0, loss_percent: 0 },
    authUser,
}: Props) {
    const { auth } = usePage<SharedData>().props;
    const user =
        authUser ||
        (auth?.user
            ? {
                  name: auth.user.name,
                  identifier: auth.user.identifier || '',
                  phone: auth.user.phone || '',
              }
            : { name: '', identifier: '', phone: '' });

    const isPeminjam = auth?.user?.role === 'peminjam';
    const toolsList = tools?.data || [];

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
    const [detailTool, setDetailTool] = useState<Tool | null>(null);
    const [pinjamTool, setPinjamTool] = useState<Tool | null>(null);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);

    const nowLocal = () =>
        new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);

    const loanForm = useForm({
        borrower_name: user.name || '',
        borrower_identifier: user.identifier || '',
        borrower_phone: user.phone || '',
        purpose: '',
        loan_date: nowLocal(),
        return_due_date: new Date(
            Date.now() - new Date().getTimezoneOffset() * 60000 + 3600000,
        )
            .toISOString()
            .slice(0, 16),
        notes: '',
        items: [{ tool_id: '', quantity: 1, condition_out: 'baik' }],
    });

    const openLoanForm = (tool: Tool) => {
        loanForm.reset();
        loanForm.setData({
            borrower_name: user.name || '',
            borrower_identifier: user.identifier || '',
            borrower_phone: user.phone || '',
            purpose: '',
            loan_date: nowLocal(),
            return_due_date: new Date(
                Date.now() - new Date().getTimezoneOffset() * 60000 + 3600000,
            )
                .toISOString()
                .slice(0, 16),
            notes: '',
            items: [
                {
                    tool_id: String(tool.id),
                    quantity: 1,
                    condition_out: 'baik',
                },
            ],
        });
        setDetailTool(null);
        setPinjamTool(tool);
    };

    const submitLoan = (e: FormEvent) => {
        e.preventDefault();
        loanForm.transform((data) => ({
            ...data,
            items: data.items.map((item) => ({
                ...item,
                tool_id: Number(item.tool_id),
            })),
        }));
        loanForm.post('/loans', {
            preserveScroll: true,
            onSuccess: () => {
                setPinjamTool(null);
                loanForm.reset();
                toast.success(
                    'Pengajuan peminjaman berhasil dikirim! Menunggu persetujuan.',
                );
            },
            onError: (errs) => {
                const msg = Object.values(errs)[0];
                if (msg) toast.error(msg);
            },
        });
    };

    const createForm = useForm({
        category_id: '',
        code: '',
        name: '',
        brand: '',
        serial_number: '',
        condition_status: 'baik',
        location: '',
        stock_total: 1,
        stock_available: 1,
        description: '',
        price: 0,
        image: null as File | null,
    });

    const editForm = useForm({
        category_id: '',
        code: '',
        name: '',
        brand: '',
        serial_number: '',
        condition_status: 'baik',
        location: '',
        stock_total: 1,
        stock_available: 1,
        description: '',
        price: 0,
        image: null as File | null,
        _method: 'put',
    });

    useEffect(() => {
        if (selectedTool) {
            editForm.setData({
                category_id: selectedTool.category_id?.toString() ?? '',
                code: selectedTool.code ?? '',
                name: selectedTool.name ?? '',
                brand: selectedTool.brand ?? '',
                serial_number: selectedTool.serial_number ?? '',
                condition_status: selectedTool.condition_status ?? 'baik',
                location: selectedTool.location ?? '',
                stock_total: selectedTool.stock_total ?? 1,
                stock_available: selectedTool.stock_available ?? 1,
                description: selectedTool.description ?? '',
                price: selectedTool.price ?? 0,
                image: null, // Reset file input
                _method: 'put',
            });
            editForm.clearErrors();
        }
    }, [selectedTool]);

    const submitCreate = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        createForm.transform((data) => ({
            ...data,
            category_id: data.category_id || null,
        }));

        createForm.post('/tools', {
            preserveScroll: true,
            onSuccess: () => {
                createForm.reset(
                    'category_id',
                    'code',
                    'name',
                    'brand',
                    'serial_number',
                    'location',
                    'description',
                    'price',
                    'image',
                );
                setIsCreateOpen(false);
                toast.success('Alat baru berhasil ditambahkan!');
            },
            onError: (errors) => {
                const messages = Object.values(errors);
                if (messages.length > 0) {
                    toast.error(messages[0], {
                        description:
                            messages.length > 1
                                ? `${messages.length - 1} field lain juga belum diisi dengan benar.`
                                : undefined,
                    });
                }
            },
        });
    };

    const submitUpdate = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!selectedTool) return;

        editForm.transform((data) => ({
            ...data,
            category_id: data.category_id || null,
        }));

        editForm.post(`/tools/${selectedTool.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedTool(null);
                toast.success('Data alat berhasil diperbarui!');
            },
            onError: (errors) => {
                const messages = Object.values(errors);
                if (messages.length > 0) {
                    toast.error(messages[0], {
                        description:
                            messages.length > 1
                                ? `${messages.length - 1} field lain juga bermasalah.`
                                : undefined,
                    });
                }
            },
        });
    };

    const handleDelete = (tool: Tool) => {
        if (confirm(`Hapus alat ${tool.name}?`)) {
            router.delete(`/tools/${tool.id}`, { preserveScroll: true });
        }
    };

    if (isPeminjam) {
        return (
            <div className="w-full max-w-full space-y-6 overflow-hidden p-4 md:p-6">
                <Heading
                    title="Katalog Alat"
                    description="Daftar koleksi alat yang dapat dipinjam saat ini beserta rincian stoknya."
                />
                <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {toolsList.map((tool) => (
                        <Card
                            key={tool.id}
                            className="group flex flex-col overflow-hidden bg-card/60 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5"
                        >
                            {tool.image_url && (
                                <div className="aspect-[4/3] w-full overflow-hidden border-b bg-muted">
                                    <img
                                        src={tool.image_url}
                                        alt={tool.name}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                </div>
                            )}
                            <CardHeader
                                className={
                                    tool.image_url ? 'pt-4 pb-3' : 'pb-3'
                                }
                            >
                                <div className="mb-2 flex items-center gap-2">
                                    {!tool.image_url && (
                                        <Package className="h-5 w-5 text-primary" />
                                    )}
                                    <Badge
                                        variant="secondary"
                                        className="transition-colors group-hover:bg-secondary/80"
                                    >
                                        {tool.category_name ?? 'Tanpa kategori'}
                                    </Badge>
                                </div>
                                <CardTitle className="text-xl">
                                    {tool.name}
                                </CardTitle>
                                <CardDescription>
                                    Kode: {tool.code}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-1 flex-col gap-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Tersedia:
                                    </span>
                                    <Badge
                                        className={
                                            tool.stock_available > 0
                                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                                : 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                                        }
                                    >
                                        {tool.stock_available} /{' '}
                                        {tool.stock_total} Unit
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Kondisi:
                                    </span>
                                    <span className="font-medium capitalize">
                                        {tool.condition_status.replace(
                                            '-',
                                            ' ',
                                        )}
                                    </span>
                                </div>
                                {tool.description && (
                                    <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">
                                        {tool.description}
                                    </p>
                                )}
                                <div className="mt-auto pt-4">
                                    {tool.stock_available < 1 ? (
                                        <Button className="w-full" disabled>
                                            Stok Habis
                                        </Button>
                                    ) : (
                                        <Button asChild className="w-full">
                                            <a
                                                href={`/loans?tool_id=${tool.id}`}
                                            >
                                                Pinjam Alat Ini
                                            </a>
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {toolsList.length === 0 && (
                        <div className="col-span-full rounded-[1.25rem] border border-dashed border-border py-12 text-center text-sm text-muted-foreground shadow-sm">
                            Katalog alat saat ini sedang kosong.
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-full space-y-6 overflow-hidden p-4 md:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <Heading
                    title="Manajemen Data Alat"
                    description="Simpan identitas alat, kondisi, lokasi, dan ketersediaan stok."
                />

                {auth.user.role === 'admin' && (
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Tombol Import */}
                        <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => setIsImportOpen(true)}
                        >
                            <Upload className="h-4 w-4" />
                            Import Excel
                        </Button>

                        {/* Tombol Tambah Manual */}
                        <Dialog
                            open={isCreateOpen}
                            onOpenChange={setIsCreateOpen}
                        >
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Tambah Alat
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-h-[92vh] w-full max-w-[95vw] overflow-y-auto sm:max-w-3xl sm:p-8">
                                <DialogHeader>
                                    <DialogTitle>
                                        Registrasi Alat Baru
                                    </DialogTitle>
                                    <DialogDescription>
                                        Masukkan data inventaris baru ke sistem.
                                    </DialogDescription>
                                </DialogHeader>
                                <ToolForm
                                    form={createForm}
                                    categories={categories}
                                    submitLabel="Simpan alat"
                                    onSubmit={submitCreate}
                                    onCancel={() => setIsCreateOpen(false)}
                                />
                            </DialogContent>
                        </Dialog>
                    </div>
                )}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="py-4">
                        <CardDescription>Total jenis alat</CardDescription>
                        <CardTitle className="text-3xl text-primary">
                            {stats.total_tools}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="py-4">
                        <CardDescription>Total unit tersedia</CardDescription>
                        <CardTitle className="text-3xl text-emerald-600 dark:text-emerald-400">
                            {stats.available_units}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="py-4">
                        <CardDescription>Perlu perhatian</CardDescription>
                        <CardTitle className="text-3xl text-rose-500">
                            {stats.need_attention}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <Card className="overflow-hidden border-border/60 bg-card/50 shadow-md backdrop-blur-xl">
                <div className="overflow-x-auto pb-4">
                    <Table className="min-w-[800px]">
                        <TableHeader className="bg-muted/30">
                            <TableRow>
                                <TableHead className="w-[80px]">Kode</TableHead>
                                <TableHead className="min-w-[200px]">
                                    Nama Alat
                                </TableHead>
                                <TableHead>Kategori</TableHead>
                                <TableHead>Kondisi</TableHead>
                                <TableHead className="text-center">
                                    Stok
                                </TableHead>
                                <TableHead className="text-right">
                                    Harga
                                </TableHead>
                                {auth.user.role === 'admin' && (
                                    <TableHead className="w-[150px] text-right">
                                        Aksi
                                    </TableHead>
                                )}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {toolsList.map((tool) => (
                                <TableRow
                                    key={tool.id}
                                    className="group cursor-pointer transition-colors hover:bg-muted/50"
                                    onClick={(e) => {
                                        // Jangan buka detail jika klik tombol aksi
                                        if (
                                            (e.target as HTMLElement).closest(
                                                'button',
                                            )
                                        )
                                            return;
                                        setDetailTool(tool);
                                    }}
                                >
                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                        {tool.code}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            {tool.image_url ? (
                                                <img
                                                    src={tool.image_url}
                                                    alt={tool.name}
                                                    className="h-10 w-10 rounded-md border object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-dashed bg-muted/50">
                                                    <Package className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                            )}
                                            {tool.name}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className="text-xs font-normal"
                                        >
                                            {tool.category_name ?? '-'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            className={`rounded-full border px-2 py-1 text-xs capitalize ${tool.condition_status === 'baik' ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400' : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400'}`}
                                        >
                                            {tool.condition_status.replace(
                                                '-',
                                                ' ',
                                            )}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {tool.stock_available}/
                                        {tool.stock_total}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm text-emerald-600 dark:text-emerald-400">
                                        {tool.price > 0 ? (
                                            `Rp ${tool.price.toLocaleString('id-ID')}`
                                        ) : (
                                            <span className="text-xs text-muted-foreground">
                                                Belum diset
                                            </span>
                                        )}
                                    </TableCell>
                                    {auth.user.role === 'admin' && (
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 shadow-none"
                                                    onClick={() =>
                                                        setSelectedTool(tool)
                                                    }
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                    <span className="sr-only">
                                                        Edit
                                                    </span>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 text-rose-500 shadow-none hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                                                    onClick={() =>
                                                        handleDelete(tool)
                                                    }
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    <span className="sr-only">
                                                        Hapus
                                                    </span>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                            {toolsList.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={
                                            auth.user.role === 'admin' ? 7 : 6
                                        }
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        Belum ada data alat yang diinputkan ke
                                        sistem.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                <TablePagination
                    current_page={tools.current_page}
                    last_page={tools.last_page}
                    from={tools.from}
                    to={tools.to}
                    total={tools.total}
                    next_page_url={tools.next_page_url}
                    prev_page_url={tools.prev_page_url}
                    first_page_url={tools.first_page_url}
                    last_page_url={tools.last_page_url}
                    links={tools.links}
                />
            </Card>

            <Dialog
                open={!!selectedTool}
                onOpenChange={(open) => !open && setSelectedTool(null)}
            >
                <DialogContent className="max-h-[92vh] w-full max-w-[95vw] overflow-y-auto sm:max-w-3xl sm:p-8">
                    <DialogHeader>
                        <DialogTitle>Edit Alat</DialogTitle>
                        <DialogDescription>
                            Perbarui detail alat yang telah dipilih.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedTool && (
                        <ToolForm
                            form={editForm}
                            categories={categories}
                            submitLabel="Perbarui alat"
                            onSubmit={submitUpdate}
                            onCancel={() => setSelectedTool(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Detail Dialog */}
            <Dialog
                open={!!detailTool}
                onOpenChange={(open) => !open && setDetailTool(null)}
            >
                <DialogContent className="flex max-h-[92vh] max-w-[96vw] flex-col overflow-hidden p-0 sm:max-w-3xl">
                    {detailTool && (
                        <>
                            {/* Hero Banner */}
                            <div className="relative">
                                {detailTool.image_url ? (
                                    <div className="h-52 w-full overflow-hidden bg-muted">
                                        <img
                                            src={detailTool.image_url}
                                            alt={detailTool.name}
                                            className="h-full w-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                                    </div>
                                ) : (
                                    <div className="h-28 w-full bg-gradient-to-br from-primary/20 via-primary/10 to-transparent" />
                                )}

                                {/* Overlay Header */}
                                <div
                                    className={`absolute right-0 bottom-0 left-0 p-5 ${detailTool.image_url ? 'text-white' : ''}`}
                                >
                                    <div className="flex items-end justify-between gap-3">
                                        <div>
                                            <p
                                                className={`mb-1 font-mono text-xs ${detailTool.image_url ? 'text-white/70' : 'text-muted-foreground'}`}
                                            >
                                                {detailTool.code}
                                            </p>
                                            <h2
                                                className={`text-2xl leading-tight font-bold ${detailTool.image_url ? 'text-white' : 'text-foreground'}`}
                                            >
                                                {detailTool.name}
                                            </h2>
                                            {detailTool.category_name && (
                                                <p
                                                    className={`mt-0.5 text-sm ${detailTool.image_url ? 'text-white/80' : 'text-muted-foreground'}`}
                                                >
                                                    {detailTool.category_name}
                                                </p>
                                            )}
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className={`shrink-0 px-3 py-1 text-sm font-semibold capitalize ${
                                                detailTool.condition_status ===
                                                'baik'
                                                    ? detailTool.image_url
                                                        ? 'border-transparent bg-emerald-500/90 text-white'
                                                        : 'border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                                    : detailTool.image_url
                                                      ? 'border-transparent bg-amber-500/90 text-white'
                                                      : 'border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                                            }`}
                                        >
                                            {detailTool.condition_status}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="flex-1 space-y-6 overflow-y-auto p-6">
                                {/* Stok Cards */}
                                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center dark:border-emerald-800 dark:bg-emerald-900/20">
                                        <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400">
                                            {detailTool.stock_available}
                                        </p>
                                        <p className="mt-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                                            Unit Tersedia
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
                                        <p className="text-4xl font-black text-foreground">
                                            {detailTool.stock_total}
                                        </p>
                                        <p className="mt-1 text-xs font-medium text-muted-foreground">
                                            Total Unit
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-center dark:border-rose-800 dark:bg-rose-900/20">
                                        <p className="text-4xl font-black text-rose-600 dark:text-rose-400">
                                            {detailTool.stock_total -
                                                detailTool.stock_available}
                                        </p>
                                        <p className="mt-1 text-xs font-medium text-rose-700 dark:text-rose-400">
                                            Sedang Dipinjam
                                        </p>
                                    </div>
                                </div>

                                <Separator />

                                {/* Spesifikasi */}
                                <div>
                                    <p className="mb-3 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                                        Spesifikasi
                                    </p>
                                    <div className="grid grid-cols-1 gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
                                        <div className="flex justify-between border-b border-border/40 pb-3">
                                            <span className="text-muted-foreground">
                                                Merek
                                            </span>
                                            <span className="font-semibold">
                                                {detailTool.brand ?? '—'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-b border-border/40 pb-3">
                                            <span className="text-muted-foreground">
                                                Kategori
                                            </span>
                                            <span className="font-semibold">
                                                {detailTool.category_name ??
                                                    '—'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-b border-border/40 pb-3">
                                            <span className="text-muted-foreground">
                                                No. Seri
                                            </span>
                                            <span className="font-mono text-xs font-semibold">
                                                {detailTool.serial_number ??
                                                    '—'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-b border-border/40 pb-3">
                                            <span className="text-muted-foreground">
                                                Lokasi
                                            </span>
                                            <span className="font-semibold">
                                                {detailTool.location ?? '—'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-b border-border/40 pb-3">
                                            <span className="text-muted-foreground">
                                                Harga
                                            </span>
                                            <span className="font-semibold text-emerald-600">
                                                Rp{' '}
                                                {detailTool.price?.toLocaleString(
                                                    'id-ID',
                                                ) ?? '0'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Info Denda untuk Peminjam */}
                                {isPeminjam && detailTool.price > 0 && (
                                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-900/20">
                                        <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-widest text-amber-800 uppercase dark:text-amber-300">
                                            <AlertTriangle className="h-3.5 w-3.5" />
                                            Estimasi Denda
                                        </p>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-amber-700 dark:text-amber-400">
                                                    Denda Keterlambatan (
                                                    {fineSettings.late_percent}
                                                    %/jam)
                                                </span>
                                                <span className="font-semibold text-amber-800 dark:text-amber-300">
                                                    Rp{' '}
                                                    {Math.round(
                                                        (detailTool.price *
                                                            fineSettings.late_percent) /
                                                            100,
                                                    ).toLocaleString('id-ID')}
                                                    /jam
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-amber-700 dark:text-amber-400">
                                                    Denda Kerusakan (
                                                    {
                                                        fineSettings.damage_percent
                                                    }
                                                    %)
                                                </span>
                                                <span className="font-semibold text-amber-800 dark:text-amber-300">
                                                    Rp{' '}
                                                    {Math.round(
                                                        (detailTool.price *
                                                            fineSettings.damage_percent) /
                                                            100,
                                                    ).toLocaleString('id-ID')}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-amber-700 dark:text-amber-400">
                                                    Denda Kehilangan (
                                                    {fineSettings.loss_percent}
                                                    %)
                                                </span>
                                                <span className="font-semibold text-amber-800 dark:text-amber-300">
                                                    Rp{' '}
                                                    {Math.round(
                                                        (detailTool.price *
                                                            fineSettings.loss_percent) /
                                                            100,
                                                    ).toLocaleString('id-ID')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {detailTool.description && (
                                    <div>
                                        <p className="mb-3 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                                            Deskripsi
                                        </p>
                                        <p className="rounded-xl border border-border/50 bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground">
                                            {detailTool.description}
                                        </p>
                                    </div>
                                )}

                                {/* Tombol Pinjam untuk Peminjam */}
                                {isPeminjam &&
                                    detailTool.stock_available > 0 && (
                                        <div className="pt-2">
                                            <Button
                                                className="w-full gap-2"
                                                onClick={() =>
                                                    openLoanForm(detailTool)
                                                }
                                            >
                                                <Send className="h-4 w-4" />
                                                Ajukan Peminjaman Alat Ini
                                            </Button>
                                        </div>
                                    )}
                                {isPeminjam &&
                                    detailTool.stock_available === 0 && (
                                        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-center text-sm text-rose-700 dark:bg-rose-900/20 dark:text-rose-400">
                                            Stok habis — tidak tersedia untuk
                                            dipinjam saat ini.
                                        </div>
                                    )}
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* ── Dialog Form Pengajuan Pinjam ── */}
            <Dialog
                open={!!pinjamTool}
                onOpenChange={(open) => {
                    if (!open) setPinjamTool(null);
                }}
            >
                <DialogContent className="max-h-[92vh] max-w-[95vw] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Send className="h-5 w-5 text-primary" />
                            Ajukan Peminjaman
                        </DialogTitle>
                        <DialogDescription>
                            {pinjamTool
                                ? `${pinjamTool.name} (${pinjamTool.code}) — Stok tersedia: ${pinjamTool.stock_available}`
                                : ''}
                        </DialogDescription>
                    </DialogHeader>

                    <form className="space-y-4 py-2" onSubmit={submitLoan}>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label>Nama Peminjam</Label>
                                <Input
                                    value={loanForm.data.borrower_name}
                                    disabled
                                    readOnly
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Identitas (NIS/NIP)</Label>
                                <Input
                                    value={loanForm.data.borrower_identifier}
                                    disabled
                                    readOnly
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label>No. Telepon</Label>
                                <Input
                                    value={loanForm.data.borrower_phone}
                                    disabled
                                    readOnly
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>
                                    Keperluan{' '}
                                    <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    value={loanForm.data.purpose}
                                    onChange={(e) =>
                                        loanForm.setData(
                                            'purpose',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Misal: Praktikum Jaringan..."
                                    className={
                                        loanForm.errors.purpose
                                            ? 'border-rose-500'
                                            : ''
                                    }
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label>Waktu Pinjam</Label>
                                <Input
                                    type="datetime-local"
                                    value={loanForm.data.loan_date}
                                    onChange={(e) =>
                                        loanForm.setData(
                                            'loan_date',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Batas Pengembalian</Label>
                                <Input
                                    type="datetime-local"
                                    value={loanForm.data.return_due_date}
                                    onChange={(e) =>
                                        loanForm.setData(
                                            'return_due_date',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                        </div>

                        {/* Item — alat sudah terisi otomatis */}
                        <div className="space-y-3 border-t pt-4">
                            <div className="flex items-center justify-between">
                                <Label>Alat yang Dipinjam</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        loanForm.setData('items', [
                                            ...loanForm.data.items,
                                            {
                                                tool_id: '',
                                                quantity: 1,
                                                condition_out: 'baik',
                                            },
                                        ])
                                    }
                                >
                                    <Plus className="mr-1 h-4 w-4" /> Tambah
                                    Alat Lain
                                </Button>
                            </div>
                            {loanForm.data.items.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="relative rounded-xl border border-border bg-muted/20 p-4"
                                >
                                    {loanForm.data.items.length > 1 && (
                                        <button
                                            type="button"
                                            className="absolute top-2 right-2 text-muted-foreground hover:text-rose-500"
                                            onClick={() =>
                                                loanForm.setData(
                                                    'items',
                                                    loanForm.data.items.filter(
                                                        (_, i) => i !== idx,
                                                    ),
                                                )
                                            }
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                    <div className="mt-1 grid gap-4 md:grid-cols-[1.6fr_0.7fr]">
                                        <div className="grid gap-2">
                                            <Label className="text-xs text-muted-foreground">
                                                Pilih Alat
                                            </Label>
                                            <Select
                                                value={item.tool_id}
                                                onValueChange={(v) =>
                                                    loanForm.setData(
                                                        'items',
                                                        loanForm.data.items.map(
                                                            (cur, i) =>
                                                                i === idx
                                                                    ? {
                                                                          ...cur,
                                                                          tool_id:
                                                                              v,
                                                                      }
                                                                    : cur,
                                                        ),
                                                    )
                                                }
                                            >
                                                <SelectTrigger className="w-full bg-background">
                                                    <SelectValue placeholder="Pilih alat..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {tools.data.map((t) => (
                                                        <SelectItem
                                                            key={t.id}
                                                            value={String(t.id)}
                                                        >
                                                            {t.name} ({t.code})
                                                            — Stok:{' '}
                                                            {t.stock_available}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label className="text-xs text-muted-foreground">
                                                Jumlah
                                            </Label>
                                            <Input
                                                type="number"
                                                min={1}
                                                value={item.quantity}
                                                className="bg-background"
                                                onChange={(e) =>
                                                    loanForm.setData(
                                                        'items',
                                                        loanForm.data.items.map(
                                                            (cur, i) =>
                                                                i === idx
                                                                    ? {
                                                                          ...cur,
                                                                          quantity:
                                                                              Number(
                                                                                  e
                                                                                      .target
                                                                                      .value,
                                                                              ),
                                                                      }
                                                                    : cur,
                                                        ),
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="grid gap-2">
                            <Label>Catatan (opsional)</Label>
                            <textarea
                                className={textareaClass}
                                rows={2}
                                value={loanForm.data.notes}
                                onChange={(e) =>
                                    loanForm.setData('notes', e.target.value)
                                }
                            />
                        </div>

                        <div className="flex justify-end gap-2 border-t pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setPinjamTool(null)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={loanForm.processing}
                                className="gap-2"
                            >
                                {loanForm.processing ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                                {loanForm.processing
                                    ? 'Mengirim...'
                                    : 'Kirim Pengajuan'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ===== Dialog Import Excel ===== */}
            <Dialog
                open={isImportOpen}
                onOpenChange={(open) => {
                    setIsImportOpen(open);
                    if (!open) setImportFile(null);
                }}
            >
                <DialogContent className="max-w-[95vw] sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                            Import Data Alat dari Excel
                        </DialogTitle>
                        <DialogDescription>
                            Upload file .xlsx/.xls berisi data alat. Alat dengan
                            kode yang sama akan diperbarui otomatis.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {/* Download Template */}
                        <div className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 p-3 dark:border-sky-500/30 dark:bg-sky-500/10">
                            <Download className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-sky-800 dark:text-sky-300">
                                    Belum punya template?
                                </p>
                                <p className="mt-0.5 mb-2 text-xs text-sky-700 dark:text-sky-400">
                                    Download template Excel berikut agar format
                                    kolom sesuai.
                                </p>
                                <a
                                    href="/tools/import/template"
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 underline underline-offset-2 hover:text-sky-900 dark:text-sky-300"
                                    target="_blank"
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    Download Template
                                </a>
                            </div>
                        </div>

                        {/* Upload File */}
                        <div className="grid gap-2">
                            <Label htmlFor="import-file">
                                Pilih File Excel
                            </Label>
                            <Input
                                id="import-file"
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={(e) =>
                                    setImportFile(e.target.files?.[0] ?? null)
                                }
                                className="cursor-pointer"
                            />
                            <p className="text-xs text-muted-foreground">
                                Format: .xlsx, .xls, .csv — Maks 5 MB
                            </p>
                        </div>

                        {importFile && (
                            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
                                <FileSpreadsheet className="h-4 w-4 shrink-0 text-emerald-600" />
                                <span className="truncate font-medium">
                                    {importFile.name}
                                </span>
                                <span className="ml-auto text-xs whitespace-nowrap text-muted-foreground">
                                    {(importFile.size / 1024).toFixed(1)} KB
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsImportOpen(false);
                                setImportFile(null);
                            }}
                            disabled={importing}
                        >
                            Batal
                        </Button>
                        <Button
                            className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                            disabled={!importFile || importing}
                            onClick={() => {
                                if (!importFile) return;
                                setImporting(true);
                                const fd = new FormData();
                                fd.append('file', importFile);
                                router.post('/tools/import', fd, {
                                    forceFormData: true,
                                    preserveScroll: true,
                                    onSuccess: () => {
                                        setIsImportOpen(false);
                                        setImportFile(null);
                                        toast.success('Import berhasil!');
                                    },
                                    onError: (errs) =>
                                        toast.error(
                                            (Object.values(
                                                errs,
                                            )[0] as string) ?? 'Import gagal.',
                                        ),
                                    onFinish: () => setImporting(false),
                                });
                            }}
                        >
                            {importing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Upload className="h-4 w-4" />
                            )}
                            {importing ? 'Mengimport...' : 'Import Sekarang'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function ToolForm({
    form,
    categories,
    submitLabel,
    onSubmit,
    onCancel,
}: {
    form: ReturnType<
        typeof useForm<{
            category_id: string;
            code: string;
            name: string;
            brand: string;
            serial_number: string;
            condition_status: string;
            location: string;
            stock_total: number;
            stock_available: number;
            description: string;
            price: number;
            image: File | null;
        }>
    >;
    categories: CategoryOption[];
    submitLabel: string;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onCancel?: () => void;
}) {
    return (
        <form className="space-y-4 py-2" onSubmit={onSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                    <Label>Kategori</Label>
                    <Select
                        value={form.data.category_id}
                        onValueChange={(value) =>
                            form.setData('category_id', value)
                        }
                    >
                        <SelectTrigger
                            className={`w-full ${form.errors.category_id ? 'border-red-500' : ''}`}
                        >
                            <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map((category) => (
                                <SelectItem
                                    key={category.id}
                                    value={category.id.toString()}
                                >
                                    {category.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid gap-2">
                    <Label>Kode alat</Label>
                    <Input
                        value={form.data.code}
                        placeholder="Kosongkan untuk otomatis (Auto)"
                        className={form.errors.code ? 'border-red-500' : ''}
                        onChange={(event) =>
                            form.setData('code', event.target.value)
                        }
                    />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                    <Label>Nama alat</Label>
                    <Input
                        value={form.data.name}
                        className={form.errors.name ? 'border-red-500' : ''}
                        onChange={(event) =>
                            form.setData('name', event.target.value)
                        }
                    />
                </div>

                <div className="grid gap-2">
                    <Label>Merek</Label>
                    <Input
                        value={form.data.brand}
                        onChange={(event) =>
                            form.setData('brand', event.target.value)
                        }
                    />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                    <Label>Serial number</Label>
                    <Input
                        value={form.data.serial_number}
                        onChange={(event) =>
                            form.setData('serial_number', event.target.value)
                        }
                    />
                </div>

                <div className="grid gap-2">
                    <Label>Kondisi</Label>
                    <Select
                        value={form.data.condition_status}
                        onValueChange={(value) =>
                            form.setData('condition_status', value)
                        }
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Pilih kondisi" />
                        </SelectTrigger>
                        <SelectContent>
                            {conditionOptions.map((option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                <div className="grid gap-2">
                    <Label>Lokasi</Label>
                    <Input
                        value={form.data.location}
                        onChange={(event) =>
                            form.setData('location', event.target.value)
                        }
                    />
                </div>
                <div className="grid gap-2">
                    <Label>Stok total</Label>
                    <Input
                        type="number"
                        min={0}
                        value={form.data.stock_total}
                        className={
                            form.errors.stock_total ? 'border-red-500' : ''
                        }
                        onChange={(event) =>
                            form.setData(
                                'stock_total',
                                Number(event.target.value),
                            )
                        }
                    />
                </div>
                <div className="grid gap-2">
                    <Label>Stok tersedia</Label>
                    <Input
                        type="number"
                        min={0}
                        value={form.data.stock_available}
                        className={
                            form.errors.stock_available ? 'border-red-500' : ''
                        }
                        onChange={(event) =>
                            form.setData(
                                'stock_available',
                                Number(event.target.value),
                            )
                        }
                    />
                </div>
            </div>

            <div className="grid gap-2">
                <Label>Harga Alat (Rp)</Label>
                <Input
                    type="number"
                    min={0}
                    value={form.data.price}
                    className={form.errors.price ? 'border-red-500' : ''}
                    onChange={(event) =>
                        form.setData('price', Number(event.target.value))
                    }
                />
            </div>

            <div className="grid gap-2">
                <Label>Deskripsi</Label>
                <textarea
                    className={textareaClass}
                    value={form.data.description}
                    onChange={(event) =>
                        form.setData('description', event.target.value)
                    }
                />
            </div>

            <div className="grid gap-2">
                <Label>Foto/Gambar Alat (Opsional)</Label>
                <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                        form.setData(
                            'image',
                            e.target.files ? e.target.files[0] : null,
                        )
                    }
                />
            </div>

            <div className="flex justify-end gap-2 border-t pt-4">
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Batal
                    </Button>
                )}
                <Button disabled={form.processing}>{submitLabel}</Button>
            </div>
        </form>
    );
}

ToolsIndex.layout = {
    breadcrumbs: [{ title: 'Data Alat', href: '/tools' }],
};