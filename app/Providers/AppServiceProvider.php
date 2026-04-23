<?php

namespace App\Providers;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Illuminate\Support\Facades\Event;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\URL;

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
        \Illuminate\Support\Carbon::setTestNow('2026-04-30 10:00:00');
        
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
