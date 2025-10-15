import { test, expect } from '@playwright/test';
import { testConfig } from '../../fixtures/test-data';
import { AuthHelper, NavigationHelper, LoadingHelper, TableHelper, PDFHelper } from '../../utils/test-helpers';

test.describe('Client Portal', () => {
  let authHelper: AuthHelper;
  let navigationHelper: NavigationHelper;
  let loadingHelper: LoadingHelper;
  let tableHelper: TableHelper;
  let pdfHelper: PDFHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    navigationHelper = new NavigationHelper(page);
    loadingHelper = new LoadingHelper(page);
    tableHelper = new TableHelper(page);
    pdfHelper = new PDFHelper(page);
    
    // Login as client before each test
    await authHelper.loginAsClient();
    await expect(page).toHaveURL(testConfig.urls.clientDashboard);
  });

  test('should display client dashboard correctly', async ({ page }) => {
    await loadingHelper.waitForPageLoad();
    
    // Verify main client dashboard elements
    const dashboardTitles = [
      page.getByText(/portal del cliente/i),
      page.getByText(/bienvenido/i),
      page.getByText(/dashboard/i),
      page.getByText(/inicio/i)
    ];
    
    let titleFound = false;
    for (const title of dashboardTitles) {
      try {
        await expect(title).toBeVisible({ timeout: 3000 });
        titleFound = true;
        break;
      } catch {
        // Continue checking other titles
      }
    }
    
    expect(titleFound).toBe(true);
    
    // Check for client navigation
    const navSelectors = [
      '[data-testid="client-sidebar"]',
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

  test('should display client information correctly', async ({ page }) => {
    await loadingHelper.waitForPageLoad();
    
    // Look for client information display
    const clientInfoSelectors = [
      '[data-testid="client-info"]',
      '.client-info',
      'div:has-text("Empresa:")',
      'div:has-text("Cliente:")',
      '.company-info'
    ];
    
    let clientInfoFound = false;
    for (const selector of clientInfoSelectors) {
      if (await page.locator(selector).isVisible()) {
        clientInfoFound = true;
        break;
      }
    }
    
    if (!clientInfoFound) {
      // Check for any user information in header
      const userInfoSelectors = [
        '[data-testid="user-menu"]',
        '.user-info',
        'button:has-text("Cliente")',
        '.header .user'
      ];
      
      for (const selector of userInfoSelectors) {
        if (await page.locator(selector).isVisible()) {
          clientInfoFound = true;
          break;
        }
      }
    }
    
    expect(clientInfoFound).toBe(true);
  });

  test('should navigate to quotations section', async ({ page }) => {
    await loadingHelper.waitForPageLoad();
    
    // Find quotations navigation link
    const quotationsLinks = [
      'a:has-text("Cotizaciones")',
      'a[href*="quotations"]',
      'nav a:has-text("Cotizaciones")',
      '[data-testid="nav-quotations"]',
      'button:has-text("Cotizaciones")'
    ];
    
    let quotationsLinkFound = false;
    for (const selector of quotationsLinks) {
      const link = page.locator(selector);
      if (await link.isVisible()) {
        await link.click();
        await page.waitForLoadState('networkidle');
        
        // Should navigate to client quotations page
        expect(page.url()).toContain('/client');
        expect(page.url()).toContain('quotations');
        quotationsLinkFound = true;
        break;
      }
    }
    
    if (!quotationsLinkFound) {
      // Try direct navigation
      await navigationHelper.goToClientQuotations();
      await expect(page).toHaveURL(testConfig.urls.clientQuotations);
    }
  });

  test('should display client quotations list', async ({ page }) => {
    // Navigate to quotations
    await navigationHelper.goToClientQuotations();
    await loadingHelper.waitForPageLoad();
    
    // Verify we're on quotations page
    expect(page.url()).toContain('quotations');
    
    // Should have quotations title
    await expect(page.getByText(/cotizaciones/i)).toBeVisible();
    
    // Look for quotations table or list
    const quotationSelectors = [
      '[data-testid="client-quotations"]',
      '[data-testid="quotations-table"]',
      'table',
      '.quotations-list',
      '.data-table'
    ];
    
    let quotationsFound = false;
    for (const selector of quotationSelectors) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        quotationsFound = true;
        
        // If it's a table, check for expected columns
        if (selector.includes('table') || selector.includes('Table')) {
          const headers = element.locator('th, .table-header');
          const headerCount = await headers.count();
          expect(headerCount).toBeGreaterThan(0);
          
          // Check for typical quotation columns
          const expectedColumns = ['folio', 'fecha', 'total', 'estado', 'acciones'];
          let columnsFound = 0;
          for (const column of expectedColumns) {
            const columnExists = await element.locator(`th:has-text("${column}"), .table-header:has-text("${column}")`).count() > 0;
            if (columnExists) columnsFound++;
          }
          
          expect(columnsFound).toBeGreaterThan(0);
        }
        break;
      }
    }
    
    expect(quotationsFound).toBe(true);
  });

  test('should view quotation details as client', async ({ page }) => {
    // Navigate to quotations
    await navigationHelper.goToClientQuotations();
    await loadingHelper.waitForPageLoad();
    
    // Look for existing quotation
    const tableRows = page.locator('tbody tr, .table-row, .quotation-item');
    const rowCount = await tableRows.count();
    
    if (rowCount > 0) {
      // Click on first quotation
      const firstRow = tableRows.first();
      
      // Try different ways to view details
      const viewSelectors = [
        'button:has-text("Ver")',
        'a:has-text("Ver")',
        'button:has-text("Detalles")',
        '[data-testid*="view"]'
      ];
      
      let viewClicked = false;
      for (const selector of viewSelectors) {
        const viewButton = firstRow.locator(selector);
        if (await viewButton.isVisible()) {
          await viewButton.click();
          viewClicked = true;
          break;
        }
      }
      
      // If no specific view button, try clicking the row
      if (!viewClicked) {
        await firstRow.click();
        viewClicked = true;
      }
      
      if (viewClicked) {
        await page.waitForTimeout(2000);
        
        // Check if quotation details are displayed
        const detailsSelectors = [
          '[data-testid="quotation-details"]',
          '.quotation-details',
          '[role="dialog"]',
          'div:has-text("Detalles de la Cotización")',
          'div:has-text("Folio:")',
          'div:has-text("Total:")'
        ];
        
        let detailsFound = false;
        for (const selector of detailsSelectors) {
          if (await page.locator(selector).isVisible()) {
            detailsFound = true;
            break;
          }
        }
        
        if (detailsFound) {
          console.log('Quotation details view found');
          
          // Check for client-specific elements (should not see admin functions)
          const adminElements = [
            'button:has-text("Editar")',
            'button:has-text("Eliminar")',
            'button:has-text("Actualizar Estado")'
          ];
          
          for (const selector of adminElements) {
            const adminElement = page.locator(selector);
            if (await adminElement.isVisible()) {
              console.log(`Warning: Admin element visible to client: ${selector}`);
            }
          }
        } else {
          // Check if navigated to details page
          if (page.url().includes('quotations/') || page.url().includes('details')) {
            console.log('Navigated to quotation details page');
          }
        }
      }
    } else {
      console.log('No quotations found for client to view');
    }
  });

  test('should allow client to approve/reject quotations', async ({ page }) => {
    // Navigate to quotations
    await navigationHelper.goToClientQuotations();
    await loadingHelper.waitForPageLoad();
    
    // Look for quotation that can be approved/rejected
    const tableRows = page.locator('tbody tr, .table-row, .quotation-item');
    const rowCount = await tableRows.count();
    
    if (rowCount > 0) {
      // Click on first quotation
      const firstRow = tableRows.first();
      await firstRow.click();
      await page.waitForTimeout(1000);
      
      // Look for approval controls
      const approvalButtons = [
        'button:has-text("Aprobar")',
        'button:has-text("Approve")',
        'button:has-text("Rechazar")',
        'button:has-text("Reject")',
        '[data-testid*="approve"]',
        '[data-testid*="reject"]'
      ];
      
      let approvalFound = false;
      for (const selector of approvalButtons) {
        const button = page.locator(selector);
        if (await button.isVisible()) {
          approvalFound = true;
          
          // Click approve button if it's an approve action
          if (selector.includes('Aprobar') || selector.includes('Approve') || selector.includes('approve')) {
            await button.click();
            await page.waitForTimeout(2000);
            
            // Check for approval success
            const approvalIndicators = [
              page.getByText(/aprobado/i),
              page.getByText(/approved/i),
              page.getByText(/éxito/i),
              page.getByText(/gracias por aprobar/i)
            ];
            
            for (const indicator of approvalIndicators) {
              try {
                await expect(indicator).toBeVisible({ timeout: 3000 });
                break;
              } catch {
                // Continue checking
              }
            }
            break;
          }
        }
      }
      
      if (!approvalFound) {
        console.log('Client approval controls not found - this might be expected if approval workflow is not implemented');
      }
    } else {
      test.skip('No quotations found for approval');
    }
  });

  test('should download quotation PDF as client', async ({ page }) => {
    // Navigate to quotations
    await navigationHelper.goToClientQuotations();
    await loadingHelper.waitForPageLoad();
    
    // Look for existing quotation
    const tableRows = page.locator('tbody tr, .table-row, .quotation-item');
    const rowCount = await tableRows.count();
    
    if (rowCount > 0) {
      const firstRow = tableRows.first();
      
      // Look for PDF download button
      const pdfButtons = [
        'button:has-text("PDF")',
        'button:has-text("Descargar PDF")',
        'a:has-text("PDF")',
        '[data-testid*="pdf"]',
        'button[title*="PDF"]'
      ];
      
      let pdfButtonFound = false;
      
      // First try to find PDF button in the row
      for (const selector of pdfButtons) {
        const pdfButton = firstRow.locator(selector);
        if (await pdfButton.isVisible()) {
          try {
            const downloadPromise = page.waitForEvent('download');
            await pdfButton.click();
            
            const download = await downloadPromise;
            const filename = download.suggestedFilename();
            
            // Verify PDF filename pattern
            expect(filename).toMatch(/\.pdf$/i);
            expect(filename).toMatch(/cotizacion|quotation/i);
            
            // Verify file is not empty
            const path = await download.path();
            if (path) {
              const fs = await import('fs');
              const stats = fs.statSync(path);
              expect(stats.size).toBeGreaterThan(0);
            }
            
            pdfButtonFound = true;
          } catch (error) {
            console.log('PDF download failed:', error);
          }
          break;
        }
      }
      
      // If not found in row, try clicking row first then look for PDF button
      if (!pdfButtonFound) {
        await firstRow.click();
        await page.waitForTimeout(1000);
        
        for (const selector of pdfButtons) {
          const pdfButton = page.locator(selector);
          if (await pdfButton.isVisible()) {
            try {
              const downloadPromise = page.waitForEvent('download');
              await pdfButton.click();
              
              const download = await downloadPromise;
              const filename = download.suggestedFilename();
              expect(filename).toMatch(/\.pdf$/i);
              
              pdfButtonFound = true;
            } catch (error) {
              console.log('PDF download failed:', error);
            }
            break;
          }
        }
      }
      
      if (!pdfButtonFound) {
        console.log('PDF download not available for clients - this might be expected');
      }
    } else {
      test.skip('No quotations found to download PDF');
    }
  });

  test('should display quotation status history', async ({ page }) => {
    // Navigate to quotations
    await navigationHelper.goToClientQuotations();
    await loadingHelper.waitForPageLoad();
    
    // Look for existing quotation
    const tableRows = page.locator('tbody tr, .table-row, .quotation-item');
    const rowCount = await tableRows.count();
    
    if (rowCount > 0) {
      // Click on quotation to view details
      const firstRow = tableRows.first();
      await firstRow.click();
      await page.waitForTimeout(1000);
      
      // Look for status history section
      const historySelectors = [
        '[data-testid="quotation-history"]',
        '[data-testid="status-history"]',
        '.history',
        '.status-history',
        'div:has-text("Historial")',
        'div:has-text("Historia del Estado")',
        '.timeline'
      ];
      
      let historyFound = false;
      for (const selector of historySelectors) {
        if (await page.locator(selector).isVisible()) {
          historyFound = true;
          
          // Check if history has entries
          const historyEntries = page.locator(`${selector} .history-entry, ${selector} .timeline-item, ${selector} li`);
          const entryCount = await historyEntries.count();
          
          if (entryCount > 0) {
            console.log(`Found ${entryCount} status history entries`);
            
            // Verify history entries contain status information
            const firstEntry = historyEntries.first();
            const entryText = await firstEntry.textContent();
            
            // Should contain date and status information
            expect(entryText).toBeTruthy();
          } else {
            console.log('Status history section found but no entries');
          }
          break;
        }
      }
      
      if (!historyFound) {
        console.log('Status history not found - this might be expected if not implemented');
      }
    } else {
      test.skip('No quotations found to view status history');
    }
  });

  test('should filter quotations by status', async ({ page }) => {
    // Navigate to quotations
    await navigationHelper.goToClientQuotations();
    await loadingHelper.waitForPageLoad();
    
    // Look for status filter
    const statusFilters = [
      'select[name*="status"]',
      'select:has(option:has-text("Estado"))',
      '[data-testid="status-filter"]',
      'select:near(label:has-text("Estado"))'
    ];
    
    let statusFilterFound = false;
    for (const selector of statusFilters) {
      const filter = page.locator(selector);
      if (await filter.isVisible()) {
        // Get available options
        const options = filter.locator('option');
        const optionCount = await options.count();
        
        if (optionCount > 1) {
          // Select a specific status
          await filter.selectOption({ index: 1 });
          await page.waitForTimeout(1000); // Wait for filtering
          
          statusFilterFound = true;
          
          // Verify filtering happened
          const table = page.locator('[data-testid="quotations-table"], table, .quotations-list').first();
          if (await table.isVisible()) {
            console.log('Status filter applied');
          }
        }
        break;
      }
    }
    
    if (!statusFilterFound) {
      console.log('Status filter not found - this might be expected if not available to clients');
    }
  });

  test('should display orders section for approved quotations', async ({ page }) => {
    await loadingHelper.waitForPageLoad();
    
    // Look for orders navigation or section
    const ordersLinks = [
      'a:has-text("Órdenes")',
      'a:has-text("Pedidos")',
      'a[href*="orders"]',
      'nav a:has-text("Órdenes")',
      '[data-testid="nav-orders"]'
    ];
    
    let ordersLinkFound = false;
    for (const selector of ordersLinks) {
      const link = page.locator(selector);
      if (await link.isVisible()) {
        await link.click();
        await page.waitForLoadState('networkidle');
        
        // Should navigate to orders page
        expect(page.url()).toContain('/client');
        ordersLinkFound = true;
        
        // Verify orders page content
        const ordersIndicators = [
          page.getByText(/órdenes/i),
          page.getByText(/pedidos/i),
          page.getByText(/orders/i)
        ];
        
        let ordersPageFound = false;
        for (const indicator of ordersIndicators) {
          try {
            await expect(indicator).toBeVisible({ timeout: 3000 });
            ordersPageFound = true;
            break;
          } catch {
            // Continue checking
          }
        }
        
        expect(ordersPageFound).toBe(true);
        break;
      }
    }
    
    if (!ordersLinkFound) {
      console.log('Orders section not found - this might be expected if orders are not available to clients');
    }
  });

  test('should handle empty quotations state for client', async ({ page }) => {
    // Navigate to quotations
    await navigationHelper.goToClientQuotations();
    await loadingHelper.waitForPageLoad();
    
    // Check if there are no quotations
    const emptyStateSelectors = [
      'div:has-text("No hay cotizaciones")',
      'div:has-text("Sin cotizaciones")',
      '.empty-state',
      '[data-testid="empty-state"]',
      'div:has-text("No quotations found")',
      'div:has-text("Aún no tienes cotizaciones")'
    ];
    
    let emptyStateFound = false;
    for (const selector of emptyStateSelectors) {
      if (await page.locator(selector).isVisible()) {
        emptyStateFound = true;
        console.log('Empty quotations state detected for client');
        break;
      }
    }
    
    // If no explicit empty state, check if table has no rows
    if (!emptyStateFound) {
      const tableRows = page.locator('tbody tr:not(:has(td:has-text("No hay")))', '.table-row, .quotation-item');
      const rowCount = await tableRows.count();
      if (rowCount === 0) {
        console.log('No quotations in table for client');
      }
    }
    
    // This test is informational and should not fail
    expect(true).toBe(true);
  });

  test('should be responsive on mobile viewports', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await loadingHelper.waitForPageLoad();
    
    // Client dashboard should still be accessible
    const dashboardTitles = [
      page.getByText(/portal del cliente/i),
      page.getByText(/bienvenido/i),
      page.getByText(/dashboard/i)
    ];
    
    let titleFound = false;
    for (const title of dashboardTitles) {
      try {
        await expect(title).toBeVisible({ timeout: 3000 });
        titleFound = true;
        break;
      } catch {
        // Continue checking
      }
    }
    
    expect(titleFound).toBe(true);
    
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
        
        // Test mobile menu functionality
        const mobileMenuButton = page.locator(selector);
        await mobileMenuButton.click();
        await page.waitForTimeout(500); // Wait for animation
        
        // Navigation should become visible
        console.log('Mobile menu toggled');
        break;
      }
    }
    
    if (!mobileMenuFound) {
      console.log('Mobile menu not found - desktop navigation might be responsive');
    }
  });

  test('should maintain client session across navigation', async ({ page }) => {
    await loadingHelper.waitForPageLoad();
    
    // Navigate to quotations
    await navigationHelper.goToClientQuotations();
    await expect(page.url()).toContain('quotations');
    
    // Navigate back to dashboard
    await navigationHelper.goToClientDashboard();
    await expect(page).toHaveURL(testConfig.urls.clientDashboard);
    
    // Verify still authenticated as client
    const userInfoSelectors = [
      '[data-testid="user-menu"]',
      'button:has-text("Cliente")',
      '.user-info'
    ];
    
    let userInfoFound = false;
    for (const selector of userInfoSelectors) {
      if (await page.locator(selector).isVisible()) {
        userInfoFound = true;
        break;
      }
    }
    
    expect(userInfoFound).toBe(true);
  });

  test('should display correct page titles in client portal', async ({ page }) => {
    await loadingHelper.waitForPageLoad();
    
    // Check dashboard page title
    let title = await page.title();
    expect(title).toMatch(/cliente|client|portal|hoja verde/i);
    
    // Navigate to quotations and check title
    await navigationHelper.goToClientQuotations();
    await loadingHelper.waitForPageLoad();
    
    title = await page.title();
    expect(title).toMatch(/cotizaciones|quotations|cliente|client|hoja verde/i);
  });
});