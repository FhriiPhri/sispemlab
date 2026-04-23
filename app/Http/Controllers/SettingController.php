<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\ActivityLog;

class SettingController extends Controller
{
    public function index()
    {
        $settings = Setting::all();
        return Inertia::render('denda/index', [
            'settings' => $settings,
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'settings' => 'required|array',
            'settings.*.id' => 'required|exists:settings,id',
            'settings.*.value' => 'required',
        ]);

        foreach ($data['settings'] as $settingData) {
            Setting::where('id', $settingData['id'])->update(['value' => $settingData['value']]);
        }

        ActivityLog::record('update_settings', "Memperbarui konfigurasi denda sistem");

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pengaturan denda berhasil diperbarui.']);

        return back();
    }
}
