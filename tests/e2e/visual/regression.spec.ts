import { test, expect } from '@playwright/test';
import { testConfig } from '../../fixtures/test-data';
import { AuthHelper, LoadingHelper } from '../../utils/test-helpers';

test.describe('Visual Regression Tests', () => {
  let authHelper: AuthHelper;
  let loadingHelper: LoadingHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    loadingHelper = new LoadingHelper(page);
  });

  test('should match login page screenshot', async ({ page }) => {
    await page.goto(testConfig.urls.login);
    await loadingHelper.waitForPageLoad();
    
    // Wait for fonts and styles to load
    await page.waitForTimeout(2000);
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: true,
      threshold: 0.3
    });
  });

  test('should match admin dashboard screenshot', async ({ page }) => {
    await authHelper.loginAsAdmin();
    await loadingHelper.waitForPageLoad();
    
    // Wait for charts and dynamic content to load
    await page.waitForTimeout(3000);
    
    // Take screenshot of main dashboard area
    await expect(page).toHaveScreenshot('admin-dashboard.png', {
      fullPage: true,
      threshold: 0.3
    });
  });

  test('should match client dashboard screenshot', async ({ page }) => {
    await authHelper.loginAsClient();
    await loadingHelper.waitForPageLoad();
    
    // Wait for content to load
    await page.waitForTimeout(2000);
    
    // Take screenshot
    await expect(page).toHaveScreenshot('client-dashboard.png', {
      fullPage: true,
      threshold: 0.3
    });
  });

  test('should match products page screenshot', async ({ page }) => {
    await authHelper.loginAsAdmin();
    await page.goto(testConfig.urls.adminProducts);
    await loadingHelper.waitForPageLoad();
    
    // Wait for table to load
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('admin-products.png', {
      fullPage: true,
      threshold: 0.3
    });
  });

  test('should match quotations page screenshot', async ({ page }) => {
    await authHelper.loginAsAdmin();
    await page.goto(testConfig.urls.adminQuotations);
    await loadingHelper.waitForPageLoad();
    
    // Wait for table to load
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('admin-quotations.png', {
      fullPage: true,
      threshold: 0.3
    });
  });

  test('should match form modal screenshots', async ({ page }) => {
    await authHelper.loginAsAdmin();
    await page.goto(testConfig.urls.adminProducts);
    await loadingHelper.waitForPageLoad();
    
    // Try to open create product form
    const createButton = page.locator('button:has-text("Nuevo Producto")');
    if (await createButton.isVisible()) {
      await createButton.click();
      
      // Wait for modal to appear
      await page.waitForTimeout(1000);
      
      const modal = page.locator('[role="dialog"], .modal, form');
      if (await modal.isVisible()) {
        await expect(modal).toHaveScreenshot('product-form-modal.png', {
          threshold: 0.3
        });
      }
    }
  });

  test('should match navigation components', async ({ page }) => {
    await authHelper.loginAsAdmin();
    await loadingHelper.waitForPageLoad();
    
    // Screenshot admin sidebar
    const sidebar = page.locator('[data-testid="admin-sidebar"], nav, .sidebar').first();
    if (await sidebar.isVisible()) {
      await expect(sidebar).toHaveScreenshot('admin-sidebar.png', {
        threshold: 0.3
      });
    }
    
    // Screenshot header
    const header = page.locator('header, .header, [data-testid="header"]').first();
    if (await header.isVisible()) {
      await expect(header).toHaveScreenshot('admin-header.png', {
        threshold: 0.3
      });
    }
  });

  test('should match table components', async ({ page }) => {
    await authHelper.loginAsAdmin();
    await page.goto(testConfig.urls.adminProducts);
    await loadingHelper.waitForPageLoad();
    
    // Screenshot products table
    const table = page.locator('table, [data-testid="products-table"], .data-table').first();
    if (await table.isVisible()) {
      await expect(table).toHaveScreenshot('products-table.png', {
        threshold: 0.3
      });
    }
  });

  test('should match empty state screens', async ({ page }) => {
    await authHelper.loginAsAdmin();
    
    // Mock empty API response
    await page.route('**/api/**', route => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]) // Empty array
        });
      } else {
        route.continue();
      }
    });
    
    await page.goto(testConfig.urls.adminProducts);
    await loadingHelper.waitForPageLoad();
    await page.waitForTimeout(2000);
    
    // Screenshot empty state
    await expect(page).toHaveScreenshot('products-empty-state.png', {
      fullPage: true,
      threshold: 0.3
    });
  });

  test('should match loading state screens', async ({ page }) => {
    await authHelper.loginAsAdmin();
    
    // Delay API responses to capture loading state
    await page.route('**/api/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      route.continue();
    });
    
    const loadingPromise = page.goto(testConfig.urls.adminDashboard);
    
    // Try to capture loading state
    await page.waitForTimeout(500);
    
    const loadingIndicator = page.locator('[data-testid="loading"], .loading, .spinner');
    if (await loadingIndicator.isVisible()) {
      await expect(page).toHaveScreenshot('dashboard-loading.png', {
        fullPage: true,
        threshold: 0.3
      });
    }
    
    await loadingPromise;
  });

  test('should match error state screens', async ({ page }) => {
    await authHelper.loginAsAdmin();
    
    // Mock error API response
    await page.route('**/api/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server Error' })
      });
    });
    
    await page.goto(testConfig.urls.adminProducts);
    await page.waitForTimeout(3000);
    
    // Screenshot error state
    await expect(page).toHaveScreenshot('products-error-state.png', {
      fullPage: true,
      threshold: 0.3
    });
  });
});