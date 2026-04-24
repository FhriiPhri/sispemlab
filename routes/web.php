<?php

use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ExportController;
use App\Http\Controllers\ImportController;
use App\Http\Controllers\LoanController;
use App\Http\Controllers\OtpPasswordController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ReturnController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\ToolController;
use App\Http\Controllers\UserController;
use App\Models\ActivityLog;
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

        Route::get('users', [UserController::class, 'index'])->name('users.index');
        Route::post('users', [UserController::class, 'store'])->name('users.store');
        Route::put('users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::delete('users/{user}', [UserController::class, 'destroy'])->name('users.destroy');

        // Log Aktivitas Sistem
        Route::get('logs', function () {
            return inertia('logs/index', ['logs' => ActivityLog::with('user')->latest()->paginate(20)]);
        })->name('logs.index');

        // Import Data Alat
        Route::get('tools/import/template', [ImportController::class, 'templateTools'])->name('tools.import.template');
        Route::post('tools/import', [ImportController::class, 'importTools'])->name('tools.import');

        // Import Data User
        Route::get('users/import/template', [ImportController::class, 'templateUsers'])->name('users.import.template');
        Route::post('users/import', [ImportController::class, 'importUsers'])->name('users.import');

        // Import Data Kategori
        Route::get('categories/import/template', [ImportController::class, 'templateCategories'])->name('categories.import.template');
        Route::post('categories/import', [ImportController::class, 'importCategories'])->name('categories.import');

        // Kelola Denda
        Route::get('denda', [SettingController::class, 'index'])->name('denda.index');
        Route::put('denda', [SettingController::class, 'update'])->name('denda.update');
    });

    // Admin & Petugas (Operasional: Approval Peminjaman, Pengembalian, Laporan)
    Route::middleware('role:admin,petugas')->group(function () {
        Route::patch('loans/{loan}/status', [LoanController::class, 'updateStatus'])->name('loans.status.update');

        Route::get('returns', [ReturnController::class, 'index'])->name('returns.index');
        Route::post('returns/process', [ReturnController::class, 'store'])->name('returns.process');
        Route::patch('returns/{return}/pay-fine', [ReturnController::class, 'payFine'])->name('returns.pay-fine');

        Route::get('reports', [ReportController::class, 'index'])->name('reports.index');
        Route::get('reports/preview', [ReportController::class, 'preview'])->name('reports.preview');
        Route::get('reports/print', [ReportController::class, 'print'])->name('reports.print');
        Route::get('reports/export', [ExportController::class, 'export'])->name('reports.export');
    });

    // Pembayaran Denda via Midtrans (bisa diakses semua role yang login)
    Route::post('payment/{return}/snap-token', [PaymentController::class, 'createSnapToken'])->name('payment.snap-token');
    Route::get('payment/{return}/status', [PaymentController::class, 'checkStatus'])->name('payment.status');

    // Peminjam / Umum (Katalog & Pengajuan Pinjam)
    Route::get('tools/catalog', [ToolController::class, 'index'])->name('tools.catalog');
    Route::get('loans', [LoanController::class, 'index'])->name('loans.index');
    Route::post('loans', [LoanController::class, 'store'])->name('loans.store');
    Route::post('loans/{loan}/return-request', [LoanController::class, 'returnRequest'])->name('loans.return-request');
});

// Grup Rute Guest (Belum Login) - Alur Reset Password OTP
Route::middleware('guest')->group(function () {
    // Step 1: Kirim OTP
    Route::post('forgot-password/send-otp', [OtpPasswordController::class, 'send'])
        ->name('password.otp.send');

    // Step 2: Verifikasi OTP
    Route::get('forgot-password/verify', [OtpPasswordController::class, 'showVerify'])
        ->name('password.otp.verify.show');
    Route::post('forgot-password/verify', [OtpPasswordController::class, 'verify'])
        ->name('password.otp.verify');

    // Kirim ulang OTP
    Route::post('forgot-password/resend', [OtpPasswordController::class, 'resend'])
        ->name('password.otp.resend');

    // Step 3: Input Password Baru
    Route::get('forgot-password/reset', [OtpPasswordController::class, 'showReset'])
        ->name('password.otp.reset.show');
    Route::post('forgot-password/reset', [OtpPasswordController::class, 'reset'])
        ->name('password.otp.reset');
});

require __DIR__.'/settings.php';