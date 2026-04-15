<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Models\ActivityLog;

/**
 * Pintu gerbang pengelolaan data Pengguna (Identity Management).
 * Mengeksekusi penambahan akun, penggantian peran, dan modifikasi kata sandi rahasia.
 */
class UserController extends Controller
{
    /**
     * Menampilkan daftar entitas User.
     */
    public function index()
    {
        return inertia('users/index', [
            'users' => User::latest()->get(),
        ]);
    }

    /**
     * Meregistrasikan pengguna baru ke sistem dari dalam Dashboard Admin.
     * Kata sandi akan otomatis melewati algoritma pseudo-acak (`bcrypt`) agar aman di database.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:8',
            'role' => ['required', Rule::in(['admin', 'petugas', 'peminjam'])],
        ]);

        $validated['password'] = bcrypt($validated['password']);
        $newUser = User::create($validated);

        ActivityLog::record('buat_akun', 'Mendaftarkan satu akun baru: ' . $newUser->name);

        return back()->with('success', 'User berhasil ditambahkan.');
    }

    /**
     * Melakukan mutasi pada data User yang sudah terdaftar.
     * Mengeksekusi validasi `Rule::unique` dengan mengabaikan id pengguna tersebut 
     * agar validasi email tidak bentrok dengan datanya sendiri.
     */
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            'role' => ['required', Rule::in(['admin', 'petugas', 'peminjam'])],
        ]);

        if ($request->filled('password')) {
            $request->validate(['password' => 'min:8']);
            $validated['password'] = bcrypt($request->password);
        }

        $user->update($validated);

        ActivityLog::record('update_akun', "Memodifikasi data akun milik: {$user->name}");

        return back()->with('success', 'User berhasil diupdate.');
    }

    /**
     * Memusnahkan akun pengguna secara permanen.
     */
    public function destroy(User $user)
    {
        $name = $user->name;
        $user->delete();

        ActivityLog::record('hapus_akun', "Melepas/menghapus akun milik: {$name}");
        return back()->with('success', 'User berhasil dihapus.');
    }
}
