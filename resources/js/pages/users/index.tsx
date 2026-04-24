import { router, useForm, usePage } from '@inertiajs/react';
import { Download, FileSpreadsheet, Loader2, Pencil, Plus, Trash2, Upload, Users } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';
import Heading from '@/components/heading';
import TablePagination, {
    type PaginatedData,
} from '@/components/table-pagination';
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

type User = {
    id: number;
    name: string;
    email: string;
    role: string;
};

type Props = {
    users: PaginatedData<User>;
};

const roleClasses: Record<string, string> = {
    admin: 'bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-300',
    petugas:
        'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300',
    peminjam:
        'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300',
};

export default function UsersIndex({ users }: Props) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const usersList = users.data;

    const handleImport = () => {
        if (!importFile) return;
        setImporting(true);
        const fd = new FormData();
        fd.append('file', importFile);
        router.post('/users/import', fd, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setIsImportOpen(false);
                setImportFile(null);
                toast.success('Import user berhasil!');
            },
            onError: (errs) =>
                toast.error((Object.values(errs)[0] as string) ?? 'Import gagal.'),
            onFinish: () => setImporting(false),
        });
    };

    const createForm = useForm({
        name: '',
        email: '',
        password: '',
        role: 'peminjam',
    });

    const editForm = useForm({
        name: '',
        email: '',
        password: '',
        role: 'peminjam',
    });

    useEffect(() => {
        if (selectedUser) {
            editForm.setData({
                name: selectedUser.name,
                email: selectedUser.email,
                password: '',
                role: selectedUser.role,
            });
            editForm.clearErrors();
        }
    }, [selectedUser]);

    const submitCreate = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        createForm.post('/users', {
            preserveScroll: true,
            onSuccess: () => {
                createForm.reset();
                setIsCreateOpen(false);
            },
        });
    };

    const submitUpdate = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!selectedUser) return;

        editForm.put(`/users/${selectedUser.id}`, {
            preserveScroll: true,
            onSuccess: () => setSelectedUser(null),
        });
    };

    const handleDelete = (user: User) => {
        if (
            confirm(`Apakah Anda yakin ingin menghapus pengguna ${user.name}?`)
        ) {
            router.delete(`/users/${user.id}`, { preserveScroll: true });
        }
    };

    return (
        <div className="w-full max-w-full space-y-6 overflow-hidden p-4 md:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <Heading
                    title="Manajemen Pengguna"
                    description="Kelola akun pengguna, hak akses, dan detail profil."
                />

                <div className="flex flex-wrap items-center gap-2">
                    {/* Import Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 border-emerald-400 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-600 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                        onClick={() => setIsImportOpen(true)}
                    >
                        <FileSpreadsheet className="h-4 w-4" />
                        Import Excel
                    </Button>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Pengguna
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Buat Akun Baru</DialogTitle>
                            <DialogDescription>
                                Masukkan identitas dan tentukan role pengguna
                                baru.
                            </DialogDescription>
                        </DialogHeader>
                        <form
                            className="space-y-4 py-2"
                            onSubmit={submitCreate}
                        >
                            <div className="grid gap-2">
                                <Label>Nama Lengkap</Label>
                                <Input
                                    value={createForm.data.name}
                                    onChange={(e) =>
                                        createForm.setData(
                                            'name',
                                            e.target.value,
                                        )
                                    }
                                    autoComplete="off"
                                    placeholder="John Doe"
                                />
                                <InputError message={createForm.errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label>Alamat Email</Label>
                                <Input
                                    type="email"
                                    value={createForm.data.email}
                                    onChange={(e) =>
                                        createForm.setData(
                                            'email',
                                            e.target.value,
                                        )
                                    }
                                    autoComplete="off"
                                    placeholder="john@example.com"
                                />
                                <InputError message={createForm.errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label>Kata Sandi</Label>
                                <Input
                                    type="password"
                                    value={createForm.data.password}
                                    onChange={(e) =>
                                        createForm.setData(
                                            'password',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Minimal 8 karakter"
                                />
                                <InputError
                                    message={createForm.errors.password}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>Peran (Role)</Label>
                                <Select
                                    value={createForm.data.role}
                                    onValueChange={(value) =>
                                        createForm.setData('role', value)
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Pilih role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="peminjam">
                                            Peminjam
                                        </SelectItem>
                                        <SelectItem value="petugas">
                                            Petugas
                                        </SelectItem>
                                        <SelectItem value="admin">
                                            Administrator
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={createForm.errors.role} />
                            </div>

                            <div className="mt-6 flex justify-end gap-2 border-t pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsCreateOpen(false)}
                                >
                                    Batal
                                </Button>
                                <Button disabled={createForm.processing}>
                                    Simpan
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
                            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                            Import Data User dari Excel
                        </DialogTitle>
                        <DialogDescription>
                            Upload file .xlsx/.xls berisi data pengguna. User dengan email yang sama akan diperbarui.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {/* Download Template */}
                        <div className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 p-3 dark:border-sky-500/30 dark:bg-sky-500/10">
                            <Download className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-sky-800 dark:text-sky-300">Belum punya template?</p>
                                <p className="mt-0.5 mb-2 text-xs text-sky-700 dark:text-sky-400">
                                    Download template Excel agar format kolom sesuai.
                                </p>
                                <a
                                    href="/users/import/template"
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 underline underline-offset-2 hover:text-sky-900 dark:text-sky-300"
                                    target="_blank"
                                >
                                    <Download className="h-3.5 w-3.5" /> Download Template
                                </a>
                            </div>
                        </div>

                        {/* Kolom Info */}
                        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                            <strong>Kolom wajib:</strong> nama, email &nbsp;|&nbsp; <strong>Opsional:</strong> password, role, nis_nip, no_hp, kelas, jurusan
                        </div>

                        {/* Upload File */}
                        <div className="grid gap-2">
                            <Label htmlFor="user-import-file">Pilih File Excel</Label>
                            <input
                                id="user-import-file"
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                                className="flex h-10 w-full cursor-pointer rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium"
                            />
                            <p className="text-xs text-muted-foreground">Format: .xlsx, .xls, .csv — Maks 5 MB</p>
                        </div>

                        {importFile && (
                            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
                                <FileSpreadsheet className="h-4 w-4 shrink-0 text-emerald-600" />
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
                            className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                            disabled={!importFile || importing}
                            onClick={handleImport}
                        >
                            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            {importing ? 'Mengimport...' : 'Import Sekarang'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Card className="overflow-hidden border-border/60 bg-card/50 shadow-md backdrop-blur-xl">
                <div className="overflow-x-auto pb-4">
                    <Table className="min-w-[800px]">
                        <TableHeader className="bg-muted/30">
                            <TableRow>
                                <TableHead className="min-w-[200px]">
                                    Data Pengguna
                                </TableHead>
                                <TableHead className="w-[150px]">
                                    Status / Role
                                </TableHead>
                                <TableHead className="w-[150px] text-right">
                                    Aksi
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {usersList.map((user) => (
                                <TableRow
                                    key={user.id}
                                    className="group transition-colors"
                                >
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 font-medium">
                                                <Users className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                                                {user.name}
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                {user.email}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={`border-transparent font-medium ${roleClasses[user.role] ?? ''} capitalize`}
                                        >
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 shadow-none"
                                                onClick={() =>
                                                    setSelectedUser(user)
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
                                                    handleDelete(user)
                                                }
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                <span className="sr-only">
                                                    Hapus
                                                </span>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {usersList.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={3}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        Belum ada data pengguna.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                <TablePagination
                    current_page={users.current_page}
                    last_page={users.last_page}
                    from={users.from}
                    to={users.to}
                    total={users.total}
                    next_page_url={users.next_page_url}
                    prev_page_url={users.prev_page_url}
                    first_page_url={users.first_page_url}
                    last_page_url={users.last_page_url}
                    links={users.links}
                />
            </Card>

            <Dialog
                open={!!selectedUser}
                onOpenChange={(open) => !open && setSelectedUser(null)}
            >
                <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Pengguna</DialogTitle>
                        <DialogDescription>
                            Perbarui identitas profil pengguna atau beri role
                            baru.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedUser && (
                        <form
                            className="space-y-4 py-2"
                            onSubmit={submitUpdate}
                        >
                            <div className="grid gap-2">
                                <Label>Nama Lengkap</Label>
                                <Input
                                    value={editForm.data.name}
                                    onChange={(e) =>
                                        editForm.setData('name', e.target.value)
                                    }
                                    autoComplete="off"
                                />
                                <InputError message={editForm.errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label>Alamat Email</Label>
                                <Input
                                    type="email"
                                    value={editForm.data.email}
                                    onChange={(e) =>
                                        editForm.setData(
                                            'email',
                                            e.target.value,
                                        )
                                    }
                                    autoComplete="off"
                                />
                                <InputError message={editForm.errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label>Kata Sandi Baru (Opsional)</Label>
                                <Input
                                    type="password"
                                    value={editForm.data.password}
                                    onChange={(e) =>
                                        editForm.setData(
                                            'password',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Kosongkan jika tidak ingin mengubah"
                                />
                                <InputError
                                    message={editForm.errors.password}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>Peran (Role)</Label>
                                <Select
                                    value={editForm.data.role}
                                    onValueChange={(value) =>
                                        editForm.setData('role', value)
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Pilih role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="peminjam">
                                            Peminjam
                                        </SelectItem>
                                        <SelectItem value="petugas">
                                            Petugas
                                        </SelectItem>
                                        <SelectItem value="admin">
                                            Administrator
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={editForm.errors.role} />
                            </div>

                            <div className="mt-6 flex justify-end gap-2 border-t pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setSelectedUser(null)}
                                >
                                    Batal
                                </Button>
                                <Button disabled={editForm.processing}>
                                    Perbarui
                                </Button>
                            </div>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

UsersIndex.layout = {
    breadcrumbs: [{ title: 'Pengguna', href: '/users' }],
};