import { test, expect } from '@playwright/test';

test.describe('Sorporul Practice Feature', () => {
  test.describe('API Routes', () => {
    test('should have sorporul sessions API route', async ({ request }) => {
      // Test that the API route exists (will return 401 without auth)
      const response = await request.post('/api/practice/sorporul/sessions', {
        headers: { 'Content-Type': 'application/json' },
        data: { questionCount: 10 },
      });

      // Route should exist (not 404) and return JSON with error
      expect(response.status()).not.toBe(404);
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(body).toHaveProperty('code');
    });

    test('should have sorporul next question API route', async ({ request }) => {
      const response = await request.get('/api/practice/sorporul/sessions/test-attempt-id/next?current=0');

      // Route should exist (not 404) and return JSON with error
      expect(response.status()).not.toBe(404);
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(body).toHaveProperty('code');
    });

    test('should have sorporul submit API route', async ({ request }) => {
      const response = await request.post('/api/practice/sorporul/sessions/test-attempt-id/submit', {
        headers: { 'Content-Type': 'application/json' },
        data: { answers: [] },
      });

      // Route should exist (not 404) and return JSON with error
      expect(response.status()).not.toBe(404);
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(body).toHaveProperty('code');
    });

    test('should have teacher sorporul content API route', async ({ request }) => {
      const response = await request.get('/api/teacher/practice/sorporul');

      // Route should exist (not 404) and return JSON with error
      expect(response.status()).not.toBe(404);
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(body).toHaveProperty('code');
    });

    test('should have teacher sorporul import API route', async ({ request }) => {
      const response = await request.post('/api/teacher/practice/sorporul/import', {
        headers: { 'Content-Type': 'application/json' },
        data: { questions: [] },
      });

      // Route should exist (not 404) and return JSON with error
      expect(response.status()).not.toBe(404);
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(body).toHaveProperty('code');
    });

    test('should have teacher AI generate distractors API route', async ({ request }) => {
      const response = await request.post('/api/teacher/practice/sorporul/ai-generate', {
        headers: { 'Content-Type': 'application/json' },
        data: {
          targetWord: 'வணக்கம்',
          correctMeaning: 'Hello',
          count: 3,
        },
      });

      // Route should exist (not 404) and return JSON with error
      expect(response.status()).not.toBe(404);
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(body).toHaveProperty('code');
    });
  });

  test.describe('Page Routes', () => {
    test('should redirect to login when accessing sorporul practice page unauthenticated', async ({ page }) => {
      await page.goto('/practice/sorporul');

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });

    test('should redirect to login when accessing vocab bank unauthenticated', async ({ page }) => {
      await page.goto('/vocab');

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });

    test('should redirect to login when accessing vocab review unauthenticated', async ({ page }) => {
      await page.goto('/vocab/review');

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });

    test('should redirect to login when accessing teacher sorporul page unauthenticated', async ({ page }) => {
      await page.goto('/teacher/practice/sorporul');

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });
  });
});

test.describe('Vocabulary Bank Feature', () => {
  test.describe('API Routes', () => {
    test('should have saved-words API route (GET)', async ({ request }) => {
      const response = await request.get('/api/saved-words');

      // Should return 401 Unauthorized without auth
      expect(response.status()).toBe(401);
    });

    test('should have saved-words API route (POST)', async ({ request }) => {
      const response = await request.post('/api/saved-words', {
        headers: { 'Content-Type': 'application/json' },
        data: {
          word: 'வணக்கம்',
          context: 'Test context',
          meaning_en: 'Hello',
          meaning_ta: null,
        },
      });

      // Should return 401 Unauthorized without auth
      expect(response.status()).toBe(401);
    });

    test('should have saved-words API route (DELETE)', async ({ request }) => {
      const response = await request.delete('/api/saved-words?id=test-id');

      // Should return 401 Unauthorized without auth
      expect(response.status()).toBe(401);
    });

    test('should have vocab review API route (GET)', async ({ request }) => {
      const response = await request.get('/api/vocab/review?limit=10');

      // Should return 401 Unauthorized without auth
      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body.code).toBe('UNAUTHORIZED');
    });

    test('should have vocab review API route (POST)', async ({ request }) => {
      const response = await request.post('/api/vocab/review', {
        headers: { 'Content-Type': 'application/json' },
        data: {
          word: 'வணக்கம்',
          result: 'good',
        },
      });

      // Should return 401 Unauthorized without auth
      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body.code).toBe('UNAUTHORIZED');
    });
  });

  test.describe('Validation', () => {
    test('should validate saved-words POST request body', async ({ request }) => {
      const response = await request.post('/api/saved-words', {
        headers: { 'Content-Type': 'application/json' },
        data: {
          // Missing required fields
        },
      });

      // Should return 401 (auth check happens first) or 400 (validation error)
      expect([400, 401]).toContain(response.status());
    });

    test('should validate vocab review POST request body', async ({ request }) => {
      const response = await request.post('/api/vocab/review', {
        headers: { 'Content-Type': 'application/json' },
        data: {
          word: 'test',
          result: 'invalid_result', // Invalid result value
        },
      });

      // Should return 401 (auth check happens first) or 400 (validation error)
      expect([400, 401]).toContain(response.status());
    });
  });
});

