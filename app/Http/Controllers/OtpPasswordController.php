<?php

namespace App\Http\Controllers;

use App\Mail\OtpMail;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Mengelola alur reset password berbasis OTP (One-Time Password).
 *
 * Alur:
 *   Step 1 → User masukkan email → OTP 6-digit digenerate + dikirim via email
 *   Step 2 → User masukkan OTP → diverifikasi, token sesi dibuat
 *   Step 3 → User masukkan password baru → password diperbarui
 */
class OtpPasswordController extends Controller
{
    // ─── Step 1: Kirim OTP ────────────────────────────────────────────────────

    /**
     * Input: email
     * Proses: cek user → generate OTP → simpan ke DB → kirim email
     * Output: redirect ke /verify-otp dengan email di session
     */
    public function send(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ], [
            'email.exists' => 'Email tidak terdaftar dalam sistem.',
        ]);

        $email = strtolower($request->email);
        $user  = User::where('email', $email)->firstOrFail();

        // Hapus OTP lama untuk email ini
        DB::table('password_reset_otps')->where('email', $email)->delete();

        // Generate OTP 6-digit
        $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        DB::table('password_reset_otps')->insert([
            'email'      => $email,
            'otp'        => $otp,
            'expires_at' => now()->addMinutes(10),
            'used'       => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Kirim email OTP
        Mail::to($email)->send(new OtpMail(otp: $otp, userName: $user->name));

        return redirect()->route('password.otp.verify.show')
            ->with('otp_email', $email)
            ->with('status', "OTP telah dikirim ke {$email}. Cek inbox atau spam Anda.");
    }

    // ─── Step 2: Verifikasi OTP ───────────────────────────────────────────────

    /**
     * Tampilkan halaman verifikasi OTP.
     */
    public function showVerify(Request $request): Response|RedirectResponse
    {
        $email = session('otp_email') ?? $request->query('email');

        if (! $email) {
            return redirect()->route('password.request');
        }

        return Inertia::render('auth/verify-otp', [
            'email'  => $email,
            'status' => session('status'),
        ]);
    }

    /**
     * Input: email + otp
     * Proses: cek OTP valid, belum expired, belum dipakai
     * Output: redirect ke /reset-password dengan reset_token di session
     */
    public function verify(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => 'required|email',
            'otp'   => 'required|string|size:6',
        ]);

        $email = strtolower($request->email);

        $record = DB::table('password_reset_otps')
            ->where('email', $email)
            ->where('otp', $request->otp)
            ->where('used', false)
            ->where('expires_at', '>', now())
            ->first();

        if (! $record) {
            return back()
                ->withInput()
                ->withErrors(['otp' => 'Kode OTP tidak valid atau sudah kadaluarsa.']);
        }

        // Tandai OTP sebagai sudah dipakai
        DB::table('password_reset_otps')
            ->where('id', $record->id)
            ->update(['used' => true]);

        // Buat token sesi untuk step 3
        $resetToken = hash('sha256', $email . now()->timestamp . random_int(1000, 9999));

        session([
            'otp_reset_email' => $email,
            'otp_reset_token' => $resetToken,
        ]);

        return redirect()->route('password.otp.reset.show');
    }

    // ─── Step 3: Reset Password ───────────────────────────────────────────────

    /**
     * Tampilkan halaman form password baru.
     */
    public function showReset(): Response|RedirectResponse
    {
        if (! session('otp_reset_token') || ! session('otp_reset_email')) {
            return redirect()->route('password.request');
        }

        return Inertia::render('auth/otp-reset-password', [
            'email' => session('otp_reset_email'),
        ]);
    }

    /**
     * Input: password + password_confirmation
     * Proses: validasi token sesi → update password user
     * Output: redirect ke /login dengan pesan sukses
     */
    public function reset(Request $request): RedirectResponse
    {
        if (! session('otp_reset_token') || ! session('otp_reset_email')) {
            return redirect()->route('password.request')
                ->withErrors(['email' => 'Sesi reset password tidak valid. Silakan ulangi dari awal.']);
        }

        $request->validate([
            'password' => 'required|string|min:8|confirmed',
        ], [
            'password.confirmed' => 'Konfirmasi password tidak cocok.',
            'password.min'       => 'Password minimal 8 karakter.',
        ]);

        $email = session('otp_reset_email');

        $user = User::where('email', $email)->first();

        if (! $user) {
            return redirect()->route('password.request')
                ->withErrors(['email' => 'Akun tidak ditemukan.']);
        }

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        // Bersihkan session
        session()->forget(['otp_reset_email', 'otp_reset_token', 'otp_email']);

        // Hapus semua OTP lama untuk email ini
        DB::table('password_reset_otps')->where('email', $email)->delete();

        return redirect()->route('login')
            ->with('status', 'Password berhasil diperbarui! Silakan login dengan password baru Anda.');
    }

    // ─── Resend OTP ───────────────────────────────────────────────────────────

    /**
     * Kirim ulang OTP ke email yang sama.
     */
    public function resend(Request $request): RedirectResponse
    {
        $request->validate(['email' => 'required|email|exists:users,email']);

        $email = strtolower($request->email);
        $user  = User::where('email', $email)->firstOrFail();

        DB::table('password_reset_otps')->where('email', $email)->delete();

        $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        DB::table('password_reset_otps')->insert([
            'email'      => $email,
            'otp'        => $otp,
            'expires_at' => now()->addMinutes(10),
            'used'       => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Mail::to($email)->send(new OtpMail(otp: $otp, userName: $user->name));

        return back()
            ->with('otp_email', $email)
            ->with('status', 'OTP baru telah dikirim ulang ke ' . $email . '.');
    }
}
