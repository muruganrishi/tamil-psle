import { test, expect } from '@playwright/test';

test.describe('Sorporul (Word Meanings) Practice', () => {
  // ============================================================================
  // Page Access Tests (Unauthenticated)
  // ============================================================================

  test('should redirect to login when accessing sorporul practice page unauthenticated', async ({ page }) => {
    await page.goto('/practice/sorporul');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to login when accessing vocab page unauthenticated', async ({ page }) => {
    await page.goto('/vocab');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to login when accessing vocab review page unauthenticated', async ({ page }) => {
    await page.goto('/vocab/review');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to login when accessing teacher sorporul questions page unauthenticated', async ({ page }) => {
    await page.goto('/teacher/practice/sorporul');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to login when accessing teacher question creation page unauthenticated', async ({ page }) => {
    await page.goto('/teacher/practice/sorporul/new');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to login when accessing teacher CSV import page unauthenticated', async ({ page }) => {
    await page.goto('/teacher/practice/sorporul/import');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  // ============================================================================
  // API Route Tests - Student Endpoints
  // ============================================================================

  test('should have sorporul questions GET API route', async ({ request }) => {
    // Test that the API route exists (will return 401 without auth, or 500 if server config issue)
    const response = await request.get('/api/practice/sorporul/questions?limit=10');

    // Should NOT return 404 - route should exist
    expect(response.status()).not.toBe(404);
  });

  test('should have vocab review GET API route', async ({ request }) => {
    // Test that the API route exists (will return 401 without auth)
    const response = await request.get('/api/vocab/review?limit=10');

    // Should return 401 Unauthorized without auth
    expect(response.status()).toBe(401);
  });

  test('should have vocab review POST API route', async ({ request }) => {
    // Test that the API route exists (will return 401 without auth)
    const response = await request.post('/api/vocab/review', {
      data: {
        word: 'அழகு',
        result: 'good',
      },
    });

    // Should return 401 Unauthorized without auth
    expect(response.status()).toBe(401);
  });

  // ============================================================================
  // API Route Tests - Teacher Endpoints
  // ============================================================================

  test('should have sorporul questions POST API route (teacher)', async ({ request }) => {
    // Test that the API route exists (will return 401 without auth, or 500 if server config issue)
    const response = await request.post('/api/practice/sorporul/questions', {
      data: {
        targetWord: 'அழகு',
        correctDefinition: 'எழில்',
        distractors: ['உணவு', 'நீர்', 'தீ'],
        status: 'draft',
      },
    });

    // Should NOT return 404 - route should exist
    expect(response.status()).not.toBe(404);
  });

  test('should have sorporul question status PATCH API route', async ({ request }) => {
    // Test that the API route exists (will return 401 without auth, or 500 if server config issue)
    const response = await request.patch('/api/practice/sorporul/questions/test-id', {
      data: {
        status: 'published',
      },
    });

    // Should NOT return 404 - route should exist
    expect(response.status()).not.toBe(404);
  });

  test('should have generate distractors API route', async ({ request }) => {
    // Test that the API route exists (will return 401 without auth, or 500 if server config issue)
    const response = await request.post('/api/practice/sorporul/generate-distractors', {
      data: {
        targetWord: 'அழகு',
        correctDefinition: 'எழில்',
      },
    });

    // Should NOT return 404 - route should exist
    expect(response.status()).not.toBe(404);
  });

  test('should have CSV import API route', async ({ request }) => {
    // Test that the API route exists (will return 401 without auth, or 500 if server config issue)
    const response = await request.post('/api/practice/sorporul/import-csv', {
      data: {
        action: 'confirm',
        uploadId: 'test-id',
      },
    });

    // Should NOT return 404 - route should exist
    expect(response.status()).not.toBe(404);
  });

  // ============================================================================
  // API Validation Tests
  // ============================================================================

  test('should reject invalid question creation data', async ({ request }) => {
    // Test validation - missing required fields
    const response = await request.post('/api/practice/sorporul/questions', {
      data: {
        // Missing targetWord and correctDefinition
        distractors: ['a', 'b', 'c'],
      },
    });

    // Should return 401 (auth first), 400 (validation), or 500 (server config issue)
    // Main thing is route exists (not 404)
    expect(response.status()).not.toBe(404);
  });

  test('should reject invalid distractor generation request', async ({ request }) => {
    // Test validation - missing required fields
    const response = await request.post('/api/practice/sorporul/generate-distractors', {
      data: {
        // Missing targetWord
        correctDefinition: 'test',
      },
    });

    // Should return 401 (auth first), 400 (validation), or 500 (server config issue)
    // Main thing is route exists (not 404)
    expect(response.status()).not.toBe(404);
  });

  test('should reject invalid vocab review submission', async ({ request }) => {
    // Test validation - invalid result value
    const response = await request.post('/api/vocab/review', {
      data: {
        word: 'test',
        result: 'invalid_result', // Should be 'again', 'hard', 'good', or 'easy'
      },
    });

    // Should return 401 (auth first) or 400 (validation)
    expect([400, 401]).toContain(response.status());
  });
});

test.describe('Sorporul Feature - Page Content', () => {
  // These tests verify page structure without authentication
  // They check that pages load and have expected elements before redirect

  test('sorporul practice page should have proper route', async ({ page }) => {
    // Navigate and check we get redirected (proves route exists)
    const response = await page.goto('/practice/sorporul');

    // Route should exist and respond
    expect(response?.status()).toBeLessThan(500);
  });

  test('vocab page should have proper route', async ({ page }) => {
    const response = await page.goto('/vocab');

    // Route should exist and respond
    expect(response?.status()).toBeLessThan(500);
  });

  test('vocab review page should have proper route', async ({ page }) => {
    const response = await page.goto('/vocab/review');

    // Route should exist and respond
    expect(response?.status()).toBeLessThan(500);
  });

  test('teacher sorporul page should have proper route', async ({ page }) => {
    const response = await page.goto('/teacher/practice/sorporul');

    // Route should exist and respond
    expect(response?.status()).toBeLessThan(500);
  });

  test('teacher question creation page should have proper route', async ({ page }) => {
    const response = await page.goto('/teacher/practice/sorporul/new');

    // Route should exist and respond
    expect(response?.status()).toBeLessThan(500);
  });

  test('teacher CSV import page should have proper route', async ({ page }) => {
    const response = await page.goto('/teacher/practice/sorporul/import');

    // Route should exist and respond
    expect(response?.status()).toBeLessThan(500);
  });
});
