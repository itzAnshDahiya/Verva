# 🔐 VERVA Secrets Management Guide

## Overview

All sensitive information (API keys, database credentials, security tokens) is **hidden** in the `.env` file and uses **environment variable references** instead of hardcoded values. This prevents accidental exposure in version control.

---

## ✅ Security Setup Verification

### What's Protected

| Secret | Status | Reference |
|--------|--------|-----------|
| MongoDB Credentials | ✅ Hidden | `${MONGODB_URI}` |
| JWT Secrets | ✅ Hidden | `${JWT_SECRET}`, `${JWT_REFRESH_SECRET}` |
| Email Password | ✅ Hidden | `${EMAIL_PASSWORD}` |
| Stripe Keys | ✅ Hidden | `${STRIPE_SECRET_KEY}`, `${STRIPE_PUBLIC_KEY}` |
| Razorpay Keys | ✅ Hidden | `${RAZORPAY_KEY_ID}`, `${RAZORPAY_KEY_SECRET}` |
| Cloudinary Keys | ✅ Hidden | `${CLOUDINARY_API_KEY}`, `${CLOUDINARY_API_SECRET}` |
| Redis Password | ✅ Hidden | `${REDIS_PASSWORD}` |
| Admin Credentials | ✅ Hidden | `${ADMIN_EMAIL}`, `${ADMIN_PASSWORD}` |

### What's Protected in `.gitignore`

```
✅ .env                 (Never committed)
✅ .env.local           (Local overrides)
✅ logs/                (Contain sensitive data)
✅ uploads/             (User-uploaded files)
✅ node_modules/        (Dependencies)
```

---

## 🚀 How to Set Up Secrets Locally

### Step 1: Copy `.env.example` to `.env`
```bash
cd backend
cp .env.example .env
```

### Step 2: Add Your Actual Secrets

Open `.env` and replace the `${PLACEHOLDER}` references with your actual values:

```bash
# Example .env file (LOCAL ONLY - Never commit!)
MONGODB_URI=mongodb+srv://your_user:your_password@cluster.mongodb.net/verva?retryWrites=true&w=majority
JWT_SECRET=your-32-character-random-secret-key-here
JWT_REFRESH_SECRET=your-32-character-random-refresh-key-here
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
STRIPE_SECRET_KEY=sk_test_your_actual_key
STRIPE_PUBLIC_KEY=pk_test_your_actual_key
RAZORPAY_KEY_ID=your_actual_key_id
RAZORPAY_KEY_SECRET=your_actual_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
ADMIN_EMAIL=admin@verva.com
ADMIN_PASSWORD=your-secure-password
```

### Step 3: Verify `.gitignore` Protects `.env`

```bash
cat .gitignore
# Should include: .env
```

---

## 📋 Environment Variable Format

### Placeholder Pattern Used

```
Variable Name: ${UPPERCASE_NAME}
```

This pattern:
- ✅ Makes it clear a variable needs configuration
- ✅ Cannot be accidentally used as a literal string
- ✅ Requires explicit configuration

### Example

**In `.env` (shown):**
```
JWT_SECRET=${JWT_SECRET}
```

**In `.env` (actual, local):**
```
JWT_SECRET=supersecretkey123456789abcdefgh
```

---

## 🔄 How Backend Reads These Values

### Node.js `dotenv` Package

The backend automatically loads variables from `.env`:

```javascript
// In server.js - loaded before any other code
require('dotenv').config();

// Access variables anywhere:
const jwtSecret = process.env.JWT_SECRET;
const mongoUri = process.env.MONGODB_URI;
// etc.
```

### No Hardcoded Values

❌ **Don't do this:**
```javascript
const mongoUri = 'mongodb+srv://user:password@cluster...'; // EXPOSED!
```

✅ **Do this instead:**
```javascript
const mongoUri = process.env.MONGODB_URI; // From .env, not exposed
```

---

## 🌍 Production Deployment

### Option 1: Environment Variables (Recommended)

Set variables directly on your hosting platform:

**Heroku:**
```bash
heroku config:set JWT_SECRET=your-secret-key
heroku config:set MONGODB_URI=mongodb+srv://...
heroku config:set STRIPE_SECRET_KEY=sk_test_...
# etc.
```

**AWS:**
```bash
aws secretsmanager create-secret --name VERVA_JWT_SECRET --secret-string "your-value"
aws secretsmanager create-secret --name VERVA_MONGODB_URI --secret-string "mongodb+srv://..."
```

**GitHub Actions (CI/CD):**
```yaml
env:
  JWT_SECRET: ${{ secrets.JWT_SECRET }}
  MONGODB_URI: ${{ secrets.MONGODB_URI }}
  STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
```

