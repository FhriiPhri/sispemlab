<?php

namespace App\Http\Controllers;

use App\Models\Loan;
use App\Models\Tool;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Controller utama untuk mengelola halaman Dashboard aplikasi.
 * Admin/Petugas: data global semua user.
 * Peminjam: hanya data milik sendiri.
 */
class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        /** @var User $user */
        $user = Auth::user();
        $role = $user->role;
        $isPeminjam = $role === 'peminjam';

        // ── Query Builder berdasarkan scope ───────────────────────────────────
        $loanScope = $isPeminjam
            ? Loan::query()->where('user_id', $user->id)
            : Loan::query();

        // Status breakdown
        $statusCounts = (clone $loanScope)
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        // Data peminjaman per bulan (6 bulan terakhir)
        $monthlyLoans = collect(range(5, 0))->map(function ($monthsAgo) use ($isPeminjam, $user) {
            $date = Carbon::now()->subMonths($monthsAgo);
            $q = Loan::whereYear('loan_date', $date->year)
                ->whereMonth('loan_date', $date->month);
            if ($isPeminjam) {
                $q->where('user_id', $user->id);
            }

            return [
                'month' => $date->format('M'),
                'year' => $date->year,
                'total' => $q->count(),
            ];
        })->values();

        // Kondisi alat (sama untuk semua role — info inventaris)
        $conditionCounts = Tool::query()
            ->selectRaw('condition_status, count(*) as total')
            ->groupBy('condition_status')
            ->pluck('total', 'condition_status');

        // Recent loans
        $recentLoans = (clone $loanScope)
            ->with(['items.tool:id,name', 'user:id,name'])
            ->latest()
            ->take(5)
            ->get()
            ->map(fn (Loan $loan): array => [
                'id' => $loan->id,
                'borrower_name' => $loan->borrower_name,
                'borrower_identifier' => $loan->borrower_identifier,
                'purpose' => $loan->purpose,
                'loan_date' => optional($loan->loan_date)?->format('Y-m-d'),
                'return_due_date' => optional($loan->return_due_date)?->format('Y-m-d'),
                'status' => $loan->status,
                'requested_by' => $loan->user?->name,
                'items' => $loan->items->map(fn ($item): array => [
                    'tool_name' => $item->tool?->name,
                    'quantity' => $item->quantity,
                ])->all(),
            ]);

        // Low stock tools (hanya relevan untuk admin/petugas)
        $lowStockTools = $isPeminjam ? collect() : Tool::query()
            ->where('stock_available', '<=', 2)
            ->orderBy('stock_available')
            ->take(5)
            ->get(['id', 'name', 'code', 'location', 'stock_total', 'stock_available'])
            ->map(fn (Tool $tool): array => [
                'id' => $tool->id,
                'name' => $tool->name,
                'code' => $tool->code,
                'location' => $tool->location,
                'stock_total' => $tool->stock_total,
                'stock_available' => $tool->stock_available,
            ]);

        // Stats cards
        $totalActive = (int) ($statusCounts['approved'] ?? 0) + (int) ($statusCounts['borrowed'] ?? 0);
        $stats = $isPeminjam
            ? [
                'total_tools' => Tool::count(),
                'available_units' => (int) Tool::sum('stock_available'),
                'active_loans' => $totalActive,
                'pending_requests' => (int) ($statusCounts['pending'] ?? 0),
                'my_total' => (clone $loanScope)->count(),
                'my_returned' => (int) ($statusCounts['returned'] ?? 0),
            ]
            : [
                'total_tools' => Tool::count(),
                'available_units' => (int) Tool::sum('stock_available'),
                'active_loans' => $totalActive,
                'pending_requests' => (int) ($statusCounts['pending'] ?? 0),
            ];

        return Inertia::render('dashboard', [
            'role' => $role,
            'stats' => $stats,
            'statusBreakdown' => [
                ['label' => 'Pending',      'value' => (int) ($statusCounts['pending'] ?? 0), 'color' => '#f59e0b'],
                ['label' => 'Disetujui',    'value' => (int) ($statusCounts['approved'] ?? 0), 'color' => '#0ea5e9'],
                ['label' => 'Dipinjam',     'value' => (int) ($statusCounts['borrowed'] ?? 0), 'color' => '#6366f1'],
                ['label' => 'Dikembalikan', 'value' => (int) ($statusCounts['returned'] ?? 0), 'color' => '#10b981'],
                ['label' => 'Ditolak',      'value' => (int) ($statusCounts['rejected'] ?? 0), 'color' => '#ef4444'],
            ],
            'monthlyLoans' => $monthlyLoans,
            'conditionBreakdown' => [
                ['label' => 'Baik',         'value' => (int) ($conditionCounts['baik'] ?? 0), 'color' => '#10b981'],
                ['label' => 'Perlu Servis', 'value' => (int) ($conditionCounts['perlu-servis'] ?? 0), 'color' => '#f59e0b'],
                ['label' => 'Rusak Ringan', 'value' => (int) ($conditionCounts['rusak-ringan'] ?? 0), 'color' => '#f97316'],
                ['label' => 'Rusak Berat',  'value' => (int) ($conditionCounts['rusak-berat'] ?? 0), 'color' => '#ef4444'],
            ],
            'recentLoans' => $recentLoans,
            'lowStockTools' => $lowStockTools,
        ]);
    }
}