import { test, expect } from '@playwright/test';

test.describe('Practice Session Pages', () => {
  test('should redirect to login when accessing student dashboard unauthenticated', async ({ page }) => {
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to login when accessing practice page unauthenticated', async ({ page }) => {
    await page.goto('/practice/vetrumai');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to login when accessing results page unauthenticated', async ({ page }) => {
    await page.goto('/results/test-attempt-id');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should have questions API route', async ({ request }) => {
    // Test that the API route exists (will return 401 without auth)
    const response = await request.get('/api/questions?section=vetrumai&limit=5');

    // Should return 401 Unauthorized without auth
    expect(response.status()).toBe(401);
  });

  test('should have attempts API route', async ({ request }) => {
    // Test that the API route exists (will return 401 without auth)
    const response = await request.post('/api/attempts', {
      data: { question_id: 'test', selected_option: 'A' }
    });

    // Should return 401 Unauthorized without auth
    expect(response.status()).toBe(401);
  });
});
