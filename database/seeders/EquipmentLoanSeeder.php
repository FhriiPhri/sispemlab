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
        // 1. Seed Users (With Identifier and Phone)
        $admin = User::query()->updateOrCreate(
            ['email' => 'admin@smktarunabhakti.sch.id'],
            [
                'name' => 'Pak Budi (Koordinator Sarpras)',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'identifier' => '197508122005011001', // NIP
                'phone' => '081234567890',
                'email_verified_at' => now(),
            ],
        );

        $petugas = User::query()->updateOrCreate(
            ['email' => 'petugas@smktarunabhakti.sch.id'],
            [
                'name' => 'Siti Aminah (Staf Lab)',
                'password' => Hash::make('password'),
                'role' => 'petugas',
                'identifier' => '199001012020122002', // NIP
                'phone' => '085711223344',
                'email_verified_at' => now(),
            ],
        );

        $peminjam = User::query()->updateOrCreate(
            ['email' => 'peminjam@smktarunabhakti.sch.id'],
            [
                'name' => 'Rian Hidayat (Siswa TKJ)',
                'password' => Hash::make('password'),
                'role' => 'peminjam',
                'identifier' => '222310155', // NIS
                'phone' => '08987654321',
                'email_verified_at' => now(),
            ],
        );

        // 2. Seed Categories (SMK Labs)
        $categories = collect([
            ['name' => 'Lab RPL', 'description' => 'Peralatan pengembangan perangkat lunak dan gim.'],
            ['name' => 'Lab TKJ', 'description' => 'Peralatan infrastruktur jaringan dan server.'],
            ['name' => 'Lab Multimedia / DKV', 'description' => 'Peralatan desain grafis dan konten kreatif.'],
            ['name' => 'Lab Broadcasting', 'description' => 'Peralatan produksi video dan siaran televisi.'],
        ])->mapWithKeys(function (array $category): array {
            $record = Category::query()->updateOrCreate(
                ['slug' => Str::slug($category['name'])],
                $category + ['slug' => Str::slug($category['name'])],
            );

            return [$record->slug => $record];
        });

        // 3. Seed Tools (SMK Specific)
        $baseTools = [
            [
                'category' => 'lab-rpl',
                'prefix' => 'LP-RPL',
                'names'  => ['Laptop ASUS ROG', 'Macbook Pro', 'Pen Tablet Wacom', 'Monitor Dell 24"'],
                'brands' => ['ASUS', 'Apple', 'Wacom', 'Dell'],
                'prices' => [14500000, 28000000, 3500000, 3200000],
                'location' => 'Ruang Lab RPL 1',
            ],
            [
                'category' => 'lab-tkj',
                'prefix' => 'NW-TKJ',
                'names'  => ['Router Mikrotik RB951', 'Switch Cisco 24 Port', 'Crimping Tool Proskit', 'LAN Tester Digital'],
                'brands' => ['Mikrotik', 'Cisco', 'Proskit', 'Fluke'],
                'prices' => [850000, 4500000, 175000, 320000],
                'location' => 'Bengkel TKJ (Lantai 2)',
            ],
            [
                'category' => 'lab-multimedia-dkv',
                'prefix' => 'CAM-MM',
                'names'  => ['Kamera Canon EOS 80D', 'Sony Alpha A6400', 'Lensa Fix 50mm', 'Gimbal DJI Ronin'],
                'brands' => ['Canon', 'Sony', 'DJI'],
                'prices' => [12500000, 11000000, 2800000, 8500000],
                'location' => 'Studio DKV',
            ],
            [
                'category' => 'lab-broadcasting',
                'prefix' => 'BC-ST',
                'names'  => ['Kamera Studio Panasonic', 'Tripod Libec', 'Mixer Audio Yamaha', 'Wireless Mic Saramonic'],
                'brands' => ['Panasonic', 'Libec', 'Yamaha', 'Saramonic'],
                'prices' => [25000000, 3200000, 4750000, 1850000],
                'location' => 'Studio Broadcasting',
            ],
        ];

        $generatedTools = collect();
        $counter = 1;

        foreach ($baseTools as $base) {
            foreach ($base['names'] as $idx => $name) {
                $brand = $base['brands'][$idx] ?? $base['brands'][0];
                $code = $base['prefix'] . '-' . str_pad($counter, 3, '0', STR_PAD_LEFT);

                $generatedTools->push([
                    'category'         => $base['category'],
                    'code'             => $code,
                    'name'             => $name,
                    'brand'            => $brand,
                    'price'            => $base['prices'][$idx] ?? 0,
                    'serial_number'    => strtoupper(Str::random(10)),
                    'condition_status' => collect(['baik', 'rusak-ringan'])->random(),
                    'location'         => $base['location'],
                    'stock_total'      => rand(5, 15),
                    'stock_available'  => rand(2, 5),
                    'description'      => "Inventaris resmi {$base['category']} SMK Taruna Bhakti.",
                ]);
                $counter++;
            }
        }

        $toolsMap = $generatedTools->mapWithKeys(function (array $tool) use ($categories): array {
            $record = Tool::query()->updateOrCreate(
                ['code' => $tool['code']],
                [
                    'category_id'      => $categories[$tool['category']]->id,
                    'name'             => $tool['name'],
                    'brand'            => $tool['brand'],
                    'price'            => $tool['price'],
                    'serial_number'    => $tool['serial_number'],
                    'condition_status' => $tool['condition_status'],
                    'location'         => $tool['location'],
                    'stock_total'      => $tool['stock_total'],
                    'stock_available'  => $tool['stock_available'],
                    'description'      => $tool['description'],
                ],
            );

            return [$record->code => $record];
        });