### Option 2: `.env.production` (Use with care)

```bash
# On production server only:
echo "JWT_SECRET=your-production-key" > .env.production
echo "MONGODB_URI=mongodb+srv://prod-user:prod-pass@..." >> .env.production

# Set permissions (read-only for app user):
chmod 600 .env.production
```

---

## 🛡️ Security Best Practices

### ✅ Secrets Management Checklist

- [ ] `.env` file is in `.gitignore`
- [ ] `.env` file is NEVER committed to git
- [ ] `.env.example` shows template only (no real values)
- [ ] All API keys are strong and random (min 32 characters)
- [ ] Different keys for development vs production
- [ ] Secrets rotated regularly (3-6 months)
- [ ] Access logged for sensitive operations
- [ ] Secrets never logged in error messages

### ✅ What NOT To Do

❌ Hardcode secrets in source code  
❌ Add `.env` file to git  
❌ Share secrets via chat/email  
❌ Use same secrets for dev and prod  
❌ Expose secrets in error messages  
❌ Log sensitive data  
❌ Commit secrets then remove (git history keeps them)  

###  ✅ Regenerate If Exposed

**If a secret is accidentally exposed:**

1. **Immediately rotate it:**
   ```bash
   # Generate new secret
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   # Update in production
   ```

2. **Update everywhere:**
   - Production environment
   - CI/CD secrets
   - Third-party services

3. **Revoke old secret:**
   - Stripe: Revoke old API key
   - Razorpay: Regenerate credentials
   - Cloudinary: Rotate API key
   - Database: Change password

4. **Audit logs:**
   - Check what was accessed with old secret
   - Monitor for unauthorized activity

---

## 📝 Example Configurations

### Local Development (`.env`)
```
NODE_ENV=development
MONGODB_URI=${MONGODB_URI}  # ← Placeholder
JWT_SECRET=${JWT_SECRET}    # ← Placeholder
EMAIL_USER=${EMAIL_USER}    # ← Placeholder
```

### Local Development (actual `.env` file)
```
NODE_ENV=development
MONGODB_URI=mongodb+srv://dev_user:dev_pass@cluster0.mongodb.net/verva-dev
JWT_SECRET=dev_secret_key_length_32_or_more_at_least
EMAIL_USER=dev.account@gmail.com
```

### Production (Environment Variables)
```
NODE_ENV=production
MONGODB_URI=<set via Heroku/AWS/etc>
JWT_SECRET=<set via Heroku/AWS/etc>
EMAIL_USER=<set via Heroku/AWS/etc>
```

---

## 🔍 Verification

### Check That Secrets Are Hidden

**Before pushing code:**
```bash
# Should show NO real secrets
git diff --cached -- backend/.env

# Should show only ${PLACEHOLDER} references
cat backend/.env | grep -E "(secret|password|key)"
```

**Verify environment variables work:**
```bash
# In Node REPL
node
> require('dotenv').config();
> console.log(process.env.JWT_SECRET) // Should print actual value
> console.log(process.env.MONGODB_URI) // Should print actual value
```

---

## 🚨 Troubleshooting

### "process.env.XXX is undefined"

**Problem:** Secret variable not loaded

**Solution:**
1. Check `.env` file exists and has value
2. Ensure syntax is correct: `KEY=value` (no spaces)
3. Restart Node process
4. Verify `.env` is in same directory as `server.js`

### "Cannot connect to database"

**Problem:** `${MONGODB_URI}` not replaced

**Solution:**
1. Check `.env` file is loaded by dotenv
2. Verify MongoDB URI is correct in `.env`
3. Check credentials include username and password
4. Try connection string in MongoDB Compass

### "API keys not working"

**Problem:** Stripe/Razorpay keys are `${PLACEHOLDER}`

**Solution:**
1. Replace `${KEY}` with actual key in `.env`
2. Ensure key is correct (test vs live key)
3. For production, use CI/CD environment variables

---

## 📚 References

- [dotenv Documentation](https://github.com/motdotla/dotenv)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodejs-best-practices)
- [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [12 Factor App - Config](https://12factor.net/config)

---

## ✅ Summary

✅ All secrets are hidden with `${PLACEHOLDER}` format  
✅ `.env` file is protected by `.gitignore`  
✅ `.env.example` provides template without secrets  
✅ Backend reads from environment variables  
✅ No hardcoded secrets in source code  
✅ Production uses CI/CD or platform environment variables  

**For local development:** Add real secrets to `.env` (never commit)  
**For production:** Use platform's environment variable management  

