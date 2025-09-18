#!/bin/bash

# API Test Script
# This script tests the API endpoints to identify issues

echo "🚀 API Test Script Starting..."
echo "Testing server at: http://localhost:8080"
echo ""

# Test 1: Basic connectivity
echo "1️⃣ Testing basic server connectivity..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health
if [ $? -eq 0 ]; then
    echo " ✅ Server is responding"
else
    echo " ❌ Server connection failed"
    echo " 💡 Solution: Make sure the server is running on port 8080"
    exit 1
fi

echo ""

# Test 2: Test API endpoints
echo "2️⃣ Testing API endpoints..."

endpoints=(
    "/api/post"
    "/api/user/profile"
    "/api/comment"
    "/api/posts/public"
)

for endpoint in "${endpoints[@]}"; do
    echo "   Testing $endpoint..."
    response=$(curl -s -w "%{http_code}" http://localhost:8080$endpoint)
    status_code="${response: -3}"
    body="${response%???}"
    
    echo "     Status: $status_code"
    if [ "$status_code" -ge 400 ]; then
        echo "     Body: \"$body\""
    fi
done

echo ""

# Test 3: Test with authentication headers
echo "3️⃣ Testing with authentication headers..."
curl -s -H "X-Requested-With: XMLHttpRequest" -H "Content-Type: application/json" \
     -w "Status: %{http_code}\n" http://localhost:8080/api/post

echo ""

# Test 4: Test CSRF token
echo "4️⃣ Testing CSRF token..."
csrf_response=$(curl -s -I http://localhost:8080/api/post)
csrf_token=$(echo "$csrf_response" | grep -i "x-csrf-token" | cut -d' ' -f2)
if [ -n "$csrf_token" ]; then
    echo "   ✅ CSRF token found: $csrf_token"
else
    echo "   ⚠️ No CSRF token found"
fi

echo ""
echo "🏁 API Test Script completed!"
echo ""
echo "📋 Common Issues and Solutions:"
echo "- 401 Unauthorized: Check authentication"
echo "- 404 Not Found: Check API routes"
echo "- 500 Internal Server Error: Check server logs"
echo "- Empty response body: Check server-side error handling"
