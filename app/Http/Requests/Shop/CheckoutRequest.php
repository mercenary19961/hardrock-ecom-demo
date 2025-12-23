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
            'customer_phone' => 'nullable|string|max:50',

            'shipping_street' => 'required|string|max:255',
            'shipping_city' => 'required|string|max:255',
            'shipping_state' => 'nullable|string|max:255',
            'shipping_postal_code' => 'required|string|max:20',
            'shipping_country' => 'required|string|max:255',

            'billing_same' => 'boolean',
            'billing_street' => 'required_if:billing_same,false|nullable|string|max:255',
            'billing_city' => 'required_if:billing_same,false|nullable|string|max:255',
            'billing_state' => 'nullable|string|max:255',
            'billing_postal_code' => 'required_if:billing_same,false|nullable|string|max:20',
            'billing_country' => 'required_if:billing_same,false|nullable|string|max:255',

            'notes' => 'nullable|string|max:1000',
        ];
    }

    public function messages(): array
    {
        return [
            'customer_name.required' => 'Please enter your full name.',
            'customer_email.required' => 'Please enter your email address.',
            'customer_email.email' => 'Please enter a valid email address.',
            'shipping_street.required' => 'Please enter your shipping address.',
            'shipping_city.required' => 'Please enter your city.',
            'shipping_postal_code.required' => 'Please enter your postal code.',
            'shipping_country.required' => 'Please select your country.',
        ];
    }
}
