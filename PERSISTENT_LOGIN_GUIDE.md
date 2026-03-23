# ✅ VERVA Authentication Setup - Persistent Login Guide

## 🎯 Current Status

### ✅ Backend Status
- **MongoDB Connection:** WORKING ✅
  ```
  MongoDB connected: ac-8emkkw1-shard-00-01.bjyaf30.mongodb.net
  Database indexes created successfully
  Database connected
  ```
- **Server Running:** On `http://localhost:5000` ✅
- **API Endpoints:** Ready at `/api/v1` ✅
- **Database:** Configured at `mongodb+srv://delhi3778_db_user:M5fIFQMhr4rraAZS@cluster0.bjyaf30.mongodb.net/verva` ✅

### ✅ Frontend Status
- **Server Running:** On `http://localhost:5500` ✅
- **Auth Pages:** `/login` and `/signup` ready ✅
- **Token Storage:** localStorage configured ✅

---

## 🔐 How Persistent Login Works

### Login Flow (After Signup)
```
1. User fills signup form on /signup
   ├─ Name: Arjun Kapoor
   ├─ Email: arjun@example.com
   ├─ Password: mypassword123
   └─ Phone: 9876543210

2. Frontend sends POST to /api/v1/auth/signup
   ├─ Backend validates input
   ├─ Hashes password with bcryptjs
   ├─ Creates user in MongoDB
   └─ Returns tokens

3. Frontend receives response
   ├─ Stores accessToken in localStorage['VERVA-token']
   ├─ Stores refreshToken in localStorage['VERVA-refresh-token']
   ├─ Stores user info in localStorage['VERVA-user']
   ├─ Dispatches VERVA:authchanged event
   └─ Redirects to /account

4. Header Updates
   ├─ Detects token in localStorage
   ├─ Shows user avatar (instead of Sign In/Sign Up buttons)
   └─ Stays logged in until logout or token expires
```

### Session Persistence
- **When you refresh the page:**
  - Frontend checks localStorage for tokens
  - If tokens exist, you're automatically logged in
  - Header shows user avatar immediately
  - No re-login needed

- **When you close and reopen browser:**
  - localStorage persists (unlike sessionStorage)
  - Tokens are still there
  - You stay logged in!

- **When token expires:**
  - Frontend uses refreshToken to get new accessToken
  - Background process, no logout needed
  - Access continues seamlessly

---

## 🧪 Testing Persistent Login (Step by Step)

### Step 1: Open Browser Developer Tools
```
Press: F12
Select:
  ├─ Console tab (for messages)
  ├─ Network tab (to see API calls)
  ├─ Application > LocalStorage (to see stored tokens)
```

### Step 2: Test Signup (Create New Account)
```
URL: http://localhost:5500/signup

1. Fill the form:
   □ Name: Test User
   □ Email: test-${Date.now()}@example.com
   □ Password: password12345
   □ Phone: 9876543210

2. Click "Continue" button → Advance to Step 2

3. Fill preferences (optional):
   □ Select home size
   □ Select concerns
   □ Check newsletter

4. Click "Create Account"

Expected Results:
   ✓ Green success message appears
   ✓ Page redirects to /account
   ✓ Header shows user avatar
   ✓ Account page displays your name
```

### Step 3: Verify Tokens Stored
```
In Browser Console (F12):

Copy & Paste:
  JSON.parse(localStorage.getItem('VERVA-user'))

Should show:
  {
    "id": "...",
    "name": "Test User",
    "email": "test-@example.com",
    "role": "user"
  }
```

### Step 4: Test Persistent Login (Refresh Page)
```
While logged in at /account:

1. Press: F5 (refresh page)
   Expected: Stay logged in, page doesn't redirect
   
2. Check header: Should still show avatar
   
3. Check localStorage (F12 > Application > LocalStorage):
   ├─ VERVA-token: ✓ Still there
   ├─ VERVA-refresh-token: ✓ Still there
   └─ VERVA-user: ✓ Still there
   
Result: ✅ Persistent login working!
```

### Step 5: Test Logout and Re-Login
```
1. Click on avatar in header
   └─ Select "Logout"

2. Expected results:
   ✓ Tokens cleared from localStorage
   ✓ Redirected to homepage
   ✓ Header shows "Sign In" + "Sign Up" buttons again

3. Go back to /login

4. Fill login form:
   □ Email: (same as signup)
   □ Password: (same as signup)
   
5. Click "Sign In"

6. Expected:
   ✓ Success message
   ✓ Redirected to /account
   ✓ Header shows avatar again
   ✓ Tokens stored again in localStorage
```

### Step 6: Test Browser Restart (Full Persistence)
```
1. While logged in:
   │
   ├─ Go to /account
   ├─ Check header (shows avatar)
   └─ Close browser completely (Ctrl+Q or X)

2. Wait 5 seconds

3. Open browser again
   │
   ├─ Go to http://localhost:5500
   ├─ Check header
   │
   └─ Result: ✅ Still logged in!
      (Because localStorage persists even after browser closes)
```

---

## 🔍 Network Debugging (F12 > Network Tab)

### During Signup
```
Look for: POST /api/v1/auth/signup

Response should show:
{
  "success": true,
  "code": "SIGNUP_SUCCESS",
  "message": "Account created successfully",
  "data": {
    "user": { ... },
    "accessToken": "eyJ...",  ← Stored in localStorage
    "refreshToken": "eyJ..."  ← Stored in localStorage
  }
}

Status: 201 Created ✅
```

