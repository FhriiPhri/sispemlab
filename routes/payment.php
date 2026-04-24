<?php

use App\Http\Controllers\PaymentController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Midtrans Webhook Route
|--------------------------------------------------------------------------
| Endpoint ini TIDAK menggunakan middleware auth/CSRF karena dipanggil
| langsung oleh server Midtrans. Keamanan dijamin oleh server key validation.
| Pastikan endpoint ini sudah dikecualikan dari CSRF di bootstrap/app.php.
|
*/

Route::post('payment/notification', [PaymentController::class, 'notification'])
    ->name('payment.notification')
    ->withoutMiddleware(['web']);