<?php

namespace App\Support;

class Permission
{
    // Section.action constants
    const PRODUCTS_VIEW   = 'products.view';
    const PRODUCTS_CREATE = 'products.create';
    const PRODUCTS_EDIT   = 'products.edit';
    const PRODUCTS_DELETE = 'products.delete';

    const CATEGORIES_VIEW   = 'categories.view';
    const CATEGORIES_CREATE = 'categories.create';
    const CATEGORIES_EDIT   = 'categories.edit';
    const CATEGORIES_DELETE = 'categories.delete';

    const ORDERS_VIEW          = 'orders.view';
    const ORDERS_UPDATE_STATUS = 'orders.update_status';
    const ORDERS_EXPORT        = 'orders.export';

    const REVIEWS_VIEW   = 'reviews.view';
    const REVIEWS_DELETE = 'reviews.delete';

    const COUPONS_VIEW   = 'coupons.view';
    const COUPONS_CREATE = 'coupons.create';
    const COUPONS_EDIT   = 'coupons.edit';
    const COUPONS_DELETE = 'coupons.delete';

    const REPORTS_VIEW = 'reports.view';

    const CUSTOMERS_VIEW = 'customers.view';
    const CUSTOMERS_EDIT = 'customers.edit';

    const ACTIVITY_LOG_VIEW   = 'activity_log.view';
    const ACTIVITY_LOG_DELETE = 'activity_log.delete';

    /** Default permissions granted to every new editor. */
    const DEFAULTS = [
        'products'     => ['view' => true,  'create' => true,  'edit' => true,  'delete' => false],
        'categories'   => ['view' => true,  'create' => false, 'edit' => true,  'delete' => false],
        'orders'       => ['view' => true,  'update_status' => true, 'export' => false],
        'reviews'      => ['view' => true,  'delete' => true],
        'coupons'      => ['view' => true,  'create' => true,  'edit' => true,  'delete' => true],
        'reports'      => ['view' => true],
        'customers'    => ['view' => true,  'edit' => false],
        'activity_log' => ['view' => true,  'delete' => true],
    ];

    /** Default notification preferences for all staff (admin + editor). */
    const DEFAULT_NOTIFICATION_PREFS = [
        'in_app' => [
            'new_order'              => true,
            'low_stock'              => true,
            'editor_sensitive_action' => true,
        ],
        'email' => [
            'new_order'              => false,
            'low_stock'              => false,
            'editor_sensitive_action' => false,
        ],
    ];

    /** All available sections and their configurable actions (used to build the Authorization UI). */
    const SCHEMA = [
        'products'     => ['view', 'create', 'edit', 'delete'],
        'categories'   => ['view', 'create', 'edit', 'delete'],
        'orders'       => ['view', 'update_status', 'export'],
        'reviews'      => ['view', 'delete'],
        'coupons'      => ['view', 'create', 'edit', 'delete'],
        'reports'      => ['view'],
        'customers'    => ['view', 'edit'],
        'activity_log' => ['view', 'delete'],
    ];
}
