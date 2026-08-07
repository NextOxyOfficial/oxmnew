@echo off
ssh -o StrictHostKeyChecking=no root@194.233.64.61 "find /var/oxymanager -name 'page.tsx' -path '*edit*' -type f 2>/dev/null; echo '---'; ls -la /var/oxymanager/frontend/src/ 2>/dev/null; echo '---'; ls -la /var/oxymanager/frontend/ 2>/dev/null | head -20"
