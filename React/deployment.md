# Deployment Guide

## Prerequisites
- Node.js 16.x or higher
- npm 7.x or higher
- A Supabase account and project
- Environment variables configured

## Environment Setup

1. Create environment-specific files:
   - `.env.development` for development
   - `.env.production` for production
   - `.env.staging` for staging (optional)

2. Required Environment Variables:
```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Security Considerations

1. Ensure `.env` files are added to `.gitignore`
2. Review and update Row Level Security policies in Supabase
3. Configure CORS settings in Supabase
4. Set up proper authentication rules

## Build Process

1. Install dependencies:
```bash
npm install
```

2. Build for production:
```bash
npm run build
```

3. Test the production build locally:
```bash
serve -s build
```

## Deployment Steps

### Option 1: Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy using Vercel's automatic deployment

### Option 2: Manual Deployment

1. Build the project:
```bash
npm run build
```

2. Deploy the `build` folder to your hosting service
3. Configure your web server (Nginx/Apache) to serve the static files
4. Set up SSL certificates

## Post-Deployment Checklist

1. Verify all environment variables are set correctly
2. Test authentication flows
3. Verify database connections
4. Check CORS settings
5. Test todo sharing functionality
6. Verify real-time updates
7. Test error handling
8. Monitor application performance

## Monitoring & Maintenance

1. Set up error tracking (e.g., Sentry)
2. Configure performance monitoring
3. Set up automated backups for Supabase
4. Implement logging strategy
5. Set up uptime monitoring

## Troubleshooting

Common issues and solutions:

1. **CORS Errors**
   - Verify CORS settings in Supabase
   - Check API endpoint configurations

2. **Authentication Issues**
   - Verify environment variables
   - Check OAuth configurations
   - Review RLS policies

3. **Performance Issues**
   - Enable caching
   - Optimize database queries
   - Review React component optimization

## Scaling Considerations

1. Database Optimization
   - Add appropriate indexes
   - Optimize queries
   - Set up connection pooling

2. Frontend Optimization
   - Implement code splitting
   - Enable caching
   - Use CDN for static assets

3. Security Measures
   - Regular security audits
   - Keep dependencies updated
   - Monitor for vulnerabilities 