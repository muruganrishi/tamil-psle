import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should display the homepage with branding', async ({ page }) => {
    await page.goto('/');

    // Check for main branding in header
    await expect(page.locator('header').getByText('TamilPSLE', { exact: true })).toBeVisible();
    await expect(page.locator('header').getByText('தமிழ்')).toBeVisible();

    // Check hero section
    await expect(page.locator('h1')).toContainText('Master Tamil for PSLE');
  });

  test('should show practice section cards', async ({ page }) => {
    await page.goto('/');

    // Check for practice sections - use headings for specificity
    await expect(page.getByRole('heading', { name: 'Vetrumai' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Comprehension' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Word Meanings', exact: true })).toBeVisible();
  });

  test('should have login and signup buttons', async ({ page }) => {
    await page.goto('/');

    // Header buttons
    const loginButton = page.locator('header').getByRole('link', { name: 'Log in' });
    const signupButton = page.locator('header').getByRole('link', { name: 'Sign up' });

    await expect(loginButton).toBeVisible();
    await expect(signupButton).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');

    await page.locator('header').getByRole('link', { name: 'Log in' }).click();

    await expect(page).toHaveURL('/login');
    await expect(page.locator('text=Welcome back')).toBeVisible();
  });

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/');

    await page.locator('header').getByRole('link', { name: 'Sign up' }).click();

    await expect(page).toHaveURL('/signup');
    await expect(page.locator('text=Create an account')).toBeVisible();
  });
});
