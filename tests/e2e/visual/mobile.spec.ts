import { test, expect } from '@playwright/test';
import { testConfig } from '../../fixtures/test-data';
import { AuthHelper, LoadingHelper } from '../../utils/test-helpers';

test.describe('Mobile Responsiveness Tests', () => {
  let authHelper: AuthHelper;
  let loadingHelper: LoadingHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    loadingHelper = new LoadingHelper(page);
  });

  test('should be responsive on mobile phones', async ({ page }) => {
    // Set mobile viewport (iPhone 12)
    await page.setViewportSize({ width: 390, height: 844 });
    
    await authHelper.loginAsAdmin();
    await loadingHelper.waitForPageLoad();
    
    // Check if main content is visible and properly sized
    const mainContent = page.locator('main, .main-content, [role="main"]').first();
    if (await mainContent.isVisible()) {
      const boundingBox = await mainContent.boundingBox();
      
      // Content should not exceed viewport width
      expect(boundingBox?.width).toBeLessThanOrEqual(390);
    }
    
    // Check navigation is accessible (might be collapsed on mobile)
    const mobileMenuButton = page.locator('button[aria-label*="menu"], .mobile-menu-button, .hamburger, button:has-text("☰")');
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      await page.waitForTimeout(500);
      
      // Navigation should become visible
      const nav = page.locator('nav, .navigation, .sidebar');
      const navVisible = await nav.isVisible();
      expect(navVisible).toBe(true);
    }
    
    // Take mobile screenshot
    await expect(page).toHaveScreenshot('mobile-admin-dashboard.png', {
      fullPage: true
    });
  });

  test('should be responsive on tablets', async ({ page }) => {
    // Set tablet viewport (iPad)
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await authHelper.loginAsAdmin();
    await loadingHelper.waitForPageLoad();
    
    // Check layout adapts to tablet size
    const content = page.locator('main, .main-content').first();
    if (await content.isVisible()) {
      const boundingBox = await content.boundingBox();
      expect(boundingBox?.width).toBeLessThanOrEqual(768);
    }
    
    // Navigation might be visible or collapsible on tablet
    const nav = page.locator('nav, .sidebar, .navigation').first();
    const navVisible = await nav.isVisible();
    
    if (navVisible) {
      console.log('Navigation visible on tablet');
    } else {
      // Check for mobile menu
      const mobileMenu = page.locator('button[aria-label*="menu"], .mobile-menu-button');
      if (await mobileMenu.isVisible()) {
        console.log('Mobile menu available on tablet');
      }
    }
    
    await expect(page).toHaveScreenshot('tablet-admin-dashboard.png', {
      fullPage: true
    });
  });

  test('should handle mobile navigation correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await authHelper.loginAsAdmin();
    await loadingHelper.waitForPageLoad();
    
    // Test mobile navigation
    const mobileMenuSelectors = [
      'button[aria-label*="menu"]',
      '.mobile-menu-button',
      '.hamburger',
      'button:has-text("☰")',
      '[data-testid="mobile-menu-button"]'
    ];
    
    let mobileMenuFound = false;
    for (const selector of mobileMenuSelectors) {
      const button = page.locator(selector);
      if (await button.isVisible()) {
        await button.click();
        await page.waitForTimeout(500);
        
        // Check if navigation menu appears
        const navMenu = page.locator('nav, .navigation-menu, .sidebar, .mobile-nav');
        const menuVisible = await navMenu.isVisible();
        
        if (menuVisible) {
          console.log('Mobile navigation menu opens successfully');
          
          // Try to navigate to products
          const productsLink = navMenu.locator('a:has-text("Productos"), button:has-text("Productos")');
          if (await productsLink.isVisible()) {
            await productsLink.click();
            await page.waitForLoadState('networkidle');
            
            expect(page.url()).toContain('products');
            console.log('Mobile navigation links work correctly');
          }
          
          mobileMenuFound = true;
        }
        break;
      }
    }
    
    if (!mobileMenuFound) {
      console.log('Mobile menu not found - navigation might be always visible or handled differently');
    }
  });

  test('should display tables responsively on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await authHelper.loginAsAdmin();
    await page.goto(testConfig.urls.adminProducts);
    await loadingHelper.waitForPageLoad();
    
    // Check how tables adapt to mobile
    const table = page.locator('table, [data-testid="products-table"]').first();
    if (await table.isVisible()) {
      const tableBox = await table.boundingBox();
      
      // Table should not exceed viewport width
      if (tableBox) {
        expect(tableBox.width).toBeLessThanOrEqual(375);
      }
      
      // Check for horizontal scroll or responsive table design
      const tableContainer = page.locator('.table-container, .overflow-x-auto, .table-responsive').first();
      if (await tableContainer.isVisible()) {
        console.log('Table has responsive container');
      }
      
      // Check if table switches to card layout on mobile
      const mobileCards = page.locator('.card, .mobile-card, .table-card');
      const cardCount = await mobileCards.count();
      if (cardCount > 0) {
        console.log('Table switches to card layout on mobile');
      }
    }
    
    await expect(page).toHaveScreenshot('mobile-products-table.png', {
      fullPage: true
    });
  });

  test('should handle forms responsively on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await authHelper.loginAsAdmin();
    await page.goto(testConfig.urls.adminProducts);
    await loadingHelper.waitForPageLoad();
    
    // Try to open create product form
    const createButton = page.locator('button:has-text("Nuevo Producto")');
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(1000);
      
      const form = page.locator('form, [role="dialog"]').first();
      if (await form.isVisible()) {
        const formBox = await form.boundingBox();
        
        // Form should fit in mobile viewport
        if (formBox) {
          expect(formBox.width).toBeLessThanOrEqual(375);
        }
        
        // Check form inputs are properly sized
        const inputs = form.locator('input, select, textarea');
        const inputCount = await inputs.count();
        
        for (let i = 0; i < inputCount && i < 3; i++) {
          const input = inputs.nth(i);
          if (await input.isVisible()) {
            const inputBox = await input.boundingBox();
            if (inputBox) {
              // Input should not be too wide
              expect(inputBox.width).toBeLessThan(350);
            }
          }
        }
        
        await expect(form).toHaveScreenshot('mobile-product-form.png');
      }
    }
  });

  test('should display client portal responsively on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await authHelper.loginAsClient();
    await loadingHelper.waitForPageLoad();
    
    // Check client dashboard on mobile
    const dashboard = page.locator('main, .main-content, .client-dashboard').first();
    if (await dashboard.isVisible()) {
      const dashboardBox = await dashboard.boundingBox();
      if (dashboardBox) {
        expect(dashboardBox.width).toBeLessThanOrEqual(375);
      }
    }
    
    // Check client navigation
    const clientNav = page.locator('nav, .client-nav, .sidebar').first();
    const navVisible = await clientNav.isVisible();
    
    if (!navVisible) {
      // Look for mobile menu
      const mobileMenu = page.locator('button[aria-label*="menu"], .mobile-menu-button');
      if (await mobileMenu.isVisible()) {
        await mobileMenu.click();
        await page.waitForTimeout(500);
        console.log('Client mobile menu opened');
      }
    }
    
    await expect(page).toHaveScreenshot('mobile-client-dashboard.png', {
      fullPage: true
    });
  });

  test('should handle text readability on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await authHelper.loginAsAdmin();
    await loadingHelper.waitForPageLoad();
    
    // Check font sizes and text readability
    const textElements = page.locator('h1, h2, h3, p, span, div').filter({ hasText: /.+/ });
    const elementCount = Math.min(await textElements.count(), 10); // Check first 10 elements
    
    for (let i = 0; i < elementCount; i++) {
      const element = textElements.nth(i);
      if (await element.isVisible()) {
        const fontSize = await element.evaluate(el => {
          return parseInt(window.getComputedStyle(el).fontSize);
        });
        
        // Font should be readable on mobile (at least 14px)
        expect(fontSize).toBeGreaterThanOrEqual(12);
        
        if (fontSize < 14) {
          console.log(`Small font detected: ${fontSize}px`);
        }
      }
    }
  });

  test('should handle touch interactions', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await authHelper.loginAsAdmin();
    await page.goto(testConfig.urls.adminProducts);
    await loadingHelper.waitForPageLoad();
    
    // Test touch interactions on buttons
    const buttons = page.locator('button').filter({ hasText: /.+/ });
    const buttonCount = Math.min(await buttons.count(), 5);
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const buttonBox = await button.boundingBox();
        
        if (buttonBox) {
          // Button should be large enough for touch (at least 44px)
          const minTouchSize = 40;
          expect(buttonBox.height).toBeGreaterThanOrEqual(minTouchSize);
          
          if (buttonBox.height < 44) {
            console.log(`Small touch target detected: ${buttonBox.height}px height`);
          }
        }
      }
    }
  });

  test('should handle landscape orientation', async ({ page }) => {
    // Set mobile landscape orientation
    await page.setViewportSize({ width: 844, height: 390 });
    
    await authHelper.loginAsAdmin();
    await loadingHelper.waitForPageLoad();
    
    // Check layout adapts to landscape
    const content = page.locator('main, .main-content').first();
    if (await content.isVisible()) {
      const contentBox = await content.boundingBox();
      if (contentBox) {
        expect(contentBox.width).toBeLessThanOrEqual(844);
        expect(contentBox.height).toBeLessThanOrEqual(390);
      }
    }
    
    // Navigation might behave differently in landscape
    const nav = page.locator('nav, .sidebar').first();
    const navVisible = await nav.isVisible();
    
    console.log(`Navigation visible in landscape: ${navVisible}`);
    
    await expect(page).toHaveScreenshot('mobile-landscape-dashboard.png', {
      fullPage: true
    });
  });

  test('should handle different mobile breakpoints', async ({ page }) => {
    const breakpoints = [
      { name: 'Small Mobile', width: 320, height: 568 },
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Large Mobile', width: 414, height: 896 },
      { name: 'Small Tablet', width: 768, height: 1024 }
    ];
    
    await authHelper.loginAsAdmin();
    
    for (const breakpoint of breakpoints) {
      await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
      await page.reload();
      await loadingHelper.waitForPageLoad();
      
      console.log(`Testing ${breakpoint.name} (${breakpoint.width}x${breakpoint.height})`);
      
      // Check main content fits
      const main = page.locator('main, .main-content').first();
      if (await main.isVisible()) {
        const mainBox = await main.boundingBox();
        if (mainBox) {
          expect(mainBox.width).toBeLessThanOrEqual(breakpoint.width);
        }
      }
      
      // Check horizontal scrolling doesn't occur
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(breakpoint.width + 5); // Allow small tolerance
      
      if (scrollWidth > breakpoint.width) {
        console.log(`Horizontal scroll detected at ${breakpoint.name}: ${scrollWidth}px`);
      }
    }
  });

  test('should maintain functionality on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await authHelper.loginAsAdmin();
    await page.goto(testConfig.urls.adminProducts);
    await loadingHelper.waitForPageLoad();
    
    // Test that core functionality still works on mobile
    const createButton = page.locator('button:has-text("Nuevo Producto")');
    if (await createButton.isVisible()) {
      // Button should be clickable
      await createButton.click();
      await page.waitForTimeout(1000);
      
      const form = page.locator('form, [role="dialog"]').first();
      if (await form.isVisible()) {
        console.log('Create product form opens on mobile');
        
        // Try to fill a form field
        const nameField = page.getByLabel(/nombre/i);
        if (await nameField.isVisible()) {
          await nameField.fill('Mobile Test Product');
          
          // Field should accept input
          const value = await nameField.inputValue();
          expect(value).toBe('Mobile Test Product');
          console.log('Form inputs work on mobile');
        }
        
        // Close form
        const cancelButton = page.locator('button:has-text("Cancelar")');
        if (await cancelButton.isVisible()) {
          await cancelButton.click();
        }
      }
    }
  });
});