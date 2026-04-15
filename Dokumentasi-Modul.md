# Dokumentasi Modul — Aplikasi Peminjaman Alat Laboratorium

Dokumen ini merinci setiap modul utama aplikasi mengikuti format standar:
**Input → Proses → Output**, beserta fungsi, prosedur, dan method yang terlibat.

---

## MODUL 1: Authentication (Login & Logout)

### Input
| Field | Tipe Data | Keterangan |
|---|---|---|
| `email` | `string` | Email terdaftar pengguna |
| `password` | `string` | Kata sandi (hashed bcrypt) |
| `remember` | `boolean` | Opsi "ingat saya" |

### Proses
1. Laravel Fortify menerima request POST ke `/login`.
2. Mencocokkan email + password dengan tabel `users`.
3. Memverifikasi hash bcrypt menggunakan `Hash::check()`.
4. Jika valid: membuat sesi autentikasi dan mengisi `auth()->user()`.
5. Trigger `after_loan_insert` aktif setelah user terhubung ke peminjaman.

### Output
- **Berhasil**: Redirect ke `/dashboard`, session user aktif.
- **Gagal**: Redirect kembali ke `/login` dengan pesan error validasi.

### Method / Fungsi Terkait
| Method | Class | Keterangan |
|---|---|---|
| `authenticate()` | `Laravel\Fortify` | Autentikasi kredensial |
| `RoleMiddleware::handle()` | `App\Http\Middleware\RoleMiddleware` | Penjaga hak akses berdasarkan role |

---

## MODUL 2: Manajemen Data Alat (CRUD Inventaris)

### Input
| Field | Tipe Data | Keterangan |
|---|---|---|
| `category_id` | `integer\|null` | FK ke tabel `categories` |
| `code` | `string\|null` | Kode unik alat (auto-generate jika kosong) |
| `name` | `string` | Nama alat, maks 255 karakter |
| `brand` | `string\|null` | Merek/produsen alat |
| `serial_number` | `string\|null` | Nomor seri unik fisik alat |
| `condition_status` | `enum` | `baik`, `perlu-servis`, `rusak-ringan`, `rusak-berat` |
| `location` | `string\|null` | Lokasi penyimpanan fisik |
| `stock_total` | `integer` | Total keseluruhan unit yang dimiliki |
| `stock_available` | `integer` | Jumlah unit yang tersedia untuk dipinjam |
| `description` | `string\|null` | Deskripsi alat, maks 1000 karakter |
| `image` | `file\|null` | Foto alat (JPEG/PNG/WebP, maks 2MB) |

### Proses
1. Request divalidasi oleh `StoreToolRequest` / `UpdateToolRequest`.
2. Jika `code` dikosongkan, `Tool::booted()` men-generate otomatis format `ALAT-YY-NNNN`.
3. Jika ada upload gambar: disimpan ke `storage/app/public/tools/`.
4. Data disimpan ke tabel `tools` via `Tool::create()` atau `$tool->update()`.
5. `ActivityLog::record()` mencatat aksi ke log.

### Output
- **Berhasil**: Redirect `/tools` + toast sukses.
- **Gagal validasi**: Toast error dengan detail field yang salah.
- **Hapus gagal**: Toast error jika alat masih memiliki histori pinjam.

### Method / Fungsi Terkait
| Method | Class | Keterangan |
|---|---|---|
| `index()` | `ToolController` | Mengambil daftar alat + stats, limit 200 |
| `store()` | `ToolController` | Simpan alat baru + upload gambar |
| `update()` | `ToolController` | Perbarui data + replace gambar lama |
| `destroy()` | `ToolController` | Hapus alat (dengan constraint guard) |
| `booted()` | `Tool` (Model) | Auto-generate kode `ALAT-` saat `creating` |

---

## MODUL 3: Peminjaman Alat

### Input
| Field | Tipe Data | Keterangan |
|---|---|---|
| `borrower_name` | `string` | Nama lengkap peminjam |
| `borrower_identifier` | `string\|null` | NIP/NIS/ID peminjam |
| `borrower_phone` | `string\|null` | Nomor telepon aktif |
| `purpose` | `string` | Tujuan/keperluan peminjaman |
| `loan_date` | `datetime` | Waktu rencana pengambilan alat |
| `return_due_date` | `datetime` | Batas waktu harus dikembalikan |
| `notes` | `string\|null` | Catatan tambahan opsional |
| `items[].tool_id` | `integer` | ID alat yang dipinjam |
| `items[].quantity` | `integer` | Jumlah unit yang dipinjam |
| `items[].condition_out` | `string\|null` | Kondisi alat saat diambil |

