<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kode OTP Reset Password</title>
    <style>
        /* Base Reset */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            background-color: #f0f4f8; 
            color: #334155; 
            line-height: 1.6;
        }

        /* Container */
        .wrapper { 
            max-width: 500px; 
            margin: 60px auto; 
            background: #ffffff; 
            border-radius: 16px; 
            overflow: hidden; 
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); 
        }

        /* Header Modern Blue Gradient */
        .header { 
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); 
            padding: 40px 20px; 
            text-align: center; 
        }
        .header h1 { 
            color: #ffffff; 
            font-size: 24px; 
            font-weight: 800; 
            letter-spacing: -0.5px;
            margin-bottom: 4px;
        }
        .header p { 
            color: #bfdbfe; 
            font-size: 14px; 
            font-weight: 400;
        }

        /* Body Content */
        .body { padding: 40px; }
        
        .greeting { 
            font-size: 18px; 
            font-weight: 700; 
            color: #1e293b;
            margin-bottom: 12px; 
        }
        .info { 
            font-size: 15px; 
            color: #64748b; 
            margin-bottom: 30px; 
        }

        /* Modern OTP Box */
        .otp-box { 
            background: #f8fafc; 
            border: 1px solid #e2e8f0; 
            border-radius: 12px; 
            padding: 30px; 
            text-align: center; 
            margin-bottom: 30px;
            box-shadow: inset 0 2px 4px 0 rgba(0,0,0,0.02);
        }
        .otp-label { 
            font-size: 13px; 
            font-weight: 600; 
            text-transform: uppercase; 
            letter-spacing: 1.5px; 
            color: #94a3b8; 
            margin-bottom: 12px; 
        }
        .otp-code { 
            font-size: 48px; 
            font-weight: 800; 
            letter-spacing: 8px; 
            color: #2563eb; 
            font-family: 'Courier New', Courier, monospace; 
        }
        .expiry { 
            display: inline-block;
            margin-top: 15px;
            padding: 4px 12px;
            background: #dbeafe;
            color: #1e40af;
            border-radius: 20px;
            font-size: 12px; 
            font-weight: 600;
        }

        /* Alert Warning */
        .warning { 
            background: #fff9f2; 
            border-radius: 8px; 
            padding: 16px; 
            font-size: 13px; 
            color: #9a3412; 
            border: 1px solid #fed7aa;
            margin-bottom: 24px; 
        }

        /* Footer */
        .footer { 
            background: #f8fafc; 
            padding: 30px; 
            text-align: center; 
            font-size: 12px; 
            color: #94a3b8; 
            border-top: 1px solid #e2e8f0; 
        }
        .footer strong { color: #64748b; }

        /* Mobile Optimization */
        @media only screen and (max-width: 480px) {
            .wrapper { margin: 20px; width: auto; }
            .body { padding: 24px; }
            .otp-code { font-size: 36px; letter-spacing: 5px; }
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <h1>SispemTB</h1>
            <p>Sistem Peminjaman Alat SMK Taruna Bhakti</p>
        </div>
        
        <div class="body">
            <p class="greeting">Halo, {{ $userName }}!</p>
            <p class="info">
                Kami menerima permintaan untuk pengaturan ulang kata sandi akun Anda. 
                Silakan gunakan kode keamanan di bawah ini:
            </p>

            <div class="otp-box">
                <div class="otp-label">Kode Keamanan</div>
                <div class="otp-code">{{ $otp }}</div>
                <div class="expiry">⏱ Berlaku selama 10 menit</div>
            </div>

            <div class="warning">
                <strong>Penting:</strong> Jangan bagikan kode ini kepada siapapun. Pihak sekolah tidak akan pernah meminta kode ini melalui media apapun.
            </div>

            <p class="info" style="font-size: 13px; margin-bottom: 0;">
                Jika Anda tidak melakukan permintaan ini, abaikan email ini. Keamanan akun Anda tetap terjaga.
            </p>
        </div>

        <div class="footer">
            &copy; {{ date('Y') }} <strong>SispemTB</strong> &bull; Depok, Indonesia<br>
            <span style="display:block; margin-top: 8px;">Email otomatis, mohon tidak membalas pesan ini.</span>
        </div>
    </div>
</body>
</html>