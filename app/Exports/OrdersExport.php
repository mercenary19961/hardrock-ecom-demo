<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class OrdersExport implements FromCollection, WithHeadings, WithMapping, WithStyles
{
    protected Collection $orders;

    public function __construct(Collection $orders)
    {
        $this->orders = $orders;
    }

    public function collection(): Collection
    {
        return $this->orders;
    }

    public function headings(): array
    {
        return [
            'Order Number',
            'Date',
            'Customer Name',
            'Customer Email',
            'Customer Phone',
            'Status',
            'Payment Status',
            'Payment Method',
            'Subtotal',
            'Tax',
            'Discount',
            'Total',
            'Items Count',
            'Shipping Address',
            'Tracking Number',
            'Carrier',
            'Notes',
        ];
    }

    public function map($order): array
    {
        $address = $order->shipping_address;
        $addressString = implode(', ', array_filter([
            $address['area'] ?? '',
            $address['street'] ?? '',
            $address['building'] ?? '',
        ]));

        return [
            $order->order_number,
            $order->created_at->format('Y-m-d H:i:s'),
            $order->customer_name,
            $order->customer_email,
            $order->customer_phone,
            ucfirst($order->status),
            ucfirst($order->payment_status),
            $order->payment_method ?? '',
            number_format($order->subtotal, 2),
            number_format($order->tax, 2),
            number_format($order->discount ?? 0, 2),
            number_format($order->total, 2),
            $order->items->count(),
            $addressString,
            $order->tracking_number ?? '',
            $order->carrier ?? '',
            $order->notes ?? '',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
