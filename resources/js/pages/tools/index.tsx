import { router, useForm, usePage } from '@inertiajs/react';
import { Package, Pencil, Plus, Trash2 } from 'lucide-react';
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
};

type Props = {
    tools: PaginatedData<Tool>;
    categories: CategoryOption[];
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

export default function ToolsIndex({ tools, categories, stats }: Props) {
    const { auth } = usePage<SharedData>().props;
    const isPeminjam = auth.user.role === 'peminjam';
    const toolsList = tools.data;

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

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
                    'image'
                );
                setIsCreateOpen(false);
                toast.success('Alat baru berhasil ditambahkan!');
            },
            onError: (errors) => {
                const messages = Object.values(errors);
                if (messages.length > 0) {
                    toast.error(messages[0], {
                        description: messages.length > 1
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
                        description: messages.length > 1
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
            <div className="space-y-6 p-4 md:p-6 w-full max-w-full overflow-hidden">
                <Heading
                    title="Katalog Alat"
                    description="Daftar koleksi alat yang dapat dipinjam saat ini beserta rincian stoknya."
                />
                <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {toolsList.map((tool) => (
                        <Card key={tool.id} className="flex flex-col group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 bg-card/60 backdrop-blur-sm overflow-hidden">
                            {tool.image_url && (
                                <div className="aspect-[4/3] w-full overflow-hidden bg-muted border-b">
                                    <img src={tool.image_url} alt={tool.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                </div>
                            )}
                            <CardHeader className={tool.image_url ? "pb-3 pt-4" : "pb-3"}>
                                <div className="flex items-center gap-2 mb-2">
                                    {!tool.image_url && <Package className="h-5 w-5 text-primary" />}
                                    <Badge variant="secondary" className="transition-colors group-hover:bg-secondary/80">{tool.category_name ?? 'Tanpa kategori'}</Badge>
                                </div>
                                <CardTitle className="text-xl">{tool.name}</CardTitle>
                                <CardDescription>Kode: {tool.code}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-3 flex-1">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Tersedia:</span>
                                    <Badge className={tool.stock_available > 0 ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300"}>
                                        {tool.stock_available} / {tool.stock_total} Unit
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Kondisi:</span>
                                    <span className="font-medium capitalize">{tool.condition_status.replace('-', ' ')}</span>
                                </div>
                                {tool.description && (
                                    <p className="text-xs text-muted-foreground mt-2 line-clamp-3">
                                        {tool.description}
                                    </p>
                                )}
                                <div className="mt-auto pt-4">
                                    <Button asChild className="w-full" disabled={tool.stock_available < 1}>
                                        <a href="/loans">Pinjam Alat Ini</a>
                                    </Button>
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
        <div className="space-y-6 p-4 md:p-6 w-full max-w-full overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <Heading
                    title="Manajemen Data Alat"
                    description="Simpan identitas alat, kondisi, lokasi, dan ketersediaan stok."
                />

                {auth.user.role === 'admin' && (
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Tambah Alat
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-3xl max-w-[95vw] w-full max-h-[92vh] overflow-y-auto sm:p-8">
                            <DialogHeader>
                                <DialogTitle>Registrasi Alat Baru</DialogTitle>
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

            <Card className="overflow-hidden border-border/60 bg-card/50 backdrop-blur-xl shadow-md">
                <div className="overflow-x-auto pb-4">
                    <Table className="min-w-[800px]">
                        <TableHeader className="bg-muted/30">
                            <TableRow>
                                <TableHead className="w-[80px]">Kode</TableHead>
                                <TableHead className="min-w-[200px]">Nama Alat</TableHead>
                                <TableHead>Kategori</TableHead>
                                <TableHead>Kondisi</TableHead>
                                <TableHead className="text-center">Stok</TableHead>
                                {auth.user.role === 'admin' && (
                                    <TableHead className="text-right w-[150px]">Aksi</TableHead>
                                )}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {toolsList.map((tool) => (
                                <TableRow key={tool.id} className="group transition-colors">
                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                        {tool.code}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            {tool.image_url ? (
                                                <img src={tool.image_url} alt={tool.name} className="h-10 w-10 rounded-md object-cover border" />
                                            ) : (
                                                <div className="h-10 w-10 rounded-md border border-dashed flex items-center justify-center bg-muted/50">
                                                    <Package className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                            )}
                                            {tool.name}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="font-normal text-xs">
                                            {tool.category_name ?? '-'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`text-xs capitalize px-2 py-1 rounded-full border ${tool.condition_status === 'baik' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'}`}>
                                            {tool.condition_status.replace('-', ' ')}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {tool.stock_available}/{tool.stock_total}
                                    </TableCell>
                                    {auth.user.role === 'admin' && (
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 shadow-none"
                                                    onClick={() => setSelectedTool(tool)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                    <span className="sr-only">Edit</span>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 shadow-none text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                                                    onClick={() => handleDelete(tool)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    <span className="sr-only">Hapus</span>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                            {toolsList.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={auth.user.role === 'admin' ? 6 : 5} className="h-24 text-center text-muted-foreground">
                                        Belum ada data alat yang diinputkan ke sistem.
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

            <Dialog open={!!selectedTool} onOpenChange={(open) => !open && setSelectedTool(null)}>
                <DialogContent className="sm:max-w-3xl max-w-[95vw] w-full max-h-[92vh] overflow-y-auto sm:p-8">
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
    form: ReturnType<typeof useForm<{
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
        image: File | null;
    }>>;
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
                        onValueChange={(value) => form.setData('category_id', value)}
                    >
                        <SelectTrigger className={`w-full ${form.errors.category_id ? 'border-red-500' : ''}`}>
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
                        onChange={(event) => form.setData('code', event.target.value)}
                    />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                    <Label>Nama alat</Label>
                    <Input
                        value={form.data.name}
                        className={form.errors.name ? 'border-red-500' : ''}
                        onChange={(event) => form.setData('name', event.target.value)}
                    />
                </div>

                <div className="grid gap-2">
                    <Label>Merek</Label>
                    <Input
                        value={form.data.brand}
                        onChange={(event) => form.setData('brand', event.target.value)}
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
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
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
                        className={form.errors.stock_total ? 'border-red-500' : ''}
                        onChange={(event) =>
                            form.setData('stock_total', Number(event.target.value))
                        }
                    />
                </div>
                <div className="grid gap-2">
                    <Label>Stok tersedia</Label>
                    <Input
                        type="number"
                        min={0}
                        value={form.data.stock_available}
                        className={form.errors.stock_available ? 'border-red-500' : ''}
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
                        form.setData('image', e.target.files ? e.target.files[0] : null)
                    }
                />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
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
