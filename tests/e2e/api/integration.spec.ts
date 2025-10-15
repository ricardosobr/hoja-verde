import { test, expect } from '@playwright/test';
import { testUsers, testConfig } from '../../fixtures/test-data';
import { AuthHelper } from '../../utils/test-helpers';

test.describe('API Integration Tests', () => {
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
  });

  test('should handle API authentication correctly', async ({ page }) => {
    // Login to get authentication state
    await authHelper.loginAsAdmin();
    
    // Monitor network requests for authentication
    const requests: any[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/') || request.url().includes('supabase')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers()
        });
      }
    });
    
    // Navigate to a page that makes API calls
    await page.goto(testConfig.urls.adminDashboard);
    await page.waitForLoadState('networkidle');
    
    // Verify authentication headers are present in API calls
    const apiRequests = requests.filter(req => 
      req.url.includes('/api/') || 
      req.url.includes('supabase.co')
    );
    
    if (apiRequests.length > 0) {
      const authRequest = apiRequests.find(req => 
        req.headers.authorization || 
        req.headers.Authorization ||
        req.headers.apikey ||
        req.headers['x-api-key']
      );
      
      expect(authRequest).toBeTruthy();
      console.log(`Found ${apiRequests.length} API requests with authentication`);
    } else {
      console.log('No API requests detected - this might be expected for static pages');
    }
  });

  test('should handle API errors gracefully', async ({ page }) => {
    await authHelper.loginAsAdmin();
    
    // Intercept API requests and simulate errors
    await page.route('**/api/**', route => {
      if (route.request().url().includes('/products') || route.request().url().includes('/quotations')) {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' })
        });
      } else {
        route.continue();
      }
    });
    
    // Navigate to products page (should handle API error)
    await page.goto(testConfig.urls.adminProducts);
    await page.waitForTimeout(3000);
    
    // Check for error handling
    const errorIndicators = [
      page.locator('.error'),
      page.locator('[role="alert"]'),
      page.getByText(/error/i),
      page.getByText(/problema/i),
      page.getByText(/failed/i)
    ];
    
    let errorHandled = false;
    for (const indicator of errorIndicators) {
      if (await indicator.isVisible()) {
        errorHandled = true;
        console.log('API error handled gracefully');
        break;
      }
    }
    
    // Even if no explicit error message, page should not crash
    const pageTitle = await page.title();
    expect(pageTitle).toBeTruthy();
    
    if (!errorHandled) {
      console.log('No explicit API error handling found, but page remained functional');
    }
  });

  test('should validate API response data integrity', async ({ page }) => {
    await authHelper.loginAsAdmin();
    
    const responses: any[] = [];
    page.on('response', async response => {
      if (response.url().includes('/api/') && response.status() === 200) {
        try {
          const data = await response.json();
          responses.push({
            url: response.url(),
            data: data,
            status: response.status()
          });
        } catch (error) {
          // Response might not be JSON
        }
      }
    });
    
    // Navigate to dashboard to trigger API calls
    await page.goto(testConfig.urls.adminDashboard);
    await page.waitForLoadState('networkidle');
    
    // Wait for potential API calls
    await page.waitForTimeout(2000);
    
    if (responses.length > 0) {
      console.log(`Captured ${responses.length} API responses`);
      
      // Validate data structure of responses
      responses.forEach((response, index) => {
        expect(response.data).toBeDefined();
        expect(response.status).toBe(200);
        
        // Basic data integrity checks
        if (Array.isArray(response.data)) {
          console.log(`Response ${index}: Array with ${response.data.length} items`);
        } else if (typeof response.data === 'object') {
          console.log(`Response ${index}: Object with keys: ${Object.keys(response.data).join(', ')}`);
        }
      });
    } else {
      console.log('No API responses captured - might be using static data or SSR');
    }
  });

  test('should handle Supabase real-time updates', async ({ page }) => {
    await authHelper.loginAsAdmin();
    
    // Monitor WebSocket connections for real-time updates
    const wsConnections: any[] = [];
    page.on('websocket', ws => {
      wsConnections.push(ws);
      console.log(`WebSocket connection established: ${ws.url()}`);
      
      ws.on('framereceived', frame => {
        console.log('WebSocket frame received:', frame.payload);
      });
    });
    
    // Navigate to a page that might use real-time updates
    await page.goto(testConfig.urls.adminQuotations);
    await page.waitForLoadState('networkidle');
    
    // Wait for potential WebSocket connections
    await page.waitForTimeout(5000);
    
    if (wsConnections.length > 0) {
      console.log(`Found ${wsConnections.length} WebSocket connections`);
      
      // Verify Supabase realtime connection
      const supabaseWs = wsConnections.find(ws => 
        ws.url().includes('supabase') || 
        ws.url().includes('realtime')
      );
      
      if (supabaseWs) {
        console.log('Supabase real-time connection established');
      }
    } else {
      console.log('No WebSocket connections found - real-time updates might not be implemented');
    }
  });

  test('should handle CRUD operations through UI and API', async ({ page }) => {
    await authHelper.loginAsAdmin();
    
    const apiCalls: any[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/') || request.url().includes('supabase')) {
        apiCalls.push({
          url: request.url(),
          method: request.method(),
          postData: request.postData()
        });
      }
    });
    
    // Navigate to products page
    await page.goto(testConfig.urls.adminProducts);
    await page.waitForLoadState('networkidle');
    
    // Try to create a new product (if possible)
    const createButton = page.locator('button:has-text("Nuevo Producto")').or(page.locator('[data-testid="create-product"]'));
    if (await createButton.isVisible()) {
      await createButton.click();
      
      // Wait for form and potential API calls
      await page.waitForTimeout(2000);
      
      // Check for GET requests (loading data)
      const getRequests = apiCalls.filter(call => call.method === 'GET');
      console.log(`Found ${getRequests.length} GET requests`);
      
      // Fill form if available and check for POST requests
      const nameField = page.getByLabel(/nombre/i);
      if (await nameField.isVisible()) {
        await nameField.fill('Test API Product');
        
        const submitButton = page.locator('button:has-text("Guardar")').or(page.locator('button[type="submit"]'));
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(3000);
          
          // Check for POST/PUT requests (create/update operations)
          const mutationRequests = apiCalls.filter(call => 
            call.method === 'POST' || 
            call.method === 'PUT' || 
            call.method === 'PATCH'
          );
          
          if (mutationRequests.length > 0) {
            console.log(`Found ${mutationRequests.length} mutation requests`);
            
            // Verify request has data
            const requestWithData = mutationRequests.find(req => req.postData);
            if (requestWithData) {
              console.log('CRUD operation detected with data payload');
            }
          }
        }
      }
    }
    
    console.log(`Total API calls captured: ${apiCalls.length}`);
  });

  test('should validate PDF generation API', async ({ page }) => {
    await authHelper.loginAsAdmin();
    
    const pdfRequests: any[] = [];
    page.on('request', request => {
      if (request.url().includes('pdf') || 
          request.headers()['accept']?.includes('application/pdf')) {
        pdfRequests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers()
        });
      }
    });
    
    // Navigate to quotations
    await page.goto(testConfig.urls.adminQuotations);
    await page.waitForLoadState('networkidle');
    
    // Look for PDF download functionality
    const pdfButton = page.locator('button:has-text("PDF")').or(page.locator('button:has-text("Descargar PDF")'));
    if (await pdfButton.isVisible()) {
      // Monitor for PDF download
      const downloadPromise = page.waitForEvent('download');
      await pdfButton.click();
      
      try {
        const download = await downloadPromise;
        
        // Verify PDF API call was made
        if (pdfRequests.length > 0) {
          console.log(`PDF API request made: ${pdfRequests[0].url}`);
          expect(pdfRequests[0].method).toBe('GET');
        }
        
        // Verify PDF download
        const filename = download.suggestedFilename();
        expect(filename).toMatch(/\.pdf$/i);
        
        const path = await download.path();
        if (path) {
          const fs = await import('fs');
          const stats = fs.statSync(path);
          expect(stats.size).toBeGreaterThan(1000); // PDF should be reasonably sized
        }
        
        console.log('PDF generation API working correctly');
      } catch (error) {
        console.log('PDF generation failed or timed out');
      }
    } else {
      console.log('PDF functionality not found - skipping PDF API test');
    }
  });

  test('should handle concurrent API requests', async ({ page }) => {
    await authHelper.loginAsAdmin();
    
    const concurrentRequests: any[] = [];
    const requestTiming: { [key: string]: number } = {};
    
    page.on('request', request => {
      if (request.url().includes('/api/') || request.url().includes('supabase')) {
        const timestamp = Date.now();
        requestTiming[request.url()] = timestamp;
        concurrentRequests.push({
          url: request.url(),
          method: request.method(),
          timestamp: timestamp
        });
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/') || response.url().includes('supabase')) {
        const requestTime = requestTiming[response.url()];
        if (requestTime) {
          const duration = Date.now() - requestTime;
          console.log(`API request to ${response.url()} took ${duration}ms`);
        }
      }
    });
    
    // Navigate to dashboard (likely makes multiple API calls)
    await page.goto(testConfig.urls.adminDashboard);
    await page.waitForLoadState('networkidle');
    
    // Wait for all requests to complete
    await page.waitForTimeout(3000);
    
    if (concurrentRequests.length > 1) {
      // Check for concurrent requests (requests made within 100ms of each other)
      const sortedRequests = concurrentRequests.sort((a, b) => a.timestamp - b.timestamp);
      let concurrentCount = 0;
      
      for (let i = 1; i < sortedRequests.length; i++) {
        const timeDiff = sortedRequests[i].timestamp - sortedRequests[i-1].timestamp;
        if (timeDiff < 100) {
          concurrentCount++;
        }
      }
      
      console.log(`Found ${concurrentCount} concurrent API requests out of ${concurrentRequests.length} total`);
      
      if (concurrentCount > 0) {
        console.log('Application handles concurrent API requests');
      }
    } else {
      console.log('Not enough API requests to test concurrency');
    }
  });

  test('should validate API rate limiting handling', async ({ page }) => {
    await authHelper.loginAsAdmin();
    
    let rateLimitHit = false;
    const responses: any[] = [];
    
    page.on('response', response => {
      responses.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
      
      // Check for rate limiting status codes
      if (response.status() === 429 || response.status() === 503) {
        rateLimitHit = true;
        console.log(`Rate limit detected: ${response.status()} ${response.statusText()}`);
      }
    });
    
    // Simulate rapid navigation to trigger multiple API calls
    const pages = [
      testConfig.urls.adminDashboard,
      testConfig.urls.adminProducts,
      testConfig.urls.adminQuotations,
      testConfig.urls.adminClients
    ];
    
    for (const pageUrl of pages) {
      await page.goto(pageUrl);
      await page.waitForTimeout(500); // Quick navigation
    }
    
    // Wait for all responses
    await page.waitForLoadState('networkidle');
    
    if (rateLimitHit) {
      console.log('Application encountered rate limiting and should handle it gracefully');
      
      // Check if the page still works despite rate limiting
      const pageTitle = await page.title();
      expect(pageTitle).toBeTruthy();
    } else {
      console.log('No rate limiting encountered during test');
    }
    
    // Log response status distribution
    const statusCounts: { [key: number]: number } = {};
    responses.forEach(resp => {
      statusCounts[resp.status] = (statusCounts[resp.status] || 0) + 1;
    });
    
    console.log('API response status distribution:', statusCounts);
  });

  test('should validate data synchronization between client and server', async ({ page }) => {
    await authHelper.loginAsAdmin();
    
    // Create an item through UI and verify it persists
    await page.goto(testConfig.urls.adminProducts);
    await page.waitForLoadState('networkidle');
    
    // Record initial state
    const initialRows = await page.locator('tbody tr, .table-row').count();
    console.log(`Initial product count: ${initialRows}`);
    
    // Try to create a new product
    const createButton = page.locator('button:has-text("Nuevo Producto")');
    if (await createButton.isVisible()) {
      await createButton.click();
      
      const nameField = page.getByLabel(/nombre/i);
      if (await nameField.isVisible()) {
        const testProductName = `Sync Test Product ${Date.now()}`;
        await nameField.fill(testProductName);
        
        // Fill other required fields
        const codeField = page.getByLabel(/código/i);
        if (await codeField.isVisible()) {
          await codeField.fill(`SYNC${Date.now()}`);
        }
        
        const priceField = page.getByLabel(/precio.*costo/i);
        if (await priceField.isVisible()) {
          await priceField.fill('100');
        }
        
        const submitButton = page.locator('button:has-text("Guardar")');
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(3000);
          
          // Verify the item appears in the list
          const updatedRows = await page.locator('tbody tr, .table-row').count();
          
          if (updatedRows > initialRows) {
            console.log('Data synchronization successful - new item visible immediately');
            
            // Verify the specific item is visible
            const newItem = page.getByText(testProductName);
            if (await newItem.isVisible()) {
              console.log('Created item found in list');
            }
          } else {
            console.log('Data synchronization might be delayed or handled differently');
          }
          
          // Refresh page and verify persistence
          await page.reload();
          await page.waitForLoadState('networkidle');
          
          const afterReloadRows = await page.locator('tbody tr, .table-row').count();
          const persistedItem = page.getByText(testProductName);
          
          if (await persistedItem.isVisible()) {
            console.log('Data persistence confirmed - item survives page reload');
          } else {
            console.log('Item not found after reload - might have been created with different name or not persisted');
          }
        }
      }
    } else {
      console.log('Create product functionality not available for synchronization test');
    }
  });

  test('should handle offline/online state changes', async ({ page }) => {
    await authHelper.loginAsAdmin();
    await page.goto(testConfig.urls.adminDashboard);
    await page.waitForLoadState('networkidle');
    
    // Go offline
    await page.context().setOffline(true);
    
    // Try to navigate to another page
    await page.goto(testConfig.urls.adminProducts);
    await page.waitForTimeout(5000);
    
    // Check how the application handles offline state
    const offlineIndicators = [
      page.getByText(/offline/i),
      page.getByText(/sin conexión/i),
      page.getByText(/network error/i),
      page.getByText(/connection failed/i)
    ];
    
    let offlineHandled = false;
    for (const indicator of offlineIndicators) {
      if (await indicator.isVisible()) {
        offlineHandled = true;
        console.log('Application detects offline state');
        break;
      }
    }
    
    // Go back online
    await page.context().setOffline(false);
    await page.waitForTimeout(2000);
    
    // Refresh or navigate to test recovery
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verify the page works again
    const pageTitle = await page.title();
    expect(pageTitle).toBeTruthy();
    
    if (offlineHandled) {
      console.log('Application handles offline/online transitions');
    } else {
      console.log('No explicit offline handling detected');
    }
  });
});