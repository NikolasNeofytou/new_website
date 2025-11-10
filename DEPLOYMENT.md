# Deployment Guide - SHMMy Forum Enhancement

This guide provides instructions for deploying the SHMMy Forum Enhancement website to production.

## Prerequisites

- Node.js v14+ installed on the server
- npm installed
- A domain name (optional, but recommended)
- SSL certificate (recommended for production)

## Deployment Options

### Option 1: Traditional Server Deployment

#### 1. Prepare Your Server

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js and npm (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

#### 2. Clone and Setup the Application

```bash
# Navigate to your web directory
cd /var/www

# Clone the repository
git clone https://github.com/NikolasNeofytou/new_website.git
cd new_website

# Install dependencies
npm install

# Test the application
node server.js
```

#### 3. Setup Process Manager (PM2)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the application
pm2 start server.js --name "shmmy-forum"

# Enable PM2 startup on boot
pm2 startup
pm2 save
```

#### 4. Configure Nginx as Reverse Proxy

```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/shmmy-forum
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/shmmy-forum /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### 5. Setup SSL with Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### Option 2: Heroku Deployment

#### 1. Prepare Your Application

Create a `Procfile` in the root directory:

```
web: node server.js
```

Update `package.json` to specify Node.js version:

```json
{
  "engines": {
    "node": "18.x",
    "npm": "9.x"
  }
}
```

#### 2. Deploy to Heroku

```bash
# Install Heroku CLI
# Visit: https://devcenter.heroku.com/articles/heroku-cli

# Login to Heroku
heroku login

# Create new Heroku app
heroku create shmmy-forum-enhancement

# Deploy
git push heroku main

# Open the app
heroku open
```

### Option 3: Docker Deployment

#### 1. Create Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

#### 2. Create docker-compose.yml

```yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    restart: unless-stopped
```

#### 3. Deploy with Docker

```bash
# Build the image
docker build -t shmmy-forum .

# Run the container
docker run -d -p 3000:3000 --name shmmy-forum-app shmmy-forum

# Or use docker-compose
docker-compose up -d
```

## Environment Configuration

Create a `.env` file for production settings:

```env
NODE_ENV=production
PORT=3000
# Add other environment variables as needed
```

Update `server.js` to use environment variables:

```javascript
require('dotenv').config();
const PORT = process.env.PORT || 3000;
```

## Security Considerations

1. **Use HTTPS**: Always use SSL certificates in production
2. **Environment Variables**: Store sensitive data in environment variables
3. **Rate Limiting**: Implement rate limiting to prevent abuse
4. **Input Validation**: Validate all user inputs
5. **CORS**: Configure CORS appropriately
6. **Database**: Migrate from in-memory storage to a proper database (PostgreSQL, MongoDB)
7. **Authentication**: Implement proper session management with JWT or similar

## Monitoring and Maintenance

### Setup Logging

```bash
# PM2 logs
pm2 logs shmmy-forum

# View logs in real-time
pm2 logs shmmy-forum --lines 100
```

### Monitoring

```bash
# Monitor with PM2
pm2 monit

# Check status
pm2 status
```

### Updates

```bash
# Pull latest changes
cd /var/www/new_website
git pull origin main

# Install dependencies
npm install

# Restart application
pm2 restart shmmy-forum
```

## Backup Strategy

1. **Database Backups**: Schedule regular database backups
2. **File Backups**: Backup user-uploaded files (if applicable)
3. **Configuration Backups**: Keep copies of configuration files

```bash
# Example backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf backup_$DATE.tar.gz /var/www/new_website
```

## Troubleshooting

### Application Won't Start

```bash
# Check logs
pm2 logs shmmy-forum --err

# Check if port is in use
sudo lsof -i :3000

# Restart the application
pm2 restart shmmy-forum
```

### High Memory Usage

```bash
# Restart PM2
pm2 restart shmmy-forum

# Check memory usage
pm2 monit
```

### Nginx Issues

```bash
# Check Nginx status
sudo systemctl status nginx

# Test configuration
sudo nginx -t

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

## Performance Optimization

1. **Enable Gzip Compression** in Nginx
2. **Use CDN** for static assets
3. **Implement Caching** for API responses
4. **Optimize Images** and static files
5. **Use Connection Pooling** for database connections

## Production Checklist

- [ ] SSL certificate installed
- [ ] Environment variables configured
- [ ] Database setup (when implemented)
- [ ] Backups scheduled
- [ ] Monitoring setup
- [ ] Error tracking configured
- [ ] Rate limiting implemented
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] Logs rotation configured
- [ ] Documentation updated
- [ ] Test all features in production

## Support

For deployment issues or questions, please contact the development team or refer to the main README.md file.
