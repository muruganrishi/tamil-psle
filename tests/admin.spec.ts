import { test, expect } from '@playwright/test';

test.describe('Admin Features', () => {
  test('should redirect to login when accessing admin dashboard unauthenticated', async ({ page }) => {
    await page.goto('/admin');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to login when accessing admin questions page unauthenticated', async ({ page }) => {
    await page.goto('/admin/questions');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to login when accessing admin question creation page unauthenticated', async ({ page }) => {
    await page.goto('/admin/questions/new');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to login when accessing admin CSV import page unauthenticated', async ({ page }) => {
    await page.goto('/admin/questions/import');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to login when accessing admin users page unauthenticated', async ({ page }) => {
    await page.goto('/admin/users');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should have admin questions API route', async ({ request }) => {
    // Test that the API route exists (will return 401 without auth)
    const response = await request.get('/api/admin/questions');

    // Should return 401 Unauthorized without auth
    expect(response.status()).toBe(401);
  });

  test('should have admin stats API route', async ({ request }) => {
    // Test that the API route exists (will return 401 without auth)
    const response = await request.get('/api/admin/stats');

    // Should return 401 Unauthorized without auth
    expect(response.status()).toBe(401);
  });

  test('should have admin users API route', async ({ request }) => {
    // Test that the API route exists (will return 401 without auth)
    const response = await request.get('/api/admin/users');

    // Should return 401 Unauthorized without auth
    expect(response.status()).toBe(401);
  });

  test('should have admin OCR assist API route', async ({ request }) => {
    // Test that the API route exists (will return 401 without auth)
    const response = await request.post('/api/admin/ocr-assist', {
      data: { image: 'data:image/jpeg;base64,test' }
    });

    // Should return 401 Unauthorized without auth
    expect(response.status()).toBe(401);
  });

  test('should have admin CSV import API route', async ({ request }) => {
    // Test that the API route exists (will return 401 without auth)
    const response = await request.post('/api/admin/questions/import-csv', {
      data: { questions: [] }
    });

    // Should return 401 Unauthorized without auth
    expect(response.status()).toBe(401);
  });

  test('should reject question creation without auth', async ({ request }) => {
    const response = await request.post('/api/admin/questions', {
      data: {
        section: 'vetrumai',
        question_text: 'Test question',
        options: [
          { label: 'A', text: 'Option A', is_correct: true },
          { label: 'B', text: 'Option B', is_correct: false },
          { label: 'C', text: 'Option C', is_correct: false },
          { label: 'D', text: 'Option D', is_correct: false }
        ],
        status: 'draft'
      }
    });

    // Should return 401 Unauthorized without auth
    expect(response.status()).toBe(401);
  });
});
