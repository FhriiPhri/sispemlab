<?php

namespace App\Imports;

use App\Models\Category;
use App\Models\Tool;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithCalculatedFormulas;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

/**
 * Import data alat dari file Excel.
 *
 * Kolom yang diperlukan (sesuai template):
 *  kode | nama_alat | kategori | merk | no_seri | kondisi | lokasi | stok_total | stok_tersedia | harga | deskripsi
 *
 * WithHeadingRow akan meng-normalisasi header menjadi slug:
 *  "kode" -> "kode", "nama_alat" -> "nama_alat", dll.
 */
class ToolsImport implements SkipsEmptyRows, ToCollection, WithCalculatedFormulas, WithHeadingRow
{
    public array $errors = [];

    public int $imported = 0;

    public int $updated = 0;

    public function collection(Collection $rows): void
    {
        foreach ($rows as $index => $row) {
            $rowNum = $index + 2; // +2 karena row 1 = heading

            // Coba kedua kemungkinan format key (slug vs underscore)
            $code = trim((string) ($row['kode'] ?? $row[0] ?? ''));
            $name = trim((string) ($row['nama_alat'] ?? $row['namaalat'] ?? $row[1] ?? ''));

            if ($code === '' || $name === '') {
                $this->errors[] = "Baris {$rowNum}: Kolom 'kode' dan 'nama_alat' wajib diisi (ditemukan: kode='{$code}', nama='{$name}').";

                continue;
            }

            // Cari atau buat kategori otomatis
            $categoryName = trim((string) ($row['kategori'] ?? $row[2] ?? ''));
            $category = null;
            if ($categoryName !== '') {
                $baseSlug = Str::slug($categoryName);
                $slug = $baseSlug;
                $counter = 1;
                // Pastikan slug unik
                while (Category::where('slug', $slug)->exists()) {
                    $slug = $baseSlug.'-'.$counter++;
                }
                $category = Category::firstOrCreate(
                    ['name' => $categoryName],
                    ['slug' => $slug, 'description' => null]
                );
            }

            // Mapping kondisi
            $kondisiMap = [
                'baik' => 'baik',
                'perlu servis' => 'perlu-servis',
                'perlu_servis' => 'perlu-servis',
                'rusak ringan' => 'rusak-ringan',
                'rusak_ringan' => 'rusak-ringan',
                'rusak berat' => 'rusak-berat',
                'rusak_berat' => 'rusak-berat',
            ];
            $kondisiInput = strtolower(trim((string) ($row['kondisi'] ?? $row[5] ?? 'baik')));
            $kondisi = $kondisiMap[$kondisiInput] ?? 'baik';

            // Harga: hilangkan titik/koma/spasi formatting (Rp 1.000.000 -> 1000000)
            $hargaRaw = (string) ($row['harga'] ?? $row[9] ?? 0);
            $harga = (float) preg_replace('/[^0-9]/', '', $hargaRaw);

            $stockTotal = (int) ($row['stok_total'] ?? $row['stoktotal'] ?? $row[7] ?? 1);
            $stockAvail = (int) ($row['stok_tersedia'] ?? $row['stoktesedia'] ?? $row['stoktersedia'] ?? $row[8] ?? $stockTotal);

            // Pastikan stock_available tidak melebihi stock_total
            if ($stockAvail > $stockTotal) {
                $stockAvail = $stockTotal;
            }

            try {
                $exists = Tool::where('code', $code)->exists();

                Tool::updateOrCreate(
                    ['code' => $code],
                    [
                        'name' => $name,
                        'category_id' => $category?->id,
                        'brand' => trim((string) ($row['merk'] ?? $row[3] ?? '')) ?: null,
                        'serial_number' => trim((string) ($row['no_seri'] ?? $row['noseri'] ?? $row[4] ?? '')) ?: null,
                        'condition_status' => $kondisi,
                        'location' => trim((string) ($row['lokasi'] ?? $row[6] ?? '')) ?: null,
                        'stock_total' => $stockTotal,
                        'stock_available' => $stockAvail,
                        'price' => $harga,
                        'description' => trim((string) ($row['deskripsi'] ?? $row[10] ?? '')) ?: null,
                    ],
                );

                $exists ? $this->updated++ : $this->imported++;
            } catch (\Exception $e) {
                $this->errors[] = "Baris {$rowNum} (kode: {$code}): ".$e->getMessage();
            }
        }
    }
}