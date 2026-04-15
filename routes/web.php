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

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    // Admin Only (CRUD user, alat, kategori, data peminjaman, pengembalian, log aktifitas)
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
        
        // Activity Logs
        Route::get('logs', function() {
            return inertia('logs/index', ['logs' => \App\Models\ActivityLog::with('user')->latest()->paginate(20)]);
        })->name('logs.index');
    });

    // Admin & Petugas (Admin CRUD peminjaman/pengembalian, Petugas Menyetujui & Memantau & Cetak Laporan)
    Route::middleware('role:admin,petugas')->group(function () {
        Route::patch('loans/{loan}/status', [LoanController::class, 'updateStatus'])->name('loans.status.update');
        
        Route::get('returns', function() {
            return inertia('returns/index', ['returns' => \App\Models\ToolReturn::with(['loan.user', 'processedBy'])->latest()->get()]);
        })->name('returns.index');
        Route::post('returns/process', [\App\Http\Controllers\ReturnController::class, 'store'])->name('returns.process');
        
        Route::get('reports', [\App\Http\Controllers\ReportController::class, 'index'])->name('reports.index');
        Route::get('reports/print', [\App\Http\Controllers\ReportController::class, 'print'])->name('reports.print');
    });

    // Peminjam (and others)
    Route::get('tools/catalog', [ToolController::class, 'index'])->name('tools.catalog');
    Route::get('loans', [LoanController::class, 'index'])->name('loans.index');
    Route::post('loans', [LoanController::class, 'store'])->name('loans.store');
    Route::post('loans/{loan}/return-request', [LoanController::class, 'returnRequest'])->name('loans.return-request');
});

require __DIR__.'/settings.php';
