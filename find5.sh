#!/bin/bash
echo "=== hostname ==="
hostname
echo "=== nginx sites ==="
ls /etc/nginx/sites-enabled/ 2>/dev/null
echo "=== grep oxymanager in nginx ==="
grep -rl 'oxymanager' /etc/nginx/ 2>/dev/null
echo "=== oxymanager nginx config ==="
cat /etc/nginx/sites-enabled/oxymanager* 2>/dev/null
grep -A5 'oxymanager' /etc/nginx/sites-enabled/* 2>/dev/null | head -40
echo "=== all server_name in nginx ==="
grep 'server_name' /etc/nginx/sites-enabled/* 2>/dev/null
echo "=== DONE ==="
