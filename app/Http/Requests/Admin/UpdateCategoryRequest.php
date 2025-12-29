<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('categories', 'slug')->ignore($this->category->id),
            ],
            'description' => 'nullable|string|max:1000',
            'image' => 'nullable|image|max:2048',
            'parent_id' => [
                'nullable',
                'exists:categories,id',
                Rule::notIn([$this->category->id]), // Can't be its own parent
            ],
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
            'low_stock_threshold' => 'nullable|integer|min:1|max:1000',
        ];
    }
}
