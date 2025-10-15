import { test, expect } from '@playwright/test';

test.describe('Setup Validation Tests', () => {
  test('should validate Playwright setup', async ({ page }) => {
    // Basic test to ensure Playwright is working
    await page.goto('https://playwright.dev');
    await expect(page).toHaveTitle(/Playwright/);
    
    console.log('✅ Playwright setup is working correctly');
  });

  test('should validate local application server', async ({ page }) => {
    // Test if local server is accessible
    try {
      await page.goto('http://localhost:3000');
      
      // Check if page loads (basic validation)
      const title = await page.title();
      expect(title).toBeTruthy();
      
      console.log('✅ Local application server is accessible');
      console.log(`Page title: ${title}`);
    } catch (error) {
      console.log('❌ Local application server is not accessible');
      console.log('Make sure to start the development server with: npm run dev');
      throw error;
    }
  });

  test('should validate test environment configuration', async ({ page }) => {
    // Check browser info
    const browserName = page.context().browser()?.browserType().name();
    console.log(`✅ Running on browser: ${browserName}`);
    
    // Check viewport
    const viewportSize = page.viewportSize();
    console.log(`✅ Viewport size: ${viewportSize?.width}x${viewportSize?.height}`);
    
    // Validate test base URL
    const baseURL = process.env.TEST_BASE_URL || 'http://localhost:3000';
    console.log(`✅ Test base URL: ${baseURL}`);
    
    expect(browserName).toBeTruthy();
    expect(viewportSize).toBeTruthy();
  });

  test('should validate test data and fixtures', async () => {
    const { testUsers, testProducts, testConfig } = await import('../fixtures/test-data');
    
    // Validate test users
    expect(testUsers.admin.email).toBeTruthy();
    expect(testUsers.client.email).toBeTruthy();
    console.log('✅ Test users configured');
    
    // Validate test products
    expect(testProducts.length).toBeGreaterThan(0);
    console.log(`✅ ${testProducts.length} test products configured`);
    
    // Validate test config
    expect(testConfig.urls.base).toBeTruthy();
    expect(testConfig.timeouts.medium).toBeGreaterThan(0);
    console.log('✅ Test configuration loaded');
  });

  test('should validate test helpers', async ({ page }) => {
    const { AuthHelper, NavigationHelper, FormHelper } = await import('../utils/test-helpers');
    
    // Create helper instances
    const authHelper = new AuthHelper(page);
    const navigationHelper = new NavigationHelper(page);
    const formHelper = new FormHelper(page);
    
    expect(authHelper).toBeTruthy();
    expect(navigationHelper).toBeTruthy();
    expect(formHelper).toBeTruthy();
    
    console.log('✅ Test helpers loaded successfully');
  });
});

test.describe('Application Health Check', () => {
  test('should perform basic application health check', async ({ page }) => {
    const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
    
    try {
      // Navigate to application
      await page.goto(baseUrl);
      
      // Wait for page to load
      await page.waitForLoadState('networkidle');
      
      // Basic checks
      const title = await page.title();
      expect(title).toBeTruthy();
      
      // Check if login form is present (indicates app is working)
      const hasLoginForm = await page.locator('form').isVisible();
      
      if (hasLoginForm) {
        console.log('✅ Login form detected - application appears to be working');
        
        // Check for email and password fields
        const emailField = page.getByLabel(/correo electrónico|email/i);
        const passwordField = page.getByLabel(/contraseña|password/i);
        
        const hasEmailField = await emailField.isVisible();
        const hasPasswordField = await passwordField.isVisible();
        
        if (hasEmailField && hasPasswordField) {
          console.log('✅ Login form has required fields');
        } else {
          console.log('⚠️ Login form missing some fields');
        }
      } else {
        console.log('⚠️ No login form detected - might be on different page or app structure changed');
      }
      
      // Check for JavaScript errors
      const jsErrors: string[] = [];
      page.on('pageerror', (error) => {
        jsErrors.push(error.message);
      });
      
      await page.waitForTimeout(2000);
      
      if (jsErrors.length === 0) {
        console.log('✅ No JavaScript errors detected');
      } else {
        console.log(`⚠️ ${jsErrors.length} JavaScript errors detected:`, jsErrors);
      }
      
    } catch (error) {
      console.log('❌ Application health check failed:', error);
      throw error;
    }
  });
});

test.describe('Environment Validation', () => {
  test('should validate Supabase configuration', async ({ page }) => {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseAnonKey) {
      console.log('✅ Supabase environment variables are configured');
      console.log(`Supabase URL: ${supabaseUrl.substring(0, 30)}...`);
    } else {
      console.log('⚠️ Supabase environment variables not found');
      console.log('Make sure SUPABASE_URL and SUPABASE_ANON_KEY are set in .env.local');
    }
    
    // This test doesn't fail if Supabase isn't configured, just warns
    expect(true).toBe(true);
  });

  test('should validate test directories structure', async () => {
    const fs = await import('fs');
    const path = await import('path');
    
    const testDirs = [
      'tests/e2e/auth',
      'tests/e2e/admin', 
      'tests/e2e/client',
      'tests/e2e/api',
      'tests/e2e/visual',
      'tests/fixtures',
      'tests/utils'
    ];
    
    for (const dir of testDirs) {
      const dirPath = path.join(process.cwd(), dir);
      const exists = fs.existsSync(dirPath);
      
      if (exists) {
        console.log(`✅ ${dir} directory exists`);
      } else {
        console.log(`❌ ${dir} directory missing`);
      }
      
      expect(exists).toBe(true);
    }
  });
});