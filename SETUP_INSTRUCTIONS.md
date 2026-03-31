# 🚀 VERVA - Complete Setup Instructions

## ✅ Current Status
- All npm dependencies installed ✓
- Backend controllers and routes verified ✓
- Frontend HTML/JS properly configured ✓
- Environment file fixed with working values ✓

## ⚠️ What Needs To Be Done

### STEP 1: Set Up MongoDB (CRITICAL)
Your application needs a database to function. Choose ONE option:

#### **OPTION A: MongoDB Atlas Cloud (RECOMMENDED - No installation needed)**
1. Go to: https://www.mongodb.com/cloud/atlas
2. Click "Start Free"
3. Create account and sign in
4. Create a new cluster (select M0 tier - it's free)
5. Click "Connect" → "Drivers" → "Node.js"
6. Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/verva?retryWrites=true&w=majority`)
7. Open `backend/.env`
8. Find this line: `MONGODB_URI=mongodb+srv://<username>:<password>@your-cluster.mongodb.net/verva?retryWrites=true&w=majority`
9. Replace with your actual connection string
10. **IMPORTANT:** Replace `<username>` and `<password>` with your MongoDB Atlas credentials

#### **OPTION B: Local MongoDB Installation**
1. Download from: https://www.mongodb.com/try/download/community
2. Run the installer and choose "Complete Install"
3. Check "Run MongoDB as a Service" during installation
4. MongoDB will start automatically
5. Open `backend/.env`
6. Find the line: `# MONGODB_URI=mongodb://localhost:27017/verva`
7. Uncomment it (remove the `#`)
8. Comment out the MongoDB Atlas line above it

---

## STEP 2: Update JWT Secrets (PRODUCTION ONLY)
The current JWT secrets in `.env` are generic development values. For production:
1. Generate random 32+ character strings for:
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`
2. Update in `backend/.env`

---

## STEP 3: Configure Optional Services (Optional)
These are not required for basic functionality but enable specific features:

### Email Notifications (Gmail)
To enable password reset emails:
1. Go to: https://myaccount.google.com/security
2. Enable "2-Step Verification"
3. Go to "App passwords" and generate one for "Mail" on "Windows"
4. Update in `backend/.env`:
   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password-here
   ```

### Payment Processing (Optional)
- **Stripe**: Get keys from https://dashboard.stripe.com/apikeys
- **Razorpay**: Get keys from https://dashboard.razorpay.com/settings/api-keys

### Image Upload (Cloudinary - Optional)
1. Sign up at: https://cloudinary.com
2. Get API credentials from Dashboard
3. Add to `backend/.env`

---

## 🎯 START THE APPLICATION

### Method 1: Start Both Frontend & Backend Together
```bash
cd frontend
npm run dev:all
```
This command starts:
- Backend on: http://localhost:5000
- Frontend on: http://localhost:5500

### Method 2: Start Separately (Better for debugging)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
**Output should show:** `VERVA server running on http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
**Output should show:** `Starting up http-server`

---

## 🧪 TEST THE APPLICATION

### Open in Browser
```
http://localhost:5500
```

### Quick Test Checklist
- [ ] Home page loads
- [ ] Click "Shop" - product list appears
- [ ] Click "Sign Up" - signup form works
- [ ] Create a test account (any email, password min 6 chars)
- [ ] Log in with your test account
- [ ] Check user profile page
- [ ] Add items to cart
- [ ] View wishlist
- [ ] Check checkout page

### Test Credentials (After Signup)
- Email: Any unique email (e.g., `test@example.com`)
- Password: Minimum 6 characters
- Phone: Any phone number

---

## 🐛 Common Issues & Solutions

### **Issue: "MongoDB connection error"**
**Solution:** 
- Verify MONGODB_URI is correctly set in `backend/.env`
- If using local MongoDB: Run `mongod` in a separate terminal first
- If using Atlas: Check username/password are correct in connection string

### **Issue: "Cannot find module" errors**
**Solution:**
```bash
# In both frontend and backend directories
npm install
```

### **Issue: Port 5000 or 5500 already in use**
**Solution:**
```bash
# Change in frontend/package.json:
"dev": "live-server --port=5501"

# Change in backend/.env:
PORT=5001
```

### **Issue: CORS errors in console**
**Solution:**
- Ensure backend is running on port 5000
- Ensure frontend is running on port 5500
- Check that FRONTEND_URL in backend/.env = `http://localhost:5500`

---

## 📊 Project Structure
```
Backend:
├── controllers/ - Business logic
├── models/ - MongoDB schemas
├── routes/ - API endpoints
├── services/ - External services (Auth, Email, Payment)
├── middleware/ - Auth, validation, error handling
├── config/ - Database, cache, logger
└── server.js - Entry point

Frontend:
├── js/ - JavaScript (API calls, auth, cart logic)
├── css/ - Stylesheets
├── pages/ - HTML pages (index, shop, cart, checkout, etc)
└── assets/ - Images and resources
```

---

## 📱 API Endpoints Available

### Authentication
- `POST /api/v1/auth/signup` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password
- `GET /api/v1/auth/profile` - Get user profile (protected)
- `PUT /api/v1/auth/profile` - Update profile (protected)

### Products
- `GET /api/v1/products` - Get all products
- `GET /api/v1/products/:id` - Get single product
- `GET /api/v1/products/search` - Search products

### Cart
- `GET /api/v1/cart` - Get user cart
- `POST /api/v1/cart/add-item` - Add to cart
- `PUT /api/v1/cart/update/:itemId` - Update item quantity
- `DELETE /api/v1/cart/remove/:itemId` - Remove from cart

### Orders
- `POST /api/v1/orders` - Create order
- `GET /api/v1/orders` - Get user orders

---

## 🎓 Next Steps After Setup

1. **Explore the codebase** - Start with `backend/server.js` and `frontend/index.html`
2. **Add more products** - Use `/api/v1/products` to add items (requires admin)
3. **Customize styling** - Edit CSS files in `frontend/css/`
4. **Add features** - Payment integration, notifications, analytics, etc.
5. **Deploy** - Use Docker (docker-compose.yml is ready) or cloud platforms

---

## 🆘 Need Help?

Check these files for detailed info:
- `README.md` - General project overview
- `QUICK_START.md` - Quick reference
- `backend/SECRETS_MANAGEMENT.md` - Security details

---

**Last Updated:** March 31, 2026  
**Status:** Ready for development after MongoDB setup ✅
