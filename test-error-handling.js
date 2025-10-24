/**
 * Test script to verify JSON parsing and error handling
 * Tests all fixed endpoints with invalid JSON and missing fields
 */

const BASE_URL = 'http://localhost:3000';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

async function testEndpoint(name, endpoint, method, body, expectedStatus, expectedErrorPattern) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };

    if (body !== undefined) {
      options.body = body;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();

    if (response.status === expectedStatus) {
      if (expectedErrorPattern && data.error && data.error.includes(expectedErrorPattern)) {
        console.log(`${colors.green}✓${colors.reset} ${name}: Got expected ${expectedStatus} with error message`);
        return true;
      } else if (!expectedErrorPattern) {
        console.log(`${colors.green}✓${colors.reset} ${name}: Got expected ${expectedStatus}`);
        return true;
      } else {
        console.log(`${colors.yellow}⚠${colors.reset} ${name}: Got ${expectedStatus} but error message doesn't match`);
        console.log(`  Expected pattern: "${expectedErrorPattern}"`);
        console.log(`  Got: "${data.error}"`);
        return false;
      }
    } else {
      console.log(`${colors.red}✗${colors.reset} ${name}: Expected ${expectedStatus}, got ${response.status}`);
      console.log(`  Response:`, data);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} ${name}: Request failed - ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('\n🧪 Testing Error Handling for Route Endpoints\n');
  console.log('Make sure the server is running on port 3000...\n');

  const tests = [
    // Test invalid JSON
    {
      name: 'POST /api/sessions - Invalid JSON',
      endpoint: '/api/sessions',
      method: 'POST',
      body: '{invalid json}',
      expectedStatus: 400,
      expectedErrorPattern: 'Invalid JSON'
    },

    // Test missing required fields
    {
      name: 'POST /api/sessions - Valid but empty body',
      endpoint: '/api/sessions',
      method: 'POST',
      body: JSON.stringify({}),
      expectedStatus: 200, // Optional fields, should work
      expectedErrorPattern: null
    },

    // Test invalid mode enum
    {
      name: 'POST /api/sessions - Invalid mode',
      endpoint: '/api/sessions',
      method: 'POST',
      body: JSON.stringify({ mode: 'invalid-mode' }),
      expectedStatus: 400,
      expectedErrorPattern: 'Validation failed'
    },

    // Test directory validation
    {
      name: 'POST /api/validate-directory - Invalid JSON',
      endpoint: '/api/validate-directory',
      method: 'POST',
      body: '{not valid json',
      expectedStatus: 400,
      expectedErrorPattern: 'Invalid JSON'
    },

    {
      name: 'POST /api/validate-directory - Missing directory field',
      endpoint: '/api/validate-directory',
      method: 'POST',
      body: JSON.stringify({}),
      expectedStatus: 400,
      expectedErrorPattern: 'Validation failed'
    },

    {
      name: 'POST /api/validate-directory - Empty directory',
      endpoint: '/api/validate-directory',
      method: 'POST',
      body: JSON.stringify({ directory: '' }),
      expectedStatus: 400,
      expectedErrorPattern: 'Directory path is required'
    },

    // Test with null values
    {
      name: 'POST /api/sessions - Null values',
      endpoint: '/api/sessions',
      method: 'POST',
      body: JSON.stringify({ title: null }),
      expectedStatus: 400,
      expectedErrorPattern: 'Validation failed'
    },

    // Test with wrong types
    {
      name: 'POST /api/validate-directory - Number instead of string',
      endpoint: '/api/validate-directory',
      method: 'POST',
      body: JSON.stringify({ directory: 123 }),
      expectedStatus: 400,
      expectedErrorPattern: 'Validation failed'
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await testEndpoint(
      test.name,
      test.endpoint,
      test.method,
      test.body,
      test.expectedStatus,
      test.expectedErrorPattern
    );

    if (result) {
      passed++;
    } else {
      failed++;
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Results: ${colors.green}${passed} passed${colors.reset}, ${failed > 0 ? colors.red : colors.green}${failed} failed${colors.reset}`);
  console.log(`${'='.repeat(60)}\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

// Check if server is running
fetch(`${BASE_URL}/api/sessions`)
  .then(() => runTests())
  .catch(() => {
    console.log(`${colors.red}✗${colors.reset} Server is not running on ${BASE_URL}`);
    console.log('Please start the server first: npm run dev\n');
    process.exit(1);
  });
