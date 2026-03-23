# VERVA Backend - Production Grade API

Production-ready Node.js/Express/MongoDB backend for VERVA e-commerce platform.

## Features

✅ **Authentication & Authorization**
- JWT-based authentication with refresh tokens
- Password hashing with bcrypt
- Account lockout after failed attempts
- Email verification
- Role-based access control (User, Admin, Vendor)

✅ **Database**
- MongoDB with Mongoose ODM
- Optimized indexes for performance
- Data validation and sanitization
- TTL indexes for automatic cleanup

✅ **Caching**
- Redis integration for performance
- Automatic cache invalidation
- Session caching

✅ **Security**
- Rate limiting (General, Auth, Payment)
- CORS configuration
- Helmet security headers
- Input validation with Joi
- SQL/NoSql injection prevention

✅ **Payment Processing**
- Stripe integration
- Razorpay integration
- Coupon/discount system
- Order management

✅ **Notifications**
- Email notifications (transactional, promotional)
- Newsletter management
- Review requests
- Abandoned cart reminders

✅ **API Features**
- RESTful API design
- Pagination support
- Search functionality
- Product filtering
- Advanced error handling
- Comprehensive logging

## Installation

1. Install dependencies
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration

4. Run migrations/seed data:
```bash
npm run seed
```

## Running

Development:
```bash
npm run dev
```

Production:
```bash
npm start
```

## API Documentation

### Authentication
- `POST /api/v1/auth/signup` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password

### Products
- `GET /api/v1/products` - Get all products with filters
- `GET /api/v1/products/:slug` - Get product details
- `GET /api/v1/products/featured` - Get featured products
- `GET /api/v1/products/search?q=query` - Search products

### Cart
- `GET /api/v1/cart` - Get user cart
- `POST /api/v1/cart/items` - Add item to cart
- `PUT /api/v1/cart/items/:productId` - Update item quantity
- `DELETE /api/v1/cart/items/:productId` - Remove item
- `POST /api/v1/cart/coupon` - Apply coupon

## Deployment

### Using Docker
```bash
docker build -t verva-backend .
docker run -p 5000:5000 --env-file .env verva-backend
```

### Using PM2
```bash
pm2 start server.js --name verva-api
pm2 save
pm2 startup
```

### Using Heroku
```bash
heroku create verva-api
git push heroku main
```

## Environment Variables

See `.env.example` for all required variables

## Testing

```bash
npm test
```

## Logging

Logs are written to:
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only

## License

MIT
