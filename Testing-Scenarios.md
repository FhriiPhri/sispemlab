# Skenario Pengujian (Testing Scenarios)

Berikut adalah pendokumentasian dari 5 (lima) skenario uji coba (test cases) untuk fitur utama aplikasi Peminjaman Alat.

## SKENARIO 1: Login User (Role Check)
*Kasus:* Login menggunakan akun Petugas dengan kombinasi kredensial yang salah, kemudian mencoba dengan kredensial yang benar.
*Langkah:*
1. Buka halaman `/login`
2. Masukkan email: `petugas@alatkampus.test`
3. Masukkan password salah: `salahpassword`
4. Tekan Login.
*Hasil:*
- Sistem menolak login dan memunculkan notifikasi "These credentials do not match our records." (Gagal login)
5. Masukkan password benar: `password`
6. Tekan Login.
*Hasil:*
- Berhasil login. Terdapat menu khusus Petugas ("Peminjaman", "Pengembalian", tidak ada "Pengguna").

## SKENARIO 2: Tambah Data Pengguna (Hak Akses)
*Kasus:* Admin mencoba menambahkan akun pengguna baru, sedangkan Petugas mencoba mengakses halaman daftar pengguna.
*Langkah:*
1. Sebagai Petugas, arahkan navigasi URL ke `/users` secara manual atau cek di menu.
*Hasil:* 
- Halaman ditolak (Error 403 / Halaman tidak ditemukan / Menu tidak muncul di Sidebar). Hak akses berfungsi.
2. Sebagai Admin, buka menu **Pengguna**.
3. Isi form tambah pengguna: Nama, Email `budi@test.com`, Password, dan Role: `peminjam`.
4. Klik Simpan.
*Hasil:* 
- Sistem memunculkan alert sukses, data tersimpan di database dan muncul pada tabel `users`.

## SKENARIO 3: Peminjam Mengajukan Peminjaman
*Kasus:* Mahasiswa (Peminjam) mengajukan pinjaman alat yang stoknya mencukupi.
*Langkah:*
1. Login sebagai `peminjam@alatkampus.test`.
2. Buka menu **Katalog Alat**.
3. Pilih alat "Proyektor Epson EB-X06".
4. Masukkan kuantitas 1 dan lengkapi tujuan (Misal: Kegiatan HIMA).
5. Tentukan tanggal pengembalian dan Simpan.
*Hasil:*
- Data peminjaman tersimpan dengan status `pending` di Dashboard Peminjam.
- Trigger basis data tercatat pada log aktifitas.

## SKENARIO 4: Petugas Menerima Peminjaman & Mengubah Status
*Kasus:* Petugas meng-approve pinjaman `pending` lalu mengubah status menjadi `borrowed` waktu alat diambil.
*Langkah:*
1. Login sebagai `petugas@alatkampus.test`.
2. Buka menu **Peminjaman**.
3. Temukan peminjaman mahasiswa (Role peminjam).
4. Ubah status menjadi `approved`. Stok belum berkurang.
5. Ubah status menjadi `borrowed`.
*Hasil:*
- Status berubah menjadi `borrowed`.
- Stok alat di tabel `tools` (stock_available) berkurang otomatis di belakang layar.

## SKENARIO 5: Pengembalian Alat (Telat / Dengan Denda)
*Kasus:* Petugas memproses pengembalian peminjaman Alat yang sudah melewati batas waktu (return_due_date).
*Langkah:*
1. Gunakan session Petugas, akses menu **Pengembalian**.
2. Pilih nomor peminjaman yang `borrowed` (misalnya batas waktu kemarin).
3. Isi input "Tanggal Kembali" dengan tanggal hari ini. Input Catatan: "Aman".
4. Klik "Proses Pengembalian".
*Hasil:*
- Sistem memanggil Stored Procedure `process_return`.
- Stored Procedure menjalankan fungsi `calculate_fine` yang mendeteksi keterlambatan.
- Tabel `returns` tercipta dengan nominal `fine` misalnya Rp 5000 (jika 1 hari).
- Transaksi otomatis melakukan Commit dan memperbarui stok barang menjadi bertambah kembali. Status menjadi `returned`.
