import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { store } from '@/routes/register';

/**
 * Halaman Registrasi Siswa/Peminjam
 * Dirancang khusus dengan identitas SMK (NIS, Kelas, Jurusan).
 */
export default function Register() {
    return (
        <>
            <Head title="Register" />
            <Form
                {...store.form()} // Mengambil konfigurasi action dan method dari route helper
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nama Lengkap</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="name"
                                    name="name"
                                    placeholder="Nama Lengkap sesuai Kartu Pelajar"
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="identifier">NIS / NIP</Label>
                                    <Input
                                        id="identifier"
                                        type="text"
                                        required
                                        tabIndex={2}
                                        name="identifier"
                                        placeholder="Nomor Induk Siswa/Pegawai"
                                    />
                                    <InputError message={errors.identifier} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="phone">Nomor WhatsApp</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        required
                                        tabIndex={3}
                                        name="phone"
                                        placeholder="Contoh: 08123456789"
                                    />
                                    <InputError message={errors.phone} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="class">Kelas</Label>
                                    <Input
                                        id="class"
                                        type="text"
                                        required
                                        tabIndex={4}
                                        name="class"
                                        placeholder="Contoh: XII, XI, X"
                                    />
                                    <InputError message={errors.class} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="major">Jurusan</Label>
                                    <Input
                                        id="major"
                                        type="text"
                                        required
                                        tabIndex={5}
                                        name="major"
                                        placeholder="Contoh: RPL 1, TKJ 2, MM"
                                    />
                                    <InputError message={errors.major} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email Sekolah / Pribadi</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    tabIndex={6}
                                    autoComplete="email"
                                    name="email"
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="password">Password</Label>
                                    <PasswordInput
                                        id="password"
                                        required
                                        tabIndex={7}
                                        autoComplete="new-password"
                                        name="password"
                                        placeholder="Password"
                                    />
                                    <InputError message={errors.password} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="password_confirmation">
                                        Konfirmasi Password
                                    </Label>
                                    <PasswordInput
                                        id="password_confirmation"
                                        required
                                        tabIndex={8}
                                        autoComplete="new-password"
                                        name="password_confirmation"
                                        placeholder="Ulangi Password"
                                    />
                                    <InputError
                                        message={errors.password_confirmation}
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 w-full"
                                tabIndex={9}
                                data-test="register-user-button"
                            >
                                {processing && <Spinner />}
                                Daftar Sekarang
                            </Button>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            Sudah punya akun?{' '}
                            <TextLink href={login()} tabIndex={10}>
                                Masuk di sini
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

Register.layout = {
    title: 'Daftar Akun Baru',
    description: 'Lengkapi data diri Anda untuk meminjam alat di Sarpras',
};
