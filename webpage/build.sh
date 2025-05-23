#!/bin/bash
# Build script for RoboPrep web app

# Clean previous build
rm -rf .next

# Run build
npm run build

# Create prerender-manifest.json if it doesn't exist
# This is required for Next.js production server to start
if [ ! -f .next/prerender-manifest.json ]; then
  echo "Creating prerender-manifest.json..."
  echo '{"version":3,"routes":{},"dynamicRoutes":{},"preview":{"previewModeId":"","previewModeSigningKey":"","previewModeEncryptionKey":""}}' > .next/prerender-manifest.json
fi

echo "Build completed successfully!"
echo "Run 'npm run start' to start the production server"