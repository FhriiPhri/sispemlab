<?php

namespace App\Http\Controllers;

use App\Models\ToolReturn;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Midtrans\Config as MidtransConfig;
use Midtrans\Snap;
use Midtrans\Notification;

/**
 * Controller integrasi Midtrans Snap untuk pembayaran denda peminjaman alat.
 * Alur: Generate Snap Token → Tampil Popup → Webhook callback → Update DB
 */
class PaymentController extends Controller
{
    public function __construct()
    {
        MidtransConfig::$serverKey    = config('midtrans.server_key');
        MidtransConfig::$isProduction = config('midtrans.is_production');
        MidtransConfig::$isSanitized  = true;
        MidtransConfig::$is3ds        = true;
    }

    /**
     * Generate Snap Token untuk pembayaran denda.
     * Dipanggil dari frontend saat tombol "Bayar Denda" ditekan.
     *
     * @param  int  $id  ID record di tabel `returns`
     * @return \Illuminate\Http\JsonResponse  { snap_token: string }
     */
    public function createSnapToken(Request $request, $id)
    {
        $return    = ToolReturn::with(['loan.user', 'loan.items.tool'])->findOrFail($id);
        $totalFine = $return->fine + $return->damage_fine;

        if ($totalFine <= 0) {
            return response()->json(['error' => 'Tidak ada denda yang perlu dibayar.'], 422);
        }

        if ($return->payment_status === 'paid') {
            return response()->json(['error' => 'Denda sudah dilunasi.'], 422);
        }

        $loan = $return->loan;
        $user = $loan->user;

        // Buat order_id unik: return_<id>_<timestamp>
        $orderId = 'DENDA-' . $return->id . '-' . time();

        // Simpan order_id sementara agar bisa dicocokkan saat webhook
        $return->update(['midtrans_order_id' => $orderId]);

        $params = [
            'transaction_details' => [
                'order_id'     => $orderId,
                'gross_amount' => (int) $totalFine,
            ],
            'customer_details' => [
                'first_name' => $user?->name ?? $loan->borrower_name,
                'email'      => $user?->email ?? '',
                'phone'      => $loan->borrower_phone ?? '',
            ],
            'item_details' => [
                [
                    'id'       => 'FINE-' . $return->id,
                    'price'    => (int) $totalFine,
                    'quantity' => 1,
                    'name'     => 'Denda Peminjaman #' . ($loan->loan_code ?? $loan->id),
                ],
            ],
            'callbacks' => [
                'finish' => route('loans.index'),
            ],
        ];

        try {
            $snapToken = Snap::getSnapToken($params);
            return response()->json(['snap_token' => $snapToken]);
        } catch (\Exception $e) {
            Log::error('Midtrans Snap error: ' . $e->getMessage());
            return response()->json(['error' => 'Gagal menghubungi Midtrans: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Webhook/Notification handler dari Midtrans.
     * Midtrans akan POST ke endpoint ini setiap ada perubahan status transaksi.
     *
     * URL: POST /payment/notification
     * PENTING: Endpoint ini harus dikecualikan dari CSRF (lihat bootstrap/app.php)
     */
    public function notification(Request $request)
    {
        try {
            $notif         = new Notification();
            $transStatus   = $notif->transaction_status;
            $fraudStatus   = $notif->fraud_status;
            $orderId       = $notif->order_id;

            $return = ToolReturn::where('midtrans_order_id', $orderId)->firstOrFail();

            // Tentukan status pembayaran berdasarkan respon Midtrans
            $isPaid = match (true) {
                $transStatus === 'capture' && $fraudStatus === 'accept' => true,
                $transStatus === 'settlement'                           => true,
                default                                                  => false,
            };

            if ($isPaid && $return->payment_status !== 'paid') {
                DB::transaction(function () use ($return, $notif) {
                    $return->update([
                        'payment_status'         => 'paid',
                        'midtrans_transaction_id' => $notif->transaction_id,
                        'midtrans_payment_type'  => $notif->payment_type,
                    ]);

                    ActivityLog::create([
                        'user_id'     => $return->loan->user_id,
                        'action'      => 'Fine Paid via Midtrans',
                        'description' => 'Denda peminjaman #' . $return->loan_id
                            . ' senilai Rp ' . number_format($return->fine + $return->damage_fine, 0, ',', '.')
                            . ' telah dibayar via ' . $notif->payment_type . '.',
                    ]);
                });
            }

            return response()->json(['message' => 'OK']);
        } catch (\Exception $e) {
            Log::error('Midtrans webhook error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Cek status transaksi secara manual dari admin/petugas.
     * Berguna untuk memperbarui status jika webhook terlambat.
     */
    public function checkStatus($id)
    {
        $return = ToolReturn::findOrFail($id);

        if (!$return->midtrans_order_id) {
            return response()->json(['error' => 'Belum ada transaksi Midtrans untuk record ini.'], 404);
        }

        try {
            $status = \Midtrans\Transaction::status($return->midtrans_order_id);

            if (in_array($status->transaction_status, ['settlement', 'capture'])
                && $return->payment_status !== 'paid'
            ) {
                $return->update([
                    'payment_status'          => 'paid',
                    'midtrans_transaction_id' => $status->transaction_id ?? null,
                    'midtrans_payment_type'   => $status->payment_type   ?? null,
                ]);
            }

            return response()->json(['status' => $status->transaction_status]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
