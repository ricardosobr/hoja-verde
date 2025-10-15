import { Page, expect, Locator } from '@playwright/test';
import { testUsers, selectors, testConfig } from '../fixtures/test-data';

/**
 * Authentication utilities for Playwright tests
 */
export class AuthHelper {
  constructor(private page: Page) {}

  /**
   * Login with credentials
   */
  async login(email: string, password: string) {
    await this.page.goto(testConfig.urls.login);
    
    // Wait for login form to be visible
    await expect(this.page.locator('form')).toBeVisible();
    
    // Fill credentials  
    await this.page.locator(selectors.emailInput).fill(email);
    await this.page.locator(selectors.passwordInput).fill(password);
    
    // Submit form
    await this.page.locator(selectors.loginButton).click();
    
    // Wait for navigation
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Login as admin user
   */
  async loginAsAdmin() {
    await this.login(testUsers.admin.email, testUsers.admin.password);
    await expect(this.page).toHaveURL(testConfig.urls.adminDashboard);
  }

  /**
   * Login as client user
   */
  async loginAsClient() {
    await this.login(testUsers.client.email, testUsers.client.password);
    await expect(this.page).toHaveURL(testConfig.urls.clientDashboard);
  }

  /**
   * Logout current user
   */
  async logout() {
    // Click user menu
    await this.page.locator(selectors.userMenu).click();
    
    // Click logout
    await this.page.locator(selectors.logoutButton).click();
    
    // Wait for redirect to login
    await expect(this.page).toHaveURL(testConfig.urls.login);
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      await expect(this.page.locator(selectors.userMenu)).toBeVisible({ timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Navigation utilities
 */
export class NavigationHelper {
  constructor(private page: Page) {}

  /**
   * Navigate to admin section
   */
  async goToAdminDashboard() {
    await this.page.goto(testConfig.urls.adminDashboard);
    await this.page.waitForLoadState('networkidle');
  }

  async goToAdminQuotations() {
    await this.page.goto(testConfig.urls.adminQuotations);
    await this.page.waitForLoadState('networkidle');
  }

  async goToAdminProducts() {
    await this.page.goto(testConfig.urls.adminProducts);
    await this.page.waitForLoadState('networkidle');
  }

  async goToAdminClients() {
    await this.page.goto(testConfig.urls.adminClients);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Navigate to client section
   */
  async goToClientDashboard() {
    await this.page.goto(testConfig.urls.clientDashboard);
    await this.page.waitForLoadState('networkidle');
  }

  async goToClientQuotations() {
    await this.page.goto(testConfig.urls.clientQuotations);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Navigate using sidebar links
   */
  async clickSidebarLink(linkText: string) {
    await this.page.locator(`nav a:has-text("${linkText}")`).click();
    await this.page.waitForLoadState('networkidle');
  }
}

/**
 * Form utilities
 */
export class FormHelper {
  constructor(private page: Page) {}

  /**
   * Fill a form field by label or placeholder
   */
  async fillField(fieldLabel: string, value: string) {
    const field = this.page.getByLabel(fieldLabel).or(this.page.getByPlaceholder(fieldLabel));
    await field.fill(value);
  }

  /**
   * Select an option from a select dropdown
   */
  async selectOption(fieldLabel: string, value: string) {
    const select = this.page.getByLabel(fieldLabel);
    await select.selectOption(value);
  }

  /**
   * Click a form button
   */
  async clickButton(buttonText: string) {
    await this.page.getByRole('button', { name: new RegExp(buttonText, 'i') }).click();
  }

  /**
   * Submit a form
   */
  async submitForm() {
    await this.page.locator(selectors.saveButton).click();
  }

  /**
   * Cancel form editing
   */
  async cancelForm() {
    await this.page.locator(selectors.cancelButton).click();
  }

  /**
   * Wait for form submission success
   */
  async waitForSuccess() {
    await expect(this.page.locator(selectors.successNotification)).toBeVisible();
  }

  /**
   * Wait for form validation error
   */
  async waitForError() {
    await expect(this.page.locator(selectors.errorNotification)).toBeVisible();
  }
}

/**
 * Table utilities
 */
export class TableHelper {
  constructor(private page: Page) {}

  /**
   * Get table rows
   */
  getRows(): Locator {
    return this.page.locator(selectors.tableRow);
  }

  /**
   * Get specific row by index
   */
  getRow(index: number): Locator {
    return this.getRows().nth(index);
  }

  /**
   * Find row containing specific text
   */
  findRowWithText(text: string): Locator {
    return this.page.locator(`${selectors.tableRow}:has-text("${text}")`);
  }

  /**
   * Click action button in specific row
   */
  async clickRowAction(rowText: string, actionText: string) {
    const row = this.findRowWithText(rowText);
    await row.getByRole('button', { name: new RegExp(actionText, 'i') }).click();
  }

  /**
   * Get table cell value
   */
  async getCellValue(rowIndex: number, columnIndex: number): Promise<string> {
    const cell = this.getRow(rowIndex).locator('td').nth(columnIndex);
    return await cell.textContent() || '';
  }

  /**
   * Wait for table to load
   */
  async waitForTable() {
    await expect(this.page.locator(selectors.dataTable)).toBeVisible();
  }

  /**
   * Check if table is empty
   */
  async isEmpty(): Promise<boolean> {
    try {
      await expect(this.page.locator(selectors.noDataMessage)).toBeVisible({ timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Notification utilities
 */
export class NotificationHelper {
  constructor(private page: Page) {}

  /**
   * Wait for success notification
   */
  async waitForSuccess(message?: string) {
    const notification = this.page.locator(selectors.successNotification);
    await expect(notification).toBeVisible();
    
    if (message) {
      await expect(notification).toContainText(message);
    }
  }

  /**
   * Wait for error notification
   */
  async waitForError(message?: string) {
    const notification = this.page.locator(selectors.errorNotification);
    await expect(notification).toBeVisible();
    
    if (message) {
      await expect(notification).toContainText(message);
    }
  }

  /**
   * Dismiss notification
   */
  async dismiss() {
    const dismissButton = this.page.locator('.toast button, [data-testid="dismiss-notification"]');
    if (await dismissButton.isVisible()) {
      await dismissButton.click();
    }
  }
}

/**
 * Loading state utilities
 */
export class LoadingHelper {
  constructor(private page: Page) {}

  /**
   * Wait for loading to complete
   */
  async waitForLoading() {
    // Wait for loading indicators to disappear
    await expect(this.page.locator(selectors.loadingSpinner)).not.toBeVisible();
  }

  /**
   * Wait for page to be fully loaded
   */
  async waitForPageLoad() {
    await Promise.all([
      this.page.waitForLoadState('networkidle'),
      this.waitForLoading()
    ]);
  }
}

/**
 * PDF utilities
 */
export class PDFHelper {
  constructor(private page: Page) {}

  /**
   * Download PDF and return path
   */
  async downloadPDF(buttonSelector = selectors.pdfDownloadButton): Promise<string> {
    const downloadPromise = this.page.waitForEvent('download');
    await this.page.locator(buttonSelector).click();
    const download = await downloadPromise;
    
    // Save to temp location
    const path = await download.path();
    return path || '';
  }

  /**
   * Verify PDF was downloaded with expected filename pattern
   */
  async verifyPDFDownload(filenamePattern: RegExp): Promise<void> {
    const downloadPromise = this.page.waitForEvent('download');
    await this.page.locator(selectors.pdfDownloadButton).click();
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toMatch(filenamePattern);
    
    // Verify file is not empty
    const path = await download.path();
    if (path) {
      const fs = await import('fs');
      const stats = fs.statSync(path);
      expect(stats.size).toBeGreaterThan(0);
    }
  }
}

/**
 * Database utilities for test setup/teardown
 */
export class DatabaseHelper {
  /**
   * Clean up test data
   */
  static async cleanup() {
    // This would typically connect to your test database
    // and clean up any test data created during tests
    // Implementation depends on your database setup
    console.log('Cleaning up test data...');
  }

  /**
   * Seed test data
   */
  static async seedTestData() {
    // This would typically seed your test database
    // with the test data needed for tests
    console.log('Seeding test data...');
  }
}

/**
 * Screenshot utilities
 */
export class ScreenshotHelper {
  constructor(private page: Page) {}

  /**
   * Take full page screenshot
   */
  async takeFullPageScreenshot(name: string) {
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}.png`, 
      fullPage: true 
    });
  }

  /**
   * Take element screenshot
   */
  async takeElementScreenshot(selector: string, name: string) {
    const element = this.page.locator(selector);
    await element.screenshot({ 
      path: `test-results/screenshots/${name}.png` 
    });
  }
}

/**
 * Utility functions
 */
export const utils = {
  /**
   * Wait for a specific amount of time
   */
  async wait(ms: number) {
    await new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Generate a random test ID
   */
  generateTestId(): string {
    return `test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  },

  /**
   * Format currency for assertions
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  },

  /**
   * Parse currency string to number
   */
  parseCurrency(currencyString: string): number {
    return parseFloat(currencyString.replace(/[^0-9.-]+/g, ''));
  }
};