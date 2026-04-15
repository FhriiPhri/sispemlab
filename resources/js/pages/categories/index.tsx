import { router, useForm } from '@inertiajs/react';
import { Layers3, Pencil, Plus, Trash2 } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
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
