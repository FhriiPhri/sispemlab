<?php

namespace App\Exports\Sheets;

use App\Models\ToolReturn;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ReturnsSheet implements FromCollection, WithHeadings, WithMapping, WithTitle, ShouldAutoSize, WithStyles
{
    public function __construct(
        private string $start,
        private string $end
    ) {}

    public function title(): string { return 'Data Pengembalian'; }

    public function collection()
    {
        return ToolReturn::with(['loan', 'processedBy'])
            ->whereBetween('return_date', [$this->start, $this->end])
            ->orderBy('return_date')
            ->get();
    }

    public function headings(): array
    {
        return ['No', 'Kode Pinjam', 'Nama Peminjam', 'Tgl Kembali', 'Denda Telat (Rp)', 'Denda Kerusakan (Rp)', 'Total Denda (Rp)', 'Status Bayar', 'Catatan Kondisi', 'Diproses Oleh'];
    }

    public function map($ret): array
    {
        static $no = 0;
        $no++;

        $totalFine = ($ret->fine ?? 0) + ($ret->damage_fine ?? 0);

        return [
            $no,
            $ret->loan?->loan_code ?? '-',
            $ret->loan?->borrower_name ?? '-',
            $ret->return_date ?? '-',
            number_format($ret->fine ?? 0, 0, ',', '.'),
            number_format($ret->damage_fine ?? 0, 0, ',', '.'),
            number_format($totalFine, 0, ',', '.'),
            $ret->payment_status === 'paid' ? 'Lunas' : 'Belum Lunas',
            $ret->condition_note ?? '-',
            $ret->processedBy?->name ?? '-',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font'      => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '059669']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ],
        ];
    }
}
