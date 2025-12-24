# HardRock E-commerce Demo

A production-ready e-commerce demonstration platform built with Laravel + Inertia + React + TypeScript. This template serves as a reusable starter for client project demos.

**Live Demo:** [https://demo.hardrock-co.com](https://demo.hardrock-co.com)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Laravel 12, PHP 8.2+ |
| Frontend | React 18, TypeScript 5 |
| Bridge | Inertia.js 2.0 |
| Styling | Tailwind CSS 4 |
| Build | Vite 6 |
| Database | MySQL 8.0 |
| Hosting | Railway |
| CDN/DNS | Cloudflare |

---

## Quick Start

### Prerequisites
- PHP 8.2+
- Composer 2.x
- Node.js 20+ & npm
- MySQL 8.0+

### Installation

```bash
# Clone repository
git clone https://github.com/mercenary19961/hardrock-ecom-demo.git
cd hardrock-ecom-demo

# Install dependencies
composer install
npm install

# Environment setup
cp .env.example .env
php artisan key:generate

# Database setup
php artisan migrate --seed

# Start development servers
php artisan serve
npm run dev
```

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hardrock-co.com | demo1234 |
| Customer | customer@hardrock-co.com | demo1234 |

---

## Project Structure

```
hardrock-ecom-demo/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Admin/           # Admin panel controllers
│   │   │   └── Shop/            # Storefront controllers
│   │   ├── Middleware/
│   │   └── Requests/            # Form request validation
│   ├── Models/                  # Eloquent models
│   └── Services/                # Business logic services
├── database/
│   ├── migrations/
│   ├── seeders/
│   └── factories/
├── resources/
│   └── js/
│       ├── components/          # Reusable UI components
│       │   ├── ui/              # Base UI primitives
│       │   ├── shop/            # Shop-specific components
│       │   └── admin/           # Admin-specific components
│       ├── layouts/             # Page layouts
│       ├── pages/               # Inertia pages
│       │   ├── Shop/            # Storefront pages
│       │   ├── Admin/           # Admin pages
│       │   └── Auth/            # Authentication pages
│       ├── hooks/               # Custom React hooks
│       ├── lib/                 # Utilities
│       ├── types/               # TypeScript definitions
│       └── contexts/            # React contexts
├── routes/
│   ├── web.php                  # Main routes
│   ├── admin.php                # Admin routes
│   └── api.php                  # API routes (if needed)
├── docs/                        # Documentation
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── DEPLOYMENT.md
│   ├── DEV_WORKFLOW.md
│   └── DEMO_SCRIPT.md
├── storage/
│   └── app/public/products/     # Product images
└── public/
    └── storage -> ../storage/app/public
```

---

## Features

### Storefront (Customer-Facing)
- [ ] Category browsing with filtering
- [ ] Product listing with pagination
- [ ] Product detail pages with image gallery
- [ ] Search functionality
- [ ] Shopping cart (session-based, persisted for logged-in users)
- [ ] Checkout flow (demo mode)
- [ ] Order confirmation
- [ ] Order history (authenticated users)

### Admin Panel
- [ ] Dashboard with key metrics
- [ ] Category CRUD
- [ ] Product CRUD with image upload
- [ ] Inventory management
- [ ] Order management & status updates
- [ ] Demo data reset capability

### Technical Features
- [ ] Responsive design (mobile-first)
- [ ] TypeScript throughout
- [ ] Form validation (client + server)
- [ ] Toast notifications
- [ ] Loading states
- [ ] Error boundaries
- [ ] SEO meta tags

---

## Development

```bash
# Run development server
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Build for production
npm run build

# Run tests
php artisan test
npm run test
```

---

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for complete Railway + Cloudflare setup instructions.

### Quick Deploy Checklist
1. Create Railway project
2. Add MySQL database service
3. Configure environment variables
4. Add custom domain: `demo.hardrock-co.com`
5. Create Cloudflare CNAME record pointing to Railway target
6. Wait for SSL certificate provisioning

---

## Documentation

- [Architecture Overview](docs/ARCHITECTURE.md)
- [Database Schema](docs/DATABASE.md) | [View Diagram](https://drawsql.app/teams/hardrock/diagrams/hardrock-e-commerce-demo)
- [Development Workflow](docs/DEV_WORKFLOW.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Demo Script](docs/DEMO_SCRIPT.md)

---

## License

Proprietary - HardRock Marketing & Technology

---

## Support

For questions or issues, contact the development team at dev@hardrock-co.com
