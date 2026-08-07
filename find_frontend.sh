#!/bin/bash
echo "=== ls /var/oxymanager/frontend ==="
ls -la /var/oxymanager/frontend/ 2>/dev/null || echo "NOT FOUND"
echo "=== PM2 describe oxm-frontend ==="
pm2 describe oxm-frontend 2>/dev/null | grep -E 'script|cwd|exec|path'
echo "=== find page.tsx anywhere ==="
find / -name 'page.tsx' -path '*orders*edit*' -type f 2>/dev/null | head -10
echo "=== systemd frontend service ==="
cat /etc/systemd/system/oxymanager-frontend.service 2>/dev/null
echo "=== DONE ==="
