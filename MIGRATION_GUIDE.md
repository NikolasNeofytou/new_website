# Migration Guide: Demo to Production

This guide helps you migrate from the demo/pilot version to the full production deployment.

## Overview

**Demo Version (Current):**
- In-memory user storage
- localStorage-based sessions
- No passwords
- No database

**Production Version (New):**
- MongoDB database
- JWT authentication
- Password-protected accounts
- Persistent storage
- Enhanced security

## Migration Steps

### Step 1: Backup Current Data

If you have existing users in the demo version, save them:

```bash
# Copy users.json as backup
cp users.json users-backup.json
```

### Step 2: Set Up MongoDB

Choose one:

**Option A: Local MongoDB**
```bash
# Install and start MongoDB
sudo apt-get install mongodb
sudo systemctl start mongodb
```

**Option B: MongoDB Atlas (Free Tier)**
1. Sign up at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string
4. Update `.env` file

### Step 3: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit configuration
nano .env
```

Update these required fields:
```env
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=generated-secret-key
SESSION_SECRET=generated-secret-key
```

Generate secure secrets:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 4: Install New Dependencies

```bash
npm install
```

This installs:
- mongoose (MongoDB driver)
- bcryptjs (password hashing)
- jsonwebtoken (JWT auth)
- helmet (security)
- morgan (logging)
- winston (advanced logging)
- express-rate-limit (rate limiting)

### Step 5: Update HTML Files

**For New Signups:**
Replace `signup.html` with `signup-full.html` or add password field:

```html
<div class="mb-3">
  <label for="password" class="form-label">Password *</label>
  <input type="password" class="form-control" id="password" name="password" required minlength="6">
</div>
```

**For Login:**
Replace `login.html` with `login-full.html` or add password field:

```html
<div class="mb-3">
  <label for="password" class="form-label">Password</label>
  <input type="password" class="form-control" id="password" name="password" required>
</div>
```

### Step 6: Update Client Scripts

The production scripts are already created:
- `signup-production.js` - Handles JWT tokens
- `login-production.js` - Stores tokens securely

Update your HTML to use production scripts:

```html
<script>
  const script = document.createElement('script');
  script.src = 'signup-production.js';  // Use production version
  document.head.appendChild(script);
</script>
```

### Step 7: Switch to Production Server

**Test locally first:**
```bash
npm run dev
```

**For production:**
```bash
npm run start:prod
```

### Step 8: Migrate Existing Users (Optional)

If you have existing demo users to migrate:

Create `migrate-users.js`:
```javascript
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const oldUsers = require('./users-backup.json');

mongoose.connect(process.env.MONGODB_URI);

async function migrateUsers() {
  for (const user of oldUsers) {
    try {
      await User.create({
        univid: user.univid,
        name: user.name,
        password: 'temporary123', // Users will need to reset
        email: user.email || '',
        year: user.year,
        specialization: user.spec
      });
      console.log(`Migrated user: ${user.univid}`);
    } catch (err) {
      console.log(`Skipped ${user.univid}: ${err.message}`);
    }
  }
  process.exit(0);
}

migrateUsers();
```

Run migration:
```bash
node migrate-users.js
```

### Step 9: Update Client Authentication

**Old Way (Demo):**
```javascript
localStorage.setItem('currentUser', JSON.stringify(data));
```

**New Way (Production):**
```javascript
localStorage.setItem('token', data.token);
localStorage.setItem('currentUser', JSON.stringify(data.user));
```

**Accessing Protected Routes:**
```javascript
fetch('/api/me', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
```

### Step 10: Test Everything

Test checklist:
- [ ] Sign up with new password-protected account
- [ ] Login with credentials
- [ ] View profile (authenticated)
- [ ] Submit contact form (saves to database)
- [ ] Logout and login again
- [ ] Check data persists after server restart

### Step 11: Update Documentation

Update README.md to reference production setup:

```markdown
## Production Deployment

See [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md) for full production deployment guide.

### Quick Start (Production)

1. Install dependencies: `npm install`
2. Configure environment: `cp .env.example .env` and edit
3. Start MongoDB
4. Run: `npm run start:prod`
```

## Breaking Changes

### API Changes

**Registration (POST /api/users):**
```javascript
// Old (Demo)
{
  "univid": "12345",
  "name": "John Doe"
}

// New (Production) - Password required
{
  "univid": "12345",
  "name": "John Doe",
  "password": "secure123",
  "email": "john@example.com",
  "year": 3,
  "specialization": "Electronics"
}
```

**Login (POST /api/login):**
```javascript
// Old (Demo) - No password
{
  "univid": "12345"
}

// New (Production) - Password required
{
  "univid": "12345",
  "password": "secure123"
}
```

**Response:**
```javascript
// Old (Demo)
{
  "user": { "univid": "12345", "name": "John Doe" }
}

// New (Production) - Includes JWT token
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "univid": "12345",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Storage Changes

**Old (Demo):**
- Users stored in memory (lost on restart)
- Contact forms logged to console

**New (Production):**
- Users stored in MongoDB
- Contact forms saved to database
- Data persists across restarts

### Security Changes

**Old (Demo):**
- No password protection
- Client-side only sessions
- No token expiration

**New (Production):**
- Bcrypt password hashing
- JWT tokens with expiration
- Server-side validation
- Rate limiting
- Security headers

## Rollback Plan

If you need to rollback to demo version:

```bash
# Use old server
node server.js

# Restore old HTML files
git checkout HEAD~1 -- signup.html login.html

# Restore old scripts
git checkout HEAD~1 -- signup.js login.js
```

## Gradual Migration Strategy

**Week 1:** Set up production environment
- Install MongoDB
- Configure environment
- Test locally

**Week 2:** Deploy to staging
- Deploy production version to test server
- Test all features
- Fix any issues

**Week 3:** User communication
- Inform users of upcoming changes
- Provide password reset instructions
- Schedule migration window

**Week 4:** Production cutover
- Switch to production server
- Monitor for issues
- Support users with migration

## Common Issues

### Issue: "Cannot connect to MongoDB"

**Solution:**
```bash
# Check MongoDB is running
sudo systemctl status mongodb

# Check connection string
echo $MONGODB_URI

# Test connection
mongo "$MONGODB_URI"
```

### Issue: "JWT token invalid"

**Solution:**
- Check JWT_SECRET in .env
- Clear localStorage and login again
- Verify token hasn't expired

### Issue: "Users can't login"

**Solution:**
- Users from demo need to sign up again with password
- Or run user migration script
- Or implement password reset

### Issue: "Database empty after restart"

**Solution:**
- Verify MongoDB is running
- Check MONGODB_URI is correct
- Confirm writes are successful

## Support

For migration help:
1. Check logs in `logs/` directory
2. Review PRODUCTION_SETUP.md
3. Test in development mode first
4. Keep demo version running during transition

---

**Recommendation:** Run both demo and production versions in parallel during transition period to allow users to migrate at their own pace.
