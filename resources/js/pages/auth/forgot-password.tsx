import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle, Mail } from 'lucide-react';
import { toast } from 'sonner';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
    });

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/forgot-password/send-otp', {
            onError: (errs) => {
                toast.error(errs.email ?? 'Terjadi kesalahan. Coba lagi.');
            },
        });
    };

    return (
        <>
            <Head title="Lupa Password" />

            <div className="space-y-6">
                {status && (
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
                        <Mail className="w-4 h-4 shrink-0" />
                        <span>{status}</span>
                    </div>
                )}

                <form onSubmit={onSubmit} className="flex flex-col gap-6">
                    <div className="grid gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Alamat Email</Label>
                            <Input
                                id="email"
                                type="email"
                                autoComplete="email"
                                autoFocus
                                placeholder="nama@sekolah.ac.id"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                            />
                            {errors.email && (
                                <p className="text-xs text-destructive">{errors.email}</p>
                            )}
                        </div>

                        <Button type="submit" className="w-full gap-2 mt-4" disabled={processing}>
                            {processing ? (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                                <Mail className="h-4 w-4" />
                            )}
                            {processing ? 'Mengirim OTP...' : 'Kirim Kode OTP'}
                        </Button>
                    </div>
                </form>

                <div className="text-center text-sm text-muted-foreground">
                    Ingat password?{' '}
                    <TextLink href="/login">Kembali login</TextLink>
                </div>
            </div>
        </>
    );
}

ForgotPassword.layout = {
    title: 'Lupa Password',
    description: 'Masukkan email akun Anda. Kami akan mengirimkan kode OTP 6-digit untuk verifikasi.',
};
