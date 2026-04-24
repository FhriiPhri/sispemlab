<?php

namespace App\Providers;

use App\Models\ActivityLog;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Carbon::setTestNow('2026-04-30 10:00:00');

        if (str_contains(config('app.url'), 'ngrok-free.app') || env('APP_ENV') !== 'local') {
            URL::forceScheme('https');
        }
        $this->configureDefaults();

        // Mencatat aktivitas saat User Login
        Event::listen(Login::class, function (Login $event) {
            ActivityLog::record('login', 'Pengguna berhasil masuk ke sistem.');
        });

        // Mencatat aktivitas saat User Logout
        Event::listen(Logout::class, function (Logout $event) {
            ActivityLog::record('logout', 'Pengguna telah keluar dari sistem.');
        });

        // Override rute verifikasi email bawaan Fortify agar otomatis login
        $this->app->booted(function () {
            Route::get('/email/verify/{id}/{hash}', function (Request $request, $id, $hash) {
                $user = User::findOrFail($id);

                if (! hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
                    abort(403);
                }

                if (! Auth::check()) {
                    Auth::login($user);
                }

                if (! $user->hasVerifiedEmail()) {
                    $user->markEmailAsVerified();
                    event(new Verified($user));
                }

                return redirect()->intended(route('dashboard', absolute: false).'?verified=1');
            })->middleware(['signed', 'throttle:6,1'])->name('verification.verify');
        });
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}