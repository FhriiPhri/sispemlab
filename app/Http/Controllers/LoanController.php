<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreLoanRequest;
use App\Http\Requests\UpdateLoanStatusRequest;
use App\Models\Loan;
use App\Models\LoanItem;
use App\Models\Tool;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\ActivityLog;

/**
 * Controller utama pengelola alur Logistik Peminjaman Alat.
 * Berperan krusial dalam siklus hidup peminjaman, meliputi proses pengajuan, persetujuan,
 * pemotongan/penambahan stok, dan penyelesaian aktivitas.
 */
class LoanController extends Controller
{
    /**
     * Menampilkan daftar riwayat dan pengajuan peminjaman saat ini.
     * Secara otomatis mengadaptasi hak akses (peminjam hanya melihat datanya sendiri).
     * Menerapkan N+1 Query Fix (Eager Loading).
     *
     * @return Response Halaman Inertia daftar peminjaman.
     */
    public function index(): Response
    {
        $loans = Loan::query()
            ->with(['items.tool:id,name,code', 'user:id,name'])
            ->when(auth()->user()->role === 'peminjam', function ($query) {
                $query->where('user_id', auth()->id());
            })
            ->latest()
            ->paginate(10)
            ->through(fn (Loan $loan): array => [
                'id' => $loan->id,
                'loan_code' => $loan->loan_code,
                'borrower_name' => $loan->borrower_name,
                'borrower_identifier' => $loan->borrower_identifier,
                'borrower_phone' => $loan->borrower_phone,
                'purpose' => $loan->purpose,
                'loan_date' => optional($loan->loan_date)?->format('Y-m-d H:i'),
                'return_due_date' => optional($loan->return_due_date)?->format('Y-m-d H:i'),
                'returned_at' => optional($loan->returned_at)?->format('Y-m-d H:i'),
                'status' => $loan->status,
                'notes' => $loan->notes,
                'requested_by' => $loan->user?->name,
                'items' => $loan->items->map(fn (LoanItem $item): array => [
                    'tool_id' => $item->tool_id,
                    'tool_name' => $item->tool?->name,
                    'tool_code' => $item->tool?->code,
                    'quantity' => $item->quantity,
                    'condition_out' => $item->condition_out,
                    'condition_in' => $item->condition_in,
                ])->all(),
            ]);

        $allLoans = Loan::query()
            ->when(auth()->user()->role === 'peminjam', function ($query) {
                $query->where('user_id', auth()->id());
            })
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $tools = Tool::query()
            ->with('category:id,name')
            ->orderBy('name')
            ->get()
            ->map(fn (Tool $tool): array => [
                'id' => $tool->id,
                'label' => $tool->name,
                'code' => $tool->code,
                'category_name' => $tool->category?->name,
                'stock_available' => $tool->stock_available,
                'condition_status' => $tool->condition_status,
            ]);

        return Inertia::render('loans/index', [
            'loans' => $loans,
            'tools' => $tools,
            'stats' => [
                'pending' => (int) ($allLoans['pending'] ?? 0),
                'active' => (int) ($allLoans['approved'] ?? 0) + (int) ($allLoans['borrowed'] ?? 0),
                'returned' => (int) ($allLoans['returned'] ?? 0),
            ],
        ]);
    }