// 4. Seed Loans (Disesuaikan dengan real-time 23 April 2026)
$loans = [
    [
        'borrower_name' => $peminjam->name,
        'borrower_identifier' => $peminjam->identifier,
        'borrower_phone' => $peminjam->phone,
        'purpose' => 'Test Denda UKK Jaringan',
        // Pinjam 3 hari yang lalu (20 April 2026)
        'loan_date' => Carbon::create(2026, 4, 20), 
        // Deadline 1 hari yang lalu (22 April 2026)
        'return_due_date' => Carbon::create(2026, 4, 22), 
        'status' => 'borrowed', 
        'notes' => 'Harusnya balik kemarin, tes denda 1 hari.',
        'items' => [
            ['code' => 'NW-TKJ-005', 'quantity' => 1, 'condition_out' => 'baik'],
        ],
    ],
    [
        'borrower_name' => 'Ekstra Sinematografi',
        'borrower_identifier' => 'EKS-001',
        'borrower_phone' => '08123456789',
        'purpose' => 'Test Denda Telat Parah',
        // Pinjam tanggal 15 April
        'loan_date' => Carbon::create(2026, 4, 15),
        // Deadline tanggal 18 April
        'return_due_date' => Carbon::create(2026, 4, 18),
        'status' => 'borrowed',
        'notes' => 'Sudah telat sekitar 5 hari.',
        'items' => [
            ['code' => 'CAM-MM-009', 'quantity' => 1, 'condition_out' => 'baik'],
        ],
    ],
];        foreach ($loans as $loanData) {
            $loan = Loan::query()->updateOrCreate(
                [
                    'borrower_name' => $loanData['borrower_name'],
                    'purpose' => $loanData['purpose'],
                ],
                [
                    'user_id' => $peminjam->id,
                    'borrower_identifier' => $loanData['borrower_identifier'],
                    'borrower_phone' => $loanData['borrower_phone'],
                    'loan_date' => $loanData['loan_date'],
                    'return_due_date' => $loanData['return_due_date'],
                    'status' => $loanData['status'],
                    'notes' => $loanData['notes'],
                    'returned_at' => $loanData['status'] === 'returned' ? now() : null,
                ],
            );

            foreach ($loanData['items'] as $item) {
                if (isset($toolsMap[$item['code']])) {
                    LoanItem::query()->updateOrCreate(
                        [
                            'loan_id' => $loan->id,
                            'tool_id' => $toolsMap[$item['code']]->id,
                        ],
                        [
                            'quantity' => $item['quantity'],
                            'condition_out' => $item['condition_out'],
                        ],
                    );
                }
            }
        }
    }
}