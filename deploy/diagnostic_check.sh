#!/bin/bash

echo "=========================================="
echo "LearningApp Deployment Diagnostic Script"
echo "=========================================="
echo ""

# Check if running as root or with sudo access
if [[ $EUID -eq 0 ]]; then
    echo "✓ Running as root"
else
    echo "✗ Not running as root. Some checks may fail."
    echo "  Run with: sudo bash diagnostic_check.sh"
    echo ""
fi

echo "1. SYSTEM STATUS"
echo "----------------"
echo "Date: $(date)"
echo "Uptime: $(uptime -p)"
echo "Free Memory: $(free -h | grep Mem | awk '{print $4}')"
echo "Disk Usage: $(df -h / | tail -1 | awk '{print $5}')"
echo ""

echo "2. SERVICE STATUS"
echo "----------------"
services=("nginx" "uwsgi" "pm2")
for service in "${services[@]}"; do
    if systemctl is-active --quiet $service; then
        echo "✓ $service is running"
    else
        echo "✗ $service is NOT running"
        echo "  Status: $(systemctl is-active $service)"
    fi
done
echo ""

echo "3. PM2 PROCESSES"
echo "---------------"
sudo -u deploy pm2 list 2>/dev/null || echo "PM2 not accessible for deploy user"
echo ""

echo "4. PORT CHECKS"
echo "-------------"
ports=(80 443 3000 3001 9190)
for port in "${ports[@]}"; do
    if netstat -tuln | grep -q ":$port "; then
        echo "✓ Port $port is open"
        netstat -tuln | grep ":$port "
    else
        echo "✗ Port $port is NOT open"
    fi
done
echo ""

echo "5. NGINX CONFIGURATION"
echo "---------------------"
if nginx -t 2>/dev/null; then
    echo "✓ Nginx configuration is valid"
else
    echo "✗ Nginx configuration has errors:"
    nginx -t
fi
echo ""

echo "6. PROJECT FILES"
echo "---------------"
project_dir="/mnt/persist/www/learningapp"
if [[ -d "$project_dir" ]]; then
    echo "✓ Project directory exists: $project_dir"
    echo "  Current symlink: $(ls -la $project_dir/current 2>/dev/null || echo 'NOT FOUND')"
    echo "  Releases: $(ls $project_dir/releases 2>/dev/null | wc -l) releases found"
    echo "  Shared directory: $(ls -la $project_dir/shared 2>/dev/null | head -5)"
else
    echo "✗ Project directory NOT FOUND: $project_dir"
fi
echo ""

echo "7. ENVIRONMENT FILES"
echo "-------------------"
env_files=("$project_dir/shared/.env" "$project_dir/shared/.env.next")
for env_file in "${env_files[@]}"; do
    if [[ -f "$env_file" ]]; then
        echo "✓ Environment file exists: $env_file"
        echo "  Size: $(du -h $env_file | cut -f1)"
        echo "  Key variables:"
        grep -E "^(DATABASE_|SECRET_KEY|ALLOWED_HOSTS|NEXT_PUBLIC_)" "$env_file" 2>/dev/null | head -5
    else
        echo "✗ Environment file NOT FOUND: $env_file"
    fi
done
echo ""

echo "8. LOG CHECKS"
echo "------------"
echo "Recent Nginx errors:"
tail -5 /var/log/nginx/error.log 2>/dev/null || echo "No nginx error log found"
echo ""
echo "Recent PM2 logs:"
sudo -u deploy pm2 logs --lines 5 2>/dev/null || echo "No PM2 logs accessible"
echo ""

echo "9. URL TESTS"
echo "-----------"
echo "Testing local URLs:"
urls=("http://localhost/wt/cms/" "http://localhost:3001/" "http://localhost/" "http://learningapp.online/")
for url in "${urls[@]}"; do
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "FAILED")
    if [[ "$status" == "200" ]]; then
        echo "✓ $url → $status"
    else
        echo "✗ $url → $status"
    fi
done
echo ""

echo "10. UWSGI STATUS"
echo "---------------"
uwsgi_socket="/run/uwsgi/app/learningapp/socket"
if [[ -S "$uwsgi_socket" ]]; then
    echo "✓ uWSGI socket exists: $uwsgi_socket"
    echo "  Permissions: $(ls -la $uwsgi_socket)"
else
    echo "✗ uWSGI socket NOT FOUND: $uwsgi_socket"
fi
echo ""

echo "=========================================="
echo "Diagnostic Complete"
echo "=========================================="
