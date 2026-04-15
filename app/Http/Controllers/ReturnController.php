<?php

namespace App\Http\Controllers;

use App\Models\Loan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Penghubung logika prosedur Pengembalian Alat.
 * Merupakan pintu antarmuka antara Laravel dan Stored Procedure di MySQL
 * untuk meringankan beban backend.
 */
class ReturnController extends Controller
{
    /**
     * Mengeksekusi penerimaan kembali alat dari peminjam.
     * Mengkalkulasi denda secara native dengan memanggil Stored Procedure MySQL `process_return`.
     * Menjamin kecepatan eksekusi tinggi tanpa looping manual pakai PHP.
     */
    public function store(Request $request)
    {
        $request->validate([
            'loan_id' => 'required|exists:loans,id',
            'condition_note' => 'nullable|string',
            'return_date' => 'required|date',
        ]);

        $loan = Loan::findOrFail($request->loan_id);
        
        if ($loan->status === 'returned') {
            return back()->with('error', 'Peminjaman ini sudah dikembalikan.');
        }

        try {
            DB::statement('CALL process_return(?, ?, ?, ?)', [
                $loan->id,
                auth()->id(),
                $request->return_date,
                $request->condition_note ?? ''
            ]);

            return back()->with('success', 'Pengembalian berhasil diproses dengan denda (jika ada).');
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal memproses pengembalian: ' . $e->getMessage());
        }
    }
}
