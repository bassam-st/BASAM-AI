#!/bin/bash

# ========================================
# سكريبت تثبيت تطبيق ذكاء - AI Chat
# ========================================

set -e

echo "========================================"
echo "    🤖 تثبيت تطبيق ذكاء - AI Chat"
echo "========================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Variables
APP_DIR="/var/www/thakaa"
DB_NAME="thakaa_db"
DB_USER="thakaa_user"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}يرجى تشغيل السكريبت كـ root (استخدم sudo)${NC}"
    exit 1
fi

# Get user inputs
echo ""
echo -e "${YELLOW}أدخل كلمة سر قاعدة البيانات:${NC}"
read -s DB_PASSWORD
echo ""

echo -e "${YELLOW}أدخل مفتاح Groq API الخاص بك:${NC}"
read GROQ_API_KEY
echo ""

echo -e "${GREEN}جاري تحديث النظام...${NC}"
apt update && apt upgrade -y

echo -e "${GREEN}جاري تثبيت Node.js 20...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo -e "${GREEN}جاري تثبيت PostgreSQL...${NC}"
apt install -y postgresql postgresql-contrib

echo -e "${GREEN}جاري تثبيت الأدوات الإضافية...${NC}"
apt install -y git nginx certbot python3-certbot-nginx

echo -e "${GREEN}جاري إعداد قاعدة البيانات...${NC}"
sudo -u postgres psql <<EOF
CREATE DATABASE ${DB_NAME};
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
ALTER DATABASE ${DB_NAME} OWNER TO ${DB_USER};
\c ${DB_NAME}
GRANT ALL ON SCHEMA public TO ${DB_USER};
EOF

echo -e "${GREEN}جاري إنشاء مجلد التطبيق...${NC}"
mkdir -p ${APP_DIR}
cd ${APP_DIR}

echo -e "${GREEN}جاري نسخ ملفات التطبيق...${NC}"
# سيتم نسخ الملفات هنا

echo -e "${GREEN}جاري إنشاء ملف البيئة...${NC}"
cat > ${APP_DIR}/.env <<EOF
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}
GROQ_API_KEY=${GROQ_API_KEY}
NODE_ENV=production
PORT=5000
EOF

echo -e "${GREEN}جاري تثبيت المتطلبات...${NC}"
cd ${APP_DIR}
npm install

echo -e "${GREEN}جاري إعداد قاعدة البيانات...${NC}"
npm run db:push

echo -e "${GREEN}جاري بناء التطبيق...${NC}"
npm run build

echo -e "${GREEN}جاري تثبيت PM2...${NC}"
npm install -g pm2

echo -e "${GREEN}جاري تشغيل التطبيق...${NC}"
pm2 start npm --name "thakaa" -- start
pm2 save
pm2 startup

echo -e "${GREEN}جاري إعداد Nginx...${NC}"
cat > /etc/nginx/sites-available/thakaa <<EOF
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/thakaa /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

echo ""
echo "========================================"
echo -e "${GREEN}    ✅ تم التثبيت بنجاح!${NC}"
echo "========================================"
echo ""
echo -e "التطبيق يعمل الآن على: ${GREEN}http://$(curl -s ifconfig.me)${NC}"
echo ""
echo "أوامر مفيدة:"
echo "  pm2 logs thakaa    - عرض السجلات"
echo "  pm2 restart thakaa - إعادة تشغيل التطبيق"
echo "  pm2 stop thakaa    - إيقاف التطبيق"
echo ""
