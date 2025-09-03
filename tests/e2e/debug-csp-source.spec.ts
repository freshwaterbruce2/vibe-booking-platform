import { test, expect } from '@playwright/test';

test('Debug CSP meta tag source', async ({ page }) => {
  await page.goto('http://localhost:3010');
  
  // Wait for page to fully load
  await page.waitForLoadState('networkidle');
  
  // Get the HTML source
  const htmlContent = await page.content();
  
  console.log('=== CHECKING HTML SOURCE FOR CSP META TAGS ===');
  
  // Look for meta tags with http-equiv
  const metaTags = htmlContent.match(/<meta[^>]*http-equiv[^>]*>/gi) || [];
  console.log('Meta tags with http-equiv:', metaTags);
  
  // Look for CSP-related content
  const cspContent = htmlContent.match(/Content-Security-Policy[^"'>]*/gi) || [];
  console.log('CSP content found:', cspContent);
  
  // Check if CSP is in head
  const headContent = htmlContent.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  if (headContent) {
    const headText = headContent[1];
    if (headText.includes('Content-Security-Policy')) {
      console.log('CSP found in HEAD section');
      const cspLines = headText.split('\n').filter(line => 
        line.includes('Content-Security-Policy') || 
        line.includes('http-equiv')
      );
      console.log('CSP-related lines:', cspLines);
    }
  }
  
  // Check response headers
  const response = await page.goto('http://localhost:3010');
  if (response) {
    const headers = response.headers();
    console.log('Response headers:');
    Object.keys(headers).forEach(key => {
      if (key.toLowerCase().includes('security') || key.toLowerCase().includes('csp')) {
        console.log(`${key}: ${headers[key]}`);
      }
    });
  }
});