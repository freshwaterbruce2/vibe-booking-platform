import { describe, it, expect } from 'vitest';
import { createWelcomeEmailTemplate } from './welcomeEmail.js';

describe('Welcome Email Template - TDD', () => {
  describe('Welcome Email System (RED PHASE - These tests should FAIL)', () => {
    it('should have createWelcomeEmailTemplate function', () => {
      // This test SHOULD FAIL initially - function doesn't exist yet
      expect(createWelcomeEmailTemplate).toBeDefined();
      expect(typeof createWelcomeEmailTemplate).toBe('function');
    });

    it('should generate welcome email with user details', () => {
      // This test SHOULD FAIL - function doesn't exist yet
      const template = createWelcomeEmailTemplate('John', 'Doe', 'john@example.com');

      expect(template).toBeDefined();
      expect(template.subject).toContain('Welcome to Vibe Hotels');
      expect(template.html).toContain('John');
      expect(template.html).toContain('luxury');
      expect(template.text).toBeDefined();
    });

    it('should include luxury hotel branding in welcome email', () => {
      // This test SHOULD FAIL - template doesn't exist yet
      const template = createWelcomeEmailTemplate('Jane', 'Smith', 'jane@example.com');

      expect(template.html).toContain('Vibe Hotels');
      expect(template.html).toContain('luxury');
      expect(template.html).toContain('#1c2951'); // Luxury navy color
      expect(template.html).toContain('🏨'); // Hotel emoji
    });

    it('should include call-to-action buttons in welcome email', () => {
      // This test SHOULD FAIL - CTA buttons don't exist yet
      const template = createWelcomeEmailTemplate('Alice', 'Johnson', 'alice@example.com');

      expect(template.html).toContain('Browse Hotels');
      expect(template.html).toContain('Complete Profile');
      expect(template.html).toContain('href=');
    });

    it('should personalize welcome message with user first name', () => {
      // This test SHOULD FAIL - personalization doesn't exist yet
      const template = createWelcomeEmailTemplate('Michael', 'Brown', 'michael@example.com');

      expect(template.html).toContain('Michael');
      expect(template.text).toContain('Michael');
      expect(template.subject).not.toContain('Michael'); // Name should not be in subject
    });

    it('should include luxury benefits in welcome email content', () => {
      // This test SHOULD FAIL - benefits content doesn't exist yet
      const template = createWelcomeEmailTemplate('Sarah', 'Davis', 'sarah@example.com');

      expect(template.html).toContain('member rates');
      expect(template.html).toContain('personalized recommendations');
      expect(template.html).toContain('exclusive');
      expect(template.html).toContain('premium');
    });
  });
});