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
            'name_ar' => 'nullable|string|max:255',
            'slug' => 'nullable|string|max:255|unique:products,slug',
            'description' => 'nullable|string',
            'description_ar' => 'nullable|string',
            'short_description' => 'nullable|string|max:500',
            'short_description_ar' => 'nullable|string|max:500',
            'price' => 'required|numeric|min:0',
            'compare_price' => 'nullable|numeric|min:0|gt:price',
            'sku' => 'nullable|string|max:100|unique:products,sku',
            'stock' => 'required|integer|min:0',
            'low_stock_threshold' => 'nullable|integer|min:1|max:1000',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
            'images' => 'nullable|array|max:10',
            'images.*' => 'image|max:2048',
            // Variant fields
            'color' => 'nullable|string|max:100',
            'color_hex' => ['nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'available_sizes' => 'nullable|array',
            'available_sizes.*' => 'string|max:20',
            'size_stock' => 'nullable|array',
            'size_stock.*' => 'integer|min:0',
            'product_group' => 'nullable|string|max:100',
        ];
    }

    public function messages(): array
    {
        return [
            'compare_price.gt' => 'The compare price must be greater than the regular price.',
            'images.max' => 'You can upload a maximum of 10 images at once.',
        ];
    }
}
