<?php

namespace App\Exports\Sheets;

use App\Models\Tool;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ToolsSheet implements FromCollection, WithHeadings, WithMapping, WithTitle, ShouldAutoSize, WithStyles
{
    public function title(): string { return 'Data Alat'; }

    public function collection()
    {
        return Tool::with('category')->orderBy('name')->get();
    }

    public function headings(): array
    {
        return ['No', 'Kode', 'Nama Alat', 'Kategori', 'Merk', 'No Seri', 'Kondisi', 'Lokasi', 'Stok Total', 'Stok Tersedia', 'Harga (Rp)', 'Deskripsi'];
    }

    public function map($tool): array
    {
        static $no = 0;
        $no++;

        return [
            $no,
            $tool->code,
            $tool->name,
            $tool->category?->name ?? '-',
            $tool->brand ?? '-',
            $tool->serial_number ?? '-',
            match($tool->condition_status) {
                'baik'        => 'Baik',
                'perlu-servis' => 'Perlu Servis',
                'rusak-ringan' => 'Rusak Ringan',
                'rusak-berat' => 'Rusak Berat',
                default       => ucfirst($tool->condition_status),
            },
            $tool->location ?? '-',
            $tool->stock_total,
            $tool->stock_available,
            number_format($tool->price ?? 0, 0, ',', '.'),
            $tool->description ?? '-',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font'      => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'EF4444']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ],
        ];
    }
}
