<?php

namespace App\Http\Controllers;

use App\Imports\CategoriesImport;
use App\Imports\ToolsImport;
use App\Imports\UsersImport;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Facades\Excel;
use Maatwebsite\Excel\Validators\ValidationException;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ImportController extends Controller
{
    // ─────────────────────────────────────────────────────────────
    // TOOLS
    // ─────────────────────────────────────────────────────────────

    /**
     * Download template Excel kosong untuk import data alat.
     */
    public function templateTools()
    {
        $export = new class implements FromArray, ShouldAutoSize, WithHeadings, WithStyles, WithTitle
        {
            public function title(): string
            {
                return 'Template Import Alat';
            }

            public function headings(): array
            {
                return [
                    'kode', 'nama_alat', 'kategori', 'merk', 'no_seri',
                    'kondisi', 'lokasi', 'stok_total', 'stok_tersedia', 'harga', 'deskripsi',
                ];
            }

            public function array(): array
            {
                return [[
                    'TKJ-001', 'Cisco Packet Tracer Router', 'Jaringan', 'Cisco', 'SN-ABC123',
                    'Baik', 'Lab TKJ', 10, 8, 2500000, 'Router untuk praktik jaringan',
                ]];
            }

            public function styles(Worksheet $sheet): array
            {
                $sheet->getStyle('A1:K1')->applyFromArray([
                    'font'      => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                    'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '2563EB']],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                ]);
                $sheet->getStyle('A2:K2')->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'DBEAFE']],
                ]);
                $sheet->getComment('F1')->getText()->createTextRun(
                    'Isi dengan: Baik / Perlu Servis / Rusak Ringan / Rusak Berat'
                );

                return [];
            }
        };

        return Excel::download($this->wrapSheet($export), 'Template Import Alat.xlsx');
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

        $import = new ToolsImport;

        try {
            Excel::import($import, $request->file('file'));
        } catch (ValidationException $e) {
            $msg = collect($e->failures())
                ->map(fn ($f) => "Baris {$f->row()}: ".implode(', ', $f->errors()))
                ->take(5)->implode(' | ');

            return back()->withErrors(['file' => 'Validasi gagal: '.$msg]);
        } catch (\Exception $e) {
            return back()->withErrors(['file' => 'Gagal membaca file: '.$e->getMessage()]);
        }

        ActivityLog::record(
            'Import Tools',
            sprintf('%d alat ditambahkan, %d diperbarui%s',
                $import->imported,
                $import->updated,
                count($import->errors) > 0 ? ', '.count($import->errors).' baris gagal' : ''
            )
        );

        if ($import->imported === 0 && $import->updated === 0) {
            $hint = count($import->errors) > 0
                ? implode(' | ', array_slice($import->errors, 0, 3))
                : 'Tidak ada data valid. Pastikan header kolom sesuai template (kode, nama_alat, dll).';

            return back()->withErrors(['file' => $hint]);
        }

        $message = sprintf('%d alat berhasil ditambahkan, %d alat diperbarui.', $import->imported, $import->updated);

        if (count($import->errors) > 0) {
            session()->flash('success', $message);
            session()->flash('warning', 'Beberapa baris dilewati: '.implode(' | ', array_slice($import->errors, 0, 3)));

            return back();
        }

        session()->flash('success', $message);

        return back();
    }

    // ─────────────────────────────────────────────────────────────
    // USERS
    // ─────────────────────────────────────────────────────────────

    /**
     * Download template Excel untuk import data pengguna.
     */
    public function templateUsers()
    {
        $export = new class implements FromArray, ShouldAutoSize, WithHeadings, WithStyles, WithTitle
        {
            public function title(): string
            {
                return 'Template Import User';
            }

            public function headings(): array
            {
                return ['nama', 'email', 'password', 'role', 'nis_nip', 'no_hp', 'kelas', 'jurusan'];
            }

            public function array(): array
            {
                return [
                    ['Budi Santoso', 'budi@smktb.sch.id', 'password123', 'peminjam', '12345678', '081234567890', 'XII RPL 1', 'Rekayasa Perangkat Lunak'],
                    ['Siti Rahayu', 'siti@smktb.sch.id', 'password123', 'peminjam', '87654321', '089876543210', 'XI TKJ 2', 'Teknik Komputer Jaringan'],
                    ['Ahmad Petugas', 'ahmad@smktb.sch.id', 'password123', 'petugas', '', '081111111111', '', ''],
                ];
            }

            public function styles(Worksheet $sheet): array
            {
                // Header biru
                $sheet->getStyle('A1:H1')->applyFromArray([
                    'font'      => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                    'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '059669']],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                ]);
                // Baris contoh warna berbeda
                $sheet->getStyle('A2:H4')->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'D1FAE5']],
                ]);
                // Komentar panduan role
                $sheet->getComment('D1')->getText()->createTextRun(
                    'Isi dengan: peminjam / petugas / admin'
                );
                // Komentar password
                $sheet->getComment('C1')->getText()->createTextRun(
                    'Kosongkan untuk memakai password default: "password"'
                );

                return [];
            }
        };

        return Excel::download($this->wrapSheet($export), 'Template Import User.xlsx');
    }

    /**
     * Proses upload dan import file Excel data pengguna.
     */
    public function importUsers(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:5120',
        ], [
            'file.required' => 'File Excel wajib diunggah.',
            'file.mimes'    => 'Format file harus .xlsx, .xls, atau .csv.',
            'file.max'      => 'Ukuran file maksimal 5 MB.',
        ]);

        $import = new UsersImport;

        try {
            Excel::import($import, $request->file('file'));
        } catch (ValidationException $e) {
            $msg = collect($e->failures())
                ->map(fn ($f) => "Baris {$f->row()}: ".implode(', ', $f->errors()))
                ->take(5)->implode(' | ');

            return back()->withErrors(['file' => 'Validasi gagal: '.$msg]);
        } catch (\Exception $e) {
            return back()->withErrors(['file' => 'Gagal membaca file: '.$e->getMessage()]);
        }

        ActivityLog::record(
            'Import Users',
            sprintf('%d user ditambahkan, %d diperbarui%s',
                $import->imported,
                $import->updated,
                count($import->errors) > 0 ? ', '.count($import->errors).' baris gagal' : ''
            )
        );

        if ($import->imported === 0 && $import->updated === 0) {
            $hint = count($import->errors) > 0
                ? implode(' | ', array_slice($import->errors, 0, 3))
                : 'Tidak ada data valid. Pastikan header kolom sesuai template (nama, email, dll).';

            return back()->withErrors(['file' => $hint]);
        }

        $message = sprintf('%d user berhasil ditambahkan, %d user diperbarui.', $import->imported, $import->updated);

        if (count($import->errors) > 0) {
            session()->flash('success', $message);
            session()->flash('warning', 'Beberapa baris dilewati: '.implode(' | ', array_slice($import->errors, 0, 3)));

            return back();
        }

        session()->flash('success', $message);

        return back();
    }

    // ─────────────────────────────────────────────────────────────
    // CATEGORIES
    // ─────────────────────────────────────────────────────────────

    /**
     * Download template Excel untuk import data kategori.
     */
    public function templateCategories()
    {
        $export = new class implements FromArray, ShouldAutoSize, WithHeadings, WithStyles, WithTitle
        {
            public function title(): string
            {
                return 'Template Import Kategori';
            }

            public function headings(): array
            {
                return ['nama_kategori', 'deskripsi'];
            }

            public function array(): array
            {
                return [
                    ['Jaringan', 'Peralatan laboratorium jaringan komputer'],
                    ['Multimedia', 'Peralatan laboratorium multimedia dan desain'],
                    ['Listrik', 'Peralatan praktikum instalasi listrik'],
                ];
            }

            public function styles(Worksheet $sheet): array
            {
                $sheet->getStyle('A1:B1')->applyFromArray([
                    'font'      => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                    'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '7C3AED']],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                ]);
                $sheet->getStyle('A2:B4')->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'EDE9FE']],
                ]);
                $sheet->getComment('A1')->getText()->createTextRun(
                    'Nama kategori harus unik. Jika sudah ada, hanya deskripsi yang diperbarui.'
                );

                return [];
            }
        };

        return Excel::download($this->wrapSheet($export), 'Template Import Kategori.xlsx');
    }

    /**
     * Proses upload dan import file Excel data kategori.
     */
    public function importCategories(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:5120',
        ], [
            'file.required' => 'File Excel wajib diunggah.',
            'file.mimes'    => 'Format file harus .xlsx, .xls, atau .csv.',
            'file.max'      => 'Ukuran file maksimal 5 MB.',
        ]);

        $import = new CategoriesImport;

        try {
            Excel::import($import, $request->file('file'));
        } catch (ValidationException $e) {
            $msg = collect($e->failures())
                ->map(fn ($f) => "Baris {$f->row()}: ".implode(', ', $f->errors()))
                ->take(5)->implode(' | ');

            return back()->withErrors(['file' => 'Validasi gagal: '.$msg]);
        } catch (\Exception $e) {
            return back()->withErrors(['file' => 'Gagal membaca file: '.$e->getMessage()]);
        }

        ActivityLog::record(
            'Import Categories',
            sprintf('%d kategori ditambahkan, %d diperbarui%s',
                $import->imported,
                $import->updated,
                count($import->errors) > 0 ? ', '.count($import->errors).' baris gagal' : ''
            )
        );

        if ($import->imported === 0 && $import->updated === 0) {
            $hint = count($import->errors) > 0
                ? implode(' | ', array_slice($import->errors, 0, 3))
                : 'Tidak ada data valid. Pastikan header kolom sesuai template (nama_kategori, deskripsi).';

            return back()->withErrors(['file' => $hint]);
        }

        $message = sprintf('%d kategori berhasil ditambahkan, %d kategori diperbarui.', $import->imported, $import->updated);

        if (count($import->errors) > 0) {
            session()->flash('success', $message);
            session()->flash('warning', 'Beberapa baris dilewati: '.implode(' | ', array_slice($import->errors, 0, 3)));

            return back();
        }

        session()->flash('success', $message);

        return back();
    }

    // ─────────────────────────────────────────────────────────────
    // HELPER
    // ─────────────────────────────────────────────────────────────

    /** Bungkus single sheet dalam WithMultipleSheets wrapper. */
    private function wrapSheet($sheet): WithMultipleSheets
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