<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Contracts\Validation\Validator;

class UpdateProductRequest extends FormRequest
{
    public const MAX_IMAGES_PER_UPLOAD = 10;
    public const MAX_TOTAL_IMAGES = 15;

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
            'images' => 'nullable|array|max:' . self::MAX_IMAGES_PER_UPLOAD,
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

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $product = $this->route('product');

            // Calculate total images after this update
            $existingImages = $product->images()->count();
            $deleteImages = count($this->input('delete_images', []));
            $newImages = $this->hasFile('images') ? count($this->file('images')) : 0;

            $totalAfterUpdate = $existingImages - $deleteImages + $newImages;

            if ($totalAfterUpdate > self::MAX_TOTAL_IMAGES) {
                $validator->errors()->add(
                    'images',
                    "A product can have a maximum of " . self::MAX_TOTAL_IMAGES . " images. " .
                    "Current: {$existingImages}, Deleting: {$deleteImages}, Adding: {$newImages} = {$totalAfterUpdate} total."
                );
            }
        });
    }

    public function messages(): array
    {
        return [
            'images.max' => 'You can upload a maximum of ' . self::MAX_IMAGES_PER_UPLOAD . ' images at once.',
        ];
    }
}
