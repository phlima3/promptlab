#!/bin/bash

# Test script for Anthropic integration
# Usage: ./scripts/test-anthropic.sh

set -e

API_URL="http://localhost:4000"

echo "🧪 Testing Anthropic Integration"
echo "================================"
echo ""

# Check if API is running
echo "1️⃣  Checking API health..."
if ! curl -s "$API_URL/health" > /dev/null; then
    echo "❌ API is not running on $API_URL"
    echo "   Start it with: yarn workspace @promptlab/api dev"
    exit 1
fi
echo "✅ API is running"
echo ""

# Get first template
echo "2️⃣  Fetching templates..."
TEMPLATE_ID=$(curl -s "$API_URL/templates" | jq -r '.[0].id')
TEMPLATE_NAME=$(curl -s "$API_URL/templates" | jq -r '.[0].name')
echo "✅ Using template: $TEMPLATE_NAME ($TEMPLATE_ID)"
echo ""

# Create generation job
echo "3️⃣  Creating generation job with Anthropic..."
RESPONSE=$(curl -s -X POST "$API_URL/generate" \
  -H "Content-Type: application/json" \
  -d "{
    \"templateId\": \"$TEMPLATE_ID\",
    \"provider\": \"anthropic\",
    \"input\": \"Explain the key benefits of TypeScript for large-scale applications\"
  }")

JOB_ID=$(echo $RESPONSE | jq -r '.jobId')
echo "✅ Job created: $JOB_ID"
echo ""

# Poll for completion
echo "4️⃣  Waiting for job completion..."
MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    ATTEMPT=$((ATTEMPT + 1))
    
    JOB=$(curl -s "$API_URL/jobs/$JOB_ID")
    STATUS=$(echo $JOB | jq -r '.status')
    
    echo "   Attempt $ATTEMPT: status=$STATUS"
    
    if [ "$STATUS" = "completed" ]; then
        echo ""
        echo "✅ Job completed successfully!"
        echo ""
        echo "📊 Results:"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        
        echo "Model: $(echo $JOB | jq -r '.model')"
        echo "Input Tokens: $(echo $JOB | jq -r '.inputTokens')"
        echo "Output Tokens: $(echo $JOB | jq -r '.outputTokens')"
        echo "Total Tokens: $(echo $JOB | jq -r '.totalTokens')"
        echo "Cost: \$$(echo $JOB | jq -r '.estimatedCostUSD')"
        echo ""
        echo "Output:"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo $JOB | jq -r '.output'
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "🎉 Test completed successfully!"
        exit 0
    elif [ "$STATUS" = "failed" ]; then
        echo ""
        echo "❌ Job failed!"
        echo "Error: $(echo $JOB | jq -r '.error')"
        exit 1
    fi
    
    sleep 2
done

echo ""
echo "⏰ Timeout waiting for job completion"
echo "Job is still in status: $STATUS"
exit 1
