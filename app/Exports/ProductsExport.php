<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ProductsExport implements FromCollection, WithHeadings, WithMapping, WithStyles
{
    protected Collection $products;

    public function __construct(Collection $products)
    {
        $this->products = $products;
    }

    public function collection(): Collection
    {
        return $this->products;
    }

    public function headings(): array
    {
        return [
            'ID',
            'SKU',
            'Slug',
            'Name',
            'Name (AR)',
            'Short Description',
            'Short Description (AR)',
            'Description',
            'Description (AR)',
            'Category',
            'Subcategory',
            'Price',
            'Compare Price',
            'Discount %',
            'Stock',
            'Low Stock Threshold',
            'Status',
            'Featured',
            'Color',
            'Color Hex',
            'Available Sizes',
            'Size Stock',
            'Available Colors',
            'Variant Stock',
            'Product Group',
            'Times Purchased',
            'Avg Rating',
            'Review Count',
            'View Count',
            'Primary Image',
            'Created At',
            'Updated At',
        ];
    }

    public function map($product): array
    {
        $discountPercent = '';
        if ($product->compare_price && $product->compare_price > $product->price) {
            $discountPercent = round((($product->compare_price - $product->price) / $product->compare_price) * 100, 1) . '%';
        }

        $sizeStock = '';
        if ($product->size_stock && is_array($product->size_stock)) {
            $sizeStock = collect($product->size_stock)
                ->map(fn($qty, $size) => "{$size}:{$qty}")
                ->join(', ');
        }

        $availableSizes = '';
        if ($product->available_sizes && is_array($product->available_sizes)) {
            $availableSizes = implode(', ', $product->available_sizes);
        }

        $availableColors = '';
        if ($product->available_colors && is_array($product->available_colors)) {
            $availableColors = collect($product->available_colors)
                ->map(fn($color) => $color['name'] ?? $color)
                ->join(', ');
        }

        $variantStock = '';
        if ($product->variant_stock && is_array($product->variant_stock)) {
            $variantStock = collect($product->variant_stock)
                ->map(fn($qty, $key) => "{$key}:{$qty}")
                ->join(', ');
        }

        // Get subcategory (if category has a parent, then category is subcategory)
        $category = $product->category;
        $categoryName = '';
        $subcategoryName = '';
        if ($category) {
            if ($category->parent_id) {
                $subcategoryName = $category->name;
                $categoryName = $category->parent?->name ?? '';
            } else {
                $categoryName = $category->name;
            }
        }

        return [
            $product->id,
            $product->sku ?? '',
            $product->slug ?? '',
            $product->name,
            $product->name_ar ?? '',
            $product->short_description ?? '',
            $product->short_description_ar ?? '',
            $product->description ?? '',
            $product->description_ar ?? '',
            $categoryName,
            $subcategoryName,
            number_format($product->price, 2),
            $product->compare_price ? number_format($product->compare_price, 2) : '',
            $discountPercent,
            $product->stock,
            $product->low_stock_threshold ?? '',
            $product->is_active ? 'Active' : 'Inactive',
            $product->is_featured ? 'Yes' : 'No',
            $product->color ?? '',
            $product->color_hex ?? '',
            $availableSizes,
            $sizeStock,
            $availableColors,
            $variantStock,
            $product->product_group ?? '',
            $product->times_purchased,
            $product->average_rating ? number_format($product->average_rating, 1) : '',
            $product->rating_count,
            $product->view_count,
            ($product->slug ?? '') . '.webp',
            $product->created_at->format('Y-m-d H:i:s'),
            $product->updated_at->format('Y-m-d H:i:s'),
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
