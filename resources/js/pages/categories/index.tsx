import { router, useForm } from '@inertiajs/react';
import { Download, FileSpreadsheet, Layers3, Loader2, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
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

type Category = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    tools_count: number;
};

type Props = {
    categories: Category[];
    stats: {
        total_categories: number;
        with_tools: number;
    };
};

const textareaClass =
    'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]';

export default function CategoriesIndex({ categories, stats }: Props) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);

    const handleImport = () => {
        if (!importFile) return;
        setImporting(true);
        const fd = new FormData();
        fd.append('file', importFile);
        router.post('/categories/import', fd, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setIsImportOpen(false);
                setImportFile(null);
                toast.success('Import kategori berhasil!');
            },
            onError: (errs) =>
                toast.error((Object.values(errs)[0] as string) ?? 'Import gagal.'),
            onFinish: () => setImporting(false),
        });
    };

    const createForm = useForm({
        name: '',
        description: '',
    });

    const editForm = useForm({
        name: '',
        description: '',
    });

    useEffect(() => {
        if (selectedCategory) {
            editForm.setData({
                name: selectedCategory.name,
                description: selectedCategory.description ?? '',
            });
            editForm.clearErrors();
        }
    }, [selectedCategory]);

    const submitCreate = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        createForm.post('/categories', {
            preserveScroll: true,
            onSuccess: () => {
                createForm.reset();
                setIsCreateOpen(false);
            },
        });
    };

    const submitUpdate = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedCategory) return;

        editForm.put(`/categories/${selectedCategory.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedCategory(null);
            },
        });
    };

    const handleDelete = (category: Category) => {
        if (confirm(`Apakah Anda yakin ingin menghapus kategori ${category.name}?`)) {
            router.delete(`/categories/${category.id}`, { preserveScroll: true });
        }
    };

    return (
        <div className="space-y-6 p-4 md:p-6 w-full max-w-full overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <Heading
                    title="Manajemen Kategori"
                    description="Kelola kelompok alat agar inventaris lebih terstruktur."
                />

                <div className="flex flex-wrap items-center gap-2">
                    {/* Import Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 border-violet-400 text-violet-700 hover:bg-violet-50 dark:border-violet-600 dark:text-violet-400 dark:hover:bg-violet-900/20"
                        onClick={() => setIsImportOpen(true)}
                    >
                        <FileSpreadsheet className="h-4 w-4" />
                        Import Excel
                    </Button>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Kategori
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Buat Kategori Baru</DialogTitle>
                            <DialogDescription>
                                Gunakan nama yang jelas dan mudah dipahami tim lab.
                            </DialogDescription>
                        </DialogHeader>
                        <form className="space-y-4 py-2" onSubmit={submitCreate}>
                            <div className="grid gap-2">
                                <Label htmlFor="category-name">Nama kategori</Label>
                                <Input
                                    id="category-name"
                                    value={createForm.data.name}
                                    onChange={(event) =>
                                        createForm.setData('name', event.target.value)
                                    }
                                    autoComplete="off"
                                />
                                <InputError message={createForm.errors.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="category-description">Deskripsi</Label>
                                <textarea
                                    id="category-description"
                                    className={textareaClass}
                                    value={createForm.data.description}
                                    onChange={(event) =>
                                        createForm.setData('description', event.target.value)
                                    }
                                />
                                <InputError message={createForm.errors.description} />
                            </div>
                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                                    Batal
                                </Button>
                                <Button disabled={createForm.processing}>
                                    Simpan Kategori
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
                </div>
            </div>

            {/* ── Import Dialog ── */}
            <Dialog open={isImportOpen} onOpenChange={(open) => { setIsImportOpen(open); if (!open) setImportFile(null); }}>
                <DialogContent className="max-w-[95vw] sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileSpreadsheet className="h-5 w-5 text-violet-600" />
                            Import Data Kategori dari Excel
                        </DialogTitle>
                        <DialogDescription>
                            Upload file .xlsx/.xls berisi data kategori. Kategori yang sudah ada akan diperbarui.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 p-3 dark:border-sky-500/30 dark:bg-sky-500/10">
                            <Download className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-sky-800 dark:text-sky-300">Belum punya template?</p>
                                <p className="mt-0.5 mb-2 text-xs text-sky-700 dark:text-sky-400">
                                    Download template Excel agar format kolom sesuai.
                                </p>
                                <a
                                    href="/categories/import/template"
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 underline underline-offset-2 hover:text-sky-900 dark:text-sky-300"
                                    target="_blank"
                                >
                                    <Download className="h-3.5 w-3.5" /> Download Template
                                </a>
                            </div>
                        </div>

                        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                            <strong>Kolom wajib:</strong> nama_kategori &nbsp;|&nbsp; <strong>Opsional:</strong> deskripsi
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="cat-import-file">Pilih File Excel</Label>
                            <input
                                id="cat-import-file"
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                                className="flex h-10 w-full cursor-pointer rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium"
                            />
                            <p className="text-xs text-muted-foreground">Format: .xlsx, .xls, .csv — Maks 5 MB</p>
                        </div>

                        {importFile && (
                            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
                                <FileSpreadsheet className="h-4 w-4 shrink-0 text-violet-600" />
                                <span className="truncate font-medium">{importFile.name}</span>
                                <span className="ml-auto whitespace-nowrap text-xs text-muted-foreground">
                                    {(importFile.size / 1024).toFixed(1)} KB
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => { setIsImportOpen(false); setImportFile(null); }} disabled={importing}>
                            Batal
                        </Button>
                        <Button
                            className="gap-2 bg-violet-600 text-white hover:bg-violet-700"
                            disabled={!importFile || importing}
                            onClick={handleImport}
                        >
                            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            {importing ? 'Mengimport...' : 'Import Sekarang'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader className="py-4">
                        <CardDescription>Total kategori</CardDescription>
                        <CardTitle className="text-3xl text-primary">
                            {stats.total_categories}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="py-4">
                        <CardDescription>Kategori digunakan alat</CardDescription>
                        <CardTitle className="text-3xl text-emerald-600 dark:text-emerald-400">
                            {stats.with_tools}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <Card className="overflow-hidden border-border/60 bg-card/50 backdrop-blur-xl shadow-md">
                <div className="overflow-x-auto pb-4">
                    <Table className="min-w-[800px]">
                        <TableHeader className="bg-muted/30">
                            <TableRow>
                                <TableHead className="w-[200px]">Nama Kategori</TableHead>
                                <TableHead>Deskripsi</TableHead>
                                <TableHead className="text-center w-[120px]">Item Terkait</TableHead>
                                <TableHead className="text-right w-[150px]">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {categories.map((category) => (
                                <TableRow key={category.id} className="group transition-colors">
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Layers3 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                            {category.name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {category.description || '-'}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="secondary" className="font-mono">
                                            {category.tools_count}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 shadow-none"
                                                onClick={() => setSelectedCategory(category)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                                <span className="sr-only">Edit</span>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 shadow-none text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                                                onClick={() => handleDelete(category)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                <span className="sr-only">Hapus</span>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {categories.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        Kategori masih kosong.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            <Dialog open={!!selectedCategory} onOpenChange={(open) => !open && setSelectedCategory(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Kategori</DialogTitle>
                        <DialogDescription>
                            Perbarui detail kategori, slug akan otomatis disesuaikan.
                        </DialogDescription>
                    </DialogHeader>
                    <form className="space-y-4 py-2" onSubmit={submitUpdate}>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-category-name">Nama kategori</Label>
                            <Input
                                id="edit-category-name"
                                value={editForm.data.name}
                                onChange={(event) =>
                                    editForm.setData('name', event.target.value)
                                }
                                autoComplete="off"
                            />
                            <InputError message={editForm.errors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-category-description">Deskripsi</Label>
                            <textarea
                                id="edit-category-description"
                                className={textareaClass}
                                value={editForm.data.description}
                                onChange={(event) =>
                                    editForm.setData('description', event.target.value)
                                }
                            />
                            <InputError message={editForm.errors.description} />
                        </div>
                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button type="button" variant="outline" onClick={() => setSelectedCategory(null)}>
                                Batal
                            </Button>
                            <Button disabled={editForm.processing}>
                                Perbarui Kategori
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

CategoriesIndex.layout = {
    breadcrumbs: [{ title: 'Kategori', href: '/categories' }],
};
