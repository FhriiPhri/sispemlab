<?php

namespace App\Imports;

use App\Models\Category;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithCalculatedFormulas;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

/**
 * Import data kategori dari file Excel.
 *
 * Kolom yang diperlukan (sesuai template):
 *  nama_kategori | deskripsi
 *
 * - nama_kategori harus unik. Jika sudah ada, akan di-update deskripsinya.
 * - slug dibuat otomatis dari nama_kategori dan dipastikan unik.
 */
class CategoriesImport implements SkipsEmptyRows, ToCollection, WithCalculatedFormulas, WithHeadingRow
{
    public array $errors = [];

    public int $imported = 0;

    public int $updated = 0;

    public function collection(Collection $rows): void
    {
        foreach ($rows as $index => $row) {
            $rowNum = $index + 2; // +2 karena row 1 = heading

            $name = trim((string) ($row['nama_kategori'] ?? $row['namakategori'] ?? $row['nama'] ?? $row[0] ?? ''));

            if ($name === '') {
                $this->errors[] = "Baris {$rowNum}: Kolom 'nama_kategori' wajib diisi.";

                continue;
            }

            $description = trim((string) ($row['deskripsi'] ?? $row['description'] ?? $row[1] ?? '')) ?: null;

            try {
                $existing = Category::where('name', $name)->first();

                if ($existing) {
                    // Update hanya deskripsi jika nama sudah ada
                    $existing->update(['description' => $description]);
                    $this->updated++;
                } else {
                    // Buat slug unik
                    $baseSlug = Str::slug($name);
                    $slug = $baseSlug;
                    $counter = 1;
                    while (Category::where('slug', $slug)->exists()) {
                        $slug = $baseSlug.'-'.$counter++;
                    }

                    Category::create([
                        'name' => $name,
                        'slug' => $slug,
                        'description' => $description,
                    ]);
                    $this->imported++;
                }
            } catch (\Exception $e) {
                $this->errors[] = "Baris {$rowNum} (nama: {$name}): ".$e->getMessage();
            }
        }
    }
}