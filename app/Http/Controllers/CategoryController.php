<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Controller untuk mengelola Kategori Alat.
 * Berperan krusial dalam klasifikasi barang agar mudah difilter (misalnya: Elektronik, Kimia).
 */
class CategoryController extends Controller
{
    /**
     * Menampilkan daftar Kategori.
     * Secara bawaan menggunakan `withCount('tools')` untuk langsung menganalisis total
     * alat yang berada di setiap kategori tanpa N+1 Query.
     *
     * @return Response Berisi koleksi Kategori.
     */
    public function index(): Response
    {
        $categories = Category::query()
            ->withCount('tools')
            ->orderBy('name')
            ->get()
            ->map(fn (Category $category): array => [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
                'description' => $category->description,
                'tools_count' => $category->tools_count,
            ]);

        return Inertia::render('categories/index', [
            'categories' => $categories,
            'stats' => [
                'total_categories' => $categories->count(),
                'with_tools' => $categories->where('tools_count', '>', 0)->count(),
            ],
        ]);
    }

    /**
     * Menyimpan Kategori baru ke basis data.
     * Otomatis memproduksi `slug` berdasarkan nama kategori menggunakan facade `Str`.
     */
    public function store(StoreCategoryRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        Category::query()->create([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'description' => $validated['description'] ?? null,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Kategori berhasil ditambahkan.']);

        return to_route('categories.index');
    }

    /**
     * Memperbarui detail Kategori spesifik beserta konversi ulang `slug`-nya.
     */
    public function update(UpdateCategoryRequest $request, Category $category): RedirectResponse
    {
        $validated = $request->validated();

        $category->update([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'description' => $validated['description'] ?? null,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Kategori berhasil diperbarui.']);

        return to_route('categories.index');
    }

    /**
     * Menghapus Kategori.
     * Memiliki pagar pengecekan: Kategori tidak bisa dienyahkan jika secara aktif memayungi suatu alat.
     */
    public function destroy(Category $category): RedirectResponse
    {
        if ($category->tools()->exists()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Kategori masih dipakai oleh data alat.']);

            return to_route('categories.index');
        }

        $category->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Kategori berhasil dihapus.']);

        return to_route('categories.index');
    }
}