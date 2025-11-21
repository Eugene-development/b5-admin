#!/bin/bash

# Get token from b5-admin localStorage (if you're logged in)
# Or use hardcoded test token

# Test 1: Query without auth (should fail)
echo "=== Test 1: Query users WITHOUT auth token ==="
curl -s -X POST http://localhost:8000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query{users{id name email}}"}' | jq .

echo ""
echo "=== Test 2: Query clients WITHOUT auth token (should work - public query) ==="
curl -s -X POST http://localhost:8000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query{clients{id name}}"}' | jq .

echo ""
echo "=== Instructions for Test 3: ==="
echo "1. Open http://localhost:5174/ in browser"
echo "2. Login to the app"
echo "3. Open DevTools Console"
echo "4. Run: localStorage.getItem('b5_auth_token')"
echo "5. Copy the token"
echo "6. Run: export TOKEN='<paste_token_here>'"
echo "7. Run this script again with: bash test-graphql.sh with-token"

if [ "$1" = "with-token" ] && [ -n "$TOKEN" ]; then
    echo ""
    echo "=== Test 3: Query users WITH auth token ==="
    curl -s -X POST http://localhost:8000/graphql \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d '{"query":"query{users{id name email}}"}' | jq .
fi
