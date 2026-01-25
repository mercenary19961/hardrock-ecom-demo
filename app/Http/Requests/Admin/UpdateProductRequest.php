<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
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
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('products', 'slug')->ignore($this->product->id),
            ],
            'description' => 'nullable|string',
            'description_ar' => 'nullable|string',
            'short_description' => 'nullable|string|max:500',
            'short_description_ar' => 'nullable|string|max:500',
            'price' => 'required|numeric|min:0',
            'compare_price' => 'nullable|numeric|min:0',
            'sku' => [
                'nullable',
                'string',
                'max:100',
                Rule::unique('products', 'sku')->ignore($this->product->id),
            ],
            'stock' => 'required|integer|min:0',
            'low_stock_threshold' => 'nullable|integer|min:1|max:1000',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
            'images' => 'nullable|array|max:5',
            'images.*' => 'image|max:2048',
            'delete_images' => 'nullable|array',
            'delete_images.*' => 'integer|exists:product_images,id',
            'image_order' => 'nullable|array',
            'image_order.*' => 'integer|exists:product_images,id',
            'image_colors' => 'nullable|array',
            'image_colors.*' => 'nullable|string|max:100',
            // Variant fields
            'color' => 'nullable|string|max:100',
            'color_hex' => ['nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'available_colors' => 'nullable|array',
            'available_colors.*.name' => 'required_with:available_colors|string|max:100',
            'available_colors.*.hex' => ['required_with:available_colors', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'available_sizes' => 'nullable|array',
            'available_sizes.*' => 'string|max:20',
            'size_stock' => 'nullable|array',
            'size_stock.*' => 'integer|min:0',
            'variant_stock' => 'nullable|array',
            'variant_stock.*' => 'integer|min:0',
            'product_group' => 'nullable|string|max:100',
        ];
    }
}
