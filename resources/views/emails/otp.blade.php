<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kode OTP Reset Password</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; color: #1e293b; }
        .wrapper { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 36px 40px; text-align: center; }
        .header h1 { color: #fff; font-size: 22px; font-weight: 700; letter-spacing: -0.3px; }
        .header p { color: rgba(255,255,255,0.75); font-size: 13px; margin-top: 4px; }
        .body { padding: 36px 40px; }
        .greeting { font-size: 16px; font-weight: 600; margin-bottom: 12px; }
        .info { font-size: 14px; color: #64748b; line-height: 1.7; margin-bottom: 28px; }
        .otp-box { background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 28px; }
        .otp-label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 8px; }
        .otp-code { font-size: 42px; font-weight: 900; letter-spacing: 10px; color: #4f46e5; font-family: monospace; }
        .expiry { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 8px; }
        .warning { background: #fef3c7; border-left: 3px solid #f59e0b; border-radius: 6px; padding: 12px 16px; font-size: 13px; color: #92400e; margin-bottom: 24px; }
        .footer { background: #f8fafc; padding: 20px 40px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <h1>🔐 SispemLab</h1>
            <p>Sistem Peminjaman Alat Laboratorium</p>
        </div>
        <div class="body">
            <p class="greeting">Halo, {{ $userName }}!</p>
            <p class="info">
                Kami menerima permintaan untuk mereset kata sandi akun Anda.
                Gunakan kode OTP berikut untuk melanjutkan proses reset password.
            </p>

            <div class="otp-box">
                <div class="otp-label">Kode OTP Anda</div>
                <div class="otp-code">{{ $otp }}</div>
                <div class="expiry">⏱ Berlaku selama <strong>10 menit</strong></div>
            </div>

            <div class="warning">
                ⚠️ <strong>Jangan bagikan kode ini</strong> kepada siapapun! Tim SispemLab tidak akan pernah meminta kode OTP Anda.
            </div>

            <p class="info" style="font-size: 13px;">
                Jika Anda tidak merasa melakukan permintaan ini, abaikan email ini dan kata sandi Anda tidak akan berubah.
            </p>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} SispemLab &mdash; Sistem Peminjaman Alat Lab<br>
            Email ini dikirim secara otomatis, harap tidak membalas.
        </div>
    </div>
</body>
</html>
