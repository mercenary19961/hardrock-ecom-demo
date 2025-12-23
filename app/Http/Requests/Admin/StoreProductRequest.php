<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:products,slug',
            'description' => 'nullable|string',
            'short_description' => 'nullable|string|max:500',
            'price' => 'required|numeric|min:0',
            'compare_price' => 'nullable|numeric|min:0|gt:price',
            'sku' => 'nullable|string|max:100|unique:products,sku',
            'stock' => 'required|integer|min:0',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
            'images' => 'nullable|array|max:5',
            'images.*' => 'image|max:2048',
        ];
    }

    public function messages(): array
    {
        return [
            'compare_price.gt' => 'The compare price must be greater than the regular price.',
            'images.max' => 'You can upload a maximum of 5 images.',
        ];
    }
}