### During Login
```
Look for: POST /api/v1/auth/login

Response should show:
{
  "success": true,
  "code": "LOGIN_SUCCESS",
  "message": "Login successful",
  "data": {
    "user": { ... },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}

Status: 200 OK ✅
```

### Checking Token in Requests
```
After login, check other API requests:

Headers should include:
  Authorization: Bearer eyJ... ← Token sent automatically

This proves frontend is correctly:
  1. Storing token
  2. Reading token from localStorage
  3. Sending it with requests
```

---

## 🛠️ Console Commands for Testing

### View Current User
```javascript
JSON.parse(localStorage.getItem('VERVA-user'))
```

### View Access Token
```javascript
localStorage.getItem('VERVA-token')
```

### View Refresh Token
```javascript
localStorage.getItem('VERVA-refresh-token')
```

### Check If Logged In
```javascript
!!localStorage.getItem('VERVA-token')
// Returns: true (logged in) or false (not logged in)
```

### Manually Clear All Auth Data
```javascript
localStorage.removeItem('VERVA-token');
localStorage.removeItem('VERVA-refresh-token');
localStorage.removeItem('VERVA-user');
location.reload();  // Refresh to see changes
```

### Run Full API Test
```javascript
runFullTest()  // Uses the connection-tester.js utility
```

---

## 🔄 Token Lifecycle

### Access Token
- **Purpose:** Proves you're logged in
- **Duration:** 7 days 
- **Stored In:** localStorage['VERVA-token']
- **Used For:** Every API request (sent in Authorization header)

### Refresh Token
- **Purpose:** Gets new access token when ours expires
- **Duration:** 30 days
- **Stored In:** localStorage['VERVA-refresh-token']
- **Used For:** Getting new access token (automatic)

### What Happens When Token Expires?
```
User making a request → Token is expired?
  │
  ├─ NO → Use existing token, request succeeds
  │
  └─ YES → Automatically exchange refresh token for new access token
     └─ Retry original request with new token
     └─ User never notices (background process)
```

---

## 🚀 Quick Start Commands

```bash
# Terminal 1: Start Backend
cd backend
npm run dev

# Terminal 2: Start Frontend
cd frontend
npx http-server -p 5500 -c-1

# Browser: Open Dev Tools and Test
F12  # Open DevTools
runFullTest()  # Test API connection
```

---

## ✅ Checklist: Everything Should Work

After following these steps:

- [ ] Backend running on http://localhost:5000
- [ ] Frontend running on http://localhost:5500
- [ ] Can create new account at /signup
- [ ] Redirected to /account after signup
- [ ] Header shows user avatar
- [ ] Can refresh page and stay logged in
- [ ] localStorage has 3 items (token, refresh-token, user)
- [ ] Can logout and return to /login
- [ ] Can login again with same credentials
- [ ] Browser restart keeps you logged in
- [ ] Tokens sent with all API requests

---

## 🐛 Troubleshooting

### "Login button disabled" or "not responding"
- Check: F12 > Console for errors
- Check: F12 > Network tab for failed request
- Check: Backend logs for error messages
- Verify: Email doesn't already exist (try another email)

### "Logged out randomly"
- Check if: Refresh token has expired (30 days)
- Check: Browser cookies/storage not cleared
- Try: Clear all localStorage and re-login

### "Can't redirect to /account after login"
- Check: /account.html exists in frontend folder
- Check: No JavaScript errors in F12 console
- Check: Token is actually stored (F12 > Application > LocalStorage)

### "API says email already registered"
- This is GOOD! Means account creation worked
- Use a different email for next test
- Or use: `test-${Date.now()}@example.com` for unique email

### "Rate limited (429) error"
- Too many login attempts from same IP
- Wait 15 minutes before trying again
- Or restart backend server

---

## 📊 Backend Response Codes

| Code | Meaning | Action |
|------|---------|--------|
| 201 | Account created | ✅ Success, redirecting |
| 200 | Login successful | ✅ Success, redirecting |
| 400 | Bad request (missing fields) | ❌ Fill all fields properly |
| 400 | Email already registered | ❌ Use different email |
| 401 | Wrong password | ❌ Check password spelling |
| 401 | Invalid email | ❌ Email not found |
| 423 | Account locked | ❌ Wait 2 hours (too many tries) |
| 429 | Rate limited | ❌ Wait 15 minutes |
| 500 | Server error | ❌ Check backend logs |

---

## 🎓 Key Concepts

### localStorage
- Data persists even after browser closes
- Perfect for storing login tokens
- About 5-10MB per domain
- Used: For auth tokens, user preferences, etc.

### sessionStorage  
- Cleared when you close the tab
- NOT used here (we want persistent login)
- About 5-10MB per domain

### Tokens (JWT)
- Not passwords, much safer
- Contain encrypted user info
- Can be decoded by backend to verify user
- Expire automatically

### CORS
- Allows frontend (http://localhost:5500) to talk to backend (http://localhost:5000)
- Backend sends headers allowing this
- Prevents unauthorized cross-origin requests

---

**You're all set! 🚀 Everything should now work with persistent login. Use the tests above to verify everything is working.**

