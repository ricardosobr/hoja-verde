# Playwright E2E Testing for Hoja Verde Quotation System

This document provides comprehensive information about the Playwright end-to-end testing suite implemented for the Hoja Verde quotation management system.

## Overview

The testing suite covers all major functionalities of the application including:
- Authentication and session management
- Admin panel operations (dashboard, products, quotations, clients)
- Client portal functionality
- API integration testing
- Visual regression testing
- Mobile responsiveness testing

## Test Structure

```
tests/
├── e2e/
│   ├── auth/                 # Authentication tests
│   │   ├── login.spec.ts     # Login flow validation
│   │   └── session.spec.ts   # Session management
│   ├── admin/                # Admin panel tests
│   │   ├── dashboard.spec.ts # Dashboard functionality
│   │   ├── products.spec.ts  # Product management
│   │   └── quotations.spec.ts # Quotation management
│   ├── client/               # Client portal tests
│   │   └── portal.spec.ts    # Client functionality
│   ├── api/                  # API integration tests
│   │   └── integration.spec.ts # API testing
│   └── visual/               # Visual and responsive tests
│       ├── regression.spec.ts # Visual regression
│       └── mobile.spec.ts    # Mobile responsiveness
├── fixtures/
│   └── test-data.ts          # Test data and fixtures
└── utils/
    └── test-helpers.ts       # Utility functions and helpers
```

## Getting Started

### Prerequisites
- Node.js (version specified in package.json)
- npm or yarn
- Next.js application running locally
- Supabase project configured

### Installation

1. Install Playwright dependencies:
```bash
npm install --save-dev @playwright/test
```

2. Install Playwright browsers:
```bash
npx playwright install
```

### Configuration

The Playwright configuration is in `playwright.config.ts` and includes:
- Multiple browser testing (Chromium, Firefox, WebKit)
- Mobile device testing
- Automatic test server startup
- Screenshot and video capture on failures
- Parallel test execution

### Environment Setup

