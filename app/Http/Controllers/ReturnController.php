<?php

namespace App\Http\Controllers;

use App\Models\Loan;
use App\Models\ToolReturn;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Mengelola proses pengembalian alat dan pelunasan denda.
 * Kalkulasi denda dilakukan di layer MySQL (Stored Procedure + Function)
 * untuk performa maksimal tanpa PHP looping.
 */
class ReturnController extends Controller
{
    /**
     * Menampilkan halaman riwayat pengembalian dengan pagination.
     *
     * Input:  Query param page, search, payment_status
     * Output: Inertia view dengan data returns paginasi
     */
    public function index(Request $request)
    {
        $query = ToolReturn::with(['loan', 'processedBy'])
            ->latest();

        // Filter by payment status
        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }

        // Filter by search (berdasarkan nama peminjam via relasi)
        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('loan', function ($q) use ($search) {
                $q->where('borrower_name', 'like', "%{$search}%")
                  ->orWhere('loan_code', 'like', "%{$search}%");
            });
        }

        $returns = $query->paginate(10)->withQueryString();

        // Statistik ringkasan untuk dashboard pengembalian
        $stats = [
            'total'    => ToolReturn::count(),
            'unpaid'   => ToolReturn::where('payment_status', 'unpaid')
                ->whereRaw('(fine > 0 OR damage_fine > 0)')
                ->count(),
            'total_fine_unpaid' => ToolReturn::where('payment_status', 'unpaid')
                ->sum(DB::raw('fine + damage_fine')),
        ];

        return inertia('returns/index', [
            'returns' => $returns,
            'stats'   => $stats,
            'filters' => $request->only(['search', 'payment_status']),
        ]);
    }

    /**
     * Memproses pengembalian alat oleh Petugas.
     * Memanggil Stored Procedure `process_return` untuk:
     * - Kalkulasi denda keterlambatan otomatis
     * - Penambahan denda kerusakan manual (opsional)
     * - Update status loan & stok alat
     * - Pencatatan ke activity_logs
     *
     * Input:  loan_id, return_date, condition_note, damage_fine
     * Proses: Stored Procedure `process_return`
     * Output: record di tabel `returns` + update `loans.status = returned`
     */
    public function store(Request $request)
    {
        $request->validate([
            'loan_id'        => 'required|exists:loans,id',
            'return_datetime' => 'required|date',
            'condition_note' => 'nullable|string|max:1000',
            'damage_fine'    => 'nullable|integer|min:0',
        ]);

        $loan = Loan::findOrFail($request->loan_id);

        if ($loan->status === 'returned') {
            return back()->with('error', 'Peminjaman ini sudah dikembalikan.');
        }

        try {
            DB::statement('CALL process_return(?, ?, ?, ?, ?)', [
                $loan->id,
                auth()->id(),
                $request->return_datetime,    // DATETIME: '2026-04-15 14:30:00'
                $request->condition_note ?? '',
                (int) ($request->damage_fine ?? 0),
            ]);

            return back()->with('success', 'Pengembalian berhasil diproses. Denda otomatis dihitung.');
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal memproses pengembalian: ' . $e->getMessage());
        }
    }

    /**
     * Melunasi denda peminjaman yang masih berstatus `unpaid`.
     *
     * Input:  ID record return yang memiliki denda belum lunas
     * Proses: Update kolom `payment_status` menjadi `paid`, catat ke activity_log
     * Output: Status denda berubah menjadi LUNAS
     */
    public function payFine(Request $request, $id)
    {
        $return = ToolReturn::with('loan')->findOrFail($id);
        $totalFine = $return->fine + $return->damage_fine;

        if ($totalFine <= 0) {
            return back()->with('error', 'Peminjaman ini tidak memiliki denda.');
        }

        if ($return->payment_status === 'paid') {
            return back()->with('error', 'Denda ini sudah dilunasi sebelumnya.');
        }

        DB::transaction(function () use ($return, $totalFine) {
            $return->update(['payment_status' => 'paid']);

            ActivityLog::create([
                'user_id'     => auth()->id(),
                'action'      => 'Fine Paid',
                'description' => 'Denda peminjaman #' . $return->loan_id . ' senilai Rp ' . number_format($totalFine, 0, ',', '.') . ' telah dilunasi.',
            ]);
        });

        return back()->with('success', 'Denda sebesar Rp ' . number_format($totalFine, 0, ',', '.') . ' berhasil dilunasi!');
    }
}
