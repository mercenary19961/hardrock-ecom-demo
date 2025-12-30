<?php

namespace App\Http\Requests\Shop;

use Illuminate\Foundation\Http\FormRequest;

class CheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_name' => 'required|string|max:255',
            'customer_email' => 'required|email|max:255',
            'customer_phone' => 'required|string|max:50',

            'delivery_area' => 'required|string|max:255',
            'delivery_street' => 'required|string|max:255',
            'delivery_building' => 'required|string|max:255',
            'delivery_notes' => 'nullable|string|max:500',

            'notes' => 'nullable|string|max:1000',
        ];
    }

    public function messages(): array
    {
        return [
            'customer_name.required' => 'Please enter your full name.',
            'customer_email.required' => 'Please enter your email address.',
            'customer_email.email' => 'Please enter a valid email address.',
            'customer_phone.required' => 'Please enter your phone number.',
            'delivery_area.required' => 'Please enter your area or neighborhood.',
            'delivery_street.required' => 'Please enter your street name.',
            'delivery_building.required' => 'Please enter your building, floor, and apartment details.',
        ];
    }
}
