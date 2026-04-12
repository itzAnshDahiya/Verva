# VERVA – Premium Air Purifier E-Commerce Platform

VERVA is a production-grade full-stack e-commerce application for premium air purifiers, featuring advanced HEPA H13 filtration monitoring, smart sensors, and a modern shopping experience.

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v16+
- **MongoDB**: Atlas account or local installation

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env # Update with your MongoDB URI and secrets
npm run dev
```
**Expected:** `VERVA server running on http://localhost:5000`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
**Expected:** `Starting up http-server on http://localhost:5500`

---

## 🏗️ Architecture

- **Frontend**: Vanilla HTML5, CSS3 (Modern UI with Glassmorphism), and Pure JavaScript.
- **Backend**: Node.js, Express, MongoDB/Mongoose.
- **Authentication**: JWT-based (Access + Refresh tokens).
- **Features**: Cart management, Wishlist, Order processing, Real-time air quality sensor simulation.

## 🛠️ Testing & Debugging

- **API Connectivity**: Use `runFullTest()` in the browser console (F12) to diagnose backend connection issues.
- **Postman**: A collection is included (`VERVA_API.postman_collection.json`) for testing all endpoints.

## 📁 Project Structure

- `/frontend`: The web storefront and user dashboard.
- `/backend`: REST API server, database models, and controllers.
- `docker-compose.yml`: Container orchestration for development.

---

## 📍 Important Locations

| Feature | File Location |
|---------|---------------|
| Database Config | `backend/.env` |
| Auth Logic | `frontend/js/auth.js` |
| Cart Logic | `frontend/js/cart.js` |
| UI Interactivity| `frontend/js/main.js` |

---

## 🎓 Support & Documentation
For detailed setup instructions and feature status, please refer to the internal guides or visit [https://github.com/itzAnshDahiya/Verva](https://github.com/itzAnshDahiya/Verva).

**Last Updated:** 2026-04-12  
**Status:** ✅ Production ready.
