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
            ['email' => 'admin@gmail.com'],
            [
                'name' => 'Etmin',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'identifier' => '197508122005011001', // NIP
                'phone' => '081234567890',
                'email_verified_at' => now(),
            ],
        );

        $petugas = User::query()->updateOrCreate(
            ['email' => 'petugas@gmail.com'],
            [
                'name' => 'Ibu Romlah',
                'password' => Hash::make('password'),
                'role' => 'petugas',
                'identifier' => '199001012020122002', // NIP
                'phone' => '085711223344',
                'email_verified_at' => now(),
            ],
        );

        $peminjam = User::query()->updateOrCreate(
            ['email' => 'peminjam@gmail.com'],
            [
                'name' => 'Iwan Irawan',
                'password' => Hash::make('password'),
                'role' => 'peminjam',
                'identifier' => '222310155', // NIS
                'phone' => '08123456789',
                'email_verified_at' => now(),
            ],
        );

        $peminjam = User::query()->updateOrCreate(
            ['email' => 'fahripadang050908@gmail.com'],
            [
                'name' => 'Muhammad Fahri Ramadhan',
                'password' => Hash::make('password'),
                'role' => 'peminjam',
                'identifier' => '222310154', // NIS
                'phone' => '081210672183',
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

        // 3. Seed Tools (SMK Specific) — with images from Unsplash
        // Image URL: pakai source.unsplash.com agar bisa didownload langsung
        $baseTools = [
            [
                'category' => 'lab-rpl',
                'prefix' => 'LP-RPL',
                'items' => [
                    ['name' => 'Laptop ASUS ROG',   'brand' => 'ASUS',  'price' => 14500000, 'img_query' => 'asus+rog+laptop'],
                    ['name' => 'Macbook Pro',        'brand' => 'Apple', 'price' => 28000000, 'img_query' => 'macbook+pro'],
                    ['name' => 'Pen Tablet Wacom',   'brand' => 'Wacom', 'price' => 3500000,  'img_query' => 'wacom+drawing+tablet'],
                    ['name' => 'Monitor Dell 24"',   'brand' => 'Dell',  'price' => 3200000,  'img_query' => 'dell+monitor'],
                ],
                'location' => 'Ruang Lab RPL 1',
            ],
            [
                'category' => 'lab-tkj',
                'prefix' => 'NW-TKJ',
                'items' => [
                    ['name' => 'Router Mikrotik RB951', 'brand' => 'Mikrotik', 'price' => 850000,  'img_query' => 'mikrotik+router'],
                    ['name' => 'Switch Cisco 24 Port',  'brand' => 'Cisco',    'price' => 4500000, 'img_query' => 'cisco+network+switch'],
                    ['name' => 'Crimping Tool Proskit', 'brand' => 'Proskit',  'price' => 175000,  'img_query' => 'crimping+tool+network'],
                    ['name' => 'LAN Tester Digital',    'brand' => 'Fluke',    'price' => 320000,  'img_query' => 'lan+cable+tester'],
                ],
                'location' => 'Bengkel TKJ (Lantai 2)',
            ],
            [
                'category' => 'lab-multimedia-dkv',
                'prefix' => 'CAM-MM',
                'items' => [
                    ['name' => 'Kamera Canon EOS 80D', 'brand' => 'Canon', 'price' => 12500000, 'img_query' => 'canon+dslr+camera'],
                    ['name' => 'Sony Alpha A6400',      'brand' => 'Sony',  'price' => 11000000, 'img_query' => 'sony+mirrorless+camera'],
                    ['name' => 'Lensa Fix 50mm',        'brand' => 'DJI',   'price' => 2800000,  'img_query' => 'camera+lens+50mm'],
                    ['name' => 'Gimbal DJI Ronin',      'brand' => 'DJI',   'price' => 8500000,  'img_query' => 'dji+gimbal+ronin'],
                ],
                'location' => 'Studio DKV',
            ],
            [
                'category' => 'lab-broadcasting',
                'prefix' => 'BC-ST',
                'items' => [
                    ['name' => 'Kamera Studio Panasonic', 'brand' => 'Panasonic', 'price' => 25000000, 'img_query' => 'studio+video+camera'],
                    ['name' => 'Tripod Libec',             'brand' => 'Libec',    'price' => 3200000,  'img_query' => 'camera+tripod'],
                    ['name' => 'Mixer Audio Yamaha',       'brand' => 'Yamaha',   'price' => 4750000,  'img_query' => 'yamaha+audio+mixer'],
                    ['name' => 'Wireless Mic Saramonic',   'brand' => 'Saramonic', 'price' => 1850000,  'img_query' => 'wireless+microphone'],
                ],
                'location' => 'Studio Broadcasting',
            ],
        ];

        // Pastikan folder storage ada
        $storagePath = storage_path('app/public/tools');
        if (! is_dir($storagePath)) {
            mkdir($storagePath, 0755, true);
        }

        $generatedTools = collect();
        $counter = 1;

        foreach ($baseTools as $base) {
            foreach ($base['items'] as $item) {
                $code = $base['prefix'].'-'.str_pad($counter, 3, '0', STR_PAD_LEFT);

                // Download gambar dari loremflickr.com (masih aktif, free, no API key)
                $imgFilename = null;
                try {
                    $imgUrl = 'https://loremflickr.com/400/300/'.urlencode(str_replace('+', ',', $item['img_query']));
                    $imgData = @file_get_contents($imgUrl, false, stream_context_create([
                        'http' => ['timeout' => 15, 'follow_location' => true],
                        'ssl' => ['verify_peer' => false],
                    ]));

                    if ($imgData !== false && strlen($imgData) > 1000) {
                        $imgFilename = 'tools/'.$code.'.jpg';
                        file_put_contents(storage_path('app/public/'.$imgFilename), $imgData);
                    }
                } catch (\Exception $e) {
                    // Gagal download → lanjut tanpa gambar
                }

                $generatedTools->push([
                    'category' => $base['category'],
                    'code' => $code,
                    'name' => $item['name'],
                    'brand' => $item['brand'],
                    'price' => $item['price'],
                    'image' => $imgFilename,
                    'serial_number' => strtoupper(Str::random(10)),
                    'condition_status' => collect(['baik', 'rusak-ringan'])->random(),
                    'location' => $base['location'],
                    'stock_total' => rand(5, 15),
                    'stock_available' => rand(2, 5),
                    'description' => "Inventaris resmi {$base['category']} SMK Taruna Bhakti.",
                ]);
                $counter++;
            }
        }

        $toolsMap = $generatedTools->mapWithKeys(function (array $tool) use ($categories): array {
            $record = Tool::query()->updateOrCreate(
                ['code' => $tool['code']],
                [
                    'category_id' => $categories[$tool['category']]->id,
                    'name' => $tool['name'],
                    'brand' => $tool['brand'],
                    'price' => $tool['price'],
                    'image' => $tool['image'],
                    'serial_number' => $tool['serial_number'],
                    'condition_status' => $tool['condition_status'],
                    'location' => $tool['location'],
                    'stock_total' => $tool['stock_total'],
                    'stock_available' => $tool['stock_available'],
                    'description' => $tool['description'],
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
        ];
        foreach ($loans as $loanData) {
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