    /**
     * Menyimpan data pengajuan peminjaman baru ke sistem.
     * Menggunakan `DB::transaction` dipadukan dengan pesimistik lock (`lockForUpdate`) 
     * untuk menghindari konflik persaingan stok alat (Race Conditions) manakala diakses bersamaan.
     *
     * @param StoreLoanRequest $request Aturan validasi input peminjaman.
     * @return RedirectResponse Kembali ke halaman utama setelah sukses.
     */
    public function store(StoreLoanRequest $request): RedirectResponse
    {
        if ($request->user() && $request->user()->loans()->whereIn('status', ['pending', 'approved', 'borrowed'])->exists()) {
            throw ValidationException::withMessages([
                'borrower_name' => ['Anda masih memiliki transaksi peminjaman aktif atau belum dikembalikan. Harap tuntaskan sebelum meminjam lagi.']
            ]);
        }

        $validated = $request->validated();

        DB::transaction(function () use ($request, $validated): void {
            $toolIds = collect($validated['items'])->pluck('tool_id')->all();
            $tools = Tool::query()
                ->whereIn('id', $toolIds)
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            foreach ($validated['items'] as $item) {
                $tool = $tools->get($item['tool_id']);

                if (! $tool || $item['quantity'] > $tool->stock_available) {
                    $toolName = $tool?->name ?? 'yang dipilih';

                    throw ValidationException::withMessages([
                        'items' => ["Stok alat {$toolName} tidak mencukupi untuk pengajuan ini."],
                    ]);
                }
            }

            $loan = Loan::query()->create([
                'user_id' => $request->user()?->id,
                'borrower_name' => $validated['borrower_name'],
                'borrower_identifier' => $validated['borrower_identifier'] ?? null,
                'borrower_phone' => $validated['borrower_phone'] ?? null,
                'purpose' => $validated['purpose'],
                'loan_date' => $validated['loan_date'],
                'return_due_date' => $validated['return_due_date'],
                'status' => 'pending',
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($validated['items'] as $item) {
                $loan->items()->create([
                    'tool_id' => $item['tool_id'],
                    'quantity' => $item['quantity'],
                    'condition_out' => $item['condition_out'] ?? null,
                ]);
            }
        });

        ActivityLog::record('pengajuan_pinjam', "Mengajukan peminjaman baru atas nama: {$validated['borrower_name']}");

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pengajuan peminjaman berhasil dibuat.']);

        return to_route('loans.index');
    }

    /**
     * Memperbarui status dari pengajuan peminjaman (contohnya: dari 'pending' ke 'approved').
     * Memastikan stok benar-benar dipotong secara akurat ketika alat fisik mulai dibawa (`borrowed`).
     * Tersinkronisasi total menggunakan Transaksi Database ACID.
     *
     * @param UpdateLoanStatusRequest $request
     * @param Loan $loan
     * @return RedirectResponse
     */
    public function updateStatus(UpdateLoanStatusRequest $request, Loan $loan): RedirectResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($loan, $validated): void {
            $loan->load('items');

            $nextStatus = $validated['status'];
            $this->ensureValidTransition($loan->status, $nextStatus);

            if ($nextStatus === 'borrowed' && $loan->status !== 'borrowed') {
                $this->decrementStocks($loan);
            }

            if ($nextStatus === 'returned' && $loan->status === 'borrowed') {
                $this->incrementStocks($loan);
            }

            $loan->update([
                'status' => $nextStatus,
                'returned_at' => $nextStatus === 'returned' ? now() : null,
                'notes' => $validated['notes'] ?? $loan->notes,
            ]);
            
            ActivityLog::record('update_status_pinjam', "Mengubah status peminjaman (ID: {$loan->id}) menjadi: {$nextStatus}");
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Status peminjaman berhasil diperbarui.']);

        return to_route('loans.index');
    }

    /**
     * Fitur bagi Peminjam untuk menandai bahwa alat siap dikembalikan.
     * Akan membubuhi peringatan otomatis ke kolom catatan agar Admin bersiap
     * memeriksa wujud fisik alat di lab.
     *
     * @param Loan $loan
     * @return RedirectResponse
     */
    public function returnRequest(Loan $loan): RedirectResponse
    {
        if ($loan->status !== 'borrowed') {
            throw ValidationException::withMessages([
                'status' => ['Hanya alat yang sedang dipinjam yang dapat diajukan pengembalian.'],
            ]);
        }

        $loan->update([
            'notes' => trim($loan->notes . "\n\n[Sistem]: Peminjam telah mengajukan proses pengembalian alat. Silakan Petugas memeriksa fisik alat di lab."),
        ]);

        ActivityLog::record('notifikasi_kembali', "Mengajukan pengembalian alat untuk transaksi peminjaman (ID: {$loan->id})");

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Permintaan pengembalian terkirim. Silakan serahkan alat ke Petugas.']);

        return to_route('loans.index');
    }

    /**
     * Mesin validasi aliran status (State Machine Validator).
     * Memastikan tidak ada loncatan jalur yang menyalahi hukum (misal dari 'rejected' ke 'approved').
     */
    private function ensureValidTransition(string $current, string $next): void
    {
        $allowedTransitions = [
            'pending' => ['approved', 'borrowed', 'rejected'],
            'approved' => ['borrowed', 'rejected'],
            'borrowed' => ['returned'],
            'rejected' => [],
            'returned' => [],
            'draft' => ['pending'],
        ];

        if (! in_array($next, $allowedTransitions[$current] ?? [], true)) {
            throw ValidationException::withMessages([
                'status' => ['Perubahan status ini tidak diizinkan dari kondisi saat ini.'],
            ]);
        }
    }

    /**
     * Agregator pengurangan stok fisik alat saat disetujui (dipinjam keluar).
     */
    private function decrementStocks(Loan $loan): void
    {
        $tools = Tool::query()
            ->whereIn('id', $loan->items->pluck('tool_id'))
            ->lockForUpdate()
            ->get()
            ->keyBy('id');

        foreach ($loan->items as $item) {
            $tool = $tools->get($item->tool_id);

            if (! $tool || $tool->stock_available < $item->quantity) {
                $toolName = $tool?->name ?? 'alat';

                throw ValidationException::withMessages([
                    'status' => ["Stok {$toolName} tidak mencukupi untuk dipinjamkan."],
                ]);
            }

            $tool->decrement('stock_available', $item->quantity);
        }
    }

    /**
     * Agregator pembesaran jumlah ketersediaan alat (saat barang kembali ke rak).
     * Parameter menggunakan `min` untuk berjaga agar tidak melewati stok total gudang.
     */
    private function incrementStocks(Loan $loan): void
    {
        $tools = Tool::query()
            ->whereIn('id', $loan->items->pluck('tool_id'))
            ->lockForUpdate()
            ->get()
            ->keyBy('id');

        foreach ($loan->items as $item) {
            $tool = $tools->get($item->tool_id);

            if (! $tool) {
                continue;
            }

            $tool->update([
                'stock_available' => min($tool->stock_total, $tool->stock_available + $item->quantity),
            ]);
        }
    }
}
