# Railway Production Environment Variables

Add these to your Railway environment variables to optimize database performance:

## Database Optimization

```bash
# Enable persistent connections (reuse DB connections)
DB_PERSISTENT=true

# Reduce connection timeout from 60s to 5s
DB_TIMEOUT=5

# Connection pool settings
DB_POOL_MIN=2
DB_POOL_MAX=10
```

## Cache Configuration (Important!)

```bash
# Use file cache instead of database to reduce DB queries
CACHE_STORE=file

# Use file sessions instead of database
SESSION_DRIVER=file
```

## How to Add in Railway:

1. Go to your Railway project
2. Click on your service (hardrock-ecom-demo)
3. Go to "Variables" tab
4. Click "New Variable" and add each one
5. Redeploy after adding variables

## Expected Improvement:

-   Current: 6-11 seconds per page
-   Target: Under 2 seconds per page

The main issue is that every request is creating new database connections. Persistent connections will reuse existing connections, dramatically reducing latency.
