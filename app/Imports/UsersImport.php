<?php

namespace App\Imports;

use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Hash;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithCalculatedFormulas;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

/**
 * Import data pengguna dari file Excel.
 *
 * Kolom yang diperlukan (sesuai template):
 *  nama | email | password | role | nis_nip | no_hp | kelas | jurusan
 *
 * - email harus unik. Jika sudah ada, baris dilewati (error).
 * - password: jika kosong, default ke "password".
 * - role: peminjam / petugas / admin (default: peminjam).
 */
class UsersImport implements SkipsEmptyRows, ToCollection, WithCalculatedFormulas, WithHeadingRow
{
    public array $errors = [];

    public int $imported = 0;

    public int $updated = 0;

    private const VALID_ROLES = ['peminjam', 'petugas', 'admin'];

    public function collection(Collection $rows): void
    {
        foreach ($rows as $index => $row) {
            $rowNum = $index + 2; // +2 karena row 1 = heading

            $name = trim((string) ($row['nama'] ?? $row['name'] ?? $row[0] ?? ''));
            $email = strtolower(trim((string) ($row['email'] ?? $row[1] ?? '')));

            if ($name === '' || $email === '') {
                $this->errors[] = "Baris {$rowNum}: Kolom 'nama' dan 'email' wajib diisi.";

                continue;
            }

            if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $this->errors[] = "Baris {$rowNum}: Format email '{$email}' tidak valid.";

                continue;
            }

            // Ambil role, validasi, default ke peminjam
            $roleInput = strtolower(trim((string) ($row['role'] ?? $row[3] ?? 'peminjam')));
            $role = in_array($roleInput, self::VALID_ROLES) ? $roleInput : 'peminjam';

            // Password: default ke "password" jika kosong
            $passwordRaw = trim((string) ($row['password'] ?? $row[2] ?? ''));
            $password = $passwordRaw !== '' ? $passwordRaw : 'password';

            $identifier = trim((string) ($row['nis_nip'] ?? $row['nisnip'] ?? $row['identifier'] ?? $row[4] ?? '')) ?: null;
            $phone = trim((string) ($row['no_hp'] ?? $row['nohp'] ?? $row['phone'] ?? $row[5] ?? '')) ?: null;
            $class = trim((string) ($row['kelas'] ?? $row['class'] ?? $row[6] ?? '')) ?: null;
            $major = trim((string) ($row['jurusan'] ?? $row['major'] ?? $row[7] ?? '')) ?: null;

            try {
                $exists = User::where('email', $email)->exists();

                if ($exists) {
                    // Update data (kecuali password jika kosong di Excel)
                    $updateData = [
                        'name' => $name,
                        'role' => $role,
                        'identifier' => $identifier,
                        'phone' => $phone,
                        'class' => $class,
                        'major' => $major,
                    ];
                    if ($passwordRaw !== '') {
                        $updateData['password'] = Hash::make($password);
                    }
                    User::where('email', $email)->update($updateData);
                    $this->updated++;
                } else {
                    User::create([
                        'name' => $name,
                        'email' => $email,
                        'password' => Hash::make($password),
                        'role' => $role,
                        'identifier' => $identifier,
                        'phone' => $phone,
                        'class' => $class,
                        'major' => $major,
                        'email_verified_at' => now(), // Auto-verify saat import
                    ]);
                    $this->imported++;
                }
            } catch (\Exception $e) {
                $this->errors[] = "Baris {$rowNum} (email: {$email}): ".$e->getMessage();
            }
        }
    }
}