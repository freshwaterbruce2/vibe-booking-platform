/**
 * Automated IONOS Deployment with Puppeteer
 * Automates IONOS control panel configuration
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class IONOSDeploymentAutomator {
  constructor(credentials) {
    this.credentials = credentials;
    this.browser = null;
    this.page = null;
  }

  async initialize() {
    this.browser = await puppeteer.launch({ 
      headless: false, // Show browser for debugging
      defaultViewport: { width: 1920, height: 1080 }
    });
    this.page = await this.browser.newPage();
  }

  async automateIONOSSetup() {
    try {
      console.log('🚀 Starting IONOS deployment automation...');

      // 1. Login to IONOS control panel
      await this.loginToIONOS();
      
      // 2. Configure Node.js runtime
      await this.configureNodeJS();
      
      // 3. Set up PostgreSQL database
      await this.setupPostgreSQL();
      
      // 4. Configure environment variables
      await this.configureEnvironment();
      
      // 5. Install Node.js dependencies
      await this.installDependencies();
      
      // 6. Start application
      await this.startApplication();
      
      console.log('✅ IONOS deployment automation complete!');
      
    } catch (error) {
      console.error('❌ Deployment automation failed:', error);
      throw error;
    }
  }

  async loginToIONOS() {
    console.log('🔐 Logging into IONOS control panel...');
    
    await this.page.goto('https://login.ionos.com');
    await this.page.waitForSelector('#username');
    
    await this.page.type('#username', this.credentials.email);
    await this.page.type('#password', this.credentials.password);
    
    await this.page.click('button[type="submit"]');
    await this.page.waitForNavigation();
    
    console.log('✅ IONOS login successful');
  }

  async configureNodeJS() {
    console.log('⚙️ Configuring Node.js runtime...');
    
    // Navigate to hosting management
    await this.page.goto('https://my.ionos.com/hosting');
    await this.page.waitForSelector('.hosting-package');
    
    // Find and click Node.js configuration
    await this.page.click('text=Node.js');
    await this.page.waitForSelector('.nodejs-config');
    
    // Set entry point to api/server.ts
    await this.page.fill('input[name="entry-point"]', 'api/server.ts');
    
    // Set Node.js version to 18+
    await this.page.selectOption('select[name="node-version"]', '18');
    
    // Enable automatic restart
    await this.page.check('input[name="auto-restart"]');
    
    await this.page.click('button:has-text("Save Configuration")');
    
    console.log('✅ Node.js configuration saved');
  }

  async setupPostgreSQL() {
    console.log('🗄️ Setting up PostgreSQL database...');
    
    // Navigate to database section
    await this.page.goto('https://my.ionos.com/database');
    
    // Create new PostgreSQL database
    await this.page.click('button:has-text("Create Database")');
    await this.page.selectOption('select[name="db-type"]', 'postgresql');
    
    // Configure database
    await this.page.fill('input[name="db-name"]', 'vibebooking_prod');
    await this.page.fill('input[name="db-user"]', 'vibebooking_user');
    
    // Generate secure password
    const dbPassword = this.generateSecurePassword();
    await this.page.fill('input[name="db-password"]', dbPassword);
    
    await this.page.click('button:has-text("Create")');
    await this.page.waitForSelector('.database-created');
    
    // Store database credentials for environment setup
    this.databaseCredentials = {
      host: await this.page.textContent('.db-host'),
      name: 'vibebooking_prod',
      user: 'vibebooking_user',
      password: dbPassword
    };
    
    console.log('✅ PostgreSQL database created');
  }

  async configureEnvironment() {
    console.log('🔧 Configuring environment variables...');
    
    // Navigate to environment configuration
    await this.page.goto('https://my.ionos.com/hosting/environment');
    
    // Set production environment variables
    const envVars = {
      'NODE_ENV': 'production',
      'DATABASE_URL': `postgresql://${this.databaseCredentials.user}:${this.databaseCredentials.password}@${this.databaseCredentials.host}:5432/${this.databaseCredentials.name}`,
      'VITE_API_URL': `https://${this.credentials.domain}/api`,
      'CORS_ORIGIN': `https://${this.credentials.domain}`,
      'JWT_SECRET': this.generateSecurePassword(32),
      'SQUARE_ENVIRONMENT': 'production'
    };
    
    for (const [key, value] of Object.entries(envVars)) {
      await this.page.click('button:has-text("Add Variable")');
      await this.page.fill('input[name="env-key"]', key);
      await this.page.fill('input[name="env-value"]', value);
      await this.page.click('button:has-text("Save")');
    }
    
    console.log('✅ Environment variables configured');
  }

  async installDependencies() {
    console.log('📦 Installing Node.js dependencies...');
    
    // Navigate to terminal/SSH access
    await this.page.goto('https://my.ionos.com/hosting/terminal');
    
    // Execute npm install in api directory
    await this.page.type('.terminal-input', 'cd api && npm install --production');
    await this.page.keyboard.press('Enter');
    
    // Wait for installation to complete
    await this.page.waitForSelector('.install-complete', { timeout: 300000 });
    
    console.log('✅ Dependencies installed');
  }

  async startApplication() {
    console.log('🚀 Starting hotel booking application...');
    
    // Start the Node.js application
    await this.page.type('.terminal-input', 'npm run start');
    await this.page.keyboard.press('Enter');
    
    // Wait for application to start
    await this.page.waitForSelector('.app-running', { timeout: 60000 });
    
    console.log('✅ Application started successfully');
  }

  generateSecurePassword(length = 16) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Usage example
async function deployToIONOS() {
  const automator = new IONOSDeploymentAutomator({
    email: process.env.IONOS_EMAIL,
    password: process.env.IONOS_PASSWORD,
    domain: process.env.IONOS_DOMAIN
  });

  try {
    await automator.initialize();
    await automator.automateIONOSSetup();
    console.log('🎉 Deployment automation successful!');
  } catch (error) {
    console.error('💥 Deployment failed:', error);
  } finally {
    await automator.cleanup();
  }
}

module.exports = { IONOSDeploymentAutomator, deployToIONOS };