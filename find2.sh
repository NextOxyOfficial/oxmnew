#!/bin/bash
echo "=== PM2 list ==="
pm2 list
echo "=== PM2 show oxm-frontend ==="
pm2 show oxm-frontend 2>/dev/null || pm2 describe oxm-frontend 2>/dev/null || pm2 info oxm-frontend 2>/dev/null
echo "=== PM2 ecosystem files ==="
find / -name 'ecosystem.config.*' -type f 2>/dev/null | head -10
echo "=== Find .next dirs ==="
find / -name '.next' -type d 2>/dev/null | head -10
echo "=== Find next.config ==="
find / -name 'next.config.*' -type f 2>/dev/null | head -10
echo "=== Find oxymanager dirs ==="
find / -maxdepth 4 -type d -name '*oxymanager*' 2>/dev/null
find / -maxdepth 4 -type d -name '*oxm*' 2>/dev/null
echo "=== DONE ==="
