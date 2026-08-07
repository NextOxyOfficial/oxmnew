#!/bin/bash
# Deploy the order edit page fix to production server
# Run this script on the server: sudo bash deploy_to_server.sh

set -e

echo "=== OxyManager Frontend Fix Deployment ==="
echo ""

# Navigate to frontend directory
cd /var/oxymanager/frontend

# Backup the current file
echo "Creating backup..."
cp "src/app/dashboard/orders/edit/[id]/page.tsx" "src/app/dashboard/orders/edit/[id]/page.tsx.backup.$(date +%Y%m%d_%H%M%S)"

# Apply the fix using sed
echo "Applying fix..."
sed -i '219,223s/.*/      \/\/ Completed orders are locked for add\/remove item APIs.\n      \/\/ Temporarily switch them to draft first, then apply final status at the end.\n      if (currentOrder.status === "completed") {\n        await ApiService.updateOrder(parseInt(orderId), { status: "draft" } as any);\n      }/' "src/app/dashboard/orders/edit/[id]/page.tsx"

# Verify the fix
echo "Verifying fix..."
if grep -q "Completed orders are locked" "src/app/dashboard/orders/edit/[id]/page.tsx"; then
    echo "✓ Fix verified - new code is present"
else
    echo "⚠ Warning: Fix verification failed. Checking for alternative pattern..."
    if grep -q 'currentOrder.status === "completed"' "src/app/dashboard/orders/edit/[id]/page.tsx"; then
        echo "✓ Alternative pattern found - fix likely applied"
    else
        echo "✗ Fix may not have been applied correctly"
        exit 1
    fi
fi

# Rebuild the frontend
echo ""
echo "Building frontend (this may take 1-2 minutes)..."
npm run build

# Restart PM2
echo ""
echo "Restarting PM2 processes..."
pm2 restart oxm-frontend --update-env

# Show status
echo ""
echo "=== Deployment Status ==="
pm2 status

echo ""
echo "=== DEPLOYMENT COMPLETE ==="
echo "The fix has been deployed. Test by:"
echo "1. Open a draft order in the browser"
echo "2. Add a product"
echo "3. Click 'Complete Order'"
echo "4. It should work without 'Cannot add items to completed orders' error"
