<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    /**
     * Memvalidasi input registrasi dan membuat akun pengguna baru.
     * Alur:
     * 1. Validasi input profil dan password.
     * 2. Buat record User dengan role default 'peminjam'.
     * 
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        // Validasi input (termasuk NIS, Kelas, Jurusan dari profileRules)
        Validator::make($input, [
            ...$this->profileRules(),
            'password' => $this->passwordRules(),
        ])->validate();

        // Simpan ke database dengan password ter-hash
        return User::create([
            'name' => $input['name'],
            'email' => $input['email'],
            'password' => \Illuminate\Support\Facades\Hash::make($input['password']),
            'identifier' => $input['identifier'],
            'phone' => $input['phone'],
            'class' => $input['class'],
            'major' => $input['major'],
            'role' => 'peminjam', // Role default untuk registrasi mandiri
        ]);
    }
}
