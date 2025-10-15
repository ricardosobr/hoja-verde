import { test, expect } from '@playwright/test';
import { testUsers, testConfig } from '../../fixtures/test-data';
import { AuthHelper, NotificationHelper } from '../../utils/test-helpers';

test.describe('Authentication Flow', () => {
  let authHelper: AuthHelper;
  let notificationHelper: NotificationHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    notificationHelper = new NotificationHelper(page);
  });

  test('should display login form correctly', async ({ page }) => {
    await page.goto(testConfig.urls.login);
    
    // Verify login form elements are present
    await expect(page.locator('form')).toBeVisible();
    await expect(page.getByLabel(/correo electrónico/i)).toBeVisible();
    await expect(page.getByLabel(/contraseña/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /iniciar sesión/i })).toBeVisible();
    
    // Verify page title
    await expect(page).toHaveTitle(/hoja verde/i);
  });

  test('should login admin user successfully', async ({ page }) => {
    await page.goto(testConfig.urls.login);
    
    // Verify login form is present
    await expect(page.locator('form')).toBeVisible();
    
    // Fill login credentials
    await page.getByLabel(/correo electrónico/i).fill(testUsers.admin.email);
    await page.getByLabel(/contraseña/i).fill(testUsers.admin.password);
    
    // Submit form
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    // Wait for navigation and verify redirect to admin dashboard
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(testConfig.urls.adminDashboard);
    
    // Verify dashboard elements are visible
    await expect(page.getByText('Dashboard')).toBeVisible();
    
    // Verify user is authenticated - user menu should be visible
    await expect(page.locator('[data-testid="user-menu"]').or(page.locator('button:has-text("Admin")'))).toBeVisible();
  });

  test('should login client user successfully', async ({ page }) => {
    await page.goto(testConfig.urls.login);
    
    // Fill client credentials
    await page.getByLabel(/correo electrónico/i).fill(testUsers.client.email);
    await page.getByLabel(/contraseña/i).fill(testUsers.client.password);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    // Wait for navigation and verify redirect to client dashboard
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(testConfig.urls.clientDashboard);
    
    // Verify client portal elements
    await expect(page.getByText(/portal del cliente/i).or(page.getByText(/bienvenido/i))).toBeVisible();
    
    // Verify user is authenticated
    await expect(page.locator('[data-testid="user-menu"]').or(page.locator('button:has-text("Cliente")'))).toBeVisible();
  });

  test('should handle invalid credentials', async ({ page }) => {
    await page.goto(testConfig.urls.login);
    
    // Try to login with invalid credentials
    await page.getByLabel(/correo electrónico/i).fill('invalid@email.com');
    await page.getByLabel(/contraseña/i).fill('wrongpassword');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    // Wait a moment for error to appear
    await page.waitForTimeout(2000);
    
    // Verify error message appears (check multiple possible error messages)
    const errorSelectors = [
      page.getByText(/email o contraseña incorrectos/i),
      page.getByText(/credenciales inválidas/i),
      page.getByText(/error/i),
      page.locator('.error, .alert-error, [role="alert"]')
    ];
    
    let errorFound = false;
    for (const selector of errorSelectors) {
      try {
        await expect(selector).toBeVisible({ timeout: 3000 });
        errorFound = true;
        break;
      } catch {
        // Continue checking other selectors
      }
    }
    
    // If no specific error message, at least verify we're still on login page
    if (!errorFound) {
      await expect(page).toHaveURL(testConfig.urls.login);
      await expect(page.locator('form')).toBeVisible();
    }
  });

  test('should handle empty form submission', async ({ page }) => {
    await page.goto(testConfig.urls.login);
    
    // Try to submit empty form
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    // Verify form validation (HTML5 validation or custom validation)
    const emailInput = page.getByLabel(/correo electrónico/i);
    const passwordInput = page.getByLabel(/contraseña/i);
    
    // Check for HTML5 validation or custom validation messages
    const emailValidation = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    const passwordValidation = await passwordInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    
    // At least one field should have validation message
    expect(emailValidation || passwordValidation).toBeTruthy();
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto(testConfig.urls.login);
    
    const passwordInput = page.getByLabel(/contraseña/i);
    
    // Find password toggle button (various possible selectors)
    const toggleSelectors = [
      page.locator('button[type="button"]:near(input[type="password"])'),
      page.locator('button:has([data-lucide="eye"])'),
      page.locator('button:has([data-lucide="eye-off"])'),
      page.locator('button').filter({ hasText: /eye/i }),
      page.locator('[data-testid="password-toggle"]')
    ];
    
    let toggleButton = null;
    for (const selector of toggleSelectors) {
      if (await selector.isVisible()) {
        toggleButton = selector;
        break;
      }
    }
    
    if (toggleButton) {
      // Initially password should be hidden
      await expect(passwordInput).toHaveAttribute('type', 'password');
      
      // Click toggle to show password
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'text');
      
      // Click toggle to hide password again
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'password');
    } else {
      // Skip test if toggle button is not found
      test.skip();
    }
  });

  test('should prevent access to protected routes when not authenticated', async ({ page }) => {
    // Try to access admin dashboard without authentication
    await page.goto(testConfig.urls.adminDashboard);
    
    // Should redirect to login page
    await expect(page).toHaveURL(testConfig.urls.login);
    await expect(page.locator('form')).toBeVisible();
    
    // Try to access client dashboard without authentication
    await page.goto(testConfig.urls.clientDashboard);
    
    // Should redirect to login page  
    await expect(page).toHaveURL(testConfig.urls.login);
    await expect(page.locator('form')).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate offline condition
    await page.context().setOffline(true);
    
    await page.goto(testConfig.urls.login);
    
    // Try to login while offline
    await page.getByLabel(/correo electrónico/i).fill(testUsers.admin.email);
    await page.getByLabel(/contraseña/i).fill(testUsers.admin.password);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    // Wait for potential error message
    await page.waitForTimeout(3000);
    
    // Should show some kind of error or remain on login page
    const isOnLoginPage = await page.locator('form').isVisible();
    expect(isOnLoginPage).toBe(true);
    
    // Restore online state
    await page.context().setOffline(false);
  });

  test('should redirect authenticated users away from login page', async ({ page }) => {
    // First login as admin
    await authHelper.loginAsAdmin();
    
    // Verify we're on admin dashboard
    await expect(page).toHaveURL(testConfig.urls.adminDashboard);
    
    // Try to go to login page while authenticated
    await page.goto(testConfig.urls.login);
    
    // Should redirect back to dashboard (or stay on dashboard)
    await page.waitForLoadState('networkidle');
    const currentUrl = page.url();
    expect(currentUrl).not.toBe(testConfig.urls.login);
  });

  test('should remember login state across page reloads', async ({ page }) => {
    // Login as admin
    await authHelper.loginAsAdmin();
    await expect(page).toHaveURL(testConfig.urls.adminDashboard);
    
    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Should still be authenticated and on dashboard
    await expect(page).toHaveURL(testConfig.urls.adminDashboard);
    await expect(page.locator('[data-testid="user-menu"]').or(page.locator('button:has-text("Admin")'))).toBeVisible();
  });
});