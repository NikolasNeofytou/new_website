# Production vs Demo: Feature Comparison

## Quick Reference

| Feature | Demo Version | Production Version |
|---------|--------------|-------------------|
| **Server** | `server.js` | `server-production.js` |
| **Storage** | In-memory | MongoDB Database |
| **Authentication** | University ID only | Password + JWT tokens |
| **Sessions** | localStorage | JWT with expiration |
| **Security** | Basic | Full (Helmet, rate limiting) |
| **Logging** | Console only | Winston + Morgan |
| **Suitable For** | Pilot (50-100 users) | Full production |

## Demo Version Features

### What It Has
✅ User signup (no password)
✅ Simple login (University ID only)
✅ Profile display
✅ Contact form
✅ Dark mode
✅ Announcements
✅ Responsive design

### Limitations
❌ Data lost on server restart
❌ No password protection
❌ No persistent storage
❌ Client-side only sessions
❌ No rate limiting
❌ Basic error handling

### Use Demo For:
- Quick testing
- Proof of concept
- Small pilot programs (50-100 users)
- Demonstrations

### Running Demo:
```bash
npm install
npm start
# Visit http://localhost:3000
```

## Production Version Features

### What It Adds
✅ MongoDB database
✅ Password authentication
✅ JWT token system
✅ Persistent storage
✅ Bcrypt password hashing
✅ Rate limiting
✅ Security headers (Helmet)
✅ Advanced logging (Winston)
✅ Error tracking
✅ Health check endpoint
✅ Admin roles
✅ Protected routes

### Requirements
- MongoDB 4.4+
- Environment configuration
- More server resources

### Use Production For:
- Full deployment
- 100+ concurrent users
- Long-term operation
- Production environment
- When data persistence is critical

### Running Production:
```bash
# Setup
cp .env.example .env
# Edit .env with your configuration
npm install

# Development mode (with auto-reload)
npm run dev

# Production mode
npm run start:prod
```

See [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md) for complete setup guide.

## Migration Path

1. **Start with Demo** - Test features, gather feedback
2. **Plan Production** - Set up MongoDB, configure environment
3. **Test Locally** - Run production version locally
4. **Deploy Staging** - Test on staging server
5. **Go Live** - Switch to production
6. **Monitor** - Watch logs and performance

See [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) for detailed migration steps.

## API Differences

### Demo API

**Sign Up:**
```javascript
POST /api/users
{
  "univid": "12345",
  "name": "John Doe"
}
```

**Login:**
```javascript
POST /api/login
{
  "univid": "12345"
}
```

### Production API

**Sign Up:**
```javascript
POST /api/users
{
  "univid": "12345",
  "name": "John Doe",
  "password": "secure123",
  "email": "john@example.com",
  "year": 3,
  "specialization": "Electronics"
}

Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}
```

**Login:**
```javascript
POST /api/login
{
  "univid": "12345",
  "password": "secure123"
}

Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}
```

**Protected Routes:**
```javascript
GET /api/me
Headers: {
  "Authorization": "Bearer <token>"
}
```

## File Structure

### Demo Files
- `server.js` - Demo server
- `signup.html` - Simple signup form
- `signup.js` - Basic signup logic
- `login.html` - Simple login form
- `login.js` - Basic login logic

### Production Files
- `server-production.js` - Full production server
- `signup-full.html` - Enhanced signup with password
- `signup-production.js` - JWT-aware signup
- `login-full.html` - Enhanced login with password
- `login-production.js` - JWT-aware login
- `models/` - Database models
- `middleware/` - Auth middleware
- `config/` - Database configuration
- `utils/` - Helper utilities

### Documentation
- `README.md` - Main documentation
- `PRODUCTION_SETUP.md` - Production deployment guide
- `MIGRATION_GUIDE.md` - Demo to production migration
- `DEPLOYMENT.md` - General deployment options
- `FEATURES.md` - Feature comparison with old system

## Which Version Should I Use?

### Choose Demo If:
- Testing the concept
- Small pilot program (<100 users)
- Short-term deployment (days/weeks)
- Don't need data persistence
- Want quick setup

### Choose Production If:
- Long-term deployment
- 100+ users
- Need data persistence
- Require password security
- Want admin features
- Need audit logs
- Have MongoDB available

## Performance Comparison

### Demo Version
- **Startup:** < 1 second
- **Memory:** ~50MB
- **Concurrent Users:** 50-100
- **Data Loss Risk:** High (server restart)

### Production Version
- **Startup:** 2-3 seconds (database connection)
- **Memory:** ~100-150MB
- **Concurrent Users:** 500-1000
- **Data Loss Risk:** Low (database persistence)

## Security Comparison

### Demo Version
- ⚠️ No password protection
- ⚠️ Client-side only validation
- ⚠️ No rate limiting
- ⚠️ Basic error messages

### Production Version
- ✅ Password hashing (bcrypt)
- ✅ JWT token authentication
- ✅ Server-side validation
- ✅ Rate limiting
- ✅ Security headers (Helmet)
- ✅ Protected routes
- ✅ Sanitized error messages

## Cost Comparison

### Demo Version
**Infrastructure:**
- Small VPS ($5-10/month)
- No database costs
- Minimal resources

**Maintenance:**
- Low complexity
- Quick updates
- Simple troubleshooting

### Production Version
**Infrastructure:**
- Medium VPS ($10-20/month) OR
- MongoDB Atlas Free Tier + Small VPS
- Database costs (if not using free tier)

**Maintenance:**
- More complex
- Database backups
- Monitoring required
- Log management

## Recommendation

**For Pilot Program:** Start with Demo
- Quick to deploy
- Easy to test
- Low risk
- Gather feedback

**For Full Deployment:** Use Production
- Data persistence
- Better security
- Scales better
- Professional features

**Migration Strategy:** Demo → Production
1. Run demo for 1-2 months
2. Gather feedback and iterate
3. Set up production environment
4. Migrate users gradually
5. Maintain demo as backup during transition

---

Need help choosing? Check [DEAN_BRIEF.md](DEAN_BRIEF.md) for decision guide.
