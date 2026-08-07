#!/bin/bash
echo "=== systemd oxymanager services ==="
cat /etc/systemd/system/oxymanager-frontend.service 2>/dev/null
echo "---"
cat /etc/systemd/system/oxymanager-backend.service 2>/dev/null
echo "=== oxmadmin PM2 home ==="
ls -la /home/oxmadmin/.pm2/dump.pm2 2>/dev/null
cat /home/oxmadmin/.pm2/dump.pm2 2>/dev/null | python3 -m json.tool 2>/dev/null | head -40
echo "=== find page.tsx under home ==="
find /home -name 'page.tsx' -path '*orders*' -type f 2>/dev/null | head -10
echo "=== find oxymanager under home ==="
find /home -maxdepth 5 -type d -name '*oxymanager*' 2>/dev/null
find /home -maxdepth 5 -name 'next.config.*' 2>/dev/null
echo "=== DONE ==="
