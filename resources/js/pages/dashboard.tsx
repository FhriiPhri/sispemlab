import { Head, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    Boxes,
    ClipboardList,
    Clock3,
    MapPin,
    PackageCheck,
    TrendingUp,
    Undo2,
    Wrench,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { dashboard } from '@/routes';
import type { SharedData } from '@/types';

type MonthlyData = { month: string; year: number; total: number };
type BreakdownItem = { label: string; value: number; color: string };

type DashboardProps = {
    role: string;
    stats: {
        total_tools: number;
        available_units: number;
        active_loans: number;
        pending_requests: number;
        // peminjam extra
        my_total?: number;
        my_returned?: number;
    };
    statusBreakdown: BreakdownItem[];
    conditionBreakdown: BreakdownItem[];
    monthlyLoans: MonthlyData[];
    recentLoans: Array<{
        id: number;
        borrower_name: string;
        borrower_identifier: string | null;
        purpose: string;
        loan_date: string | null;
        return_due_date: string | null;
        status: string;
        requested_by: string | null;
        items: Array<{ tool_name: string | null; quantity: number }>;
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

// ── Helpers ───────────────────────────────────────────────────────────────────
const statusClasses: Record<string, string> = {
    pending:
        'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300',
    approved: 'bg-sky-100 text-sky-800 dark:bg-sky-500/10 dark:text-sky-300',
    borrowed:
        'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-300',
    returned:
        'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300',
    rejected:
        'bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-300',
    draft: 'bg-slate-200 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300',
};
const formatStatus = (v: string) =>
    ({
        pending: 'Pending',
        approved: 'Disetujui',
        borrowed: 'Dipinjam',
        returned: 'Dikembalikan',
        rejected: 'Ditolak',
        draft: 'Draft',
    })[v] ?? v;

// ── Bar Chart ─────────────────────────────────────────────────────────────────
function BarChart({
    data,
    color = '#6366f1',
}: {
    data: MonthlyData[];
    color?: string;
}) {
    const max = Math.max(...data.map((d) => d.total), 1);
    const chartH = 120;
    const barW = 32;
    const gap = 12;
    const totalW = data.length * (barW + gap) - gap;

    return (
        <div className="overflow-x-auto">
            <svg width={totalW + 20} height={chartH + 40} className="mx-auto">
                {data.map((d, i) => {
                    const barH = Math.max(
                        (d.total / max) * chartH,
                        d.total > 0 ? 4 : 0,
                    );
                    const x = i * (barW + gap);
                    const y = chartH - barH;
                    return (
                        <g key={i}>
                            <rect
                                x={x}
                                y={0}
                                width={barW}
                                height={chartH}
                                rx={6}
                                fill="currentColor"
                                className="text-muted/30"
                            />
                            <rect
                                x={x}
                                y={y}
                                width={barW}
                                height={barH}
                                rx={6}
                                fill={color}
                                opacity={0.85}
                            />
                            {d.total > 0 && (
                                <text
                                    x={x + barW / 2}
                                    y={y - 5}
                                    textAnchor="middle"
                                    fontSize={10}
                                    fill={color}
                                    fontWeight="600"
                                >
                                    {d.total}
                                </text>
                            )}
                            <text
                                x={x + barW / 2}
                                y={chartH + 18}
                                textAnchor="middle"
                                fontSize={11}
                                fill="currentColor"
                                opacity={0.6}
                            >
                                {d.month}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

// ── Donut Chart ───────────────────────────────────────────────────────────────
function DonutChart({
    data,
    label = 'total',
}: {
    data: BreakdownItem[];
    label?: string;
}) {
    const total = data.reduce((s, d) => s + d.value, 0);
    const r = 52;
    const cx = 70;
    const cy = 70;
    const circumference = 2 * Math.PI * r;

    let offset = 0;
    const slices = data.map((d) => {
        const pct = total > 0 ? d.value / total : 0;
        const dash = pct * circumference;
        const gap = circumference - dash;
        const slice = { ...d, dash, gap, offset };
        offset += dash;
        return slice;
    });

    return (
        <div className="flex flex-col items-center gap-3">
            <svg width={140} height={140}>
                {total === 0 ? (
                    <circle
                        cx={cx}
                        cy={cy}
                        r={r}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={18}
                        className="text-muted/30"
                    />
                ) : (
                    slices.map((s, i) => (
                        <circle
                            key={i}
                            cx={cx}
                            cy={cy}
                            r={r}
                            fill="none"
                            stroke={s.color}
                            strokeWidth={18}
                            strokeDasharray={`${s.dash} ${s.gap}`}
                            strokeDashoffset={-s.offset + circumference * 0.25}
                            style={{ transition: 'stroke-dasharray 0.6s ease' }}
                        />
                    ))
                )}
                <text
                    x={cx}
                    y={cy - 6}
                    textAnchor="middle"
                    fontSize={22}
                    fontWeight="700"
                    fill="currentColor"
                >
                    {total}
                </text>
                <text
                    x={cx}
                    y={cy + 14}
                    textAnchor="middle"
                    fontSize={10}
                    fill="currentColor"
                    opacity={0.6}
                >
                    {label}
                </text>
            </svg>
            <div className="grid w-full grid-cols-2 gap-x-4 gap-y-1.5">
                {data.map((d) => (
                    <div
                        key={d.label}
                        className="flex items-center gap-1.5 text-xs"
                    >
                        <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: d.color }}
                        />
                        <span className="truncate text-muted-foreground">
                            {d.label}
                        </span>
                        <span className="ml-auto font-semibold">{d.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Dashboard({
    role,
    stats,
    statusBreakdown,
    conditionBreakdown,
    monthlyLoans,
    recentLoans,
    lowStockTools,
}: DashboardProps) {
    const { auth } = usePage<SharedData>().props;
    const isPeminjam = role === 'peminjam';
    const totalMonth = monthlyLoans.reduce((s, d) => s + d.total, 0);

    return (
        <>
            <Head title="Dashboard Operasional" />
            <div className="flex flex-1 flex-col gap-6 rounded-[1.75rem] p-4 md:p-6">
                {/* ── Banner ── */}
                <section className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-[linear-gradient(135deg,var(--color-primary)_0%,#1e3a8a_52%,var(--color-primary)_100%)] px-6 py-8 text-white shadow-xl shadow-slate-900/10">
                    <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
                    <div className="relative">
                        <p className="mb-2 text-sm font-medium tracking-[0.24em] text-sky-100 uppercase">
                            Dashboard · SispemTB
                        </p>
                        <h1 className="max-w-2xl text-3xl leading-tight font-semibold md:text-4xl">
                            {isPeminjam
                                ? `Selamat datang, ${auth.user.name.split(' ')[0]}!`
                                : 'Pantau alat, stok, dan peminjaman dari satu tempat.'}
                        </h1>
                        <p className="mt-3 text-sm leading-7 text-slate-200">
                            {isPeminjam
                                ? 'Berikut statistik peminjaman alat milik kamu.'
                                : 'SMK Taruna Bhakti Depok — Sistem Peminjaman Alat Laboratorium'}
                        </p>
                    </div>
                </section>

                {/* ── Stat Cards ── */}
                {isPeminjam ? (
                    /* Peminjam: card milik sendiri */
                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {[
                            {
                                label: 'Total Peminjamanku',
                                value: stats.my_total ?? 0,
                                icon: ClipboardList,
                                accent: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300',
                            },
                            {
                                label: 'Sudah Dikembalikan',
                                value: stats.my_returned ?? 0,
                                icon: Undo2,
                                accent: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
                            },
                            {
                                label: 'Pinjaman Aktif',
                                value: stats.active_loans,
                                icon: PackageCheck,
                                accent: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
                            },
                            {
                                label: 'Menunggu Persetujuan',
                                value: stats.pending_requests,
                                icon: Clock3,
                                accent: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
                            },
                        ].map((card) => (
                            <div
                                key={card.label}
                                className="group rounded-[1.5rem] border border-border/60 bg-card/60 p-5 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:bg-card/90 hover:shadow-xl"
                            >
                                <div className="mb-4 flex items-center justify-between">
                                    <span className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                                        {card.label}
                                    </span>
                                    <div
                                        className={`rounded-2xl p-2 transition-transform group-hover:scale-110 ${card.accent}`}
                                    >
                                        <card.icon className="h-5 w-5" />
                                    </div>
                                </div>
                                <div className="text-3xl font-semibold">
                                    {card.value}
                                </div>
                            </div>
                        ))}
                    </section>
                ) : (
                    /* Admin/Petugas: card global */
                    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {(
                            [
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
                            ] as const
                        ).map((card) => (
                            <div
                                key={card.key}
                                className="group rounded-[1.5rem] border border-border/60 bg-card/60 p-5 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:bg-card/90 hover:shadow-xl"
                            >
                                <div className="mb-4 flex items-center justify-between">
                                    <span className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                                        {card.label}
                                    </span>
                                    <div
                                        className={`rounded-2xl p-2 transition-transform group-hover:scale-110 ${card.accent}`}
                                    >
                                        <card.icon className="h-5 w-5" />
                                    </div>
                                </div>
                                <div className="text-3xl font-semibold">
                                    {stats[card.key]}
                                </div>
                            </div>
                        ))}
                    </section>
                )}

                {/* ── Charts ── */}
                {isPeminjam ? (
                    /* Peminjam: hanya 1 bar chart peminjamannya sendiri */
                    <section className="grid gap-4 xl:grid-cols-2">
                        <div className="rounded-[1.5rem] border border-border/70 bg-card p-5 shadow-sm">
                            <div className="mb-5 flex items-center justify-between">
                                <div>
                                    <h2 className="flex items-center gap-2 text-lg font-semibold">
                                        <TrendingUp className="h-4 w-4 text-indigo-500" />
                                        Riwayat Peminjamanku
                                    </h2>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        6 bulan terakhir (data milikmu)
                                    </p>
                                </div>
                                <span className="text-2xl font-bold text-indigo-600">
                                    {totalMonth}
                                </span>
                            </div>
                            <BarChart data={monthlyLoans} color="#6366f1" />
                        </div>

                        <div className="rounded-[1.5rem] border border-border/70 bg-card p-5 shadow-sm">
                            <div className="mb-4">
                                <h2 className="text-lg font-semibold">
                                    Status Peminjamanku
                                </h2>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    Distribusi status peminjaman milikmu
                                </p>
                            </div>
                            <DonutChart
                                data={statusBreakdown}
                                label="peminjamanku"
                            />
                        </div>
                    </section>
                ) : (
                    /* Admin/Petugas: 3 chart penuh */
                    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <div className="rounded-[1.5rem] border border-border/70 bg-card p-5 shadow-sm">
                            <div className="mb-5 flex items-center justify-between">
                                <div>
                                    <h2 className="flex items-center gap-2 text-lg font-semibold">
                                        <TrendingUp className="h-4 w-4 text-indigo-500" />
                                        Tren Peminjaman
                                    </h2>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        6 bulan terakhir (semua user)
                                    </p>
                                </div>
                                <span className="text-2xl font-bold text-indigo-600">
                                    {totalMonth}
                                </span>
                            </div>
                            <BarChart data={monthlyLoans} />
                        </div>

                        <div className="rounded-[1.5rem] border border-border/70 bg-card p-5 shadow-sm">
                            <div className="mb-4">
                                <h2 className="text-lg font-semibold">
                                    Status Peminjaman
                                </h2>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    Distribusi seluruh transaksi
                                </p>
                            </div>
                            <DonutChart
                                data={statusBreakdown}
                                label="transaksi"
                            />
                        </div>

                        <div className="rounded-[1.5rem] border border-border/70 bg-card p-5 shadow-sm">
                            <div className="mb-4">
                                <h2 className="flex items-center gap-2 text-lg font-semibold">
                                    <Wrench className="h-4 w-4 text-amber-500" />
                                    Kondisi Alat
                                </h2>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    Berdasarkan jenis alat
                                </p>
                            </div>
                            <DonutChart
                                data={conditionBreakdown}
                                label="jenis alat"
                            />
                        </div>
                    </section>
                )}

                {/* ── Recent Loans + Low Stock ── */}
                <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
                    <div className="rounded-[1.5rem] border border-border/70 bg-card p-5 shadow-sm">
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    {isPeminjam
                                        ? 'Riwayat Terbaru Saya'
                                        : 'Aktivitas Peminjaman Terbaru'}
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    5 peminjaman paling baru.
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
                                        className="rounded-[1.25rem] border border-border/50 bg-background/50 p-4 backdrop-blur-md transition-all duration-300 hover:border-primary/20 hover:bg-background/80 hover:shadow-md"
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
                                                        ] ?? statusClasses.draft
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
                                    {isPeminjam
                                        ? 'Kamu belum memiliki peminjaman.'
                                        : 'Belum ada transaksi peminjaman.'}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Low Stock / Info Alat */}
                    <div className="rounded-[1.5rem] border border-border/70 bg-card p-5 shadow-sm">
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    {isPeminjam
                                        ? 'Info Inventaris'
                                        : 'Stok Menipis'}
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    {isPeminjam
                                        ? 'Ketersediaan alat saat ini.'
                                        : 'Alat dengan unit tersedia rendah.'}
                                </p>
                            </div>
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                        </div>

                        {isPeminjam ? (
                            /* Peminjam: tampilkan ringkasan inventaris */
                            <div className="space-y-3">
                                <div className="space-y-2 rounded-[1.2rem] border border-border/50 bg-background/50 p-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Total Jenis Alat
                                        </span>
                                        <span className="font-semibold">
                                            {stats.total_tools}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Unit Tersedia
                                        </span>
                                        <span className="font-semibold text-emerald-600">
                                            {stats.available_units}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Admin/Petugas: stok menipis */
                            <div className="space-y-3">
                                {lowStockTools.length > 0 ? (
                                    lowStockTools.map((tool) => (
                                        <div
                                            key={tool.id}
                                            className="rounded-[1.2rem] border border-border/50 bg-background/50 p-4 backdrop-blur-sm transition-all duration-300 hover:border-amber-500/20 hover:bg-amber-500/5 hover:shadow-md"
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
                        )}
                    </div>
                </section>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: dashboard() }],
};