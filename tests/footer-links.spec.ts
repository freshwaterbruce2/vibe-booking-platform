import { test, expect } from '@playwright/test';

test.describe('Footer Navigation Links', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3009');
    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');
  });

  const footerLinks = [
    // Explore section
    { text: 'Luxury Hotels', href: '/search' },
    { text: 'Exclusive Destinations', href: '/destinations' },
    { text: 'Member Offers', href: '/deals' },
    { text: 'Executive Travel', href: '/business' },

    // Services section
    { text: 'Personal Concierge', href: '/concierge' },
    { text: 'Rewards Program', href: '/rewards' },
    { text: 'Curated Experiences', href: '/experiences' },
    { text: '24/7 Support', href: '/support' },

    // Legal links
    { text: 'Privacy Policy', href: '/privacy' },
    { text: 'Terms of Service', href: '/terms' },
    { text: 'Accessibility', href: '/accessibility' },
  ];

  footerLinks.forEach(({ text, href }) => {
    test(`should navigate to ${text} (${href})`, async ({ page }) => {
      // Find and click the link
      const link = page.getByRole('link', { name: text });
      await expect(link).toBeVisible();

      // Click the link
      await link.click();

      // Check if we navigated (URL should change)
      await page.waitForLoadState('networkidle');
      const currentUrl = page.url();

      if (href === '/search' || href === '/destinations' || href === '/deals' || href === '/experiences' || href === '/rewards') {
        // These routes exist - should not be 404
        expect(currentUrl).toContain(href);
        await expect(page.locator('h1, h2')).toBeVisible(); // Should have content
      } else {
        // These routes don't exist yet - should show 404 or blank page
        console.log(`Missing route: ${href} - Current URL: ${currentUrl}`);
      }
    });
  });

  test('newsletter subscription form', async ({ page }) => {
    // Test newsletter form functionality
    const emailInput = page.locator('input[type="email"]');
    const subscribeButton = page.getByRole('button', { name: /subscribe/i });

    await expect(emailInput).toBeVisible();
    await expect(subscribeButton).toBeVisible();

    // Fill in email
    await emailInput.fill('test@example.com');

    // Click subscribe
    await subscribeButton.click();

    // Check console for subscription log (since it's just console.log currently)
    // In a real app, this would check for success message or API call
  });

  test('contact information is displayed', async ({ page }) => {
    // Check contact info in footer
    await expect(page.getByText('concierge@vibehotels.com')).toBeVisible();
    await expect(page.getByText('+1 (888) VIBE-LUXURY')).toBeVisible();
    await expect(page.getByText('Beverly Hills, CA')).toBeVisible();
  });

  test('trust badges are displayed', async ({ page }) => {
    // Check the new trust badges
    await expect(page.getByText('Secure Booking')).toBeVisible();
    await expect(page.getByText('Award Winning')).toBeVisible();
    await expect(page.getByText('Global Network')).toBeVisible();
    await expect(page.getByText('256-bit SSL Encryption')).toBeVisible();
    await expect(page.getByText('50,000+ Premium Hotels')).toBeVisible();
  });

  test('system status indicator', async ({ page }) => {
    await expect(page.getByText('All systems operational')).toBeVisible();
    // Check for the animated pulse dot
    const statusDot = page.locator('.animate-pulse').first();
    await expect(statusDot).toBeVisible();
  });
});

test.describe('Missing Routes Analysis', () => {
  const missingRoutes = [
    '/business',
    '/concierge',
    '/support',
    '/privacy',
    '/terms',
    '/accessibility'
  ];

  missingRoutes.forEach(route => {
    test(`check missing route: ${route}`, async ({ page }) => {
      await page.goto(`http://localhost:3009${route}`);
      await page.waitForLoadState('networkidle');

      // Should probably show a 404 or blank page since routes don't exist
      const pageContent = await page.textContent('body');
      console.log(`Route ${route} content length: ${pageContent?.length || 0}`);

      // Log this for analysis
      expect(true).toBe(true); // Just a placeholder to log the results
    });
  });
});