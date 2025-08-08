const { test, expect, chromium } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const fs = require('fs');
const path = require('path');

const TEST_URL = 'http://localhost:3001';

describe('Hotel Booking Accessibility Tests', () => {
  let browser;
  let context;
  let page;
  const accessibilityResults = {
    violations: [],
    passes: [],
    issues: [],
    summary: {}
  };
  
  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext();
  });
  
  afterAll(async () => {
    await generateAccessibilityReport();
    if (context) await context.close();
    if (browser) await browser.close();
  });
  
  beforeEach(async () => {
    page = await context.newPage();
  });
  
  afterEach(async () => {
    if (page) await page.close();
  });

  describe('WCAG 2.1 AA Compliance', () => {
    test('should pass axe-core accessibility audit on homepage', async () => {
      await page.goto(TEST_URL);
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      
      // Store results for reporting
      accessibilityResults.violations.push(...accessibilityScanResults.violations);
      accessibilityResults.passes.push(...accessibilityScanResults.passes);
      
      // Log violations for debugging
      if (accessibilityScanResults.violations.length > 0) {
        console.log('Accessibility Violations Found:');
        accessibilityScanResults.violations.forEach(violation => {
          console.log(`- ${violation.id}: ${violation.description}`);
          console.log(`  Impact: ${violation.impact}`);
          console.log(`  Help: ${violation.help}`);
          console.log(`  Nodes: ${violation.nodes.length}`);
        });
      }
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });
    
    test('should pass accessibility audit on search results page', async () => {
      await page.goto(TEST_URL);
      
      // Fill and submit search form
      await page.fill('#destination', 'Las Vegas, NV');
      await page.fill('#purpose', 'Business trip');
      await page.click('.search-btn');
      
      // Wait for results to load
      await page.waitForSelector('#funnyResponseText', { timeout: 10000 });
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      
      accessibilityResults.violations.push(...accessibilityScanResults.violations);
      accessibilityResults.passes.push(...accessibilityScanResults.passes);
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });

  describe('Keyboard Navigation', () => {
    test('should be fully navigable with keyboard only', async () => {
      await page.goto(TEST_URL);
      
      // Start keyboard navigation
      await page.keyboard.press('Tab');
      
      // Track focus movement
      const focusableElements = [];
      
      for (let i = 0; i < 15; i++) { // Test first 15 tab stops
        const focusedElement = await page.evaluate(() => {
          const element = document.activeElement;
          return {
            tagName: element.tagName,
            id: element.id,
            className: element.className,
            type: element.type,
            ariaLabel: element.getAttribute('aria-label'),
            text: element.textContent?.substring(0, 50)
          };
        });
        
        focusableElements.push(focusedElement);
        await page.keyboard.press('Tab');
      }
      
      // Verify focus is moving through interactive elements
      const interactiveElements = focusableElements.filter(el => 
        ['INPUT', 'BUTTON', 'SELECT', 'A'].includes(el.tagName)
      );
      
      expect(interactiveElements.length).toBeGreaterThan(5);
      
      // Test reverse navigation
      await page.keyboard.press('Shift+Tab');
      const reverseFocus = await page.evaluate(() => {
        return document.activeElement.tagName;
      });
      
      expect(['INPUT', 'BUTTON', 'SELECT', 'A'].includes(reverseFocus)).toBe(true);
    });
    
    test('should handle Enter and Space keys correctly', async () => {
      await page.goto(TEST_URL);
      
      // Test Enter key on search button
      await page.focus('.search-btn');
      
      // Mock form submission to avoid actual API calls
      await page.evaluate(() => {
        document.getElementById('searchForm').addEventListener('submit', (e) => {
          e.preventDefault();
          document.body.setAttribute('data-form-submitted', 'true');
        });
      });
      
      await page.keyboard.press('Enter');
      
      const formSubmitted = await page.getAttribute('body', 'data-form-submitted');
      expect(formSubmitted).toBe('true');
      
      // Test Space key on theme toggle
      await page.focus('.theme-toggle');
      
      const initialTheme = await page.evaluate(() => {
        return document.body.classList.contains('theme-purple');
      });
      
      await page.keyboard.press('Space');
      
      const newTheme = await page.evaluate(() => {
        return document.body.classList.contains('theme-purple');
      });
      
      expect(newTheme).toBe(!initialTheme);
    });
    
    test('should handle arrow keys in custom dropdowns', async () => {
      await page.goto(TEST_URL);
      
      // Focus on guests selector
      await page.focus('.guests-selector');
      
      // Open dropdown with Enter or Space
      await page.keyboard.press('Enter');
      
      // Check dropdown is open
      const isDropdownOpen = await page.isVisible('#guestsDropdown');
      expect(isDropdownOpen).toBe(true);
      
      // Test Escape key closes dropdown
      await page.keyboard.press('Escape');
      
      const isDropdownClosed = await page.isHidden('#guestsDropdown');
      expect(isDropdownClosed).toBe(true);
    });
  });

  describe('Screen Reader Support', () => {
    test('should have proper ARIA labels and descriptions', async () => {
      await page.goto(TEST_URL);
      
      // Check form inputs have proper labels
      const inputsWithLabels = await page.evaluate(() => {
        const inputs = document.querySelectorAll('input, select, textarea');
        const results = [];
        
        inputs.forEach(input => {
          const id = input.id;
          const label = document.querySelector(`label[for="${id}"]`);
          const ariaLabel = input.getAttribute('aria-label');
          const ariaLabelledBy = input.getAttribute('aria-labelledby');
          
          results.push({
            id,
            hasLabel: !!label,
            hasAriaLabel: !!ariaLabel,
            hasAriaLabelledBy: !!ariaLabelledBy,
            hasAnyLabel: !!(label || ariaLabel || ariaLabelledBy)
          });
        });
        
        return results;
      });
      
      // All inputs should have some form of label
      inputsWithLabels.forEach(input => {
        expect(input.hasAnyLabel).toBe(true);
      });
    });
    
    test('should have proper heading structure', async () => {
      await page.goto(TEST_URL);
      
      const headings = await page.evaluate(() => {
        const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        return Array.from(headingElements).map(h => ({
          level: parseInt(h.tagName.charAt(1)),
          text: h.textContent.trim()
        }));
      });
      
      // Should have at least one h1
      const h1Count = headings.filter(h => h.level === 1).length;
      expect(h1Count).toBeGreaterThanOrEqual(1);
      
      // Headings should be in logical order (no skipping levels)
      for (let i = 1; i < headings.length; i++) {
        const currentLevel = headings[i].level;
        const previousLevel = headings[i - 1].level;
        
        // Next heading should not skip more than one level
        if (currentLevel > previousLevel) {
          expect(currentLevel - previousLevel).toBeLessThanOrEqual(1);
        }
      }
    });
    
    test('should have proper ARIA roles and states', async () => {
      await page.goto(TEST_URL);
      
      // Check combobox has proper ARIA attributes
      const guestsSelector = await page.evaluate(() => {
        const element = document.querySelector('.guests-selector');
        return {
          role: element.getAttribute('role'),
          ariaHaspopup: element.getAttribute('aria-haspopup'),
          ariaExpanded: element.getAttribute('aria-expanded'),
          tabindex: element.getAttribute('tabindex')
        };
      });
      
      expect(guestsSelector.role).toBe('combobox');
      expect(guestsSelector.ariaHaspopup).toBe('true');
      expect(guestsSelector.ariaExpanded).toBe('false');
      expect(guestsSelector.tabindex).toBe('0');
      
      // Check buttons have proper labels
      const buttons = await page.evaluate(() => {
        const buttonElements = document.querySelectorAll('button');
        return Array.from(buttonElements).map(button => ({
          text: button.textContent.trim(),
          ariaLabel: button.getAttribute('aria-label'),
          title: button.getAttribute('title'),
          hasAccessibleName: !!(button.textContent.trim() || button.getAttribute('aria-label') || button.getAttribute('title'))
        }));
      });
      
      buttons.forEach(button => {
        expect(button.hasAccessibleName).toBe(true);
      });
    });
  });

  describe('Color Contrast and Visual Accessibility', () => {
    test('should have sufficient color contrast ratios', async () => {
      await page.goto(TEST_URL);
      
      // Use axe-core to check color contrast
      const colorContrastResults = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .withRules(['color-contrast'])
        .analyze();
      
      accessibilityResults.violations.push(...colorContrastResults.violations);
      
      expect(colorContrastResults.violations).toEqual([]);
    });
    
    test('should be usable when CSS is disabled', async () => {
      await page.goto(TEST_URL);
      
      // Disable CSS
      await page.addStyleTag({
        content: '* { all: unset !important; display: block !important; }'
      });
      
      // Check that form is still usable
      const destinationInput = page.locator('#destination');
      await expect(destinationInput).toBeVisible();
      
      const searchButton = page.locator('.search-btn');
      await expect(searchButton).toBeVisible();
      
      // Test that form can still be filled
      await page.fill('#destination', 'Test City');
      const inputValue = await page.inputValue('#destination');
      expect(inputValue).toBe('Test City');
    });
    
    test('should support high contrast mode', async () => {
      await page.goto(TEST_URL);
      
      // Simulate high contrast mode
      await page.evaluate(() => {
        document.body.style.filter = 'contrast(2) brightness(1.5)';
      });
      
      // Check that elements are still visible and functional
      const searchForm = page.locator('#searchForm');
      await expect(searchForm).toBeVisible();
      
      const inputs = await page.locator('input').count();
      expect(inputs).toBeGreaterThan(0);
    });
  });

  describe('Form Accessibility', () => {
    test('should provide clear error messages and validation', async () => {
      await page.goto(TEST_URL);
      
      // Test HTML5 validation
      await page.click('.search-btn'); // Submit empty form
      
      const destinationValidity = await page.evaluate(() => {
        const input = document.getElementById('destination');
        return {
          valid: input.checkValidity(),
          validationMessage: input.validationMessage
        };
      });
      
      expect(destinationValidity.valid).toBe(false);
      expect(destinationValidity.validationMessage).toBeTruthy();
    });
    
    test('should associate error messages with form fields', async () => {
      await page.goto(TEST_URL);
      
      // Check that required fields have proper attributes
      const requiredFields = await page.evaluate(() => {
        const inputs = document.querySelectorAll('input[required]');
        return Array.from(inputs).map(input => ({
          id: input.id,
          required: input.required,
          ariaRequired: input.getAttribute('aria-required'),
          ariaInvalid: input.getAttribute('aria-invalid')
        }));
      });
      
      requiredFields.forEach(field => {
        expect(field.required).toBe(true);
        // Should have aria-required or aria-invalid for screen readers
        expect(field.ariaRequired === 'true' || field.ariaInvalid !== null).toBe(true);
      });
    });
  });

  describe('Responsive Accessibility', () => {
    test('should maintain accessibility on mobile devices', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(TEST_URL);
      
      // Run accessibility audit on mobile viewport
      const mobileAccessibilityResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
      
      accessibilityResults.violations.push(...mobileAccessibilityResults.violations);
      
      expect(mobileAccessibilityResults.violations).toEqual([]);
      
      // Test touch targets are large enough (44x44 pixels minimum)
      const touchTargets = await page.evaluate(() => {
        const interactiveElements = document.querySelectorAll('button, input, select, a, [tabindex="0"]');
        return Array.from(interactiveElements).map(element => {
          const rect = element.getBoundingClientRect();
          return {
            tagName: element.tagName,
            width: rect.width,
            height: rect.height,
            meetsMinSize: rect.width >= 44 && rect.height >= 44
          };
        });
      });
      
      // Most touch targets should meet minimum size requirements
      const adequateTargets = touchTargets.filter(target => target.meetsMinSize);
      const inadequateTargets = touchTargets.filter(target => !target.meetsMinSize);
      
      // Log inadequate targets for review
      if (inadequateTargets.length > 0) {
        console.log('Touch targets below 44x44px:', inadequateTargets);
        accessibilityResults.issues.push({
          type: 'Touch Target Size',
          count: inadequateTargets.length,
          elements: inadequateTargets
        });
      }
      
      // At least 80% of targets should meet size requirements
      const adequatePercentage = (adequateTargets.length / touchTargets.length) * 100;
      expect(adequatePercentage).toBeGreaterThanOrEqual(80);
    });
  });

  describe('Focus Management', () => {
    test('should have visible focus indicators', async () => {
      await page.goto(TEST_URL);
      
      // Check that focus indicators are visible
      await page.focus('#destination');
      
      const focusStyles = await page.evaluate(() => {
        const element = document.getElementById('destination');
        const computedStyles = window.getComputedStyle(element, ':focus');
        return {
          outline: computedStyles.outline,
          outlineWidth: computedStyles.outlineWidth,
          outlineStyle: computedStyles.outlineStyle,
          outlineColor: computedStyles.outlineColor,
          boxShadow: computedStyles.boxShadow
        };
      });
      
      // Should have some form of focus indicator
      const hasFocusIndicator = 
        focusStyles.outlineWidth !== '0px' ||
        focusStyles.boxShadow !== 'none' ||
        focusStyles.outline !== 'none';
      
      expect(hasFocusIndicator).toBe(true);
    });
    
    test('should trap focus in modal dialogs', async () => {
      await page.goto(TEST_URL);
      
      // If there are any modal dialogs, test focus trapping
      // This is a placeholder for modal testing if modals exist
      const modals = await page.locator('[role="dialog"]').count();
      
      if (modals > 0) {
        // Test focus trapping within modal
        await page.keyboard.press('Tab');
        const focusedElement = await page.evaluate(() => {
          return document.activeElement.closest('[role="dialog"]') !== null;
        });
        expect(focusedElement).toBe(true);
      }
    });
  });
});

