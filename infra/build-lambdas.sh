#!/bin/bash

# Poll System - Lambda Build Script
# Builds all Lambda functions to JavaScript

set -e

echo "🔨 Building Lambda Functions..."

# Build polls lambdas
echo "📊 Building polls lambdas..."
cd lambda/polls
tsc || npx tsc --esModuleInterop --module commonjs --target ES2020 --outDir . *.ts
cd ../..

# Build access-keys lambdas
echo "🔑 Building access-keys lambdas..."
cd lambda/access-keys
tsc || npx tsc --esModuleInterop --module commonjs --target ES2020 --outDir . *.ts
cd ../..

# Build voting lambdas
echo "🗳️  Building voting lambdas..."
cd lambda/voting
tsc || npx tsc --esModuleInterop --module commonjs --target ES2020 --outDir . *.ts
cd ../..

# Build suggestions lambdas
echo "💡 Building suggestions lambdas..."
cd lambda/suggestions
tsc || npx tsc --esModuleInterop --module commonjs --target ES2020 --outDir . *.ts
cd ../..

# Build recurrence lambda
echo "🔄 Building recurrence lambda..."
cd lambda/recurrence
tsc || npx tsc --esModuleInterop --module commonjs --target ES2020 --outDir . *.ts
cd ../..

echo "✅ All Lambda functions built successfully!"

