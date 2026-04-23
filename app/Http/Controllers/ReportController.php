<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ActivityLog;
use App\Models\Loan;
use App\Models\ToolReturn;
use App\Models\User;
use App\Models\Category;
use App\Models\Tool;

/**
 * Controller untuk mengekstrak dan menyajikan Laporan.
 */
class ReportController extends Controller
{
    public function index()
    {
        return inertia('reports/index');
    }

    public function print(Request $request)
    {
        $type = $request->input('type');
        $needsDate = in_array($type, ['peminjaman', 'pengembalian', 'semua']);

        $rules = [
            'type' => 'required|in:peminjaman,pengembalian,semua,user,kategori,alat,log',
        ];
        if ($needsDate) {
            $rules['start_date'] = 'required|date';
            $rules['end_date']   = 'required|date|after_or_equal:start_date';
        }
        $request->validate($rules);

        $start = ($request->start_date ?? now()->startOfMonth()->toDateString()) . ' 00:00:00';
        $end   = ($request->end_date   ?? now()->endOfMonth()->toDateString())   . ' 23:59:59';

        $loans = $returns = $users = $categories = $toolsData = $activityLogs = [];

        if (in_array($type, ['peminjaman', 'semua'])) {
            $loans = Loan::with(['user', 'items.tool'])
                ->whereBetween('loan_date', [$start, $end])
                ->orderBy('loan_date', 'asc')->get();
        }

        if (in_array($type, ['pengembalian', 'semua'])) {
            $returns = ToolReturn::with(['loan.user', 'loan.items.tool', 'processedBy'])
                ->whereBetween('return_date', [$start, $end])
                ->orderBy('return_date', 'asc')->get();
        }

        if (in_array($type, ['user', 'semua'])) {
            $users = User::orderBy('name')->get();
        }

        if (in_array($type, ['kategori', 'semua'])) {
            $categories = Category::orderBy('name')->get();
        }

        if (in_array($type, ['alat', 'semua'])) {
            $toolsData = Tool::with('category')->orderBy('name')->get();
        }

        if (in_array($type, ['log', 'semua'])) {
            $activityLogs = ActivityLog::with('user')->latest()->get();
        }

        return inertia('reports/print', [
            'start_date'   => $request->start_date,
            'end_date'     => $request->end_date,
            'type'         => $type,
            'loans'        => $loans,
            'returns'      => $returns,
            'users'        => $users,
            'categories'   => $categories,
            'toolsData'    => $toolsData,
            'activityLogs' => $activityLogs,
        ]);
    }

    /**
     * JSON endpoint untuk live preview data laporan di frontend.
     */
    public function preview(Request $request)
    {
        $type      = $request->input('type', 'semua');
        $needsDate = in_array($type, ['peminjaman', 'pengembalian', 'semua']);
        $start     = $request->input('start_date', now()->startOfMonth()->toDateString()) . ' 00:00:00';
        $end       = $request->input('end_date',   now()->endOfMonth()->toDateString())   . ' 23:59:59';

        $data = [];

        if (in_array($type, ['peminjaman', 'semua'])) {
            $loans = Loan::with(['items'])
                ->whereBetween('loan_date', [$start, $end])
                ->latest('loan_date')->limit(8)->get();
            $data['peminjaman'] = [
                'total' => Loan::whereBetween('loan_date', [$start, $end])->count(),
                'rows'  => $loans->map(fn($l) => [
                    'kode'     => $l->loan_code ?? '-',
                    'peminjam' => $l->borrower_name,
                    'tgl'      => optional($l->loan_date)->format('d/m/Y'),
                    'status'   => $l->status,
                    'item'     => $l->items->count() . ' alat',
                ])->all(),
            ];
        }

        if (in_array($type, ['pengembalian', 'semua'])) {
            $returns = ToolReturn::with(['loan'])
                ->whereBetween('return_date', [$start, $end])
                ->latest('return_date')->limit(8)->get();
            $data['pengembalian'] = [
                'total' => ToolReturn::whereBetween('return_date', [$start, $end])->count(),
                'rows'  => $returns->map(fn($r) => [
                    'kode'   => $r->loan?->loan_code ?? '-',
                    'tgl'    => optional($r->return_date)->format('d/m/Y'),
                    'denda'  => $r->fine > 0 ? 'Rp ' . number_format((float)$r->fine, 0, ',', '.') : '-',
                    'status' => $r->payment_status ?? '-',
                ])->all(),
            ];
        }

        if (in_array($type, ['user', 'semua'])) {
            $users = User::orderBy('name')->limit(8)->get();
            $data['user'] = [
                'total' => User::count(),
                'rows'  => $users->map(fn($u) => [
                    'nama'  => $u->name,
                    'email' => $u->email,
                    'role'  => $u->role,
                ])->all(),
            ];
        }

        if (in_array($type, ['kategori', 'semua'])) {
            $cats = Category::withCount('tools')->orderBy('name')->limit(8)->get();
            $data['kategori'] = [
                'total' => Category::count(),
                'rows'  => $cats->map(fn($c) => [
                    'nama' => $c->name,
                    'alat' => $c->tools_count . ' alat',
                ])->all(),
            ];
        }

        if (in_array($type, ['alat', 'semua'])) {
            $tools = Tool::with('category')->orderBy('name')->limit(8)->get();
            $data['alat'] = [
                'total' => Tool::count(),
                'rows'  => $tools->map(fn($t) => [
                    'kode'     => $t->code,
                    'nama'     => $t->name,
                    'kategori' => $t->category?->name ?? '-',
                    'stok'     => $t->stock_available . '/' . $t->stock_total,
                    'kondisi'  => str_replace('-', ' ', $t->condition_status),
                ])->all(),
            ];
        }

        if (in_array($type, ['log', 'semua'])) {
            $logs = ActivityLog::with('user')->latest()->limit(8)->get();
            $data['log'] = [
                'total' => ActivityLog::count(),
                'rows'  => $logs->map(fn($l) => [
                    'user'  => $l->user?->name ?? 'System',
                    'aksi'  => $l->action,
                    'waktu' => $l->created_at?->format('d/m/Y H:i'),
                ])->all(),
            ];
        }

        return response()->json([
            'type'  => $type,
            'start' => $needsDate ? $request->input('start_date') : null,
            'end'   => $needsDate ? $request->input('end_date')   : null,
            'data'  => $data,
        ]);
    }
}
