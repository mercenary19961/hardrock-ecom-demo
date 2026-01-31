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
