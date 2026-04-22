export type User = {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    role: 'admin' | 'petugas' | 'peminjam';
    identifier: string | null; // NIS / NIP
    phone: string | null;
    class: string | null;      // Kelas
    major: string | null;      // Jurusan
    [key: string]: unknown;
};

export type Auth = {
    user: User;
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
