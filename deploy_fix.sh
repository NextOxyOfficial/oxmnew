#!/bin/bash
# Deploy the fixed edit page to production server

# Find the target file
TARGET=$(find /var/oxymanager/frontend/src -path '*/orders/edit/*/page.tsx' -type f 2>/dev/null | head -1)

if [ -z "$TARGET" ]; then
    echo "ERROR: Could not find edit page on server"
    find /var/oxymanager/frontend/src -name 'page.tsx' -path '*orders*' 2>/dev/null
    exit 1
fi

echo "Found target: $TARGET"

# Backup
cp "$TARGET" "${TARGET}.bak"
echo "Backup created"

# Copy the fixed file
cp /tmp/edit_page.tsx "$TARGET"
echo "Fixed file deployed"

# Verify the fix is present
if grep -q "Completed orders are locked" "$TARGET"; then
    echo "FIX VERIFIED - new code present"
else
    if grep -q "currentOrder.status === .completed" "$TARGET"; then
        echo "FIX VERIFIED - completed check present"
    else
        echo "WARNING: Fix may not be applied correctly"
        grep -n "currentOrder.status" "$TARGET" | head -5
    fi
fi

# Rebuild frontend
echo "Building frontend..."
cd /var/oxymanager/frontend
npm run build 2>&1 | tail -20

echo ""
echo "Restarting PM2..."
pm2 restart oxm-frontend --update-env 2>&1
pm2 status 2>&1

echo ""
echo "DEPLOYMENT COMPLETE"
