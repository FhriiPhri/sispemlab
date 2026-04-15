import { Head } from '@inertiajs/react';
import {
    AlertTriangle,
    Boxes,
    ClipboardList,
    Clock3,
    MapPin,
    PackageCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { dashboard } from '@/routes';

type DashboardProps = {
    stats: {
        total_tools: number;
        available_units: number;
        active_loans: number;
        pending_requests: number;
    };
    statusBreakdown: Array<{
        label: string;
        value: number;
    }>;
    recentLoans: Array<{
        id: number;
        borrower_name: string;
        borrower_identifier: string | null;
        purpose: string;
        loan_date: string | null;
        return_due_date: string | null;
        status: string;
        requested_by: string | null;
        items: Array<{
            tool_name: string | null;
            quantity: number;
        }>;
    }>;
    lowStockTools: Array<{
        id: number;
        name: string;
        code: string;
        location: string | null;
        stock_total: number;
        stock_available: number;
    }>;
};

const statCards = [
    {
        key: 'total_tools',
        label: 'Total Jenis Alat',
        icon: Boxes,
        accent: 'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
    },
    {
        key: 'available_units',
        label: 'Unit Tersedia',
        icon: PackageCheck,
        accent: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
    },
    {
        key: 'active_loans',
        label: 'Pinjaman Aktif',
        icon: ClipboardList,
        accent: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
    },
    {
        key: 'pending_requests',
        label: 'Menunggu Persetujuan',
        icon: Clock3,
        accent: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
    },
] as const;

const statusClasses: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300',
    approved: 'bg-sky-100 text-sky-800 dark:bg-sky-500/10 dark:text-sky-300',
    borrowed: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-300',
    returned: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300',
    rejected: 'bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-300',
    draft: 'bg-slate-200 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300',
};

const formatStatus = (value: string) =>
    ({
        pending: 'Pending',
        approved: 'Disetujui',
        borrowed: 'Dipinjam',
        returned: 'Dikembalikan',
        rejected: 'Ditolak',
        draft: 'Draft',
    })[value] ?? value;

