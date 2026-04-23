<?php

namespace App\Exports\Sheets;

use App\Models\User;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class UsersSheet implements FromCollection, WithHeadings, WithMapping, WithTitle, ShouldAutoSize, WithStyles
{
    public function title(): string { return 'Data User'; }

    public function collection()
    {
        return User::orderBy('role')->orderBy('name')->get();
    }

    public function headings(): array
    {
        return ['No', 'Nama', 'Email', 'Peran', 'Identitas (NIS/NIP)', 'No HP', 'Kelas', 'Jurusan', 'Terdaftar Sejak'];
    }

    public function map($user): array
    {
        static $no = 0;
        $no++;

        return [
            $no,
            $user->name,
            $user->email,
            match($user->role) {
                'admin'    => 'Admin',
                'petugas'  => 'Petugas',
                'peminjam' => 'Peminjam',
                default    => ucfirst($user->role),
            },
            $user->identifier ?? '-',
            $user->phone ?? '-',
            $user->class ?? '-',
            $user->major ?? '-',
            $user->created_at?->format('d/m/Y') ?? '-',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font'      => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '0EA5E9']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ],
        ];
    }
}
