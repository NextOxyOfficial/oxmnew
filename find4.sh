#!/bin/bash
echo "=== ALL .next dirs ==="
find / -name '.next' -type d 2>/dev/null
echo "=== ALL next.config files ==="
find / -name 'next.config.*' -type f 2>/dev/null
echo "=== ALL PM2 dump files ==="
find / -name 'dump.pm2' -type f 2>/dev/null
echo "=== oxmadmin PM2 dump content ==="
su - oxmadmin -c 'pm2 jlist 2>/dev/null' | python3 -c "import sys,json; data=json.load(sys.stdin); [print(f\"{p['name']}: cwd={p.get('pm2_env',{}).get('pm_cwd','?')} script={p.get('pm2_env',{}).get('pm_exec_path','?')}\") for p in data]" 2>/dev/null
echo "=== systemctl cat oxymanager-frontend ==="
systemctl cat oxymanager-frontend.service 2>/dev/null
echo "=== systemctl cat oxymanager-backend ==="
systemctl cat oxymanager-backend.service 2>/dev/null
echo "=== DONE ==="
