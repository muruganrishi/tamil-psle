import { test, expect } from '@playwright/test';

test.describe('Word Meaning Feature', () => {
  test('should have meaning API route', async ({ request }) => {
    // Test that the API route exists (will return 401 without auth)
    const response = await request.post('/api/meaning', {
      data: {
        word: 'வணக்கம்',
        context: 'Test context sentence',
        language: 'en'
      }
    });

    // Should return 401 Unauthorized without auth
    expect(response.status()).toBe(401);
  });

  test('should redirect to login when accessing saved words page unauthenticated', async ({ page }) => {
    await page.goto('/saved-words');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should have saved-words API route', async ({ request }) => {
    // Test that the API route exists (will return 401 without auth)
    const response = await request.get('/api/saved-words');

    // Should return 401 Unauthorized without auth
    expect(response.status()).toBe(401);
  });

  test('should have profile language API route', async ({ request }) => {
    // Test that the API route exists (will return 401 without auth)
    const response = await request.patch('/api/profile/language', {
      data: { preferred_language: 'en' }
    });

    // Should return 401 Unauthorized without auth
    expect(response.status()).toBe(401);
  });
});