### Proses
1. `StoreLoanRequest` memvalidasi semua field.
2. Sistem cek: apakah user masih punya pinjaman aktif (pending/approved/borrowed)?
3. `DB::transaction()` dibuka + `lockForUpdate()` pada tabel `tools` (cegah race condition).
4. Validasi stok per item: `quantity <= stock_available`.
5. `Loan::create()` menyimpan header peminjaman → Status awal: `pending`.
6. `Loan::booted()` men-generate `loan_code` format `TRX-YYYYMMDD-NNNN`.
7. MySQL Trigger `after_loan_insert` otomatis mencatat ke `activity_logs`.
8. Detail per alat disimpan ke `loan_items`.

### Output
- **Berhasil**: Redirect `/loans` + toast sukses + loan_code tergenerate.
- **Stok kurang**: ValidationException → toast error "Stok tidak mencukupi".
- **Masih punya pinjaman aktif**: ValidationException → toast error.

### Method / Fungsi Terkait
| Method | Class | Keterangan |
|---|---|---|
| `index()` | `LoanController` | Daftar peminjaman sesuai role, limit 100 |
| `store()` | `LoanController` | Simpan pengajuan pinjam baru |
| `updateStatus()` | `LoanController` | Perubahan status (pending→approved→borrowed→returned) |
| `ensureValidTransition()` | `LoanController` | State machine validator |
| `decrementStocks()` | `LoanController` | Kurangi stok saat status → borrowed |
| `booted()` | `Loan` (Model) | Auto-generate `TRX-` loan_code saat `creating` |
| `after_loan_insert` | MySQL Trigger | Insert log ke `activity_logs` otomatis |

---

## MODUL 4: Pengembalian Alat & Perhitungan Denda

### Input
| Field | Tipe Data | Keterangan |
|---|---|---|
| `loan_id` | `integer` | ID peminjaman yang dikembalikan |
| `return_date` | `date` | Tanggal aktual pengembalian |
| `condition_note` | `string\|null` | Catatan kondisi alat saat dikembalikan |

### Proses
1. `ReturnController::store()` memvalidasi input.
2. Sistem memastikan loan belum berstatus `returned`.
3. Memanggil MySQL Stored Procedure: `CALL process_return(loan_id, user_id, return_date, note)`.
4. Di dalam SP:
   - `START TRANSACTION` dibuka.
   - `SELECT return_due_date` dari tabel `loans`.
   - Memanggil MySQL Function: `calculate_fine(expected_date, actual_date)`.
   - `calculate_fine` menghitung: `DATEDIFF(actual, expected) * 5000` (Rp 5.000/hari).
   - `INSERT INTO returns` dengan nominal denda hasil kalkulasi.
   - `UPDATE loans SET status = 'returned'`.
   - `UPDATE tools` untuk restore stok via JOIN `loan_items`.
   - `COMMIT` jika semua langkah sukses.
   - `ROLLBACK` otomatis jika ada error (SQLEXCEPTION handler).

### Output
- **Berhasil**: Status loan jadi `returned`, stok alat bertambah, denda tercatat di `returns`.
- **Gagal (Exception)**: ROLLBACK otomatis, error dikembalikan ke user.

### Method / Fungsi Terkait
| Method/Objek | Tipe | Keterangan |
|---|---|---|
| `store()` | `ReturnController` | Entry point PHP → memanggil SP |
| `process_return()` | MySQL Stored Procedure | Logika inti pengembalian + transaksi |
| `calculate_fine()` | MySQL Function | `DATEDIFF * 5000`, return INT |
| `COMMIT` / `ROLLBACK` | MySQL | Jaminan integritas transaksi |

---

## MODUL 5: Laporan & Log Aktifitas

### Input
| Parameter | Tipe | Keterangan |
|---|---|---|
| `start_date` | `date\|null` | Filter awal rentang laporan |
| `end_date` | `date\|null` | Filter akhir rentang laporan |
| `status` | `string\|null` | Filter berdasarkan status pinjaman |

### Proses
1. `ReportController::index()` mengambil data dari tabel `loans` + `loan_items` + `returns`.
2. Query dengan validasi parameter filter.
3. Log aktivitas ditarik dari `activity_logs` via `ActivityLog::with('user')`.

### Output
- **Halaman web**: Tabel laporan teragregasi berdasarkan filter.
- **Log**: Daftar semua aksi pengguna lengkap dengan role, waktu (detik), dan deskripsi.

### Method / Fungsi Terkait
| Method | Class | Keterangan |
|---|---|---|
| `index()` | `ReportController` | Render halaman laporan |
| `print()` | `ReportController` | Format cetak laporan |
| `record()` | `ActivityLog` (Model) | Static helper catat log aktifitas |
