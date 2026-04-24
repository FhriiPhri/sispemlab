<?php

namespace App\Http\Controllers;

use App\Exports\AllDataExport;
use App\Exports\Sheets\ActivityLogsSheet;
use App\Exports\Sheets\CategoriesSheet;
use App\Exports\Sheets\LoansSheet;
use App\Exports\Sheets\ReturnsSheet;
use App\Exports\Sheets\ToolsSheet;
use App\Exports\Sheets\UsersSheet;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Maatwebsite\Excel\Facades\Excel;

/**
 * ExportController: Export data ke file .xlsx multi-sheet menggunakan Laravel Excel.
 */
class ExportController extends Controller
{
    public function export(Request $request)
    {
        $type = $request->validate([
            'type' => 'required|in:peminjaman,pengembalian,semua,user,kategori,alat,log',
        ])['type'];

        $needsDate = in_array($type, ['peminjaman', 'pengembalian', 'semua']);

        if ($needsDate) {
            $request->validate([
                'start_date' => 'required|date',
                'end_date' => 'required|date|after_or_equal:start_date',
            ]);
        }

        $start = ($request->start_date ?? now()->startOfMonth()->toDateString()).' 00:00:00';
        $end = ($request->end_date ?? now()->endOfMonth()->toDateString()).' 23:59:59';

        [$export, $filename] = match ($type) {
            'peminjaman' => [$this->single(new LoansSheet($start, $end)),   'Laporan Peminjaman.xlsx'],
            'pengembalian' => [$this->single(new ReturnsSheet($start, $end)),  'Laporan Pengembalian.xlsx'],
            'semua' => [new AllDataExport($start, $end),                'Laporan Semua Data.xlsx'],
            'user' => [$this->single(new UsersSheet),                'Data User.xlsx'],
            'kategori' => [$this->single(new CategoriesSheet),           'Data Kategori.xlsx'],
            'alat' => [$this->single(new ToolsSheet),                'Data Alat.xlsx'],
            'log' => [$this->single(new ActivityLogsSheet),         'Log Aktivitas.xlsx'],
        };

        return Excel::download($export, $filename);
    }

    /**
     * Bungkus single sheet menjadi object yang kompatibel dengan Excel::download
     */
    private function single($sheet): WithMultipleSheets
    {
        return new class($sheet) implements WithMultipleSheets
        {
            public function __construct(private $sheet) {}

            public function sheets(): array
            {
                return [$this->sheet];
            }
        };
    }
}