export default function Dashboard({
    stats,
    statusBreakdown,
    recentLoans,
    lowStockTools,
}: DashboardProps) {
    return (
        <>
            <Head title="Dashboard Operasional" />

            <div className="flex flex-1 flex-col gap-6 rounded-[1.75rem] p-4 md:p-6">
                <section className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-[linear-gradient(135deg,var(--color-primary)_0%,#1e3a8a_52%,var(--color-primary)_100%)] px-6 py-8 text-white shadow-xl shadow-slate-900/10">
                    <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
                    <div className="relative grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
                        <div>
                            <p className="mb-3 text-sm font-medium tracking-[0.24em] text-sky-100 uppercase">
                                Dashboard Operasional
                            </p>
                            <h1 className="max-w-2xl text-3xl leading-tight font-semibold md:text-4xl">
                                Pantau alat, stok tersedia, dan alur
                                peminjaman dari satu tempat.
                            </h1>
                            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200 md:text-base">
                                Fondasi project sudah kita arahkan ke kebutuhan
                                sistem peminjaman alat. Langkah berikutnya
                                tinggal menambah CRUD, approval action, dan
                                histori pengembalian.
                            </p>
                        </div>

                        <div className="grid gap-3 rounded-[1.5rem] border border-white/10 bg-white/8 p-4 backdrop-blur">
                            <p className="text-sm text-slate-200">
                                Fokus sprint berikutnya
                            </p>
                            <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm">
                                CRUD data alat dan kategori
                            </div>
                            <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm">
                                Form pengajuan peminjaman
                            </div>
                            <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm">
                                Approval dan pengembalian alat
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {statCards.map((card) => {
                        const value = stats[card.key];

                        return (
                            <div
                                key={card.key}
                                className="rounded-[1.5rem] border border-border/60 bg-card/60 p-5 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:bg-card/90 hover:border-primary/20 group"
                            >
                                <div className="mb-4 flex items-center justify-between">
                                    <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                                        {card.label}
                                    </span>
                                    <div
                                        className={`rounded-2xl p-2 transition-transform duration-300 group-hover:scale-110 ${card.accent}`}
                                    >
                                        <card.icon className="h-5 w-5" />
                                    </div>
                                </div>
                                <div className="text-3xl font-semibold">
                                    {value}
                                </div>
                            </div>
                        );
                    })}
                </section>

                <section className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
                    <div className="rounded-[1.5rem] border border-border/70 bg-card p-5 shadow-sm">
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    Aktivitas Peminjaman Terbaru
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Data ini diambil dari tabel peminjaman dan
                                    detail item.
                                </p>
                            </div>
                            <Badge variant="secondary">
                                {recentLoans.length} data
                            </Badge>
                        </div>

                        <div className="space-y-4">
                            {recentLoans.length > 0 ? (
                                recentLoans.map((loan) => (
                                    <div
                                        key={loan.id}
                                        className="rounded-[1.25rem] border border-border/50 bg-background/50 p-4 backdrop-blur-md transition-all duration-300 hover:shadow-md hover:bg-background/80 hover:border-primary/20"
                                    >
                                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                            <div>
                                                <div className="mb-2 flex items-center gap-2">
                                                    <h3 className="font-semibold">
                                                        {loan.borrower_name}
                                                    </h3>
                                                    <span className="text-xs text-muted-foreground">
                                                        {loan.borrower_identifier ??
                                                            'Tanpa ID'}
                                                    </span>
                                                </div>
                                                <p className="text-sm leading-6 text-muted-foreground">
                                                    {loan.purpose}
                                                </p>
                                                <p className="mt-3 text-xs text-muted-foreground">
                                                    Item:{' '}
                                                    {loan.items
                                                        .map(
                                                            (item) =>
                                                                `${item.tool_name ?? 'Alat'} x${item.quantity}`,
                                                        )
                                                        .join(', ')}
                                                </p>
                                            </div>

                                            <div className="flex flex-col items-start gap-2 md:items-end">
                                                <Badge
                                                    className={
                                                        statusClasses[
                                                            loan.status
                                                        ] ??
                                                        statusClasses.draft
                                                    }
                                                >
                                                    {formatStatus(loan.status)}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {loan.loan_date} s.d.{' '}
                                                    {loan.return_due_date}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    Input oleh{' '}
                                                    {loan.requested_by ??
                                                        'Sistem'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-[1.25rem] border border-dashed border-border p-6 text-sm text-muted-foreground">
                                    Belum ada transaksi peminjaman. Seeder atau
                                    input data pertama akan muncul di sini.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-4">
                        <div className="rounded-[1.5rem] border border-border/70 bg-card p-5 shadow-sm">
                            <div className="mb-5 flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold">
                                        Breakdown Status
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        Ringkasan progres pengajuan.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {statusBreakdown.map((status) => (
                                    <div key={status.label}>
                                        <div className="mb-1 flex items-center justify-between text-sm">
                                            <span>{status.label}</span>
                                            <span className="font-semibold">
                                                {status.value}
                                            </span>
                                        </div>
                                        <div className="h-2 rounded-full bg-muted">
                                            <div
                                                className="h-2 rounded-full bg-primary"
                                                style={{
                                                    width: `${Math.min(
                                                        100,
                                                        status.value * 20,
                                                    )}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-[1.5rem] border border-border/70 bg-card p-5 shadow-sm">
                            <div className="mb-5 flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold">
                                        Stok Menipis
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        Alat dengan unit tersedia paling rendah.
                                    </p>
                                </div>
                                <AlertTriangle className="h-5 w-5 text-amber-500" />
                            </div>

                            <div className="space-y-3">
                                {lowStockTools.length > 0 ? (
                                    lowStockTools.map((tool) => (
                                        <div
                                            key={tool.id}
                                            className="rounded-[1.2rem] border border-border/50 bg-background/50 p-4 backdrop-blur-sm transition-all duration-300 hover:shadow-md hover:bg-amber-500/5 hover:border-amber-500/20"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <h3 className="font-medium">
                                                        {tool.name}
                                                    </h3>
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        {tool.code}
                                                    </p>
                                                    <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                                                        <MapPin className="h-3.5 w-3.5" />
                                                        {tool.location ??
                                                            'Lokasi belum diatur'}
                                                    </p>
                                                </div>
                                                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                                                    {tool.stock_available}/
                                                    {tool.stock_total}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="rounded-[1.25rem] border border-dashed border-border p-6 text-sm text-muted-foreground">
                                        Belum ada alat dengan stok rendah.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
