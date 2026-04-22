import { Head, Link, usePage } from '@inertiajs/react';
import { 
    ArrowRight, 
    Boxes, 
    ShieldCheck, 
    Activity,
    FileText,
    MonitorSmartphone,
    CheckCircle2,
    Zap,
    History
} from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { dashboard } from '@/routes';

export default function Landing({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage().props;

    const quickActions = auth.user
        ? [{ label: 'Masuk Dashboard', href: dashboard() }]
        : [
              { label: 'Login ke Sistem', href: '/login' },
              ...(canRegister
                  ? [{ label: 'Daftar Akun', href: '/register' }]
                  : []),
          ];

    const features = [
        {
            title: 'Manajemen Inventaris Super Rapi',
            description: 'Kelola ratusan alat lab dengan pengkodean otomatis, alokasi kategori, hingga pengecekan fisik barang.',
            icon: Boxes,
        },
        {
            title: 'Sistem Persetujuan Bertingkat',
            description: 'Fitur approval canggih bagi petugas dan admin. Tidak ada lagi alat keluar tanpa pantauan dan izin resmi.',
            icon: ShieldCheck,
        },
        {
            title: 'Pemantauan Stok Real-time',
            description: 'Ketahui secara pasti ketersediaan barang setiap saat. Mencegah bentrok peminjaman pada waktu bersamaan.',
            icon: Activity,
        },
        {
            title: 'Log Histori & Pengembalian',
            description: 'Setiap barang yang kembali akan dicek kondisinya. Sistem otomatis merekam riwayat alat secara permanen.',
            icon: History,
        },
        {
            title: 'Lengkap dengan Export Laporan',
            description: 'Butuh laporan pertanggungjawaban? Mudah. Unduh rekapan peminjaman harian atau bulanan dalam 1 klik.',
            icon: FileText,
        },
        {
            title: 'Akses Responsif Multi-Platform',
            description: 'Desain profesional yang menyesuaikan layar. Bisa diakses mulus di HP, Tablet, maupun super-wide Monitor.',
            icon: MonitorSmartphone,
        },
    ];

    const steps = [
        {
            step: '01',
            title: 'Pilih & Ajukan Alat',
            description: 'Peminjam melihat katalog barang yang tersedia, memilih alat, dan mengisi formulir keperluan di sistem.'
        },
        {
            step: '02',
            title: 'Proses Verifikasi',
            description: 'Petugas / Admin akan langsung menerima notifikasi untuk melihat kelayakan dan menyetujui peminjaman.'
        },
        {
            step: '03',
            title: 'Ambil & Gunakan',
            description: 'Setelah disetujui, peminjam dapat mengambil fisik alat di lokasi penyimpanan dan menggunakannya.'
        },
        {
            step: '04',
            title: 'Kembalikan Tepat Waktu',
            description: 'Kembalikan barang sesuai batas waktu. Kondisi alat akan dicek kembali oleh sistem dan petugas.'
        }
    ];

    return (
        <>
            <Head title="Sistem Pakar Peminjaman Alat" />

            <div className="min-h-screen bg-[linear-gradient(to_bottom_right,#f0f7ff_0%,#f8fafc_50%,#f0fdf4_100%)] text-slate-900 dark:bg-[linear-gradient(to_bottom_right,#0f172a_0%,#1e293b_50%,#022c22_100%)] dark:text-slate-50 selection:bg-primary/20 selection:text-primary">
                
                {/* Navbar */}
                <nav className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-white/20 bg-white/60 px-6 py-4 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/60 lg:px-12">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-transparent text-white">
                            <AppLogoIcon className="h-9 w-9" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight">SispemTB</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {quickActions.map((action, index) => (
                            <Link
                                key={action.label}
                                href={action.href}
                                className={
                                    index === 0
                                        ? 'rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5'
                                        : 'hidden sm:inline-flex rounded-full border border-slate-300 bg-white/50 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-100 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:bg-slate-800'
                                }
                            >
                                {action.label}
                            </Link>
                        ))}
                    </div>
                </nav>

                <main className="flex flex-col items-center pt-32 pb-16">
                    
                    {/* Hero Section */}
                    <section className="mx-auto w-full max-w-7xl px-6 lg:px-12">
                        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
                            <div className="space-y-8">
                                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                    Versi Enterprise Siap Digunakan
                                </div>
                                <h2 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
                                    Kelola Alat Sekolah <br/>
                                    <span className="bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">Tanpa Ribet.</span>
                                </h2>
                                <p className="text-lg text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
                                    Tinggalkan pencatatan manual. SispemTB memberikan Anda kendali penuh atas inventaris, pelacakan peminjaman alat, hingga pelaporan otomatis secara *real-time*.
                                </p>
                                
                                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                    <Link
                                        href={auth.user ? dashboard() : '/login'}
                                        className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-8 py-4 text-base font-semibold text-white transition-all hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/20 hover:-translate-y-1 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 dark:hover:shadow-white/20"
                                    >
                                        Mulai Sekarang
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                    <a
                                        href="#fitur"
                                        className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/50 px-8 py-4 text-base font-semibold text-slate-700 backdrop-blur-sm transition-all hover:bg-slate-50 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-200 dark:hover:bg-slate-800"
                                    >
                                        Pelajari Fitur
                                    </a>
                                </div>

                                <div className="pt-8 flex items-center gap-6 text-sm font-medium text-slate-500 dark:text-slate-400">
                                    <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-500"/> Terintegrasi</div>
                                    <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-500"/> Akurat</div>
                                    <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-500"/> Cepat</div>
                                </div>
                            </div>
                            
                            {/* Abstract Dashboard Mockup */}
                            <div className="relative w-full aspect-square md:aspect-[4/3] lg:aspect-auto lg:h-[600px] rounded-[2.5rem] bg-gradient-to-tr from-slate-100 to-slate-50 border border-white p-8 shadow-2xl shadow-indigo-900/10 dark:from-slate-800 dark:to-slate-900 dark:border-slate-700/50 flex flex-col gap-4 overflow-hidden transform lg:-rotate-2 transition-transform hover:rotate-0 duration-700">
                                {/* Top bar mockup */}
                                <div className="flex w-full items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                                    <div className="flex gap-2">
                                        <div className="h-3 w-3 rounded-full bg-rose-400" />
                                        <div className="h-3 w-3 rounded-full bg-amber-400" />
                                        <div className="h-3 w-3 rounded-full bg-emerald-400" />
                                    </div>
                                    <div className="h-6 w-32 rounded-full bg-slate-200 dark:bg-slate-800" />
                                </div>
                                {/* Content mockup */}
                                <div className="flex flex-1 gap-6">
                                    {/* Sidebar mockup */}
                                    <div className="hidden sm:flex flex-col gap-4 w-1/3 pt-4">
                                        <div className="h-8 w-full rounded-lg bg-primary/20 dark:bg-primary/20" />
                                        <div className="h-8 w-full rounded-lg bg-slate-200 dark:bg-slate-800/60" />
                                        <div className="h-8 w-full rounded-lg bg-slate-200 dark:bg-slate-800/60" />
                                    </div>
                                    {/* Main area mockup */}
                                    <div className="flex-1 flex flex-col gap-4 pt-4">
                                        <div className="flex gap-4">
                                            <div className="h-24 flex-1 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30" />
                                            <div className="h-24 flex-1 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30" />
                                        </div>
                                        <div className="h-40 w-full rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm mt-4 p-4 flex flex-col justify-between">
                                            <div className="flex justify-between items-center">
                                                <div className="h-4 w-32 rounded bg-slate-100 dark:bg-slate-800"/>
                                                <div className="h-6 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40"/>
                                            </div>
                                            <div className="h-2 w-full rounded bg-slate-100 dark:bg-slate-800 mb-2 mt-auto"/>
                                            <div className="h-2 w-3/4 rounded bg-slate-100 dark:bg-slate-800"/>
                                        </div>
                                         <div className="h-16 w-full rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* How It Works Section */}
                    <section className="mx-auto w-full max-w-7xl pt-32 px-6 lg:px-12">
                        <div className="text-center mb-16 space-y-4">
                            <h2 className="text-3xl lg:text-5xl font-bold tracking-tight">Alur Peminjaman yang Jelas</h2>
                            <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto">
                                SispemTB merampingkan birokrasi peminjaman manual menjadi alur digital yang mudah dipantau oleh setiap pihak.
                            </p>
                        </div>
                        
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 relative">
                            {steps.map((step, idx) => (
                                <div key={idx} className="relative z-10 rounded-3xl border border-border/50 bg-card/60 p-8 shadow-sm backdrop-blur-xl transition-all hover:-translate-y-2 hover:shadow-xl group">
                                    <div className="text-6xl font-black text-slate-100 dark:text-slate-800 mb-4 transition-colors group-hover:text-primary/10">
                                        {step.step}
                                    </div>
                                    <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{step.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Features Matrix Section */}
                    <section id="fitur" className="mx-auto w-full max-w-7xl pt-32 px-6 lg:px-12">
                        <div className="flex flex-col lg:flex-row gap-12 lg:items-end mb-12">
                            <div className="flex-1 space-y-4">
                                <div className="inline-flex items-center gap-2 text-primary font-bold tracking-wider uppercase text-sm">
                                    <Zap className="h-4 w-4" /> Kemampuan Sistem
                                </div>
                                <h2 className="text-3xl lg:text-5xl font-bold tracking-tight">Lebih dari Sekedar Mencatat</h2>
                            </div>
                            <p className="flex-1 text-slate-600 dark:text-slate-400 text-lg">
                                Didesain khusus untuk memenuhi tata kelola aset fisik di lingkungan sekolah, praktikum, dan bengkel SMK Taruna Bhakti.
                            </p>
                        </div>
                        
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {features.map((item, idx) => (
                                <div key={idx} className="rounded-3xl border border-white/50 bg-white/40 p-8 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:bg-white/80 dark:border-slate-800/50 dark:bg-slate-900/40 dark:hover:bg-slate-900/80 group flex flex-col">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-white">
                                        <item.icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm flex-1">{item.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* CTA Section */}
                    <section className="mx-auto w-full max-w-7xl px-6 lg:px-12 pt-32">
                        <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-slate-900 to-indigo-950 px-8 py-20 text-center text-white shadow-2xl md:px-16 md:py-28">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                            <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/30 blur-[100px]" />
                            <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-emerald-500/20 blur-[100px]" />
                            
                            <div className="relative z-10 mx-auto max-w-3xl space-y-6">
                                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">Siap merapikan sistem peminjaman Anda?</h2>
                                <p className="text-lg md:text-xl text-slate-300 mx-auto max-w-2xl flex-1">
                                    Bergabung dengan institusi lain yang mendigitalisasi lab mereka. Setup dalam 5 menit, hemat waktu ribuan jam.
                                </p>
                                <div className="pt-8">
                                    <Link
                                        href={auth.user ? dashboard() : '/login'}
                                        className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-10 py-5 text-lg font-bold text-slate-900 transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                                    >
                                        Mulai Sekarang - Gratis
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>

                </main>
                
                {/* Footer */}
                <footer className="border-t border-border/50 bg-background/50 py-8 backdrop-blur-sm text-center text-slate-500 dark:text-slate-400 text-sm">
                    <p>© {new Date().getFullYear()} Hak Cipta Dilindungi. SispemTB Project.</p>
                </footer>
            </div>
        </>
    );
}
