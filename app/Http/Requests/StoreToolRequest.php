<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreToolRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>|string>
     */
    public function rules(): array
    {
        return [
            'category_id' => ['nullable', 'exists:categories,id'],
            'code' => ['nullable', 'string', 'max:50', Rule::unique('tools', 'code')],
            'name' => ['required', 'string', 'max:255'],
            'image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:2048'],
            'brand' => ['nullable', 'string', 'max:255'],
            'serial_number' => ['nullable', 'string', 'max:255'],
            'condition_status' => ['required', Rule::in(['baik', 'perlu-servis', 'rusak-ringan', 'rusak-berat'])],
            'location' => ['nullable', 'string', 'max:255'],
            'stock_total' => ['required', 'integer', 'min:0'],
            'stock_available' => ['required', 'integer', 'min:0', 'lte:stock_total'],
            'description' => ['nullable', 'string', 'max:1000'],
            'price' => ['required', 'numeric', 'min:0'],
        ];
    }
}
