import { test, expect } from '@playwright/test';

test.describe('Class Management', () => {
  test('should redirect to login when accessing student classes page unauthenticated', async ({ page }) => {
    await page.goto('/classes');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to login when accessing teacher dashboard unauthenticated', async ({ page }) => {
    await page.goto('/teacher');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to login when accessing teacher class detail unauthenticated', async ({ page }) => {
    await page.goto('/teacher/classes/test-class-id');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should have classes API route', async ({ request }) => {
    // Test that the API route exists (will return 401 without auth)
    const response = await request.get('/api/classes');

    // Should return 401 Unauthorized without auth
    expect(response.status()).toBe(401);
  });

  test('should have class join API route', async ({ request }) => {
    // Test that the API route exists (will return 401 without auth)
    const response = await request.post('/api/classes/join', {
      data: { join_code: 'ABC123' }
    });

    // Should return 401 Unauthorized without auth
    expect(response.status()).toBe(401);
  });

  test('should have class detail API route', async ({ request }) => {
    // Test that the API route exists (will return 401 without auth)
    const response = await request.get('/api/classes/test-class-id');

    // Should return 401 Unauthorized without auth
    expect(response.status()).toBe(401);
  });
});
