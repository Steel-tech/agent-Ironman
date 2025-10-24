#!/bin/bash

# Simple test script to verify JSON error handling
BASE_URL="http://localhost:3000"

echo "Testing JSON Parsing and Validation Error Handling"
echo "=================================================="
echo ""

# Test 1: Invalid JSON
echo "Test 1: Invalid JSON on POST /api/sessions"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/sessions" \
  -H "Content-Type: application/json" \
  -d '{invalid json}')
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "400" ]; then
  echo "✓ Got 400 status"
  echo "  Response: $body"
else
  echo "✗ Expected 400, got $http_code"
  echo "  Response: $body"
fi
echo ""

# Test 2: Missing required field
echo "Test 2: Missing directory field on POST /api/validate-directory"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/validate-directory" \
  -H "Content-Type: application/json" \
  -d '{}')
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "400" ]; then
  echo "✓ Got 400 status"
  echo "  Response: $body"
else
  echo "✗ Expected 400, got $http_code"
  echo "  Response: $body"
fi
echo ""

# Test 3: Invalid enum value
echo "Test 3: Invalid mode enum on POST /api/sessions"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/sessions" \
  -H "Content-Type: application/json" \
  -d '{"mode": "invalid-mode"}')
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "400" ]; then
  echo "✓ Got 400 status"
  echo "  Response: $body"
else
  echo "✗ Expected 400, got $http_code"
  echo "  Response: $body"
fi
echo ""

# Test 4: Valid request (should work)
echo "Test 4: Valid request to POST /api/sessions"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/sessions" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Session", "mode": "general"}')
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
  echo "✓ Got 200 status"
  echo "  Response: $body"
else
  echo "✗ Expected 200, got $http_code"
  echo "  Response: $body"
fi
echo ""

echo "=================================================="
echo "Test complete"
