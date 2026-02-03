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
            'Name',
            'Name (AR)',
            'Category',
            'Price',
            'Compare Price',
            'Discount %',
            'Stock',
            'Size Stock',
            'Status',
            'Featured',
            'Color',
            'Available Sizes',
            'Times Purchased',
            'Avg Rating',
            'Review Count',
            'View Count',
            'Created At',
            'Primary Image',
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

        return [
            $product->id,
            $product->sku ?? '',
            $product->name,
            $product->name_ar ?? '',
            $product->category?->name ?? '',
            number_format($product->price, 2),
            $product->compare_price ? number_format($product->compare_price, 2) : '',
            $discountPercent,
            $product->stock,
            $sizeStock,
            $product->is_active ? 'Active' : 'Inactive',
            $product->is_featured ? 'Yes' : 'No',
            $product->color ?? '',
            $availableSizes,
            $product->times_purchased,
            $product->average_rating ? number_format($product->average_rating, 1) : '',
            $product->rating_count,
            $product->view_count,
            $product->created_at->format('Y-m-d H:i:s'),
            $product->primaryImage?->path ?? '',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
