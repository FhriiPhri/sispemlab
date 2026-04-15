<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Loan;
use App\Models\LoanItem;
use App\Models\Tool;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class EquipmentLoanSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $admin = User::query()->updateOrCreate(
            ['email' => 'admin@alatkampus.test'],
            [
                'name' => 'Admin Laboratorium',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'email_verified_at' => now(),
            ],
        );

        $petugas = User::query()->updateOrCreate(
            ['email' => 'petugas@alatkampus.test'],
            [
                'name' => 'Petugas Sarpras',
                'password' => Hash::make('password'),
                'role' => 'petugas',
                'email_verified_at' => now(),
            ],
        );

        $peminjam = User::query()->updateOrCreate(
            ['email' => 'peminjam@alatkampus.test'],
            [
                'name' => 'Mahasiswa Peminjam',
                'password' => Hash::make('password'),
                'role' => 'peminjam',
                'email_verified_at' => now(),
            ],
        );

        // $categories = collect([
        //     ['name' => 'Audio Visual', 'description' => 'Perangkat presentasi dan dokumentasi kegiatan.'],
        //     ['name' => 'Elektronik', 'description' => 'Perangkat pendukung praktikum dan troubleshooting.'],
        //     ['name' => 'Jaringan', 'description' => 'Alat dan komponen untuk setup jaringan lokal.'],
        // ])->mapWithKeys(function (array $category): array {
        //     $record = Category::query()->updateOrCreate(
        //         ['slug' => Str::slug($category['name'])],
        //         $category + ['slug' => Str::slug($category['name'])],
        //     );

        //     return [$record->slug => $record];
        // });

        // $tools = collect([
        //     [
        //         'category' => 'audio-visual',
        //         'code' => 'AV-001',
        //         'name' => 'Proyektor Epson EB-X06',
        //         'brand' => 'Epson',
        //         'serial_number' => 'EPX06-2026-01',
        //         'condition_status' => 'baik',
        //         'location' => 'Lab Multimedia',
        //         'stock_total' => 4,
        //         'stock_available' => 2,
        //         'description' => 'Digunakan untuk presentasi kelas dan seminar.',
        //     ],
        //     [
        //         'category' => 'audio-visual',
        //         'code' => 'AV-002',
        //         'name' => 'Kamera Sony Handycam',
        //         'brand' => 'Sony',
        //         'serial_number' => 'SNY-HC-08',
        //         'condition_status' => 'baik',
        //         'location' => 'Ruang Inventaris',
        //         'stock_total' => 3,
        //         'stock_available' => 1,
        //         'description' => 'Dokumentasi kegiatan mahasiswa dan kebutuhan konten.',
        //     ],
        //     [
        //         'category' => 'elektronik',
        //         'code' => 'EL-015',
        //         'name' => 'Multimeter Digital',
        //         'brand' => 'Sanwa',
        //         'serial_number' => 'SNW-2215',
        //         'condition_status' => 'baik',
        //         'location' => 'Lab Hardware',
        //         'stock_total' => 12,
        //         'stock_available' => 9,
        //         'description' => 'Pemeriksaan arus, tegangan, dan resistansi.',
        //     ],
        //     [
        //         'category' => 'jaringan',
        //         'code' => 'NW-021',
        //         'name' => 'Crimping Tool RJ45',
        //         'brand' => 'Proskit',
        //         'serial_number' => 'PSK-CR-21',
        //         'condition_status' => 'perlu-servis',
        //         'location' => 'Lab Jaringan',
        //         'stock_total' => 6,
        //         'stock_available' => 2,
        //         'description' => 'Peralatan praktikum terminasi kabel jaringan.',
        //     ],
        // ])->mapWithKeys(function (array $tool) use ($categories): array {
        //     $record = Tool::query()->updateOrCreate(
        //         ['code' => $tool['code']],
        //         [
        //             'category_id' => $categories[$tool['category']]->id,
        //             'name' => $tool['name'],
        //             'brand' => $tool['brand'],
        //             'serial_number' => $tool['serial_number'],
        //             'condition_status' => $tool['condition_status'],
        //             'location' => $tool['location'],
        //             'stock_total' => $tool['stock_total'],
        //             'stock_available' => $tool['stock_available'],
        //             'description' => $tool['description'],
        //         ],
        //     );

        //     return [$record->code => $record];
        // });

        // $loans = [
        //     [
        //         'borrower_name' => 'BEM Fakultas Teknik',
        //         'borrower_identifier' => 'ORG-FT-01',
        //         'borrower_phone' => '081234567890',
        //         'purpose' => 'Presentasi proposal kegiatan mahasiswa',
        //         'loan_date' => Carbon::today()->subDays(1),
        //         'return_due_date' => Carbon::today()->addDays(2),
        //         'status' => 'borrowed',
        //         'notes' => 'Perlu pengecekan kabel HDMI saat pengembalian.',
        //         'items' => [
        //             ['code' => 'AV-001', 'quantity' => 1, 'condition_out' => 'baik'],
        //         ],
        //     ],
        //     [
        //         'borrower_name' => 'Laboratorium Embedded',
        //         'borrower_identifier' => 'LAB-EMB-02',
        //         'borrower_phone' => '081211223344',
        //         'purpose' => 'Praktikum pengukuran tegangan dan arus',
        //         'loan_date' => Carbon::today(),
        //         'return_due_date' => Carbon::today()->addDays(5),
        //         'status' => 'approved',
        //         'notes' => 'Menunggu pengambilan alat oleh asisten lab.',
        //         'items' => [
        //             ['code' => 'EL-015', 'quantity' => 3, 'condition_out' => 'baik'],
        //         ],
        //     ],
        //     [
        //         'borrower_name' => 'Tim Dokumentasi Wisuda',
        //         'borrower_identifier' => 'DOC-2026-03',
        //         'borrower_phone' => '089876543210',
        //         'purpose' => 'Perekaman acara wisuda periode genap',
        //         'loan_date' => Carbon::today()->addDay(),
        //         'return_due_date' => Carbon::today()->addDays(4),
        //         'status' => 'pending',
        //         'notes' => 'Butuh persetujuan koordinator sarpras.',
        //         'items' => [
        //             ['code' => 'AV-002', 'quantity' => 1, 'condition_out' => 'baik'],
        //         ],
        //     ],
        // ];

        // foreach ($loans as $loanData) {
        //     $loan = Loan::query()->updateOrCreate(
        //         [
        //             'borrower_name' => $loanData['borrower_name'],
        //             'purpose' => $loanData['purpose'],
        //         ],
        //         [
        //             'user_id' => $peminjam->id,
        //             'borrower_identifier' => $loanData['borrower_identifier'],
        //             'borrower_phone' => $loanData['borrower_phone'],
        //             'loan_date' => $loanData['loan_date'],
        //             'return_due_date' => $loanData['return_due_date'],
        //             'status' => $loanData['status'],
        //             'notes' => $loanData['notes'],
        //             'returned_at' => $loanData['status'] === 'returned' ? now() : null,
        //         ],
        //     );

        //     foreach ($loanData['items'] as $item) {
        //         LoanItem::query()->updateOrCreate(
        //             [
        //                 'loan_id' => $loan->id,
        //                 'tool_id' => $tools[$item['code']]->id,
        //             ],
        //             [
        //                 'quantity' => $item['quantity'],
        //                 'condition_out' => $item['condition_out'],
        //             ],
        //         );
        //     }
        // }
    }
}