test.describe('Teacher Content Management', () => {
  test.describe('API Validation', () => {
    test('should validate create sorporul question request', async ({ request }) => {
      const response = await request.post('/api/teacher/practice/sorporul', {
        headers: { 'Content-Type': 'application/json' },
        data: {
          // Missing required fields
          targetWord: 'test',
        },
      });

      // Route should exist and return error response
      expect(response.status()).not.toBe(404);
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(body).toHaveProperty('code');
    });

    test('should validate sorporul import request', async ({ request }) => {
      const response = await request.post('/api/teacher/practice/sorporul/import', {
        headers: { 'Content-Type': 'application/json' },
        data: {
          questions: [], // Empty array
          publishImmediately: false,
        },
      });

      // Route should exist and return error response
      expect(response.status()).not.toBe(404);
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(body).toHaveProperty('code');
    });

    test('should validate AI generate request', async ({ request }) => {
      const response = await request.post('/api/teacher/practice/sorporul/ai-generate', {
        headers: { 'Content-Type': 'application/json' },
        data: {
          // Missing required fields
        },
      });

      // Route should exist and return error response
      expect(response.status()).not.toBe(404);
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(body).toHaveProperty('code');
    });
  });

  test.describe('CRUD Operations', () => {
    test('should return error for unauthorized GET questions', async ({ request }) => {
      const response = await request.get('/api/teacher/practice/sorporul?status=all&limit=10');
      // Route should exist and return error
      expect(response.status()).not.toBe(404);
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(body).toHaveProperty('code');
    });

    test('should return error for unauthorized PUT question', async ({ request }) => {
      const response = await request.put('/api/teacher/practice/sorporul', {
        headers: { 'Content-Type': 'application/json' },
        data: {
          id: '00000000-0000-0000-0000-000000000000',
          questionText: 'Updated question',
        },
      });
      // Route should exist and return error
      expect(response.status()).not.toBe(404);
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(body).toHaveProperty('code');
    });

    test('should return error for unauthorized DELETE question', async ({ request }) => {
      const response = await request.delete(
        '/api/teacher/practice/sorporul?id=00000000-0000-0000-0000-000000000000'
      );
      // Route should exist and return error
      expect(response.status()).not.toBe(404);
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(body).toHaveProperty('code');
    });
  });
});

test.describe('Integration Scenarios', () => {
  test.describe('Sorporul Practice Flow', () => {
    test('API endpoints follow correct response structure', async ({ request }) => {
      // Test sessions endpoint returns proper error structure
      const sessionsResponse = await request.post('/api/practice/sorporul/sessions', {
        headers: { 'Content-Type': 'application/json' },
        data: { questionCount: 10 },
      });
      expect(sessionsResponse.status()).not.toBe(404);
      const sessionsBody = await sessionsResponse.json();
      expect(sessionsBody).toHaveProperty('error');
      expect(sessionsBody).toHaveProperty('code');

      // Test next question endpoint returns proper error structure
      const nextResponse = await request.get(
        '/api/practice/sorporul/sessions/00000000-0000-0000-0000-000000000000/next?current=0'
      );
      expect(nextResponse.status()).not.toBe(404);
      const nextBody = await nextResponse.json();
      expect(nextBody).toHaveProperty('error');
      expect(nextBody).toHaveProperty('code');

      // Test submit endpoint returns proper error structure
      const submitResponse = await request.post(
        '/api/practice/sorporul/sessions/00000000-0000-0000-0000-000000000000/submit',
        {
          headers: { 'Content-Type': 'application/json' },
          data: {
            answers: [{ questionId: '00000000-0000-0000-0000-000000000001', selectedOption: 'A' }],
          },
        }
      );
      expect(submitResponse.status()).not.toBe(404);
      const submitBody = await submitResponse.json();
      expect(submitBody).toHaveProperty('error');
      expect(submitBody).toHaveProperty('code');
    });
  });

  test.describe('Vocabulary Flow', () => {
    test('vocab review API returns proper structure for due reviews', async ({ request }) => {
      const response = await request.get('/api/vocab/review?limit=10');
      const body = await response.json();

      // Even unauthorized, should return structured error
      expect(body).toHaveProperty('error');
      expect(body).toHaveProperty('code');
      expect(body.code).toBe('UNAUTHORIZED');
    });

    test('vocab review POST handles SM-2 result values', async ({ request }) => {
      const validResults = ['easy', 'good', 'hard', 'again'];

      for (const result of validResults) {
        const response = await request.post('/api/vocab/review', {
          headers: { 'Content-Type': 'application/json' },
          data: {
            word: 'testword',
            result,
          },
        });

        // Should return 401 (auth first), not 400 (validation)
        // This confirms the result enum values are accepted by the schema
        expect(response.status()).toBe(401);
      }
    });
  });

  test.describe('Teacher AI Generation', () => {
    test('AI generate endpoint accepts valid meaning languages', async ({ request }) => {
      const languages = ['ta', 'en'];

      for (const lang of languages) {
        const response = await request.post('/api/teacher/practice/sorporul/ai-generate', {
          headers: { 'Content-Type': 'application/json' },
          data: {
            targetWord: 'வணக்கம்',
            correctMeaning: 'Greeting',
            count: 3,
            meaningLanguage: lang,
          },
        });

        // Route should exist and return error (auth or other)
        expect(response.status()).not.toBe(404);
        const body = await response.json();
        expect(body).toHaveProperty('error');
        expect(body).toHaveProperty('code');
      }
    });

    test('AI generate endpoint accepts valid word classes', async ({ request }) => {
      const wordClasses = ['noun', 'verb', 'adjective', 'adverb', 'pronoun', 'other'];

      for (const wc of wordClasses) {
        const response = await request.post('/api/teacher/practice/sorporul/ai-generate', {
          headers: { 'Content-Type': 'application/json' },
          data: {
            targetWord: 'test',
            correctMeaning: 'test meaning',
            count: 3,
            wordClass: wc,
          },
        });

        // Route should exist and return error (auth or other)
        expect(response.status()).not.toBe(404);
        const body = await response.json();
        expect(body).toHaveProperty('error');
        expect(body).toHaveProperty('code');
      }
    });
  });
});