Create a `.env.local` file with test environment variables:
```env
TEST_BASE_URL=http://localhost:3000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Running Tests

### Local Development

Run all tests:
```bash
npm run test:e2e
```

Run specific test file:
```bash
npx playwright test tests/e2e/auth/login.spec.ts
```

Run tests in UI mode:
```bash
npm run test:e2e:ui
```

Run tests in debug mode:
```bash
npm run test:e2e:debug
```

### Test Categories

**Authentication Tests:**
```bash
npx playwright test tests/e2e/auth/
```

**Admin Panel Tests:**
```bash
npx playwright test tests/e2e/admin/
```

**Client Portal Tests:**
```bash
npx playwright test tests/e2e/client/
```

**API Integration Tests:**
```bash
npx playwright test tests/e2e/api/
```

**Visual Tests:**
```bash
npx playwright test tests/e2e/visual/
```

## Test Data Management

### Test Users
The system uses predefined test users:
- **Admin User**: `admin@hojaverde.com`
- **Client User**: `cliente@ejemplo.com`

### Test Data Fixtures
Located in `tests/fixtures/test-data.ts`, includes:
- User credentials
- Sample products
- Sample quotations
- Sample companies
- Test data generators

### Data Cleanup
Tests are designed to be independent and don't rely on persistent data. Each test should clean up after itself or use unique identifiers.

## Test Helpers and Utilities

### AuthHelper
Handles authentication operations:
- `loginAsAdmin()` - Login as admin user
- `loginAsClient()` - Login as client user
- `logout()` - Logout current user
- `isAuthenticated()` - Check authentication state

### NavigationHelper
Handles page navigation:
- `goToAdminDashboard()` - Navigate to admin dashboard
- `goToAdminProducts()` - Navigate to products page
- `goToClientDashboard()` - Navigate to client dashboard

### FormHelper
Handles form interactions:
- `fillField()` - Fill form fields
- `selectOption()` - Select dropdown options
- `submitForm()` - Submit forms
- `waitForSuccess()` - Wait for success notifications

### TableHelper
Handles table operations:
- `getRows()` - Get table rows
- `findRowWithText()` - Find specific rows
- `clickRowAction()` - Click action buttons in rows

## Visual Testing

### Screenshot Comparison
Visual regression tests capture screenshots and compare them against baseline images. Update baselines when UI changes are intentional:

```bash
npx playwright test --update-snapshots
```

### Mobile Testing
Mobile responsiveness tests cover:
- Different viewport sizes
- Touch interactions
- Mobile navigation
- Form usability on mobile
- Text readability

## CI/CD Integration

### GitHub Actions Workflow

Create `.github/workflows/playwright.yml`:

```yaml
name: Playwright Tests
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: lts/*
    - name: Install dependencies
      run: npm ci
    - name: Install Playwright Browsers
      run: npx playwright install --with-deps
    - name: Run Playwright tests
      run: npm run test:e2e
      env:
        TEST_BASE_URL: http://localhost:3000
        SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
        SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
    - uses: actions/upload-artifact@v4
      if: always()
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 30
```

### Test Reporting

Playwright generates comprehensive test reports including:
- Test results with pass/fail status
- Screenshots of failures
- Video recordings of test runs
- Performance metrics
- Test execution timeline

View reports:
```bash
npm run test:e2e:report
```

## Best Practices

### Test Organization
- Group related tests in describe blocks
- Use descriptive test names
- Keep tests independent and atomic
- Use beforeEach/afterEach for setup/cleanup

### Data Management
- Use test data generators for dynamic data
- Avoid hard-coded test data
- Clean up test data after tests
- Use unique identifiers to avoid conflicts

### Stability
- Wait for elements to be visible before interacting
- Use explicit waits instead of fixed timeouts
- Handle flaky elements with retry logic
- Use stable selectors (data-testid attributes)

### Performance
- Run tests in parallel when possible
- Use page.route() for API mocking
- Minimize unnecessary waits
- Optimize test data setup

## Troubleshooting

### Common Issues

**Tests fail due to authentication:**
- Verify test user credentials are correct
- Check Supabase configuration
- Ensure test database has required data

**Screenshots don't match:**
- Update baselines with `--update-snapshots`
- Check for timing issues with dynamic content
- Verify consistent test environment

**Flaky tests:**
- Add explicit waits for dynamic content
- Use more stable selectors
- Check for race conditions
- Implement retry logic for unreliable operations

### Debugging

1. **Run with debug mode:**
```bash
npm run test:e2e:debug
```

2. **Add debug statements:**
```typescript
await page.pause(); // Pauses execution
console.log(await page.textContent('selector'));
```

3. **Enable verbose logging:**
```bash
DEBUG=pw:api npx playwright test
```

## Maintenance

### Regular Tasks
- Update test data when application data models change
- Refresh visual baselines when UI updates are made
- Review and update selectors if DOM structure changes
- Monitor test performance and optimize slow tests

### Version Updates
- Keep Playwright updated to latest stable version
- Update browser versions regularly
- Test compatibility with new application versions
- Update CI/CD configuration as needed

## Contributing

### Adding New Tests
1. Follow existing test structure and patterns
2. Use test helpers and utilities
3. Add appropriate test data to fixtures
4. Include both positive and negative test cases
5. Test edge cases and error conditions

### Code Standards
- Use TypeScript for type safety
- Follow existing naming conventions
- Add comments for complex test logic
- Use async/await for asynchronous operations
- Handle errors gracefully

### Review Process
- All tests should pass locally before submission
- Include test updates with feature changes
- Review test coverage for new functionality
- Update documentation for significant changes

## Contact and Support

For questions or issues with the test suite:
- Review existing test patterns and helpers
- Check Playwright documentation
- Create issues for bugs or feature requests
- Follow project contribution guidelines

---

This testing suite provides comprehensive coverage of the Hoja Verde quotation system and ensures reliable, maintainable end-to-end testing for all major application functionality.