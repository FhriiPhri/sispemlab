<?php

namespace App\Exports;

use App\Exports\Sheets\LoansSheet;
use App\Exports\Sheets\ReturnsSheet;
use App\Exports\Sheets\UsersSheet;
use App\Exports\Sheets\CategoriesSheet;
use App\Exports\Sheets\ToolsSheet;
use App\Exports\Sheets\ActivityLogsSheet;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

/**
 * Export "Semua Data" — sheet: Peminjaman, Pengembalian, User, Kategori, Alat, Log Aktivitas
 */
class AllDataExport implements WithMultipleSheets
{
    public function __construct(
        private string $start,
        private string $end
    ) {}

    public function sheets(): array
    {
        return [
            new LoansSheet($this->start, $this->end),
            new ReturnsSheet($this->start, $this->end),
            new UsersSheet(),
            new CategoriesSheet(),
            new ToolsSheet(),
            new ActivityLogsSheet(),
        ];
    }
}
