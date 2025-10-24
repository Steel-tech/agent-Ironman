# 🔐 Security Setup & API Key Rotation

## ⚠️ URGENT: Your API Keys Were Exposed

Your `.env` file contained exposed API keys. Follow these steps immediately:

---

## 1. Rotate Anthropic API Key

### Step 1: Revoke the Old Key
1. Go to: https://console.anthropic.com/settings/keys
2. Find the key starting with `sk-ant-api03-hz--yRvpsX5Ybr3ACkyvDdaBT...`
3. Click **Delete** or **Revoke** to invalidate it immediately

### Step 2: Create a New Key
1. On the same page, click **Create Key**
2. Give it a name: `agent-ironman-app-production`
3. Copy the new key (it will only be shown once)
4. Save it to your password manager

### Step 3: Update Your .env File
```bash
ANTHROPIC_API_KEY=sk-ant-api03-YOUR-NEW-KEY-HERE
```

---

## 2. Rotate Z.AI API Key

### Step 1: Revoke the Old Key
1. Go to: https://z.ai (or your Z.AI dashboard)
2. Find the key: `a56064c5c08142ee8fc3c65518b4fac0.gyDy3kTCsueVmRMX`
3. Revoke/delete it

### Step 2: Create a New Key
1. Generate a new API key
2. Copy it immediately
3. Save it to your password manager

### Step 3: Update Your .env File
```bash
ZAI_API_KEY=YOUR-NEW-ZAI-KEY-HERE
```

---

## 3. Complete Your .env Configuration

Add these missing configuration values to your `.env` file:

```bash
# Redis Configuration (Required for Python worker)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# LLM Configuration (Optional but recommended)
DEFAULT_MODEL=claude-3-5-sonnet-20241022
MAX_TOKENS=8000
TEMPERATURE=0.7
MAX_DOCUMENT_SIZE_MB=50

# Vector Store Configuration (Optional)
CHROMA_PERSIST_DIR=./data/chroma

# Server Configuration (Optional)
PORT=3003
```

---

## 4. Verify Protection

Run these commands to ensure your keys are protected:

```bash
# Check .gitignore exists and protects .env
cat .gitignore | grep "^\.env$"

# If you initialize git, verify .env is ignored
git init
git status | grep .env  # Should NOT appear in untracked files
```

---

## 5. Best Practices Going Forward

✅ **DO:**
- Always use `.env.example` for sharing configuration templates
- Store API keys in a password manager
- Rotate keys every 90 days
- Use different keys for development and production
- Check `.gitignore` before committing

❌ **DON'T:**
- Never commit `.env` files to version control
- Don't share API keys in chat, email, or screenshots
- Don't hardcode keys in source code
- Don't reuse keys across multiple projects

---

## 6. Emergency Response Checklist

If you suspect a key was exposed:

- [ ] Revoke the key immediately (within 5 minutes)
- [ ] Check API usage for unauthorized activity
- [ ] Generate a new key
- [ ] Update all services using that key
- [ ] Enable API usage alerts if available
- [ ] Review access logs for suspicious activity

---

## Need Help?

- Anthropic Support: https://support.anthropic.com
- Z.AI Support: Check your Z.AI dashboard

**Estimated Time to Complete:** 10-15 minutes

**Priority Level:** 🔴 CRITICAL - Do this before running the app
