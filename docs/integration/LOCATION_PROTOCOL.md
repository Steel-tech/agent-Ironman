# 🎯 Agent Ironman Location Protocol

## Problem
Claude kept working in `/Users/vics/Documents/agent-ironman/` (chat storage) instead of `/Users/vics/Applications/agent-ironman-app/` (actual codebase).

## Solution - Multiple Safety Checks

### 1. Root Marker File ✅
Created `.agent-ironman-root` in the correct directory.

**Purpose**: Marks the true root of the codebase.

### 2. Verification Script ✅
Created `verify-location.sh`

**Usage**:
```bash
cd /Users/vics/Applications/agent-ironman-app
./verify-location.sh
```

This checks:
- ✅ Current directory is correct
- ✅ `package.json` exists
- ✅ `server/` directory exists
- ✅ `client/` directory exists

### 3. At Start of Every Session

**For Claude/AI Assistant:**

ALWAYS run this FIRST before any file operations:

```bash
# Check for root marker
if [ -f "/Users/vics/Applications/agent-ironman-app/.agent-ironman-root" ]; then
    echo "✅ Found codebase root marker"
    cd /Users/vics/Applications/agent-ironman-app
else
    echo "❌ WARNING: Codebase marker not found!"
fi
```

### 4. Visual Reminder in VS Code

Add to `.vscode/settings.json`:
```json
{
  "window.title": "🎯 Agent Ironman App - /Applications/agent-ironman-app"
}
```

This shows the correct path in your VS Code title bar!

---

## The Two Locations Explained

### ✅ CORRECT: `/Users/vics/Applications/agent-ironman-app/`
**This is:**
- Your actual codebase
- Where VS Code opens
- Where you run `bun run server/server.ts`
- Where localhost:3003 runs from
- Where ALL development happens

**Contains:**
- `package.json`
- `server/` directory
- `client/` directory
- `bun.lock`
- All source code

### ❌ WRONG: `/Users/vics/Documents/agent-ironman/`
**This is:**
- Chat session storage
- Where Claude conversation working directories are
- Each chat has its own `chat-*/` subdirectory
- NOT the codebase!

**Contains:**
- `chat-*/` directories (working directories for each conversation)
- Temporary files
- NO actual source code development

---

## Quick Check Commands

### Always Correct Location:
```bash
cd /Users/vics/Applications/agent-ironman-app
```

### Verify You're in the Right Place:
```bash
./verify-location.sh
```

### Or manually check:
```bash
pwd
ls -la | grep -E "package.json|server|client"
```

Should output:
```
/Users/vics/Applications/agent-ironman-app
drwxr-xr-x  client
-rw-r--r--  package.json
drwxr-xr-x  server
```

---

## Protocol for Claude/AI Assistants

### **MANDATORY CHECK BEFORE ANY FILE OPERATION:**

```bash
# Step 1: Check for root marker
if [ ! -f "/Users/vics/Applications/agent-ironman-app/.agent-ironman-root" ]; then
    echo "⚠️  WARNING: Not in codebase root!"
    exit 1
fi

# Step 2: Navigate to correct location
cd /Users/vics/Applications/agent-ironman-app

# Step 3: Verify structure
if [ ! -f "package.json" ]; then
    echo "⚠️  WARNING: package.json not found!"
    exit 1
fi

# Step 4: Confirm
pwd
```

### **Before ANY of these operations:**
- Reading/writing files in `server/`
- Reading/writing files in `client/`
- Modifying `package.json`
- Running server commands
- Creating new directories/files
- Updating dependencies

**ALWAYS** verify you're at `/Users/vics/Applications/agent-ironman-app/` first!

---

## For User (Vic)

### In Future Sessions with Claude:

**At the start, say:**
> "Before we begin, verify you're working in /Users/vics/Applications/agent-ironman-app/ by checking for .agent-ironman-root file"

Or just run:
```bash
./verify-location.sh
```

And share the output with Claude.

### If Claude Ever Works in Wrong Location:

**Immediately say:**
> "STOP! You're in the wrong directory. The codebase is at /Users/vics/Applications/agent-ironman-app/, NOT in Documents!"

---

## Environment Variable (Optional)

Add to your `~/.zshrc` or `~/.bashrc`:

```bash
export AGENT_IRONMAN_ROOT="/Users/vics/Applications/agent-ironman-app"
alias ironman='cd $AGENT_IRONMAN_ROOT'
```

Then just type `ironman` to go to the correct directory!

---

## VS Code Workspace

Save this workspace file: `agent-ironman.code-workspace`

```json
{
  "folders": [
    {
      "path": "/Users/vics/Applications/agent-ironman-app",
      "name": "🎯 Agent Ironman App (CORRECT LOCATION)"
    }
  ],
  "settings": {
    "window.title": "🎯 Agent Ironman App - /Applications/agent-ironman-app"
  }
}
```

Open this workspace in VS Code to always be in the right place!

---

## Checklist for Every Session

- [ ] `cd /Users/vics/Applications/agent-ironman-app`
- [ ] Run `./verify-location.sh`
- [ ] See ✅ "CORRECT LOCATION!"
- [ ] Verify Claude knows the correct path
- [ ] Begin work

---

## Why This Happened

1. **Documents/agent-ironman** exists because that's where chat sessions are stored
2. **Applications/agent-ironman-app** is the actual codebase
3. Similar names caused confusion
4. No marker file to identify the correct location

**Now fixed with:**
- ✅ `.agent-ironman-root` marker file
- ✅ `verify-location.sh` script
- ✅ This documentation
- ✅ Protocol for Claude to follow

---

## Summary

**ALWAYS WORK IN:**
```
/Users/vics/Applications/agent-ironman-app/
```

**NEVER WORK IN:**
```
/Users/vics/Documents/agent-ironman/
```

**Verify with:**
```bash
./verify-location.sh
```

---

**Created**: November 7, 2025
**Status**: Active Protocol
**For**: All development work on Agent Ironman
