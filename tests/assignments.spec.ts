import { test, expect } from '@playwright/test';

test.describe('Assignments Feature', () => {
  test('should redirect to login when accessing assignment creation page unauthenticated', async ({ page }) => {
    await page.goto('/teacher/classes/test-class-id/assignments/new');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to login when accessing class results page unauthenticated', async ({ page }) => {
    await page.goto('/teacher/classes/test-class-id/results');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should have assignments API route', async ({ request }) => {
    // Test that the API route exists (will return 401 without auth)
    const response = await request.get('/api/assignments');

    // Should return 401 Unauthorized without auth
    expect(response.status()).toBe(401);
  });

  test('should have assignment detail API route', async ({ request }) => {
    // Test that the API route exists (will return 401 without auth)
    const response = await request.get('/api/assignments/test-assignment-id');

    // Should return 401 Unauthorized without auth
    expect(response.status()).toBe(401);
  });

  test('should have assignment results API route', async ({ request }) => {
    // Test that the API route exists (will return 401 without auth)
    const response = await request.get('/api/assignments/test-assignment-id/results');

    // Should return 401 Unauthorized without auth
    expect(response.status()).toBe(401);
  });

  test('should reject assignment creation without auth', async ({ request }) => {
    const response = await request.post('/api/assignments', {
      data: {
        class_id: 'test-class',
        title: 'Test Assignment',
        sections: ['vetrumai'],
        question_count: 5,
        max_attempts: 1
      }
    });

    // Should return 401 Unauthorized without auth
    expect(response.status()).toBe(401);
  });
});
