import { Head, useForm } from '@inertiajs/react';
import { CheckCircle, Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
    email: string;
};

export default function OtpResetPassword({ email }: Props) {
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        password: '',
        password_confirmation: '',
    });

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/forgot-password/reset', {
            onError: (errs) => {
                const first = Object.values(errs)[0];
                if (first) toast.error(first as string);
            },
        });
    };

    // Strength indicator
    const strength = (() => {
        const p = data.password;
        if (!p) return 0;
        let s = 0;
        if (p.length >= 8)  s++;
        if (/[A-Z]/.test(p)) s++;
        if (/[0-9]/.test(p)) s++;
        if (/[^A-Za-z0-9]/.test(p)) s++;
        return s;
    })();

    const strengthLabels = ['', 'Lemah', 'Cukup', 'Kuat', 'Sangat Kuat'];
    const strengthColors = ['', 'bg-rose-500', 'bg-amber-500', 'bg-emerald-500', 'bg-emerald-600'];

    return (
        <>
            <Head title="Buat Password Baru" />

            <div className="space-y-6">
                <div className="text-center text-sm text-muted-foreground">
                    Buat password baru untuk akun{' '}
                    <span className="font-semibold text-foreground">{email}</span>
                </div>

                <form onSubmit={onSubmit} className="flex flex-col gap-6">
                    <div className="grid gap-6">
                        {/* Password */}
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password Baru</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPass ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    autoFocus
                                    placeholder="Min. 8 karakter"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>

                            {/* Strength bar */}
                            {data.password && (
                                <div className="space-y-1.5">
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div
                                                key={i}
                                                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                                    i <= strength ? strengthColors[strength] : 'bg-muted'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <p className={`text-xs font-medium ${
                                        strength <= 1 ? 'text-rose-500' :
                                        strength === 2 ? 'text-amber-500' : 'text-emerald-600'
                                    }`}>
                                        {strengthLabels[strength]}
                                    </p>
                                </div>
                            )}

                            {errors.password && (
                                <p className="text-xs text-destructive">{errors.password}</p>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation">Konfirmasi Password</Label>
                            <div className="relative">
                                <Input
                                    id="password_confirmation"
                                    type={showConfirm ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    placeholder="Ulangi password"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>

                            {/* Match indicator */}
                            {data.password_confirmation && (
                                <div className="flex items-center gap-1.5 text-xs">
                                    {data.password === data.password_confirmation ? (
                                        <>
                                            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                                            <span className="text-emerald-600">Password cocok</span>
                                        </>
                                    ) : (
                                        <span className="text-rose-500">Password tidak cocok</span>
                                    )}
                                </div>
                            )}

                            {errors.password_confirmation && (
                                <p className="text-xs text-destructive">{errors.password_confirmation}</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full gap-2 mt-4"
                            disabled={processing || data.password !== data.password_confirmation || !data.password}
                        >
                            {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                            {processing ? 'Menyimpan...' : 'Simpan Password Baru'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

OtpResetPassword.layout = {
    title: 'Buat Password Baru',
    description: 'Masukkan password baru untuk akun Anda',
};

