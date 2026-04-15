<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLoanRequest extends FormRequest
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
            'borrower_name' => ['required', 'string', 'max:255'],
            'borrower_identifier' => ['nullable', 'string', 'max:255'],
            'borrower_phone' => ['nullable', 'string', 'max:50'],
            'purpose' => ['required', 'string', 'max:1000'],
            'loan_date' => ['required', 'date'],
            'return_due_date' => ['required', 'date', 'after_or_equal:loan_date'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.tool_id' => ['required', 'integer', 'distinct', 'exists:tools,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.condition_out' => ['nullable', 'string', 'max:255'],
        ];
    }
}
