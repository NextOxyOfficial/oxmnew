#!/bin/bash
find /var/oxymanager -name 'page.tsx' -path '*edit*' -type f 2>/dev/null
echo "=== DIR LISTING ==="
ls -la /var/oxymanager/frontend/src/app/dashboard/orders/ 2>/dev/null || echo "src dir not found"
echo "=== CHECK .next ==="
ls -la /var/oxymanager/frontend/.next/ 2>/dev/null | head -10 || echo ".next not found"
echo "=== CHECK package.json ==="
head -5 /var/oxymanager/frontend/package.json 2>/dev/null || echo "package.json not found"
