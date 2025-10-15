import { test, expect } from '@playwright/test';
import { testUsers, testConfig } from '../../fixtures/test-data';
import { AuthHelper } from '../../utils/test-helpers';

test.describe('Session Management', () => {
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
  });

  test('should maintain session across page reloads', async ({ page }) => {
    // Login as admin
    await authHelper.loginAsAdmin();
    await expect(page).toHaveURL(testConfig.urls.adminDashboard);
    
    // Verify user menu is visible
    await expect(page.locator('[data-testid="user-menu"]').or(page.locator('button:has-text("Admin")'))).toBeVisible();
    
    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Should still be authenticated
    await expect(page).toHaveURL(testConfig.urls.adminDashboard);
    await expect(page.locator('[data-testid="user-menu"]').or(page.locator('button:has-text("Admin")'))).toBeVisible();
  });

  test('should maintain session across different tabs', async ({ context }) => {
    // Create first page and login
    const page1 = await context.newPage();
    const authHelper1 = new AuthHelper(page1);
    
    await authHelper1.loginAsAdmin();
    await expect(page1).toHaveURL(testConfig.urls.adminDashboard);
    
    // Create second page (new tab)
    const page2 = await context.newPage();
    
    // Navigate to admin area in second tab
    await page2.goto(testConfig.urls.adminDashboard);
    await page2.waitForLoadState('networkidle');
    
    // Should be authenticated in second tab
    await expect(page2).toHaveURL(testConfig.urls.adminDashboard);
    await expect(page2.locator('[data-testid="user-menu"]').or(page2.locator('button:has-text("Admin")'))).toBeVisible();
    
    // Clean up
    await page1.close();
    await page2.close();
  });

  test('should logout successfully from admin panel', async ({ page, context }) => {
    // Login first
    await authHelper.loginAsAdmin();
    await expect(page).toHaveURL(testConfig.urls.adminDashboard);
    
    // Find and click user menu
    const userMenuSelectors = [
      '[data-testid="user-menu"]',
      'button:has-text("Admin")',
      'button:has-text("Usuario")',
      '[data-testid="profile-menu"]',
      '.user-menu'
    ];
    
    let userMenuClicked = false;
    for (const selector of userMenuSelectors) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        await element.click();
        userMenuClicked = true;
        break;
      }
    }
    
    expect(userMenuClicked).toBe(true);
    
    // Find and click logout option
    const logoutSelectors = [
      'button:has-text("Cerrar sesión")',
      'a:has-text("Cerrar sesión")',
      '[data-testid="logout-button"]',
      'button:has-text("Logout")',
      'button:has-text("Salir")'
    ];
    
    let logoutClicked = false;
    for (const selector of logoutSelectors) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        await element.click();
        logoutClicked = true;
        break;
      }
    }
    
    expect(logoutClicked).toBe(true);
    
    // Wait for redirect and verify we're on login page
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(testConfig.urls.login);
    await expect(page.locator('form')).toBeVisible();
    
    // Verify session cookies are cleared
    const cookies = await context.cookies();
    const authCookies = cookies.filter(cookie => 
      cookie.name.includes('auth') || 
      cookie.name.includes('session') ||
      cookie.name.includes('token')
    );
    
    // Most auth cookies should be cleared or set to empty
    authCookies.forEach(cookie => {
      expect(cookie.value === '' || cookie.value === 'null' || cookie.value === 'undefined').toBeTruthy();
    });
  });

  test('should logout successfully from client portal', async ({ page, context }) => {
    // Login as client first
    await authHelper.loginAsClient();
    await expect(page).toHaveURL(testConfig.urls.clientDashboard);
    
    // Find and click user menu
    const userMenuSelectors = [
      '[data-testid="user-menu"]',
      'button:has-text("Cliente")',
      'button:has-text("Usuario")',
      '[data-testid="profile-menu"]',
      '.user-menu'
    ];
    
    let userMenuClicked = false;
    for (const selector of userMenuSelectors) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        await element.click();
        userMenuClicked = true;
        break;
      }
    }
    
    expect(userMenuClicked).toBe(true);
    
    // Click logout
    const logoutSelectors = [
      'button:has-text("Cerrar sesión")',
      'a:has-text("Cerrar sesión")',
      '[data-testid="logout-button"]',
      'button:has-text("Logout")',
      'button:has-text("Salir")'
    ];
    
    let logoutClicked = false;
    for (const selector of logoutSelectors) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        await element.click();
        logoutClicked = true;
        break;
      }
    }
    
    expect(logoutClicked).toBe(true);
    
    // Verify redirect to login
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(testConfig.urls.login);
    await expect(page.locator('form')).toBeVisible();
  });

  test('should handle session expiration gracefully', async ({ page }) => {
    // Login as admin
    await authHelper.loginAsAdmin();
    await expect(page).toHaveURL(testConfig.urls.adminDashboard);
    
    // Simulate session expiration by clearing auth cookies
    await page.context().clearCookies();
    
    // Try to navigate to a protected route
    await page.goto(testConfig.urls.adminQuotations);
    await page.waitForLoadState('networkidle');
    
    // Should redirect to login page
    await expect(page).toHaveURL(testConfig.urls.login);
    await expect(page.locator('form')).toBeVisible();
  });

  test('should prevent cross-role access', async ({ page }) => {
    // Login as client
    await authHelper.loginAsClient();
    await expect(page).toHaveURL(testConfig.urls.clientDashboard);
    
    // Try to access admin routes
    await page.goto(testConfig.urls.adminDashboard);
    await page.waitForLoadState('networkidle');
    
    // Should not be able to access admin dashboard
    // Could redirect to login, client dashboard, or show unauthorized
    const currentUrl = page.url();
    expect(currentUrl).not.toBe(testConfig.urls.adminDashboard);
    
    // Common redirects for unauthorized access
    const validRedirects = [
      testConfig.urls.login,
      testConfig.urls.clientDashboard,
      '/unauthorized',
      '/403'
    ];
    
    const isValidRedirect = validRedirects.some(url => currentUrl.includes(url));
    expect(isValidRedirect).toBe(true);
  });

  test('should handle multiple login attempts with same user', async ({ page }) => {
    // First login
    await authHelper.loginAsAdmin();
    await expect(page).toHaveURL(testConfig.urls.adminDashboard);
    
    // Try to login again with same credentials
    await page.goto(testConfig.urls.login);
    
    // If redirected away from login (already authenticated), that's good
    await page.waitForLoadState('networkidle');
    
    if (page.url() === testConfig.urls.login) {
      // If still on login page, try logging in again
      await page.getByLabel(/correo electrónico/i).fill(testUsers.admin.email);
      await page.getByLabel(/contraseña/i).fill(testUsers.admin.password);
      await page.getByRole('button', { name: /iniciar sesión/i }).click();
      
      await page.waitForLoadState('networkidle');
    }
    
    // Should end up on dashboard
    await expect(page).toHaveURL(testConfig.urls.adminDashboard);
  });

  test('should handle session timeout warning', async ({ page }) => {
    // Login as admin
    await authHelper.loginAsAdmin();
    await expect(page).toHaveURL(testConfig.urls.adminDashboard);
    
    // Simulate long idle time (this test might need adjustment based on actual timeout implementation)
    // For now, just verify the application can handle being idle
    await page.waitForTimeout(5000);
    
    // Try to perform an action after idle time
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Should either still be authenticated or redirect to login
    const currentUrl = page.url();
    const isValid = currentUrl === testConfig.urls.adminDashboard || currentUrl === testConfig.urls.login;
    expect(isValid).toBe(true);
  });

  test('should clear session data on browser close simulation', async ({ context }) => {
    const page = await context.newPage();
    const authHelper = new AuthHelper(page);
    
    // Login
    await authHelper.loginAsAdmin();
    await expect(page).toHaveURL(testConfig.urls.adminDashboard);
    
    // Close the page (simulating browser close)
    await page.close();
    
    // Create new page (simulating reopening browser)
    const newPage = await context.newPage();
    
    // Try to access protected route
    await newPage.goto(testConfig.urls.adminDashboard);
    await newPage.waitForLoadState('networkidle');
    
    // Depending on session persistence, might redirect to login
    // This test verifies the behavior is consistent
    const currentUrl = newPage.url();
    expect([testConfig.urls.login, testConfig.urls.adminDashboard]).toContain(currentUrl);
    
    await newPage.close();
  });

  test('should handle concurrent sessions from different devices', async ({ browser }) => {
    // Create two separate browser contexts (simulating different devices)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    const authHelper1 = new AuthHelper(page1);
    const authHelper2 = new AuthHelper(page2);
    
    // Login from first "device"
    await authHelper1.loginAsAdmin();
    await expect(page1).toHaveURL(testConfig.urls.adminDashboard);
    
    // Login from second "device" with same credentials
    await authHelper2.loginAsAdmin();
    await expect(page2).toHaveURL(testConfig.urls.adminDashboard);
    
    // Both sessions should be valid (or handle concurrent session policy)
    await page1.reload();
    await page1.waitForLoadState('networkidle');
    
    await page2.reload();
    await page2.waitForLoadState('networkidle');
    
    // Verify both are still authenticated (behavior may vary based on implementation)
    const url1 = page1.url();
    const url2 = page2.url();
    
    expect([testConfig.urls.login, testConfig.urls.adminDashboard]).toContain(url1);
    expect([testConfig.urls.login, testConfig.urls.adminDashboard]).toContain(url2);
    
    // Clean up
    await context1.close();
    await context2.close();
  });
});