import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test('should display login form', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('text=Welcome back')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible();
  });

  test('should have link to signup page', async ({ page }) => {
    await page.goto('/login');

    const signupLink = page.getByRole('link', { name: 'Sign up' });
    await expect(signupLink).toBeVisible();

    await signupLink.click();
    await expect(page).toHaveURL('/signup');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill('invalid@test.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Log in' }).click();

    // Should show an error message
    await expect(page.locator('.bg-red-50')).toBeVisible({ timeout: 10000 });
  });

  test('should show TamilPSLE branding', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('text=TamilPSLE')).toBeVisible();
    await expect(page.locator('text=தமிழ்')).toBeVisible();
  });
});

test.describe('Signup Page', () => {
  test('should display signup form', async ({ page }) => {
    await page.goto('/signup');

    await expect(page.locator('text=Create an account')).toBeVisible();
    await expect(page.getByLabel('Name (optional)')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Confirm Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign up' })).toBeVisible();
  });

  test('should have link to login page', async ({ page }) => {
    await page.goto('/signup');

    const loginLink = page.getByRole('link', { name: 'Log in' });
    await expect(loginLink).toBeVisible();

    await loginLink.click();
    await expect(page).toHaveURL('/login');
  });

  test('should validate password match', async ({ page }) => {
    await page.goto('/signup');

    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password', { exact: true }).fill('password123');
    await page.getByLabel('Confirm Password').fill('differentpassword');
    await page.getByRole('button', { name: 'Sign up' }).click();

    // Should show password mismatch error
    await expect(page.locator('text=Passwords do not match')).toBeVisible();
  });

  test('should validate password length', async ({ page }) => {
    await page.goto('/signup');

    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password', { exact: true }).fill('12345');
    await page.getByLabel('Confirm Password').fill('12345');
    await page.getByRole('button', { name: 'Sign up' }).click();

    // Should show password length error
    await expect(page.locator('text=Password must be at least 6 characters')).toBeVisible();
  });
});
