const puppeteer = require('puppeteer');

async function testNavigation() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const page = await browser.newPage();

  try {
    console.log('🚀 Testing Vibe Hotels navigation...');

    // Navigate to the main page
    await page.goto('http://localhost:3009', { waitUntil: 'networkidle2' });
    console.log('✅ Page loaded successfully');

    // Test footer links
    const linksToTest = [
      { text: 'Executive Travel', expectedUrl: '/business' },
      { text: 'Personal Concierge', expectedUrl: '/concierge' },
      { text: '24/7 Support', expectedUrl: '/support' },
      { text: 'Privacy Policy', expectedUrl: '/privacy' },
      { text: 'Terms of Service', expectedUrl: '/terms' },
      { text: 'Accessibility', expectedUrl: '/accessibility' }
    ];

    for (const link of linksToTest) {
      try {
        console.log(`🔗 Testing link: ${link.text}`);

        // Find and click the link
        await page.evaluate((linkText) => {
          const links = Array.from(document.querySelectorAll('a'));
          const link = links.find(l => l.textContent.includes(linkText));
          if (link) {
            link.click();
          } else {
            throw new Error(`Link "${linkText}" not found`);
          }
        }, link.text);

        // Wait for navigation
        await page.waitForNavigation({ waitUntil: 'networkidle2' });

        // Check URL
        const currentUrl = page.url();
        if (currentUrl.includes(link.expectedUrl)) {
          console.log(`✅ ${link.text} -> ${link.expectedUrl} works!`);
        } else {
          console.log(`❌ ${link.text} failed. Expected: ${link.expectedUrl}, Got: ${currentUrl}`);
        }

        // Go back to main page
        await page.goto('http://localhost:3009', { waitUntil: 'networkidle2' });

      } catch (error) {
        console.log(`❌ ${link.text} failed: ${error.message}`);
      }
    }

    // Test newsletter subscription
    console.log('📧 Testing newsletter subscription...');
    try {
      await page.type('input[type="email"]', 'test@example.com');
      await page.click('button[type="submit"]');

      // Wait for button text to change
      await page.waitForFunction(
        () => {
          const button = document.querySelector('button[type="submit"]');
          return button && button.textContent.includes('Subscribing...');
        },
        { timeout: 2000 }
      );

      console.log('✅ Newsletter subscription form works!');
    } catch (error) {
      console.log(`❌ Newsletter subscription failed: ${error.message}`);
    }

    console.log('\n🎉 Navigation testing complete!');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

testNavigation();