<?php

namespace App\Http\Controllers;

use App\Imports\ToolsImport;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ImportController extends Controller
{
    /**
     * Download template Excel kosong untuk import data alat.
     */
    public function template()
    {
        $export = new class implements FromArray, WithHeadings, ShouldAutoSize, WithStyles, WithTitle {
            public function title(): string { return 'Template Import Alat'; }

            public function headings(): array
            {
                return [
                    'kode', 'nama_alat', 'kategori', 'merk', 'no_seri',
                    'kondisi', 'lokasi', 'stok_total', 'stok_tersedia', 'harga', 'deskripsi',
                ];
            }

            public function array(): array
            {
                // Satu baris contoh
                return [[
                    'TKJ-001', 'Cisco Packet Tracer Router', 'Jaringan', 'Cisco', 'SN-ABC123',
                    'Baik', 'Lab TKJ', 10, 8, 2500000, 'Router untuk praktik jaringan',
                ]];
            }

            public function styles(Worksheet $sheet): array
            {
                // Styling header
                $sheet->getStyle('A1:K1')->applyFromArray([
                    'font'      => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                    'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '2563EB']],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                ]);

                // Baris contoh warna berbeda
                $sheet->getStyle('A2:K2')->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'DBEAFE']],
                ]);

                // Komentar panduan kondisi di kolom F
                $sheet->getComment('F1')->getText()->createTextRun(
                    'Isi dengan: Baik / Perlu Servis / Rusak Ringan / Rusak Berat'
                );

                return [];
            }
        };

        return Excel::download(new class($export) implements \Maatwebsite\Excel\Concerns\WithMultipleSheets {
            public function __construct(private $sheet) {}
            public function sheets(): array { return [$this->sheet]; }
        }, 'template_import_alat.xlsx');
    }

    /**
     * Proses upload dan import file Excel data alat.
     */
    public function importTools(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:5120',
        ], [
            'file.required' => 'File Excel wajib diunggah.',
            'file.mimes'    => 'Format file harus .xlsx, .xls, atau .csv.',
            'file.max'      => 'Ukuran file maksimal 5 MB.',
        ]);

        $import = new ToolsImport();

        try {
            Excel::import($import, $request->file('file'));
        } catch (\Maatwebsite\Excel\Validators\ValidationException $e) {
            $failures = $e->failures();
            $msg = collect($failures)->map(fn($f) => "Baris {$f->row()}: " . implode(', ', $f->errors()))->take(5)->implode(' | ');
            return back()->withErrors(['file' => 'Validasi gagal: ' . $msg]);
        } catch (\Exception $e) {
            return back()->withErrors(['file' => 'Gagal membaca file: ' . $e->getMessage()]);
        }

        // Log aktivitas
        \App\Models\ActivityLog::record(
            'Import Tools',
            sprintf('%d alat ditambahkan, %d diperbarui%s',
                $import->imported,
                $import->updated,
                count($import->errors) > 0 ? ', ' . count($import->errors) . ' baris gagal' : ''
            )
        );

        $message = sprintf(
            '%d alat berhasil ditambahkan, %d alat diperbarui.',
            $import->imported,
            $import->updated
        );

        // Jika 0 ditambahkan dan 0 diupdate, kemungkinan format salah
        if ($import->imported === 0 && $import->updated === 0) {
            $hint = count($import->errors) > 0
                ? implode(' | ', array_slice($import->errors, 0, 3))
                : 'Tidak ada data valid yang ditemukan. Pastikan header kolom sesuai template (kode, nama_alat, dll).';
            return back()->withErrors(['file' => $hint]);
        }

        if (count($import->errors) > 0) {
            session()->flash('success', $message);
            session()->flash('warning', 'Beberapa baris dilewati: ' . implode(' | ', array_slice($import->errors, 0, 3)));
            return back();
        }

        session()->flash('success', $message);
        return back();
    }
}
