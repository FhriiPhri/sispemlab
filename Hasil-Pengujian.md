# Hasil Pengujian (Test Case Results)

Dokumen ini merupakan hasil eksekusi nyata dari 5 skenario uji yang telah didefinisikan di `Testing-Scenarios.md`.

---

## TEST CASE 1: Login User (Cek Kredensial)

| | Detail |
|---|---|
| **Kasus** | Login dengan password **salah** lalu dengan password **benar** |
| **Actor** | Petugas (`petugas@alatkampus.test`) |
| **Langkah** | 1) Buka `/login` → Isi email benar, password salah → Klik Login<br>2) Isi email + password benar → Klik Login |
| **Hasil (Gagal)** | ❌ Sistem menolak. Muncul pesan: *"These credentials do not match our records."* Tidak ada sesi yang dibuat. |
| **Hasil (Berhasil)** | ✅ Redirect ke `/dashboard`. Menu sidebar menampilkan Peminjaman & Pengembalian (sesuai role Petugas). Menu Pengguna tidak muncul. |
| **Status** | **LULUS** ✅ |

---

## TEST CASE 2: Tambah Data Alat (Admin) & Cek Privilege (Petugas)

| | Detail |
|---|---|
| **Kasus A** | Petugas mencoba akses URL `/tools` (Admin only) |
| **Langkah** | Login sebagai Petugas → Arahkan manual ke URL `http://127.0.0.1:8000/tools` |
| **Hasil** | ❌ Halaman dikembalikan Error 403 Forbidden. Route `tools` dilindungi middleware `role:admin`. |
| **Kasus B** | Admin menambah alat baru dengan kode dikosongkan |
| **Langkah** | Login Admin → Daftar Alat → Tambah Alat → Isi nama, stok, kondisi, kosongkan kode → Simpan |
| **Hasil** | ✅ Alat tersimpan. Kode ter-generate otomatis format `ALAT-26-XXXX`. Toast sukses muncul. |
| **Status** | **LULUS** ✅ |

---

## TEST CASE 3: Peminjam Mengajukan Peminjaman

| | Detail |
|---|---|
| **Kasus** | Peminjam membuat pengajuan pinjam alat yang stoknya cukup |
| **Actor** | Peminjam (`peminjam@alatkampus.test`) |
| **Langkah** | Login → Peminjaman → Buat Pengajuan → Isi form → Pilih alat → Kirim |
| **Hasil** | ✅ Data tersimpan di DB dengan status `pending`. Kode TRX (`TRX-YYYYMMDD-NNNN`) ter-generate otomatis. Trigger `after_loan_insert` mencatat ke `activity_logs`. Toast sukses muncul. |
| **Kasus Stok Habis** | Memilih alat dengan stok = 0 & quantity > 0 → Klik Kirim |
| **Hasil (Gagal)** | ❌ Toast error: *"Stok alat [Nama] tidak mencukupi untuk pengajuan ini."* DB tidak diubah (transaction rollback). |
| **Status** | **LULUS** ✅ |

---

## TEST CASE 4: Approve & Proses Peminjaman (Petugas/Admin)

| | Detail |
|---|---|
| **Kasus** | Petugas menyetujui lalu mengubah status ke `borrowed` |
| **Actor** | Petugas (`petugas@alatkampus.test`) |
| **Langkah** | Login → Peminjaman → Temukan pinjaman `pending` → Klik "Setujui" → Stok belum berubah → Klik "Beri Akses Pinjam" |
| **Hasil** | ✅ Status berubah `pending` → `approved` → `borrowed`. Saat status jadi `borrowed`, `stock_available` di tabel `tools` **berkurang** sesuai quantity (dikunci dengan `lockForUpdate` ACID). |
| **Kasus transit ilegal** | Mencoba ubah status dari `returned` → `approved` via API |
| **Hasil** | ❌ ValidationException: *"Perubahan status ini tidak diizinkan dari kondisi saat ini."* (State Machine menolak). |
| **Status** | **LULUS** ✅ |

---

## TEST CASE 5: Pengembalian Alat + Perhitungan Denda

| | Detail |
|---|---|
| **Kasus** | Petugas memproses pengembalian alat yang **terlambat 2 hari** |
| **Actor** | Petugas |
| **Langkah** | Login → Pengembalian → Pilih pinjaman `borrowed` → Isi tanggal kembali (2 hari setelah batas) → Klik Proses |
| **Proses DB** | `CALL process_return(id, user_id, return_date, note)` → `calculate_fine()` → `DATEDIFF = 2` → `Fine = 2 × 5000 = 10.000` |
| **Hasil** | ✅ Tabel `returns` terisi dengan `fine = 10000`. Status loan jadi `returned`. Stok alat bertambah kembali. Semua dalam satu `COMMIT`. |
| **Kasus tanpa keterlambatan** | Return date = return_due_date (tepat waktu) |
| **Hasil** | ✅ `calculate_fine()` → `DATEDIFF = 0` → `Fine = 0`. Data tersimpan dengan denda 0. |
| **Status** | **LULUS** ✅ |

---

## Ringkasan Hasil Pengujian

| No | Skenario | Status |
|---|---|---|
| 1 | Login user (kredensial salah & benar) | ✅ Lulus |
| 2 | Tambah alat + cek privilege role | ✅ Lulus |
| 3 | Ajukan peminjaman (normal & stok habis) | ✅ Lulus |
| 4 | Approve & proses borrowed + state machine | ✅ Lulus |
| 5 | Pengembalian + denda (terlambat & tepat waktu) | ✅ Lulus |

**Total: 5/5 skenario LULUS** ✅
