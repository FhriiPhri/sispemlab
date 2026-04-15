<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreToolRequest;
use App\Http\Requests\UpdateToolRequest;
use App\Models\Category;
use App\Models\Tool;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\ActivityLog;
/**
 * Controller utama manajemen Inventaris Alat.
 * Menangani fungsi CRUD untuk master data alat yang tersedia di laboratorium.
 */
class ToolController extends Controller
{
    /**
     * Menampilkan katalog alat persediaan lab.
     * Menggunakan Eager Loading pada relasi kepingan `category` untuk memblokir N+1 Query Problem.
     *
     * @return Response Menyajikan format JSON proper ke Inertia Frontend.
     */
    public function index(): Response
    {
        $tools = Tool::query()
            ->with('category:id,name')
            ->orderBy('name')
            ->paginate(15)
            ->through(fn (Tool $tool): array => [
                'id' => $tool->id,
                'category_id' => $tool->category_id,
                'category_name' => $tool->category?->name,
                'code' => $tool->code,
                'name' => $tool->name,
                'image' => $tool->image,
                'image_url' => $tool->image ? Storage::url($tool->image) : null,
                'brand' => $tool->brand,
                'serial_number' => $tool->serial_number,
                'condition_status' => $tool->condition_status,
                'location' => $tool->location,
                'stock_total' => $tool->stock_total,
                'stock_available' => $tool->stock_available,
                'description' => $tool->description,
            ]);

        return Inertia::render('tools/index', [
            'tools' => $tools,
            'categories' => Category::query()->orderBy('name')->get(['id', 'name']),
            'stats' => [
                'total_tools' => Tool::count(),
                'available_units' => (int) Tool::sum('stock_available'),
                'need_attention' => Tool::whereIn('condition_status', ['perlu-servis', 'rusak-ringan', 'rusak-berat'])->count(),
            ],
        ]);
    }

    /**
     * Menyimpan profil alat baru beserta proses upload lampiran foto.
     *
     * @param StoreToolRequest $request Memastikan validasi ekstensi gambar, batas ukuran (MIME Type), dsb.
     * @return RedirectResponse 
     */
    public function store(StoreToolRequest $request): RedirectResponse
    {
        $data = $request->validated();

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('tools', 'public');
        }

        Tool::query()->create($data);

        ActivityLog::record('tambah_alat', "Mendaftarkan alat baru ke inventaris: {$data['name']}");

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Data alat berhasil ditambahkan.']);

        return to_route('tools.index');
    }

    /**
     * Menyimpan pembaruan model fisik dan metadatanya.
     * Jika terjadi upload foto baru, file lawas akan dihapuskan secara tuntas (`deleted`) guna
     * menyingkirkan akumulasi beban berkas mati di storage.
     *
     * @param UpdateToolRequest $request
     * @param Tool $tool Instansiasi otomatis dari route model binding.
     * @return RedirectResponse
     */
    public function update(UpdateToolRequest $request, Tool $tool): RedirectResponse
    {
        $data = $request->validated();

        if ($request->hasFile('image')) {
            if ($tool->image) {
                Storage::disk('public')->delete($tool->image);
            }
            $data['image'] = $request->file('image')->store('tools', 'public');
        }

        $tool->update($data);

        ActivityLog::record('update_alat', "Memperbarui spesifikasi alat: {$tool->name}");

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Data alat berhasil diperbarui.']);

        return to_route('tools.index');
    }

    /**
     * Menghapus instansi alat secara lunak, tetapi dengan pelindung kuat (Constraint Guard).
     * Alat tidak boleh dibinasakan jika jejak peminjamannya masih hidup di memori tabel sekunder.
     * Ini mencegah referential integrity corruption.
     *
     * @param Tool $tool
     * @return RedirectResponse
     */
    public function destroy(Tool $tool): RedirectResponse
    {
        if ($tool->loanItems()->exists()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Alat sudah memiliki histori peminjaman dan tidak bisa dihapus.']);

            return to_route('tools.index');
        }

        if ($tool->image) {
            Storage::disk('public')->delete($tool->image);
        }

        $name = $tool->name;
        $tool->delete();

        ActivityLog::record('hapus_alat', "Memusnahkan/menghapus alat dari sistem: {$name}");

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Data alat berhasil dihapus.']);

        return to_route('tools.index');
    }
}
