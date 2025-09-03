# 🚀 QUICK START DEPLOYMENT GUIDE

## ✅ You're Almost Ready! Just 3 Steps:

### 1️⃣ Get Your IONOS Password
1. Login to: https://my.ionos.com
2. Go to: **Menu → Hosting → SFTP & SSH Access**
3. Click **"Show Password"** (or reset it if needed)
4. Copy the password

### 2️⃣ Update Your Password
Edit `deploy-config.json` and replace:
```json
"password": "YOUR_IONOS_PASSWORD"
```
with your actual password.

### 3️⃣ Initialize Railway & Deploy
```powershell
# First time only - setup Railway:
cd backend
railway login
railway init
cd ..

# Test SFTP connection (optional):
.\test-sftp-connection.ps1

# Deploy everything:
.\deploy.ps1
# OR just double-click DEPLOY.bat
```

---

## 📋 Your Connection Details:
- **SFTP Host**: access-5018507174.webspace-host.com
- **Port**: 22
- **Username**: a301789
- **Password**: *(get from IONOS panel)*

## 🔧 What the Script Does:
1. Deploys backend to Railway
2. Sets all environment variables
3. Builds frontend with Railway URL
4. Uploads to IONOS via SFTP
5. Opens your live site

## ⏱️ Deployment Time:
- First time: ~5 minutes (Railway setup)
- After that: ~2 minutes

## 🆘 Troubleshooting:
- **Can't connect to SFTP?** → Check password in deploy-config.json
- **Railway not found?** → Run: `npm install -g @railway/cli`
- **WinSCP not found?** → Run: `choco install winscp -y`
- **Build fails?** → Run: `npm install` first

## 📦 Files Created:
- `deploy.ps1` - Main deployment script
- `DEPLOY.bat` - Quick launcher
- `deploy-config.json` - Your credentials
- `test-sftp-connection.ps1` - Test SFTP access
- `deploy.log` - Deployment logs

---

Ready? Just get your password and run `DEPLOY.bat`! 🎉