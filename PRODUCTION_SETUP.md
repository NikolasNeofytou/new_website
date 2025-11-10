# Full Production Deployment Guide

This guide will help you deploy the SHMMy Forum Enhancement with full production features including database, authentication, and security.

## Prerequisites

- Node.js 14+ and npm
- MongoDB 4.4+ (local or MongoDB Atlas)
- Domain name (optional, but recommended)
- SSL certificate (Let's Encrypt recommended)

## Step 1: Database Setup

### Option A: Local MongoDB

```bash
# Install MongoDB (Ubuntu/Debian)
sudo apt-get install mongodb

# Start MongoDB service
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Verify it's running
sudo systemctl status mongodb
```

### Option B: MongoDB Atlas (Cloud - Recommended)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster
4. Get your connection string
5. Update `.env` with your connection string

## Step 2: Environment Configuration

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your actual values
nano .env
```

**Important Environment Variables:**

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://localhost:27017/shmmy_forum  # Or your Atlas URI
JWT_SECRET=your-very-secure-random-string-here
SESSION_SECRET=another-very-secure-random-string
```

**Generate secure secrets:**
```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate session secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 3: Install Dependencies

```bash
npm install
```

## Step 4: Update Server Reference

**For Production Mode:**

Update `package.json` to add production scripts:

```json
{
  "scripts": {
    "start": "node server.js",
    "start:prod": "NODE_ENV=production node server-production.js",
    "dev": "NODE_ENV=development nodemon server-production.js"
  }
}
```

## Step 5: Create Logs Directory

```bash
mkdir -p logs
```

## Step 6: Test Locally

```bash
# Start in development mode
npm run dev

# Or start in production mode
npm run start:prod
```

Visit `http://localhost:3000` and test:
- Sign up with password
- Login with credentials
- View profile
- Submit contact form

## Step 7: Production Server Setup

### Using PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start server-production.js --name shmmy-forum

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### Using systemd

Create `/etc/systemd/system/shmmy-forum.service`:

```ini
[Unit]
Description=SHMMy Forum Enhancement
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/new_website
ExecStart=/usr/bin/node server-production.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable shmmy-forum
sudo systemctl start shmmy-forum
```

## Step 8: Nginx Configuration

Create `/etc/nginx/sites-available/shmmy-forum`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/shmmy-forum /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Step 9: SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

## Step 10: Firewall Configuration

```bash
# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Allow SSH
sudo ufw allow OpenSSH

# Enable firewall
sudo ufw enable
```

## Step 11: Create Admin User

Connect to your server and run:

```bash
node -e "
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI);

User.create({
  univid: 'admin',
  name: 'Administrator',
  password: 'change-this-password',
  email: 'admin@example.com',
  role: 'admin'
}).then(() => {
  console.log('Admin user created');
  process.exit(0);
});
"
```

## Step 12: Monitoring

### PM2 Monitoring

```bash
# View logs
pm2 logs shmmy-forum

# Monitor resources
pm2 monit

# View status
pm2 status
```

### Application Logs

```bash
# View error logs
tail -f logs/error.log

# View combined logs
tail -f logs/combined.log
```

## Step 13: Backups

### Database Backup

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/mongodb"

mkdir -p $BACKUP_DIR

mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/backup_$DATE"

# Keep only last 7 days
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} \;
```

Add to crontab:
```bash
crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

## Step 14: Update Workflow

```bash
# Pull latest changes
cd /var/www/new_website
git pull origin main

# Install dependencies
npm install

# Restart application
pm2 restart shmmy-forum

# Or with systemd
sudo systemctl restart shmmy-forum
```

## Features Available in Production

✅ **Database Storage**
- User accounts persisted in MongoDB
- Contact form submissions stored
- Data survives server restarts

✅ **Secure Authentication**
- Password hashing with bcrypt
- JWT tokens for sessions
- Token expiration and refresh

✅ **Security**
- Rate limiting
- Helmet.js security headers
- Input validation
- XSS protection

✅ **Monitoring**
- Winston logging
- Error tracking
- Access logs
- Health check endpoint

✅ **Admin Features**
- Admin role for users
- View all contact submissions
- Protected admin routes

## API Endpoints

### Public Endpoints

- `GET /api/health` - Health check
- `GET /api/announcements` - Get announcements
- `POST /api/users` - Register new user
- `POST /api/login` - Login
- `POST /api/contact` - Submit contact form

### Protected Endpoints (Require Authentication)

- `GET /api/me` - Get current user
- `GET /api/contacts` - Get all contacts (admin only)

### Authentication

Include JWT token in Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Testing Production Features

1. **Sign Up**: Create account with password
2. **Login**: Login with credentials
3. **Profile**: View authenticated profile
4. **Contact**: Submit form (saved to database)
5. **Admin**: Access admin endpoints with admin account

## Troubleshooting

### Database Connection Issues

```bash
# Check MongoDB is running
sudo systemctl status mongodb

# Check connection string in .env
cat .env | grep MONGODB_URI

# Test connection
mongo "YOUR_MONGODB_URI"
```

### Application Not Starting

```bash
# Check logs
pm2 logs shmmy-forum --lines 50

# Check for missing dependencies
npm install

# Check environment variables
printenv | grep NODE_ENV
```

### Permission Errors

```bash
# Fix file permissions
sudo chown -R www-data:www-data /var/www/new_website

# Fix logs directory
sudo mkdir -p /var/www/new_website/logs
sudo chown -R www-data:www-data /var/www/new_website/logs
```

## Performance Optimization

1. **Enable gzip in Nginx**
2. **Use CDN for static assets**
3. **Enable MongoDB indexing**
4. **Use connection pooling**
5. **Implement caching for announcements**

## Security Checklist

- [ ] Change default JWT secrets
- [ ] Enable HTTPS
- [ ] Configure firewall
- [ ] Set up backups
- [ ] Enable rate limiting
- [ ] Update dependencies regularly
- [ ] Monitor logs for suspicious activity
- [ ] Use strong admin password
- [ ] Enable MongoDB authentication
- [ ] Keep Node.js updated

## Support

For issues or questions:
1. Check logs in `logs/` directory
2. Review error messages
3. Consult MongoDB and Node.js documentation
4. Check GitHub issues

---

**Next Steps:**
- Set up email service for notifications
- Implement password reset
- Add more admin features
- Set up analytics
- Add search functionality
