import { test, expect } from '@playwright/test';

test.describe('Adaimozhi Feature', () => {
  test.describe('Student Practice - Unauthenticated', () => {
    test('should redirect to login when accessing adaimozhi practice unauthenticated', async ({ page }) => {
      await page.goto('/practice/adaimozhi');

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });

    test('should return 401 for adaimozhi questions API without auth', async ({ request }) => {
      const response = await request.get('/api/practice/adaimozhi?limit=5');

      // Should return 401 Unauthorized without auth
      expect(response.status()).toBe(401);
    });

    test('should return 401 for adaimozhi sessions API without auth', async ({ request }) => {
      const response = await request.post('/api/practice/adaimozhi/sessions', {
        data: { questionCount: 10 },
      });

      expect(response.status()).toBe(401);
    });
  });

  test.describe('Teacher APIs - Unauthenticated', () => {
    test('should return 401 for teacher adaimozhi list API without auth', async ({ request }) => {
      const response = await request.get('/api/teacher/practice/adaimozhi');

      expect(response.status()).toBe(401);
    });

    test('should return 401 for teacher adaimozhi create API without auth', async ({ request }) => {
      const response = await request.post('/api/teacher/practice/adaimozhi', {
        data: {
          phrase_text: 'தாமரை _____',
          missing_word: 'கண்கள்',
          complete_phrase: 'தாமரை கண்கள்',
        },
      });

      expect(response.status()).toBe(401);
    });

    test('should return 401 for teacher adaimozhi import API without auth', async ({ request }) => {
      const response = await request.post('/api/teacher/practice/adaimozhi/import');

      expect(response.status()).toBe(401);
    });
  });

  test.describe('Teacher Pages - Unauthenticated', () => {
    test('should redirect to login when accessing teacher adaimozhi list', async ({ page }) => {
      await page.goto('/teacher/practice/adaimozhi');

      await expect(page).toHaveURL(/\/login/);
    });

    test('should redirect to login when accessing teacher adaimozhi create page', async ({ page }) => {
      await page.goto('/teacher/practice/adaimozhi/new');

      await expect(page).toHaveURL(/\/login/);
    });

    test('should redirect to login when accessing teacher adaimozhi import page', async ({ page }) => {
      await page.goto('/teacher/practice/adaimozhi/import');

      await expect(page).toHaveURL(/\/login/);
    });
  });
});

// Authenticated tests require test user setup
// These tests should be run with proper test fixtures and authentication

test.describe.skip('Adaimozhi - Authenticated Student', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: Implement test user authentication
    // await loginAsStudent(page);
  });

  test('should load adaimozhi practice page with questions', async ({ page }) => {
    await page.goto('/practice/adaimozhi');

    // Should see practice header
    await expect(page.getByRole('heading', { name: /adaimozhi/i })).toBeVisible();

    // Should see a question with blank (_____)
    await expect(page.locator('.font-tamil').filter({ hasText: '_____' })).toBeVisible();

    // Should see 4 MCQ options
    await expect(page.getByRole('radio')).toHaveCount(4);
  });

  test('should submit answer and see result', async ({ page }) => {
    await page.goto('/practice/adaimozhi');

    // Select an option
    await page.getByRole('radio').first().click();

    // Should show result with complete phrase and meaning
    await expect(page.getByText(/முழு சொற்றொடர்/i)).toBeVisible();
  });

  test('distractors should come from other adaimozhi entries', async ({ page }) => {
    await page.goto('/practice/adaimozhi');

    // Get all option texts
    const options = await page.getByRole('radio').allTextContents();

    // All options should be Tamil words (not placeholders)
    for (const option of options) {
      expect(option).toMatch(/[\u0B80-\u0BFF]+/);
    }
  });
});

test.describe.skip('Adaimozhi - Authenticated Teacher', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: Implement test teacher authentication
    // await loginAsTeacher(page);
  });

  test('should list teacher adaimozhi entries', async ({ page }) => {
    await page.goto('/teacher/practice/adaimozhi');

    // Should see content management header
    await expect(page.getByRole('heading', { name: /adaimozhi content/i })).toBeVisible();

    // Should see status filter tabs
    await expect(page.getByRole('button', { name: /all/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /draft/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /published/i })).toBeVisible();
  });

  test('should create new adaimozhi entry', async ({ page }) => {
    await page.goto('/teacher/practice/adaimozhi/new');

    // Fill form
    await page.getByLabel(/complete phrase/i).fill('தாமரை கண்கள்');
    await page.getByLabel(/missing word/i).fill('கண்கள்');
    await page.getByLabel(/tamil meaning/i).fill('தாமரை போன்ற அழகிய கண்கள்');

    // Auto-generated phrase with blank should appear
    await expect(page.getByLabel(/phrase with blank/i)).toHaveValue('தாமரை _____');

    // Submit
    await page.getByRole('button', { name: /create entry/i }).click();

    // Should redirect to list
    await expect(page).toHaveURL('/teacher/practice/adaimozhi');
  });

  test('should import CSV file', async ({ page }) => {
    await page.goto('/teacher/practice/adaimozhi/import');

    // Upload CSV
    const csvContent = `phrase_with_blank,missing_word,complete_phrase,meaning_ta,meaning_en
தாமரை _____,கண்கள்,தாமரை கண்கள்,தாமரை போன்ற அழகிய கண்கள்,Beautiful eyes like lotus`;

    // Create a file and upload
    // Note: This requires test file creation
    // await page.setInputFiles('input[type="file"]', 'tests/fixtures/adaimozhi-sample.csv');

    // Should show preview table
    // await expect(page.getByText(/preview import/i)).toBeVisible();
  });

  test('should publish and unpublish entries', async ({ page }) => {
    await page.goto('/teacher/practice/adaimozhi');

    // Click publish on a draft entry
    await page.getByRole('button', { name: /publish/i }).first().click();

    // Entry should now show as published
    await expect(page.getByText(/published/i)).toBeVisible();
  });
});
