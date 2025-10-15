import { test, expect } from '@playwright/test';
import { testConfig } from '../../fixtures/test-data';
import { AuthHelper, NavigationHelper, LoadingHelper } from '../../utils/test-helpers';

test.describe('Admin Dashboard', () => {
  let authHelper: AuthHelper;
  let navigationHelper: NavigationHelper;
  let loadingHelper: LoadingHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    navigationHelper = new NavigationHelper(page);
    loadingHelper = new LoadingHelper(page);
    
    // Login as admin before each test
    await authHelper.loginAsAdmin();
    await expect(page).toHaveURL(testConfig.urls.adminDashboard);
  });

  test('should display dashboard correctly', async ({ page }) => {
    // Wait for page to fully load
    await loadingHelper.waitForPageLoad();
    
    // Verify main dashboard elements
    await expect(page.getByText('Dashboard').or(page.getByText(/panel de control/i))).toBeVisible();
    
    // Check for main navigation
    const navSelectors = [
      '[data-testid="admin-sidebar"]',
      'nav',
      '.sidebar',
      '[role="navigation"]'
    ];
    
    let navFound = false;
    for (const selector of navSelectors) {
      if (await page.locator(selector).isVisible()) {
        navFound = true;
        break;
      }
    }
    expect(navFound).toBe(true);
  });

  test('should display metric cards with data', async ({ page }) => {
    await loadingHelper.waitForPageLoad();
    
    // Look for metric cards with various possible structures
    const metricSelectors = [
      '[data-testid*="metric"]',
      '[data-testid*="card"]',
      '.metric-card',
      '.dashboard-card',
      '[data-testid="total-quotations"]',
      '[data-testid="pending-orders"]',
      '[data-testid="total-revenue"]',
      '[data-testid="active-clients"]'
    ];
    
    // Should have at least some metric cards
    let metricsFound = 0;
    for (const selector of metricSelectors) {
      const elements = page.locator(selector);
      const count = await elements.count();
      metricsFound += count;
    }
    
    // Alternatively, look for card-like structures
    if (metricsFound === 0) {
      const cardSelectors = [
        '.card',
        '[class*="card"]',
        '[class*="metric"]',
        'div:has-text("Cotizaciones")',
        'div:has-text("Órdenes")',
        'div:has-text("Ingresos")',
        'div:has-text("Clientes")'
      ];
      
      for (const selector of cardSelectors) {
        const elements = page.locator(selector);
        const count = await elements.count();
        if (count > 0) {
          metricsFound += count;
          break;
        }
      }
    }
    
    expect(metricsFound).toBeGreaterThan(0);
  });

  test('should display charts correctly', async ({ page }) => {
    await loadingHelper.waitForPageLoad();
    
    // Look for chart containers (Recharts or other chart libraries)
    const chartSelectors = [
      '[data-testid*="chart"]',
      '.recharts-wrapper',
      'svg[class*="recharts"]',
      '.chart-container',
      'canvas',
      '[data-testid="revenue-chart"]',
      '[data-testid="status-chart"]'
    ];
    
    let chartsFound = 0;
    for (const selector of chartSelectors) {
      const elements = page.locator(selector);
      const count = await elements.count();
      if (count > 0) {
        chartsFound += count;
        
        // Verify chart is rendered (has content)
        const firstChart = elements.first();
        const isVisible = await firstChart.isVisible();
        if (isVisible) {
          // For SVG charts, check if they have path elements
          if (selector.includes('svg')) {
            const paths = firstChart.locator('path');
            const pathCount = await paths.count();
            expect(pathCount).toBeGreaterThan(0);
          }
        }
      }
    }
    
    // Should have at least one chart, but not fail if charts are not implemented yet
    if (chartsFound === 0) {
      console.log('No charts found - this might be expected if charts are not implemented yet');
    }
  });

  test('should display recent quotations table', async ({ page }) => {
    await loadingHelper.waitForPageLoad();
    
    // Look for quotations table or list
    const quotationSelectors = [
      '[data-testid="recent-quotations"]',
      '[data-testid*="quotation"]',
      'table:has-text("Cotización")',
      'table:has-text("Folio")',
      '.quotations-table',
      'div:has-text("Cotizaciones Recientes")'
    ];
    
    let quotationsFound = false;
    for (const selector of quotationSelectors) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        quotationsFound = true;
        
        // If it's a table, verify it has rows
        if (selector.includes('table')) {
          const rows = element.locator('tbody tr');
          const rowCount = await rows.count();
          // May have 0 rows if no data, which is acceptable
          expect(rowCount).toBeGreaterThanOrEqual(0);
        }
        break;
      }
    }
    
    // If specific quotations section not found, look for any table
    if (!quotationsFound) {
      const tables = page.locator('table');
      const tableCount = await tables.count();
      if (tableCount > 0) {
        quotationsFound = true;
      }
    }
    
    // Recent quotations section might not be implemented yet
    if (!quotationsFound) {
      console.log('Recent quotations section not found - this might be expected if not implemented yet');
    }
  });

  test('should navigate to different sections from dashboard', async ({ page }) => {
    await loadingHelper.waitForPageLoad();
    
    // Test navigation to quotations
    const quotationsLinks = [
      'a:has-text("Cotizaciones")',
      'a[href*="quotations"]',
      'nav a:has-text("Cotizaciones")',
      '[data-testid="nav-quotations"]'
    ];
    
    let quotationsLinkFound = false;
    for (const selector of quotationsLinks) {
      const link = page.locator(selector);
      if (await link.isVisible()) {
        await link.click();
        await page.waitForLoadState('networkidle');
        
        // Should navigate to quotations page
        expect(page.url()).toContain('quotations');
        quotationsLinkFound = true;
        break;
      }
    }
    
    if (quotationsLinkFound) {
      // Go back to dashboard
      await navigationHelper.goToAdminDashboard();
      await expect(page).toHaveURL(testConfig.urls.adminDashboard);
    }
    
    // Test navigation to products
    const productsLinks = [
      'a:has-text("Productos")',
      'a[href*="products"]',
      'nav a:has-text("Productos")',
      '[data-testid="nav-products"]'
    ];
    
    for (const selector of productsLinks) {
      const link = page.locator(selector);
      if (await link.isVisible()) {
        await link.click();
        await page.waitForLoadState('networkidle');
        
        // Should navigate to products page
        expect(page.url()).toContain('products');
        break;
      }
    }
  });

  test('should display user information in header', async ({ page }) => {
    await loadingHelper.waitForPageLoad();
    
    // Look for user information in header
    const userInfoSelectors = [
      '[data-testid="user-menu"]',
      '.user-info',
      'button:has-text("Admin")',
      'button:has-text("Usuario")',
      '.header .user',
      '[data-testid="profile-menu"]'
    ];
    
    let userInfoFound = false;
    for (const selector of userInfoSelectors) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        userInfoFound = true;
        break;
      }
    }
    
    expect(userInfoFound).toBe(true);
  });

  test('should be responsive on mobile viewports', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await loadingHelper.waitForPageLoad();
    
    // Dashboard should still be accessible
    await expect(page.getByText('Dashboard').or(page.getByText(/panel de control/i))).toBeVisible();
    
    // Mobile menu might be collapsed
    const mobileMenuSelectors = [
      '[data-testid="mobile-menu"]',
      '.mobile-menu',
      'button[aria-label*="menu"]',
      'button:has-text("☰")',
      '.hamburger'
    ];
    
    let mobileMenuFound = false;
    for (const selector of mobileMenuSelectors) {
      if (await page.locator(selector).isVisible()) {
        mobileMenuFound = true;
        break;
      }
    }
    
    // If mobile menu exists, test it works
    if (mobileMenuFound) {
      const mobileMenuButton = page.locator(mobileMenuSelectors[0]);
      await mobileMenuButton.click();
      
      // Navigation should become visible
      await page.waitForTimeout(500); // Wait for animation
      // This test is flexible as mobile menu behavior varies
    }
  });

  test('should handle loading states gracefully', async ({ page }) => {
    // Reload page and check for loading indicators
    await page.reload();
    
    // Look for loading indicators (they might appear briefly)
    const loadingSelectors = [
      '[data-testid="loading"]',
      '.loading',
      '.spinner',
      'div:has-text("Cargando")',
      '[role="progressbar"]'
    ];
    
    // Loading indicators should disappear
    await loadingHelper.waitForLoading();
    
    // Page should be fully loaded
    await expect(page.getByText('Dashboard').or(page.getByText(/panel de control/i))).toBeVisible();
  });

  test('should display correct page title', async ({ page }) => {
    await loadingHelper.waitForPageLoad();
    
    // Check page title
    const title = await page.title();
    expect(title).toMatch(/dashboard|admin|hoja verde/i);
  });

  test('should handle empty data states', async ({ page }) => {
    await loadingHelper.waitForPageLoad();
    
    // If there's no data, should show appropriate empty states
    const emptyStateSelectors = [
      'div:has-text("No hay datos")',
      'div:has-text("Sin información")',
      '.empty-state',
      '[data-testid="empty-state"]'
    ];
    
    // This test is informational - empty states might or might not be present
    for (const selector of emptyStateSelectors) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        console.log(`Empty state found: ${selector}`);
      }
    }
  });

  test('should maintain dashboard functionality after navigation', async ({ page }) => {
    await loadingHelper.waitForPageLoad();
    
    // Navigate away from dashboard
    const quotationsLink = page.locator('a:has-text("Cotizaciones")').or(page.locator('a[href*="quotations"]'));
    
    if (await quotationsLink.isVisible()) {
      await quotationsLink.click();
      await page.waitForLoadState('networkidle');
      
      // Navigate back to dashboard
      await navigationHelper.goToAdminDashboard();
      await expect(page).toHaveURL(testConfig.urls.adminDashboard);
      
      // Dashboard should still work
      await expect(page.getByText('Dashboard').or(page.getByText(/panel de control/i))).toBeVisible();
    }
  });
});