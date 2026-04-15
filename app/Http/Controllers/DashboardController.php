<?php

namespace App\Http\Controllers;

use App\Models\Loan;
use App\Models\Tool;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Controller utama untuk mengelola halaman Dashboard aplikasi.
 * Bertanggung jawab dalam menyajikan metrik statistik peminjaman, jumlah alat,
 * serta memberikan laporan singkat transaksi terbaru.
 */
class DashboardController extends Controller
{
    /**
     * Menyiapkan dan menampilkan halaman Dashboard.
     * Mengambil data agregat (ringkasan status, stok menipis, dan transaksi terbaru)
     * tanpa membebani server berkat penggunaan query kalkulasi langsung (`selectRaw`).
     *
     * @return Response Tampilan Inertia 'dashboard' beserta properti metrik.
     */
    public function __invoke(): Response
    {
        $statusCounts = Loan::query()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        // Mengambil 5 peminjaman paling baru dengan format rinci.
        // Eager loading [items.tool, user] dipakai untuk mendongkrak performa dan mencegah N+1 Query.
        $recentLoans = Loan::query()
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

        $lowStockTools = Tool::query()
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

        return Inertia::render('dashboard', [
            'stats' => [
                'total_tools' => Tool::count(),
                'available_units' => (int) Tool::sum('stock_available'),
                'active_loans' => (int) ($statusCounts['approved'] ?? 0) + (int) ($statusCounts['borrowed'] ?? 0),
                'pending_requests' => (int) ($statusCounts['pending'] ?? 0),
            ],
            'statusBreakdown' => [
                ['label' => 'Pending', 'value' => (int) ($statusCounts['pending'] ?? 0)],
                ['label' => 'Disetujui', 'value' => (int) ($statusCounts['approved'] ?? 0)],
                ['label' => 'Dipinjam', 'value' => (int) ($statusCounts['borrowed'] ?? 0)],
                ['label' => 'Dikembalikan', 'value' => (int) ($statusCounts['returned'] ?? 0)],
                ['label' => 'Ditolak', 'value' => (int) ($statusCounts['rejected'] ?? 0)],
            ],
            'recentLoans' => $recentLoans,
            'lowStockTools' => $lowStockTools,
        ]);
    }
}
