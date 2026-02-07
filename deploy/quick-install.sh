#!/bin/bash

# ========================================
# 🤖 سكريبت التثبيت السريع لتطبيق ذكاء
# ========================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

APP_DIR="/var/www/thakaa"
DB_NAME="thakaa_db"
DB_USER="thakaa_user"

echo ""
echo -e "${BLUE}========================================"
echo "    🤖 تثبيت تطبيق ذكاء - AI Chat"
echo -e "========================================${NC}"
echo ""

# Check root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ يرجى تشغيل السكريبت كـ root${NC}"
    echo "استخدم: sudo bash quick-install.sh"
    exit 1
fi

# Get inputs
echo -e "${YELLOW}📝 أدخل كلمة سر قاعدة البيانات (اختر كلمة قوية):${NC}"
read -s DB_PASSWORD
echo ""

if [ -z "$DB_PASSWORD" ]; then
    echo -e "${RED}❌ كلمة السر مطلوبة${NC}"
    exit 1
fi

echo -e "${YELLOW}📝 أدخل مفتاح Groq API:${NC}"
read GROQ_API_KEY
echo ""

if [ -z "$GROQ_API_KEY" ]; then
    echo -e "${RED}❌ مفتاح Groq API مطلوب${NC}"
    exit 1
fi

# Step 1: Update system
echo -e "${GREEN}[1/8] 📦 تحديث النظام...${NC}"
apt update -qq && apt upgrade -y -qq

# Step 2: Install Node.js
echo -e "${GREEN}[2/8] 📦 تثبيت Node.js 20...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
    apt install -y nodejs -qq
fi
echo "   Node.js $(node -v)"

# Step 3: Install PostgreSQL
echo -e "${GREEN}[3/8] 📦 تثبيت PostgreSQL...${NC}"
apt install -y postgresql postgresql-contrib -qq
systemctl start postgresql
systemctl enable postgresql

# Step 4: Setup database
echo -e "${GREEN}[4/8] 🗄️ إعداد قاعدة البيانات...${NC}"
sudo -u postgres psql -c "DROP DATABASE IF EXISTS ${DB_NAME};" 2>/dev/null || true
sudo -u postgres psql -c "DROP USER IF EXISTS ${DB_USER};" 2>/dev/null || true
sudo -u postgres psql <<EOF
CREATE DATABASE ${DB_NAME};
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
ALTER DATABASE ${DB_NAME} OWNER TO ${DB_USER};
EOF
sudo -u postgres psql -d ${DB_NAME} -c "GRANT ALL ON SCHEMA public TO ${DB_USER};"

# Step 5: Setup app directory
echo -e "${GREEN}[5/8] 📁 إعداد ملفات التطبيق...${NC}"
mkdir -p ${APP_DIR}

# Extract app files if tar exists in current directory
if [ -f "thakaa-app.tar.gz" ]; then
    tar -xzf thakaa-app.tar.gz -C ${APP_DIR}
else
    echo -e "${RED}❌ ملف thakaa-app.tar.gz غير موجود${NC}"
    echo "تأكد من وجود الملف في نفس المجلد"
    exit 1
fi

# Create .env file
cat > ${APP_DIR}/.env <<EOF
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}
GROQ_API_KEY=${GROQ_API_KEY}
NODE_ENV=production
PORT=5000
SESSION_SECRET=$(openssl rand -hex 32)
EOF

# Step 6: Install dependencies and build
echo -e "${GREEN}[6/8] 📦 تثبيت المتطلبات وبناء التطبيق...${NC}"
cd ${APP_DIR}
npm install --silent
npm run db:push
npm run build

# Step 7: Setup PM2
echo -e "${GREEN}[7/8] ⚡ إعداد PM2...${NC}"
npm install -g pm2 --silent
pm2 delete thakaa 2>/dev/null || true
pm2 start npm --name "thakaa" -- start
pm2 save
pm2 startup -u root --hp /root 2>/dev/null || true

# Step 8: Setup Nginx
echo -e "${GREEN}[8/8] 🌐 إعداد Nginx...${NC}"
apt install -y nginx -qq

cat > /etc/nginx/sites-available/thakaa <<'EOF'
server {
    listen 80;
    server_name _;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
EOF

ln -sf /etc/nginx/sites-available/thakaa /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
systemctl enable nginx

# Get server IP
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "عنوان_السيرفر")

echo ""
echo -e "${GREEN}========================================"
echo "    ✅ تم التثبيت بنجاح!"
echo -e "========================================${NC}"
echo ""
echo -e "🌐 التطبيق يعمل على: ${BLUE}http://${SERVER_IP}${NC}"
echo ""
echo -e "${YELLOW}أوامر مفيدة:${NC}"
echo "  pm2 logs thakaa     - عرض السجلات"
echo "  pm2 restart thakaa  - إعادة التشغيل"
echo "  pm2 status          - عرض الحالة"
echo ""
echo -e "${YELLOW}لإضافة نطاق + SSL:${NC}"
echo "  1. وجه النطاق إلى IP السيرفر"
echo "  2. sudo apt install certbot python3-certbot-nginx"
echo "  3. sudo certbot --nginx -d yourdomain.com"
echo ""
