<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    /**
     * Default settings structure with groups and fields
     */
    private array $settingsStructure = [
        'general' => [
            'label' => 'General',
            'description' => 'Basic store information',
            'fields' => [
                'store_name' => [
                    'label' => 'Store Name',
                    'type' => 'text',
                    'default' => 'HardRock Store',
                    'placeholder' => 'Enter store name',
                ],
                'store_name_ar' => [
                    'label' => 'Store Name (Arabic)',
                    'type' => 'text',
                    'default' => 'متجر هارد روك',
                    'placeholder' => 'أدخل اسم المتجر',
                    'rtl' => true,
                ],
                'store_email' => [
                    'label' => 'Store Email',
                    'type' => 'email',
                    'default' => 'support@hardrock-demo.com',
                    'placeholder' => 'support@example.com',
                ],
                'store_phone' => [
                    'label' => 'Store Phone',
                    'type' => 'text',
                    'default' => '+962 79 123 4567',
                    'placeholder' => '+962 xx xxx xxxx',
                ],
                'store_address' => [
                    'label' => 'Store Address',
                    'type' => 'textarea',
                    'default' => 'Amman, Jordan',
                    'placeholder' => 'Enter store address',
                ],
            ],
        ],
        'currency' => [
            'label' => 'Currency & Pricing',
            'description' => 'Configure currency display and tax settings',
            'fields' => [
                'currency_code' => [
                    'label' => 'Currency Code',
                    'type' => 'select',
                    'default' => 'JOD',
                    'options' => [
                        ['value' => 'JOD', 'label' => 'JOD - Jordanian Dinar'],
                        ['value' => 'USD', 'label' => 'USD - US Dollar'],
                        ['value' => 'EUR', 'label' => 'EUR - Euro'],
                        ['value' => 'GBP', 'label' => 'GBP - British Pound'],
                        ['value' => 'AED', 'label' => 'AED - UAE Dirham'],
                        ['value' => 'SAR', 'label' => 'SAR - Saudi Riyal'],
                    ],
                ],
                'currency_symbol' => [
                    'label' => 'Currency Symbol',
                    'type' => 'text',
                    'default' => 'JD',
                    'placeholder' => '$, €, £, etc.',
                ],
                'currency_symbol_ar' => [
                    'label' => 'Currency Symbol (Arabic)',
                    'type' => 'text',
                    'default' => 'د.أ',
                    'placeholder' => 'دينار، ريال، etc.',
                    'rtl' => true,
                ],
                'tax_rate' => [
                    'label' => 'Tax Rate (%)',
                    'type' => 'number',
                    'default' => '16',
                    'placeholder' => '0',
                    'min' => 0,
                    'max' => 100,
                    'step' => 0.01,
                ],
                'tax_included' => [
                    'label' => 'Prices Include Tax',
                    'type' => 'boolean',
                    'default' => true,
                    'description' => 'If enabled, displayed prices already include tax',
                ],
            ],
        ],
        'shipping' => [
            'label' => 'Shipping',
            'description' => 'Configure shipping options and costs',
            'fields' => [
                'free_shipping_threshold' => [
                    'label' => 'Free Shipping Threshold',
                    'type' => 'number',
                    'default' => '50',
                    'placeholder' => '0 for no free shipping',
                    'min' => 0,
                    'description' => 'Orders above this amount get free shipping (0 to disable)',
                ],
                'default_shipping_cost' => [
                    'label' => 'Default Shipping Cost',
                    'type' => 'number',
                    'default' => '5',
                    'placeholder' => '0',
                    'min' => 0,
                    'step' => 0.01,
                ],
                'express_shipping_cost' => [
                    'label' => 'Express Shipping Cost',
                    'type' => 'number',
                    'default' => '10',
                    'placeholder' => '0',
                    'min' => 0,
                    'step' => 0.01,
                ],
                'shipping_enabled' => [
                    'label' => 'Enable Shipping',
                    'type' => 'boolean',
                    'default' => true,
                    'description' => 'Enable shipping for orders',
                ],
            ],
        ],
        'inventory' => [
            'label' => 'Inventory',
            'description' => 'Stock and inventory settings',
            'fields' => [
                'low_stock_threshold' => [
                    'label' => 'Low Stock Threshold',
                    'type' => 'number',
                    'default' => '10',
                    'placeholder' => '10',
                    'min' => 0,
                    'description' => 'Products below this quantity are marked as low stock',
                ],
                'out_of_stock_visibility' => [
                    'label' => 'Show Out of Stock Products',
                    'type' => 'boolean',
                    'default' => true,
                    'description' => 'Display products that are out of stock in the shop',
                ],
                'stock_management' => [
                    'label' => 'Enable Stock Management',
                    'type' => 'boolean',
                    'default' => true,
                    'description' => 'Track and manage product inventory',
                ],
            ],
        ],
        'checkout' => [
            'label' => 'Checkout',
            'description' => 'Checkout process settings',
            'fields' => [
                'guest_checkout' => [
                    'label' => 'Allow Guest Checkout',
                    'type' => 'boolean',
                    'default' => true,
                    'description' => 'Allow customers to checkout without creating an account',
                ],
                'min_order_amount' => [
                    'label' => 'Minimum Order Amount',
                    'type' => 'number',
                    'default' => '0',
                    'placeholder' => '0 for no minimum',
                    'min' => 0,
                    'description' => 'Minimum cart total required to checkout (0 for no minimum)',
                ],
                'order_notes_enabled' => [
                    'label' => 'Enable Order Notes',
                    'type' => 'boolean',
                    'default' => true,
                    'description' => 'Allow customers to add notes to their orders',
                ],
            ],
        ],
        'notifications' => [
            'label' => 'Notifications',
            'description' => 'Email notification settings',
            'fields' => [
                'admin_email' => [
                    'label' => 'Admin Notification Email',
                    'type' => 'email',
                    'default' => 'admin@hardrock-demo.com',
                    'placeholder' => 'admin@example.com',
                    'description' => 'Email address for admin notifications',
                ],
                'new_order_notification' => [
                    'label' => 'New Order Notifications',
                    'type' => 'boolean',
                    'default' => true,
                    'description' => 'Send email when a new order is placed',
                ],
                'low_stock_notification' => [
                    'label' => 'Low Stock Notifications',
                    'type' => 'boolean',
                    'default' => true,
                    'description' => 'Send email when product stock is low',
                ],
            ],
        ],
    ];

    public function index(): Response
    {
        // Get all settings from database
        $dbSettings = Setting::all()->keyBy('key');

        // Merge with structure and apply defaults
        $settings = [];
        foreach ($this->settingsStructure as $group => $groupData) {
            $settings[$group] = [
                'label' => $groupData['label'],
                'description' => $groupData['description'],
                'fields' => [],
            ];

            foreach ($groupData['fields'] as $key => $field) {
                $dbSetting = $dbSettings->get($key);
                $value = $dbSetting ? $dbSetting->value : ($field['default'] ?? null);

                // Cast value based on type
                if ($field['type'] === 'boolean') {
                    $value = filter_var($value, FILTER_VALIDATE_BOOLEAN);
                } elseif ($field['type'] === 'number') {
                    $value = is_numeric($value) ? (float) $value : ($field['default'] ?? 0);
                }

                $settings[$group]['fields'][$key] = array_merge($field, [
                    'key' => $key,
                    'value' => $value,
                ]);
            }
        }

        return Inertia::render('Admin/Settings/Index', [
            'settings' => $settings,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->all();

        foreach ($this->settingsStructure as $group => $groupData) {
            foreach ($groupData['fields'] as $key => $field) {
                if (array_key_exists($key, $data)) {
                    $value = $data[$key];

                    // Handle boolean values from checkboxes
                    if ($field['type'] === 'boolean') {
                        $value = filter_var($value, FILTER_VALIDATE_BOOLEAN) ? '1' : '0';
                    }

                    Setting::set($key, $value, $group, $field['type']);
                }
            }
        }

        // Clear all settings cache
        Setting::clearCache();

        return back()->with('success', 'Settings saved successfully.');
    }
}
