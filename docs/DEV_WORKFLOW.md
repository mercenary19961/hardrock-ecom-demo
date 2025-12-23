# Development Workflow

## Branch Strategy

```
main (production)
  │
  ├── develop (integration)
  │     │
  │     ├── feature/storefront-home
  │     ├── feature/product-catalog
  │     ├── feature/cart-system
  │     ├── feature/checkout-flow
  │     ├── feature/admin-dashboard
  │     └── feature/admin-products
  │
  └── hotfix/* (emergency fixes)
```

### Branch Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/<module>-<description>` | `feature/cart-quantity-update` |
| Bug fix | `fix/<issue>-<description>` | `fix/checkout-validation` |
| Hotfix | `hotfix/<description>` | `hotfix/payment-error` |
| Docs | `docs/<description>` | `docs/api-endpoints` |

---

## Development Setup

### First-Time Setup

```bash
# 1. Clone and enter project
git clone https://github.com/mercenary19961/hardrock-ecom-demo.git
cd hardrock-ecom-demo

# 2. Install dependencies
composer install
npm install

# 3. Environment configuration
cp .env.example .env
php artisan key:generate

# 4. Database setup
# Create MySQL database 'hardrock_ecom_demo'
php artisan migrate
php artisan db:seed

# 5. Storage link for images
php artisan storage:link

# 6. Start development servers (2 terminals)
php artisan serve          # Terminal 1: Laravel server
npm run dev                # Terminal 2: Vite dev server
```

### Daily Development

```bash
# Pull latest changes
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/your-feature

# Start servers
php artisan serve
npm run dev

# ... make changes ...

# Run checks before committing
npm run typecheck
npm run lint
php artisan test
```

---

## Commit Conventions

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting (no code change) |
| `refactor` | Code restructuring |
| `test` | Adding/updating tests |
| `chore` | Build/tooling changes |

### Examples

```bash
feat(cart): add quantity update functionality
fix(checkout): validate shipping address fields
docs(readme): add deployment instructions
refactor(products): extract image upload to service
test(orders): add order creation tests
chore(deps): update laravel to 12.1
```

---

## Pull Request Process

### Creating a PR

1. **Push your branch**
   ```bash
   git push -u origin feature/your-feature
   ```

2. **Create PR on GitHub**
   - Base: `develop`
   - Title: Same format as commits
   - Description: What changed and why

3. **PR Checklist**
   - [ ] Code follows existing patterns
   - [ ] TypeScript types are complete
   - [ ] No console errors/warnings
   - [ ] Tested manually
   - [ ] Database migrations run cleanly
   - [ ] No hardcoded values (use config/env)

### Code Review Guidelines

- Focus on logic, not style (automated by linting)
- Check for security issues
- Verify database queries are efficient
- Ensure error states are handled

---

## Testing

### Running Tests

```bash
# PHP tests
php artisan test                    # All tests
php artisan test --filter=CartTest  # Specific test

# TypeScript checks
npm run typecheck                   # Type checking
npm run lint                        # ESLint
```

### Test Structure

```
tests/
├── Feature/
│   ├── Admin/
│   │   ├── CategoryTest.php
│   │   ├── ProductTest.php
│   │   └── OrderTest.php
│   ├── Shop/
│   │   ├── CartTest.php
│   │   ├── CheckoutTest.php
│   │   └── ProductBrowsingTest.php
│   └── Auth/
│       └── AuthenticationTest.php
└── Unit/
    ├── Services/
    │   ├── CartServiceTest.php
    │   └── InventoryServiceTest.php
    └── Models/
        └── ProductTest.php
```

---

## Database Changes

### Creating Migrations

```bash
# Create migration
php artisan make:migration add_featured_to_products_table

# Run migrations
php artisan migrate

# Rollback last batch
php artisan migrate:rollback

# Fresh install with seeds (dev only!)
php artisan migrate:fresh --seed
```

### Migration Best Practices

1. **Always include down()** - For rollbacks
2. **Small, focused migrations** - One change per migration
3. **Use foreign key constraints** - Data integrity
4. **Add indexes** - For frequently queried columns

---

## Common Tasks

### Adding a New Page

1. Create Laravel controller method
2. Add route in `routes/web.php` or `routes/admin.php`
3. Create React page in `resources/js/pages/`
4. Add TypeScript types if needed

### Adding a New Component

1. Create component in `resources/js/components/`
2. Export from appropriate index.ts
3. Add TypeScript props interface
4. Use existing UI primitives when possible

### Adding a New API Endpoint

1. Create controller method
2. Add Form Request for validation
3. Add route (consider API versioning)
4. Update TypeScript types

---

## Troubleshooting

### Common Issues

**Vite not detecting changes**
```bash
rm -rf node_modules/.vite
npm run dev
```

**Database connection issues**
```bash
# Check .env database credentials
php artisan config:clear
php artisan cache:clear
```

**Storage images not showing**
```bash
php artisan storage:link
# Ensure storage/app/public exists
```

**TypeScript errors after pull**
```bash
npm install  # New dependencies
npm run typecheck  # See specific errors
```
