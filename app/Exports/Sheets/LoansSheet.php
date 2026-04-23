<?php

namespace App\Exports\Sheets;

use App\Models\Loan;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class LoansSheet implements FromCollection, WithHeadings, WithMapping, WithTitle, ShouldAutoSize, WithStyles
{
    public function __construct(
        private string $start,
        private string $end
    ) {}

    public function title(): string { return 'Data Peminjaman'; }

    public function collection()
    {
        return Loan::with(['user', 'items.tool'])
            ->whereBetween('loan_date', [$this->start, $this->end])
            ->orderBy('loan_date')
            ->get();
    }

    public function headings(): array
    {
        return ['No', 'Kode Pinjam', 'Nama Peminjam', 'Identitas', 'No HP', 'Keperluan', 'Tgl Pinjam', 'Batas Kembali', 'Status', 'Alat Dipinjam', 'Diajukan Oleh', 'Catatan'];
    }

    public function map($loan): array
    {
        static $no = 0;
        $no++;

        $items = $loan->items->map(fn ($i) => ($i->tool?->name ?? '?') . ' (x' . $i->quantity . ')')->implode(', ');

        return [
            $no,
            $loan->loan_code ?? '-',
            $loan->borrower_name,
            $loan->borrower_identifier ?? '-',
            $loan->borrower_phone ?? '-',
            $loan->purpose,
            optional($loan->loan_date)?->format('d/m/Y') ?? '-',
            optional($loan->return_due_date)?->format('d/m/Y') ?? '-',
            match($loan->status) {
                'pending'  => 'Menunggu',
                'approved' => 'Disetujui',
                'borrowed' => 'Dipinjam',
                'returned' => 'Dikembalikan',
                'rejected' => 'Ditolak',
                default    => ucfirst($loan->status),
            },
            $items,
            $loan->user?->name ?? 'Sistem',
            $loan->notes ?? '-',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font'      => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '4F46E5']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ],
        ];
    }
}