// Helper function to generate accessibility report
async function generateAccessibilityReport() {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalViolations: accessibilityResults.violations.length,
      totalPasses: accessibilityResults.passes.length,
      totalIssues: accessibilityResults.issues.length,
      criticalViolations: accessibilityResults.violations.filter(v => v.impact === 'critical').length,
      seriousViolations: accessibilityResults.violations.filter(v => v.impact === 'serious').length,
      moderateViolations: accessibilityResults.violations.filter(v => v.impact === 'moderate').length,
      minorViolations: accessibilityResults.violations.filter(v => v.impact === 'minor').length
    },
    violations: accessibilityResults.violations.map(violation => ({
      id: violation.id,
      impact: violation.impact,
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      nodes: violation.nodes.length,
      tags: violation.tags
    })),
    issues: accessibilityResults.issues,
    recommendations: generateAccessibilityRecommendations()
  };
  
  // Write report to file
  const reportPath = path.join(__dirname, '../accessibility-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('\n========== ACCESSIBILITY TEST REPORT ==========');
  console.log(`Total Violations: ${report.summary.totalViolations}`);
  console.log(`  Critical: ${report.summary.criticalViolations}`);
  console.log(`  Serious: ${report.summary.seriousViolations}`);
  console.log(`  Moderate: ${report.summary.moderateViolations}`);
  console.log(`  Minor: ${report.summary.minorViolations}`);
  console.log(`Total Passes: ${report.summary.totalPasses}`);
  console.log(`Total Issues: ${report.summary.totalIssues}`);
  
  if (report.violations.length > 0) {
    console.log('\nTop Violations:');
    report.violations.slice(0, 5).forEach(violation => {
      console.log(`- ${violation.id} (${violation.impact}): ${violation.description}`);
    });
  }
  
  console.log(`\nFull report saved to: ${reportPath}`);
  console.log('===============================================\n');
}

function generateAccessibilityRecommendations() {
  const recommendations = [];
  
  if (accessibilityResults.violations.length > 0) {
    const criticalViolations = accessibilityResults.violations.filter(v => v.impact === 'critical');
    const seriousViolations = accessibilityResults.violations.filter(v => v.impact === 'serious');
    
    if (criticalViolations.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Critical Issues',
        items: criticalViolations.map(v => `Fix ${v.id}: ${v.description}`)
      });
    }
    
    if (seriousViolations.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Serious Issues',
        items: seriousViolations.map(v => `Address ${v.id}: ${v.description}`)
      });
    }
  }
  
  // General recommendations
  recommendations.push({
    priority: 'LOW',
    category: 'Best Practices',
    items: [
      'Regularly test with screen readers (NVDA, JAWS, VoiceOver)',
      'Test keyboard navigation on all interactive elements',
      'Validate color contrast ratios meet WCAG 2.1 AA standards',
      'Ensure all images have meaningful alt text',
      'Test with users who have disabilities',
      'Consider implementing skip links for navigation',
      'Ensure error messages are clear and associated with form fields'
    ]
  });
  
  return recommendations;
}
