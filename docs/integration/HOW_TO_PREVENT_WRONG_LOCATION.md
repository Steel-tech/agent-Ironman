# 🛡️ How to Prevent Working in Wrong Location

## The Problem
Claude kept working in `/Users/vics/Documents/agent-ironman/` (chat storage) instead of `/Users/vics/Applications/agent-ironman-app/` (actual codebase).

---

## ✅ Solutions Implemented

### 1. **Marker File** `.agent-ironman-root`
**Location**: `/Users/vics/Applications/agent-ironman-app/.agent-ironman-root`

This file marks the correct codebase root. Claude can check for this file to verify location.

### 2. **Verification Script** `verify-location.sh`
**Usage**:
```bash
npm run verify
# or
./verify-location.sh
```

**What it checks**:
- ✅ You're in `/Users/vics/Applications/agent-ironman-app/`
- ✅ `package.json` exists
- ✅ `server/` directory exists
- ✅ `client/` directory exists

### 3. **Quick Reference** `WHERE_AM_I.txt`
Open this file anytime to see the correct path in big, clear text.

### 4. **Full Documentation** `LOCATION_PROTOCOL.md`
Complete protocol for preventing this issue.

---

## 🔄 How to Use in Future Sessions

### **Option 1: Quick Verification (Recommended)**
At the start of every session:
```bash
npm run verify
```

You'll see:
```
✅ CORRECT LOCATION!
✅ package.json exists
✅ server/ exists
✅ client/ exists
🎉 All good! You're in the right place.
```

### **Option 2: Tell Claude**
At the start of your session, say:

> "Before we begin, verify you're in /Users/vics/Applications/agent-ironman-app/ by checking for the .agent-ironman-root file"

### **Option 3: Automatic Check**
Add to your shell profile (`~/.zshrc` or `~/.bashrc`):
```bash
# Auto-verify location when entering directory
cd /Users/vics/Applications/agent-ironman-app
./verify-location.sh
```

---

## 🎯 For Claude/AI Assistants

### **MANDATORY FIRST STEP**
Before ANY file operations, run:

```bash
# Check for codebase marker
ls -la /Users/vics/Applications/agent-ironman-app/.agent-ironman-root
```

If file exists: ✅ Correct location
If file doesn't exist: ❌ Wrong location, STOP

### **Always Navigate First**
```bash
cd /Users/vics/Applications/agent-ironman-app
```

### **Verify Before Working**
```bash
pwd  # Should output: /Users/vics/Applications/agent-ironman-app
ls package.json server client  # All should exist
```

---

## 📍 The Two Locations

### ✅ **CORRECT**: `/Users/vics/Applications/agent-ironman-app/`
- Actual codebase
- VS Code workspace
- Development happens here
- Run server from here

**Identifiers**:
- Has `.agent-ironman-root` file
- Has `package.json`
- Has `server/` and `client/` directories
- Has `verify-location.sh` script

### ❌ **WRONG**: `/Users/vics/Documents/agent-ironman/`
- Chat session storage
- Working directories for conversations
- Has `chat-*/` subdirectories
- NOT for development

**Identifiers**:
- NO `.agent-ironman-root` file
- Has many `chat-*/` directories
- Used for temporary chat files

---

## 🚨 If Wrong Location Detected

### **Immediate Actions**:

1. **STOP all file operations**
2. **Navigate to correct location**:
   ```bash
   cd /Users/vics/Applications/agent-ironman-app
   ```
3. **Verify**:
   ```bash
   ./verify-location.sh
   ```
4. **Copy any important work** from wrong location if needed
5. **Delete duplicates** in wrong location

---

## 🔧 Quick Commands Reference

```bash
# Navigate to correct location
cd /Users/vics/Applications/agent-ironman-app

# Verify you're in right place
npm run verify

# Or manually
./verify-location.sh

# Check current directory
pwd

# See quick reference
cat WHERE_AM_I.txt
```

---

## 📋 Session Start Checklist

Every time you start working:

- [ ] Open VS Code workspace
- [ ] Terminal: `cd /Users/vics/Applications/agent-ironman-app`
- [ ] Run: `npm run verify`
- [ ] See: ✅ "CORRECT LOCATION!"
- [ ] Tell Claude the correct path
- [ ] Begin work

---

## 🎓 Why This Works

1. **Marker File**: Physical file that marks correct location
2. **Script**: Automated verification, no human error
3. **Visual Aids**: `WHERE_AM_I.txt` for quick reference
4. **Documentation**: Complete protocol for all scenarios
5. **npm Script**: Easy access via `npm run verify`
6. **Multiple Checks**: Path, structure, marker file

---

## 💡 Tips

### For You (Vic):
- Run `npm run verify` at the start of each session
- Add alias to your shell: `alias ironman='cd /Users/vics/Applications/agent-ironman-app && npm run verify'`
- Keep VS Code always open to the right workspace

### For Claude:
- ALWAYS check for `.agent-ironman-root` before file operations
- ALWAYS `cd` to the correct path first
- ALWAYS verify with `pwd` and structure check
- If in doubt, ask user to run `npm run verify`

---

## 📊 Summary

| Prevention Method | Status | How to Use |
|------------------|--------|------------|
| Marker File | ✅ | Automatic check |
| Verification Script | ✅ | `npm run verify` |
| Documentation | ✅ | Read when needed |
| Quick Reference | ✅ | `cat WHERE_AM_I.txt` |
| npm Script | ✅ | `npm run verify` |
| Protocol | ✅ | Follow always |

---

## 🎉 Result

**This will never happen again if:**
1. ✅ You run `npm run verify` at session start
2. ✅ Claude checks for `.agent-ironman-root` before operations
3. ✅ Both verify the path before working

---

**Created**: November 7, 2025
**Status**: Active Prevention System
**Location**: `/Users/vics/Applications/agent-ironman-app/`
