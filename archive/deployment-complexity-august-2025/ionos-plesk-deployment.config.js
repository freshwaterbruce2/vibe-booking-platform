/**
 * IONOS VPS + Plesk Deployment Configuration
 * Optimized for Plesk-managed Linux VPS hosting
 */

export default {
  deployment: {
    provider: 'ionos',
    panel: 'plesk',
    environment: 'production',
    server: {
      os: 'linux',
      plesk_version: 'obsidian',
      node_version: '18.x',
      // Plesk handles process management
      processManager: 'plesk_nodejs'
    }
  },

  // Frontend deployment (React Static Build)
  frontend: {
    type: 'static',
    buildCommand: 'npm run build',
    outputDir: 'dist',
    // Plesk document root structure
    deployPath: 'httpdocs/',
    // Plesk expects static files in httpdocs
    indexFile: 'index.html',
    
    // Optimization for Plesk hosting
    optimization: {
      compress: true,
      minify: true,
      // Plesk handles gzip compression
      gzipHandledByServer: true
    },
    
    // Plesk-specific configuration
    plesk: {
      documentRoot: 'httpdocs',
      // React router support
      rewriteRules: {
        spa: true, // Enable SPA routing
        fallback: 'index.html'
      }
    }
  },

  // Backend deployment (Node.js via Plesk Extension)
  backend: {
    type: 'nodejs',
    buildCommand: 'npm run build',
    startCommand: 'npm run start',
    entryPoint: 'dist/server.js',
    port: 3001,
    
    // Plesk Node.js application structure
    plesk: {
      applicationRoot: 'api/',
      documentRoot: 'api/public/',
      // Plesk manages the Node.js process
      managed: true,
      environment: 'production',
      
      // Plesk proxy configuration
      proxy: {
        // Frontend calls /api/* routes to Node.js app
        path: '/api',
        target: 'localhost:3001',
        passthrough: true
      }
    }
  },

  // Database configuration for Plesk environment
  database: {
    type: 'sqlite',
    // Use Plesk private directory for database
    path: 'D:/vhosts/yourdomain.com/private/database.sqlite',
    
    backup: {
      enabled: true,
      schedule: '0 2 * * *', // Daily at 2 AM
      retention: 30,
      // Plesk backup location
      location: 'D:/vhosts/yourdomain.com/private/backups/'
    }
  },

  // Plesk-optimized environment variables
  environment: {
    NODE_ENV: 'production',
    PORT: '3001',
    
    // Database (Plesk private directory)
    LOCAL_SQLITE: 'true',
    DATABASE_PATH: 'D:/vhosts/yourdomain.com/private/database.sqlite',
    
    // JWT secrets (managed via Plesk environment variables)
    JWT_SECRET: '${PLESK_ENV_JWT_SECRET}',
    JWT_REFRESH_SECRET: '${PLESK_ENV_JWT_REFRESH_SECRET}',
    JWT_RESET_SECRET: '${PLESK_ENV_JWT_RESET_SECRET}',
    
    // Email service
    EMAIL_PROVIDER: 'sendgrid',
    SENDGRID_API_KEY: '${PLESK_ENV_SENDGRID_API_KEY}',
    EMAIL_FROM: 'bookings@yourdomain.com',
    EMAIL_FROM_NAME: 'Vibe Booking',
    
    // External APIs
    OPENAI_API_KEY: '${PLESK_ENV_OPENAI_API_KEY}',
    LITEAPI_KEY: '${PLESK_ENV_LITEAPI_KEY}',
    
    // Square payments
    SQUARE_ACCESS_TOKEN: '${PLESK_ENV_SQUARE_ACCESS_TOKEN}',
    SQUARE_APPLICATION_ID: '${PLESK_ENV_SQUARE_APPLICATION_ID}',
    SQUARE_LOCATION_ID: '${PLESK_ENV_SQUARE_LOCATION_ID}',
    SQUARE_WEBHOOK_SIGNATURE_KEY: '${PLESK_ENV_SQUARE_WEBHOOK_SIGNATURE_KEY}',
    SQUARE_ENVIRONMENT: 'production',
    
    // Security
    ADMIN_IPS: '${PLESK_ENV_ADMIN_IPS}',
    CORS_ORIGINS: 'https://yourdomain.com,https://www.yourdomain.com',
    
    // Monitoring
    SENTRY_DSN: '${PLESK_ENV_SENTRY_DSN}'
  },

  // Plesk domain and hosting configuration
  plesk: {
    domain: {
      name: 'yourdomain.com',
      aliases: ['www.yourdomain.com'],
      // Plesk automatically handles DNS
      dns: {
        managed: true,
        autoconfig: true
      }
    },
    
    hosting: {
      // Main hosting settings
      documentRoot: 'httpdocs',
      // Enable PHP if needed for admin tools
      php: {
        enabled: false,
        version: '8.1'
      },
      
      // Node.js application configuration
      nodejs: {
        enabled: true,
        version: '18.x',
        applicationRoot: 'api',
        applicationStartupFile: 'dist/server.js',
        customEnvironmentVariables: true
      },
      
      // SSL certificate (Let's Encrypt via Plesk)
      ssl: {
        enabled: true,
        provider: 'letsencrypt',
        autoRenew: true,
        redirectHttp: true
      },
      
      // Security settings
      security: {
        // Plesk manages firewall
        firewall: true,
        // ModSecurity if available
        waf: true,
        // Fail2Ban integration
        bruteForceProtection: true
      }
    },
    
    // Backup configuration (Plesk Backup Manager)
    backup: {
      enabled: true,
      schedule: 'daily',
      retention: 30,
      include: ['httpdocs', 'private', 'api'],
      exclude: ['node_modules', 'logs', 'tmp']
    }
  },

  // Deployment workflow for Plesk
  deployment: {
    steps: [
      // 1. Build frontend (static React)
      {
        name: 'build_frontend',
        command: 'npm run build',
        description: 'Build React application for production'
      },
      
      // 2. Upload frontend to Plesk httpdocs
      {
        name: 'deploy_frontend',
        method: 'ftp',
        source: 'dist/',
        target: 'httpdocs/',
        description: 'Deploy React build to Plesk document root'
      },
      
      // 3. Build backend
      {
        name: 'build_backend',
        command: 'cd backend && npm run build',
        description: 'Build Node.js backend'
      },
      
      // 4. Upload backend to Plesk Node.js app
      {
        name: 'deploy_backend',
        method: 'ftp',
        source: 'backend/',
        target: 'api/',
        description: 'Deploy Node.js app to Plesk application directory'
      },
      
      // 5. Install dependencies via Plesk
      {
        name: 'install_dependencies',
        method: 'plesk_nodejs',
        command: 'npm install --production',
        description: 'Install Node.js dependencies via Plesk'
      },
      
      // 6. Set up database
      {
        name: 'setup_database',
        method: 'plesk_nodejs',
        command: 'npm run db:setup:local',
        description: 'Initialize SQLite database'
      },
      
      // 7. Configure environment variables
      {
        name: 'configure_environment',
        method: 'plesk_panel',
        description: 'Set environment variables via Plesk Node.js settings'
      },
      
      // 8. Start/restart application
      {
        name: 'start_application',
        method: 'plesk_nodejs',
        command: 'restart',
        description: 'Restart Node.js application via Plesk'
      }
    ]
  },

  // Monitoring via Plesk
  monitoring: {
    // Plesk built-in monitoring
    plesk: {
      resourceUsage: true,
      applicationStatus: true,
      logViewing: true
    },
    
    // Custom monitoring endpoints
    healthCheck: {
      frontend: '/',
      backend: '/api/health',
      database: '/api/health/db'
    },
    
    // Log management
    logs: {
      nodejs: 'logs/nodejs.log',
      error: 'logs/error.log',
      access: 'logs/access.log',
      // Plesk handles log rotation
      rotation: 'auto'
    }
  },

  // Performance optimization for Plesk
  performance: {
    // Plesk handles most optimizations
    caching: {
      static: true, // Plesk nginx caching
      gzip: true,   // Plesk compression
      expires: '30d' // Static asset expiry
    },
    
    // Node.js optimization
    nodejs: {
      clustering: false, // Plesk manages processes
      memory: '512M',
      keepAlive: true
    }
  },

  // Security configuration
  security: {
    // Plesk security features
    plesk: {
      firewall: true,
      modsecurity: true,
      fail2ban: true,
      ssl: 'letsencrypt'
    },
    
    // Application-level security
    application: {
      helmet: true,
      cors: {
        origin: ['https://yourdomain.com', 'https://www.yourdomain.com'],
        credentials: true
      },
      rateLimit: {
        windowMs: 900000, // 15 minutes
        max: 100
      }
    }
  }
};