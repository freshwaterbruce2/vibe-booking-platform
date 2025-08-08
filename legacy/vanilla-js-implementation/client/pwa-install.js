// PWA Installation and Notification Management
class PWAManager {
  constructor() {
    this.deferredPrompt = null;
    this.isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    this.init();
  }

  init() {
    this.setupInstallPrompt();
    this.setupNotifications();
    this.setupOfflineHandling();
    this.trackInstallation();
  }

  setupInstallPrompt() {
    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      this.deferredPrompt = e;
      // Show the install button
      this.showInstallButton();
    });

    // Handle install button click
    const installButton = document.getElementById('install-button');
    if (installButton) {
      installButton.addEventListener('click', () => {
        this.promptInstall();
      });
    }
  }

  showInstallButton() {
    if (this.isStandalone) return;

    const installButton = this.createInstallButton();
    document.body.appendChild(installButton);
    
    // Show install banner after a delay
    setTimeout(() => {
      this.showInstallBanner();
    }, 10000); // Show after 10 seconds
  }

  createInstallButton() {
    const button = document.createElement('button');
    button.id = 'install-button';
    button.className = 'pwa-install-button';
    button.innerHTML = '<i class="fas fa-download"></i> Install App';
    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 50px;
      padding: 12px 20px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      z-index: 1000;
      transition: all 0.3s ease;
      display: none;
    `;
    
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
    });
    
    // Show button with animation
    setTimeout(() => {
      button.style.display = 'block';
      button.style.animation = 'slideInRight 0.5s ease forwards';
    }, 100);
    
    return button;
  }

  showInstallBanner() {
    if (this.isStandalone || localStorage.getItem('install-banner-dismissed')) return;

    const banner = document.createElement('div');
    banner.className = 'pwa-install-banner';
    banner.innerHTML = `
      <div class="pwa-banner-content">
        <div class="pwa-banner-text">
          <h3>Install HotelFinder</h3>
          <p>Get faster access and offline features!</p>
        </div>
        <div class="pwa-banner-actions">
          <button class="pwa-banner-install">Install</button>
          <button class="pwa-banner-dismiss">×</button>
        </div>
      </div>
    `;
    
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      color: white;
      padding: 16px;
      z-index: 1001;
      transform: translateY(-100%);
      transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(banner);
    
    // Show banner with animation
    setTimeout(() => {
      banner.style.transform = 'translateY(0)';
    }, 100);
    
    // Handle banner actions
    banner.querySelector('.pwa-banner-install').addEventListener('click', () => {
      this.promptInstall();
      this.dismissBanner(banner);
    });
    
    banner.querySelector('.pwa-banner-dismiss').addEventListener('click', () => {
      this.dismissBanner(banner);
      localStorage.setItem('install-banner-dismissed', 'true');
    });
    
    // Auto-dismiss after 15 seconds
    setTimeout(() => {
      if (document.body.contains(banner)) {
        this.dismissBanner(banner);
      }
    }, 15000);
  }

  dismissBanner(banner) {
    banner.style.transform = 'translateY(-100%)';
    setTimeout(() => {
      if (document.body.contains(banner)) {
        document.body.removeChild(banner);
      }
    }, 300);
  }

  async promptInstall() {
    if (!this.deferredPrompt) return;

    // Show the install prompt
    this.deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await this.deferredPrompt.userChoice;
    
    // Track the user's response
    if (typeof gtag !== 'undefined') {
      gtag('event', 'pwa_install_prompt', {
        event_category: 'PWA',
        event_label: outcome,
      });
    }
    
    // Clear the saved prompt since it can't be used again
    this.deferredPrompt = null;
    
    // Hide install button
    const installButton = document.getElementById('install-button');
    if (installButton) {
      installButton.style.display = 'none';
    }
  }

  setupNotifications() {
    // Check if notifications are supported
    if ('Notification' in window && 'serviceWorker' in navigator) {
      // Request notification permission after user interaction
      document.addEventListener('click', this.requestNotificationPermission.bind(this), { once: true });
    }
  }

  async requestNotificationPermission() {
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        this.showWelcomeNotification();
        
        // Track permission granted
        if (typeof gtag !== 'undefined') {
          gtag('event', 'notification_permission_granted', {
            event_category: 'PWA',
          });
        }
      }
    }
  }

  showWelcomeNotification() {
    if ('serviceWorker' in navigator && 'showNotification' in ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification('Welcome to HotelFinder!', {
          body: 'You\'ll now receive notifications about great hotel deals.',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          tag: 'welcome',
          requireInteraction: false,
          silent: true,
        });
      });
    }
  }

  setupOfflineHandling() {
    // Handle online/offline status
    window.addEventListener('online', () => {
      this.showOnlineStatus();
    });
    
    window.addEventListener('offline', () => {
      this.showOfflineStatus();
    });
    
    // Check initial status
    if (!navigator.onLine) {
      this.showOfflineStatus();
    }
  }

  showOnlineStatus() {
    this.showStatusMessage('You\'re back online!', 'success');
  }

  showOfflineStatus() {
    this.showStatusMessage('You\'re offline. Some features may be limited.', 'warning');
  }

  showStatusMessage(message, type) {
    const toast = document.createElement('div');
    toast.className = `pwa-status-toast pwa-status-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#10b981' : '#f59e0b'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 1002;
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  trackInstallation() {
    // Track when PWA is launched
    window.addEventListener('appinstalled', () => {
      if (typeof gtag !== 'undefined') {
        gtag('event', 'pwa_installed', {
          event_category: 'PWA',
        });
      }
    });
    
    // Track if app is launched from home screen
    if (this.isStandalone) {
      if (typeof gtag !== 'undefined') {
        gtag('event', 'pwa_launched_standalone', {
          event_category: 'PWA',
        });
      }
    }
  }
}

// Add required CSS for PWA components
const pwaStyles = document.createElement('style');
pwaStyles.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .pwa-banner-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .pwa-banner-text h3 {
    margin: 0 0 4px 0;
    font-size: 18px;
    font-weight: 600;
  }
  
  .pwa-banner-text p {
    margin: 0;
    opacity: 0.9;
    font-size: 14px;
  }
  
  .pwa-banner-actions {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  
  .pwa-banner-install {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease;
  }
  
  .pwa-banner-install:hover {
    background: rgba(255, 255, 255, 0.3);
  }
  
  .pwa-banner-dismiss {
    background: none;
    color: white;
    border: none;
    font-size: 24px;
    cursor: pointer;
    padding: 4px;
    opacity: 0.7;
    transition: opacity 0.2s ease;
  }
  
  .pwa-banner-dismiss:hover {
    opacity: 1;
  }
  
  @media (max-width: 768px) {
    .pwa-banner-content {
      flex-direction: column;
      gap: 12px;
      text-align: center;
    }
    
    .pwa-banner-text h3 {
      font-size: 16px;
    }
    
    .pwa-banner-text p {
      font-size: 13px;
    }
    
    .pwa-install-button {
      bottom: 10px !important;
      right: 10px !important;
      padding: 10px 16px !important;
      font-size: 13px !important;
    }
  }
`;

document.head.appendChild(pwaStyles);

// Initialize PWA Manager when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new PWAManager();
  });
} else {
  new PWAManager();
}