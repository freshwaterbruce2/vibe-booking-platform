/**
 * IONOS VPS Deployment Configuration
 * Optimized for Linux VPS with Plesk management
 */

export default {
  deployment: {
    provider: 'ionos',
    environment: 'production',
    server: {
      os: 'linux',
      panel: 'plesk',
      node_version: '18.x',
      pm2: true  // Process manager for Node.js
    }
  },

  // Frontend build configuration for IONOS
  frontend: {
    buildCommand: 'npm run build',
    outputDir: 'dist',
    publicPath: '/',
    // IONOS serves from /httpdocs/ directory
    deployPath: '/httpdocs/',
    // Optimize for IONOS CDN
    optimization: {
      compress: true,
      minify: true,
      bundleAnalyzer: false
    }
  },

  // Backend configuration for IONOS VPS
  backend: {
    buildCommand: 'npm run build',
    startCommand: 'npm run start',
    port: 3001,
    // IONOS VPS process management
    processManager: 'pm2',
    instances: 'max', // Use all CPU cores
    // IONOS file paths
    deployPath: '/httpdocs/api/',
    logsPath: '/var/log/vibe-booking/',
    uploadsPath: '/httpdocs/uploads/'
  },

  // Database configuration for IONOS
  database: {
    // Start with SQLite for simplicity, upgrade to PostgreSQL later
    type: 'sqlite',
    path: 'D:/vibe-booking/database/database.sqlite',
    backup: {
      enabled: true,
      schedule: '0 2 * * *', // Daily at 2 AM
      retention: 30, // Keep 30 days
      location: 'D:/vibe-booking/backups/'
    }
  },

  // IONOS-specific environment variables
  environment: {
    NODE_ENV: 'production',
    PORT: '3001',
    
    // Database
    LOCAL_SQLITE: 'true',
    DATABASE_PATH: 'D:/vibe-booking/database/database.sqlite',
    
    // JWT (use secure production secrets)
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    JWT_RESET_SECRET: process.env.JWT_RESET_SECRET,
    
    // Email (SendGrid production)
    EMAIL_PROVIDER: 'sendgrid',
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
    EMAIL_FROM: 'bookings@vibebooking.com',
    EMAIL_FROM_NAME: 'Vibe Booking',
    
    // APIs
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    LITEAPI_KEY: process.env.LITEAPI_KEY,
    
    // Square Payments (Production)
    SQUARE_ACCESS_TOKEN: process.env.SQUARE_ACCESS_TOKEN,
    SQUARE_APPLICATION_ID: process.env.SQUARE_APPLICATION_ID,
    SQUARE_LOCATION_ID: process.env.SQUARE_LOCATION_ID,
    SQUARE_WEBHOOK_SIGNATURE_KEY: process.env.SQUARE_WEBHOOK_SIGNATURE_KEY,
    SQUARE_ENVIRONMENT: 'production',
    
    // Monitoring
    SENTRY_DSN: process.env.SENTRY_DSN,
    
    // Security
    ADMIN_IPS: process.env.ADMIN_IPS, // Your IP addresses
    RATE_LIMIT_WINDOW_MS: '900000', // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: '100'
  },

  // IONOS security configuration
  security: {
    // IONOS firewall rules
    firewall: {
      allowPorts: [80, 443, 3001],
      blockPorts: [22], // SSH only from admin IPs
      adminIPs: ['YOUR_IP_ADDRESS'] // Replace with your actual IP
    },
    
    // SSL certificate (IONOS Let's Encrypt)
    ssl: {
      enabled: true,
      provider: 'letsencrypt',
      autoRenew: true
    },
    
    // IONOS DDoS protection (included)
    ddosProtection: true
  },

  // Deployment scripts for IONOS
  scripts: {
    // Pre-deployment checks
    preDeploy: [
      'npm run typecheck',
      'npm run lint',
      'npm run test'
    ],
    
    // Build process
    build: [
      'npm ci --production=false',
      'npm run build:frontend',
      'npm run build:backend'
    ],
    
    // Deployment to IONOS VPS
    deploy: [
      'rsync -avz --delete dist/ user@your-server:/httpdocs/',
      'rsync -avz --delete backend/dist/ user@your-server:/httpdocs/api/',
      'ssh user@your-server "pm2 restart vibe-booking"'
    ],
    
    // Post-deployment verification
    postDeploy: [
      'curl -f https://your-domain.com/api/health',
      'npm run test:e2e:production'
    ]
  },

  // IONOS monitoring and logging
  monitoring: {
    // Use IONOS log analysis
    logs: {
      level: 'info',
      format: 'json',
      destination: '/var/log/vibe-booking/app.log',
      rotation: {
        maxFiles: 10,
        maxSize: '100M'
      }
    },
    
    // Health checks
    healthCheck: {
      endpoint: '/api/health',
      interval: 300, // 5 minutes
      timeout: 10000 // 10 seconds
    },
    
    // Performance monitoring
    performance: {
      cpuThreshold: 80,
      memoryThreshold: 85,
      diskThreshold: 90,
      responseTimeThreshold: 2000 // 2 seconds
    }
  },

  // IONOS backup configuration
  backup: {
    database: {
      schedule: '0 2 * * *', // Daily at 2 AM
      retention: 30,
      compression: true
    },
    
    files: {
      include: ['/httpdocs/', '/var/lib/vibe-booking/'],
      exclude: ['node_modules/', 'logs/', 'tmp/'],
      schedule: '0 3 * * 0', // Weekly on Sunday at 3 AM
      retention: 4 // 4 weeks
    }
  },

  // Domain and DNS configuration
  domain: {
    primary: 'your-domain.com',
    www: 'www.your-domain.com',
    api: 'api.your-domain.com',
    
    // IONOS DNS settings
    dns: {
      ttl: 3600,
      records: [
        { type: 'A', name: '@', value: 'YOUR_SERVER_IP' },
        { type: 'A', name: 'www', value: 'YOUR_SERVER_IP' },
        { type: 'CNAME', name: 'api', value: 'your-domain.com' }
      ]
    }
  }
};