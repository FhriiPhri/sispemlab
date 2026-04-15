import { router, useForm, usePage } from '@inertiajs/react';
import { Pencil, Plus, Trash2, Users } from 'lucide-react';
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
    users: User[];
};

const roleClasses: Record<string, string> = {
    admin: 'bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-300',
    petugas: 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300',
    peminjam: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300',
};

export default function UsersIndex({ users }: Props) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

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
        if (confirm(`Apakah Anda yakin ingin menghapus pengguna ${user.name}?`)) {
            router.delete(`/users/${user.id}`, { preserveScroll: true });
        }
    };

    return (
        <div className="space-y-6 p-4 md:p-6 w-full max-w-full overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <Heading
                    title="Manajemen Pengguna"
                    description="Kelola akun pengguna, hak akses, dan detail profil."
                />

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Pengguna
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Buat Akun Baru</DialogTitle>
                            <DialogDescription>
                                Masukkan identitas dan tentukan role pengguna baru.
                            </DialogDescription>
                        </DialogHeader>
                        <form className="space-y-4 py-2" onSubmit={submitCreate}>
                            <div className="grid gap-2">
                                <Label>Nama Lengkap</Label>
                                <Input
                                    value={createForm.data.name}
                                    onChange={(e) => createForm.setData('name', e.target.value)}
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
                                    onChange={(e) => createForm.setData('email', e.target.value)}
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
                                    onChange={(e) => createForm.setData('password', e.target.value)}
                                    placeholder="Minimal 8 karakter"
                                />
                                <InputError message={createForm.errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label>Peran (Role)</Label>
                                <Select
                                    value={createForm.data.role}
                                    onValueChange={(value) => createForm.setData('role', value)}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Pilih role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="peminjam">Peminjam</SelectItem>
                                        <SelectItem value="petugas">Petugas</SelectItem>
                                        <SelectItem value="admin">Administrator</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={createForm.errors.role} />
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t mt-6">
                                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
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

            <Card className="overflow-hidden border-border/60 bg-card/50 backdrop-blur-xl shadow-md">
                <div className="overflow-x-auto pb-4">
                    <Table className="min-w-[800px]">
                        <TableHeader className="bg-muted/30">
                            <TableRow>
                                <TableHead className="min-w-[200px]">Data Pengguna</TableHead>
                                <TableHead className="w-[150px]">Status / Role</TableHead>
                                <TableHead className="text-right w-[150px]">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id} className="group transition-colors">
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 font-medium">
                                                <Users className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                {user.name}
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                {user.email}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`font-medium border-transparent ${roleClasses[user.role] ?? ''} capitalize`}>
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 shadow-none"
                                                onClick={() => setSelectedUser(user)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                                <span className="sr-only">Edit</span>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 shadow-none text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                                                onClick={() => handleDelete(user)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                <span className="sr-only">Hapus</span>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {users.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                        Belum ada data pengguna.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Pengguna</DialogTitle>
                        <DialogDescription>
                            Perbarui identitas profil pengguna atau beri role baru.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedUser && (
                        <form className="space-y-4 py-2" onSubmit={submitUpdate}>
                            <div className="grid gap-2">
                                <Label>Nama Lengkap</Label>
                                <Input
                                    value={editForm.data.name}
                                    onChange={(e) => editForm.setData('name', e.target.value)}
                                    autoComplete="off"
                                />
                                <InputError message={editForm.errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label>Alamat Email</Label>
                                <Input
                                    type="email"
                                    value={editForm.data.email}
                                    onChange={(e) => editForm.setData('email', e.target.value)}
                                    autoComplete="off"
                                />
                                <InputError message={editForm.errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label>Kata Sandi Baru (Opsional)</Label>
                                <Input
                                    type="password"
                                    value={editForm.data.password}
                                    onChange={(e) => editForm.setData('password', e.target.value)}
                                    placeholder="Kosongkan jika tidak ingin mengubah"
                                />
                                <InputError message={editForm.errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label>Peran (Role)</Label>
                                <Select
                                    value={editForm.data.role}
                                    onValueChange={(value) => editForm.setData('role', value)}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Pilih role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="peminjam">Peminjam</SelectItem>
                                        <SelectItem value="petugas">Petugas</SelectItem>
                                        <SelectItem value="admin">Administrator</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={editForm.errors.role} />
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t mt-6">
                                <Button type="button" variant="outline" onClick={() => setSelectedUser(null)}>
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
