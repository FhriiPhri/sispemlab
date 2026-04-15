<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Loan;
use App\Models\ToolReturn;

/**
 * Controller untuk mengekstrak dan menyajikan Laporan.
 * Merangkum riwayat peminjaman dan pengembalian dalam bentuk antarmuka web dan format siap cetak PDF/Kertas.
 */
class ReportController extends Controller
{
    /**
     * Menampilkan antarmuka pemilihan parameter Laporan.
     */
    public function index()
    {
        return inertia('reports/index');
    }

    /**
     * Generator dokumen laporan cetak.
     * Menerima interval tanggal dan tipe pemfilteran (Peminjaman / Pengembalian / Semua).
     * Melindungi dari serangan `Query N+1` dengan mendefinisikan `with` pada *closure* data sebelum diparse.
     *
     * @param Request $request
     * @return \Inertia\Response
     */
    public function print(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'type' => 'required|in:peminjaman,pengembalian,semua',
        ]);

        $start = $request->start_date . ' 00:00:00';
        $end = $request->end_date . ' 23:59:59';
        $type = $request->type;

        $loans = [];
        $returns = [];

        if (in_array($type, ['peminjaman', 'semua'])) {
            $loans = Loan::with(['user', 'items.tool'])
                ->whereBetween('loan_date', [$start, $end])
                ->orderBy('loan_date', 'asc')
                ->get();
        }

        if (in_array($type, ['pengembalian', 'semua'])) {
            $returns = ToolReturn::with(['loan.user', 'loan.items.tool', 'processedBy'])
                ->whereBetween('return_date', [$start, $end])
                ->orderBy('return_date', 'asc')
                ->get();
        }

        return inertia('reports/print', [
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'type' => $type,
            'loans' => $loans,
            'returns' => $returns,
        ]);
    }
}
