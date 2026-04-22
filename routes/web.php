<?php

use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\LoanController;
use App\Http\Controllers\ToolController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'landing', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

// Rute yang hanya bisa diakses jika sudah login dan email terverifikasi
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    // Khusus Admin (Manajemen Master Data: User, Alat, Kategori, Log)
    Route::middleware('role:admin')->group(function () {
        Route::get('categories', [CategoryController::class, 'index'])->name('categories.index');
        Route::post('categories', [CategoryController::class, 'store'])->name('categories.store');
        Route::put('categories/{category}', [CategoryController::class, 'update'])->name('categories.update');
        Route::delete('categories/{category}', [CategoryController::class, 'destroy'])->name('categories.destroy');

        Route::get('tools', [ToolController::class, 'index'])->name('tools.index');
        Route::post('tools', [ToolController::class, 'store'])->name('tools.store');
        Route::put('tools/{tool}', [ToolController::class, 'update'])->name('tools.update');
        Route::delete('tools/{tool}', [ToolController::class, 'destroy'])->name('tools.destroy');
        
        Route::get('users', [\App\Http\Controllers\UserController::class, 'index'])->name('users.index');
        Route::post('users', [\App\Http\Controllers\UserController::class, 'store'])->name('users.store');
        Route::put('users/{user}', [\App\Http\Controllers\UserController::class, 'update'])->name('users.update');
        Route::delete('users/{user}', [\App\Http\Controllers\UserController::class, 'destroy'])->name('users.destroy');
        
        // Log Aktivitas Sistem
        Route::get('logs', function() {
            return inertia('logs/index', ['logs' => \App\Models\ActivityLog::with('user')->latest()->paginate(20)]);
        })->name('logs.index');
    });

    // Admin & Petugas (Operasional: Approval Peminjaman, Pengembalian, Laporan)
    Route::middleware('role:admin,petugas')->group(function () {
        Route::patch('loans/{loan}/status', [LoanController::class, 'updateStatus'])->name('loans.status.update');
        
        Route::get('returns', [\App\Http\Controllers\ReturnController::class, 'index'])->name('returns.index');
        Route::post('returns/process', [\App\Http\Controllers\ReturnController::class, 'store'])->name('returns.process');
        Route::patch('returns/{return}/pay-fine', [\App\Http\Controllers\ReturnController::class, 'payFine'])->name('returns.pay-fine');
        
        Route::get('reports', [\App\Http\Controllers\ReportController::class, 'index'])->name('reports.index');
        Route::get('reports/print', [\App\Http\Controllers\ReportController::class, 'print'])->name('reports.print');
    });

    // Peminjam / Umum (Katalog & Pengajuan Pinjam)
    Route::get('tools/catalog', [ToolController::class, 'index'])->name('tools.catalog');
    Route::get('loans', [LoanController::class, 'index'])->name('loans.index');
    Route::post('loans', [LoanController::class, 'store'])->name('loans.store');
    Route::post('loans/{loan}/return-request', [LoanController::class, 'returnRequest'])->name('loans.return-request');
});

// Grup Rute Guest (Belum Login) - Alur Reset Password OTP
Route::middleware('guest')->group(function () {
    // Step 1: Kirim OTP
    Route::post('forgot-password/send-otp', [\App\Http\Controllers\OtpPasswordController::class, 'send'])
        ->name('password.otp.send');

    // Step 2: Verifikasi OTP
    Route::get('forgot-password/verify', [\App\Http\Controllers\OtpPasswordController::class, 'showVerify'])
        ->name('password.otp.verify.show');
    Route::post('forgot-password/verify', [\App\Http\Controllers\OtpPasswordController::class, 'verify'])
        ->name('password.otp.verify');

    // Kirim ulang OTP
    Route::post('forgot-password/resend', [\App\Http\Controllers\OtpPasswordController::class, 'resend'])
        ->name('password.otp.resend');

    // Step 3: Input Password Baru
    Route::get('forgot-password/reset', [\App\Http\Controllers\OtpPasswordController::class, 'showReset'])
        ->name('password.otp.reset.show');
    Route::post('forgot-password/reset', [\App\Http\Controllers\OtpPasswordController::class, 'reset'])
        ->name('password.otp.reset');
});

require __DIR__.'/settings.php';

