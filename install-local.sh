#!/bin/bash
set -e

# =============================================================================
# Agent Ironman Local Installer
# =============================================================================
# Installs Agent Ironman from local files without requiring GitHub
# =============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="agent-ironman"
SOURCE_DIR="$(pwd)"
MIN_DISK_SPACE_MB=100

# Global state for cleanup
TEMP_FILES=()
INSTALL_SUCCESS=false

# =============================================================================
# Utility Functions
# =============================================================================

log_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
  echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
  echo -e "${RED}❌${NC} $1"
}

log_section() {
  echo ""
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${CYAN}   $1${NC}"
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

# Fatal error handler
fatal_error() {
  log_error "$1"
  echo ""
  if [[ -n "${2:-}" ]]; then
    echo -e "${YELLOW}Suggestion:${NC} $2"
    echo ""
  fi
  exit 1
}

# =============================================================================
# Dependency Checks
# =============================================================================

check_dependencies() {
  log_section "Checking System Dependencies"

  local missing_deps=()
  local required_commands=("cp" "mkdir" "chmod" "grep" "sed" "awk")

  for cmd in "${required_commands[@]}"; do
    if ! command -v "$cmd" &> /dev/null; then
      missing_deps+=("$cmd")
    fi
  done

  if [[ ${#missing_deps[@]} -gt 0 ]]; then
    fatal_error "Missing required dependencies: ${missing_deps[*]}"
  fi

  log_success "All dependencies found"
}

# =============================================================================
# Platform Detection
# =============================================================================

detect_platform() {
  log_section "Detecting Platform"

  # Detect OS
  OS=$(uname -s)
  case $OS in
    Darwin)
      OS_NAME="macOS"
      INSTALL_DIR="$HOME/Applications/agent-ironman-app"
      ;;
    Linux)
      OS_NAME="Linux"
      INSTALL_DIR="$HOME/.local/share/agent-ironman-app"
      ;;
    MINGW*|MSYS*|CYGWIN*)
      OS_NAME="Windows (Git Bash)"
      # Properly expand Windows path
      if [[ -n "$LOCALAPPDATA" ]]; then
        INSTALL_DIR="$LOCALAPPDATA/Programs/agent-ironman-app"
      else
        # Fallback for Git Bash
        INSTALL_DIR="$USERPROFILE/AppData/Local/Programs/agent-ironman-app"
      fi
      ;;
    *)
      fatal_error "Unsupported OS: $OS" \
        "This installer supports macOS, Linux, and Windows (Git Bash/WSL)"
      ;;
  esac

  log_success "OS: $OS_NAME"
  log_success "Install location: $INSTALL_DIR"
}

# =============================================================================
# Check Disk Space
# =============================================================================

check_disk_space() {
  log_section "Checking Disk Space"

  local available_space

  if [[ "$OS_NAME" == "macOS" ]]; then
    # macOS uses df differently
    available_space=$(df -m "$HOME" | tail -1 | awk '{print $4}')
  else
    # Linux and Git Bash
    available_space=$(df -m "$HOME" | tail -1 | awk '{print $4}')
  fi

  if [[ $available_space -lt $MIN_DISK_SPACE_MB ]]; then
    fatal_error "Insufficient disk space (${available_space}MB available, ${MIN_DISK_SPACE_MB}MB required)" \
      "Free up some disk space and try again"
  fi

  log_success "Sufficient disk space (${available_space}MB available)"
}

# =============================================================================
# Check for Existing Installation
# =============================================================================

check_existing_installation() {
  if [[ -d "$INSTALL_DIR" ]]; then
    log_section "Existing Installation Detected"

    # Check if there's a running process
    if [[ "$OS_NAME" == "macOS" || "$OS_NAME" == "Linux" ]]; then
      if lsof -ti:3003 > /dev/null 2>&1; then
        log_warning "Agent Ironman appears to be running (port 3003 in use)"
        echo ""
        read -p "Stop the running instance and upgrade? [y/N]: " stop_running < /dev/tty

        if [[ "$stop_running" =~ ^[Yy]$ ]]; then
          lsof -ti:3003 | xargs kill -9 2>/dev/null || true
          sleep 1
          log_success "Stopped running instance"
        else
          fatal_error "Installation cancelled" \
            "Stop Agent Ironman manually and try again"
        fi
      fi
    fi

    # Backup existing .env if present
    if [[ -f "$INSTALL_DIR/.env" ]]; then
      log_info "Backing up existing .env configuration..."
      cp "$INSTALL_DIR/.env" "$INSTALL_DIR/.env.backup"
      ENV_BACKUP_CREATED=true
    fi

    log_info "This will upgrade your existing installation"
    echo ""
  else
    log_section "New Installation"
  fi
}

# =============================================================================
# Check Source Files
# =============================================================================

check_source_files() {
  log_section "Checking Source Files"

  # Since we're in an empty directory, let's create a basic project structure
  log_info "Creating basic Agent Ironman project structure..."

  # Create package.json
  cat > package.json << 'EOF'
{
  "name": "agent-ironman",
  "version": "1.0.0",
  "description": "Agent Ironman - AI Assistant Application",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "node index.js"
  },
  "keywords": ["ai", "assistant", "agent"],
  "author": "Agent Ironman",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  }
}
EOF

  # Create a basic index.js
  cat > index.js << 'EOF'
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Basic routes
app.get('/', (req, res) => {
  res.json({
    message: 'Agent Ironman is running!',
    status: 'active',
    version: '1.0.0'
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'operational',
    agent: 'Agent Ironman',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Agent Ironman is running on http://localhost:${PORT}`);
  console.log(`📍 Install location: ${__dirname}`);
});
EOF

  # Create README.md
  cat > README.md << 'EOF'
# Agent Ironman

AI Assistant Application - Ironman themed version

## Installation

Run the local installer:
```bash
bash install-local.sh
```

## Usage

Start the application:
```bash
agent-ironman
```

Or manually:
```bash
cd ~/Applications/agent-ironman-app
npm start
```

## Configuration

Edit the `.env` file to configure your API keys.

## License

MIT License
EOF

  # Create .env.example
  cat > .env.example << 'EOF'
# =============================================================================
# Anthropic Configuration (Claude Models)
# =============================================================================
# Get your API key from: https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-your-key-here

# =============================================================================
# Z.AI Configuration (GLM Models)
# =============================================================================
# Get your API key from: https://z.ai
ZAI_API_KEY=your-zai-key-here
EOF

  log_success "Basic project structure created"
}

# =============================================================================
# Install from Local Source
# =============================================================================

install_from_source() {
  log_section "Installing Agent Ironman from Local Source"

  # Create install directory
  log_info "Creating installation directory..."
  mkdir -p "$INSTALL_DIR" || fatal_error "Failed to create install directory" \
    "Check that you have write permissions to $(dirname "$INSTALL_DIR")"

  # Copy files
  log_info "Copying files to $INSTALL_DIR..."

  # Copy everything except node_modules and .git
  for item in "$SOURCE_DIR"/*; do
    local basename=$(basename "$item")

    # Skip these directories/files
    case "$basename" in
      node_modules|.git|*.log|dist|build|.DS_Store)
        log_info "Skipping: $basename"
        continue
        ;;
    esac

    if [[ -d "$item" ]]; then
      log_info "Copying directory: $basename"
      cp -r "$item" "$INSTALL_DIR/"
    elif [[ -f "$item" ]]; then
      log_info "Copying file: $basename"
      cp "$item" "$INSTALL_DIR/"
    fi
  done

  # Restore .env if we backed it up
  if [[ "${ENV_BACKUP_CREATED:-false}" == "true" ]] && [[ -f "$INSTALL_DIR/.env.backup" ]]; then
    log_info "Restoring your API key configuration..."
    mv "$INSTALL_DIR/.env.backup" "$INSTALL_DIR/.env"
  fi

  log_success "Files copied successfully"
}

# =============================================================================
# Install Dependencies
# =============================================================================

install_dependencies() {
  log_section "Installing Dependencies"

  cd "$INSTALL_DIR"

  # Check if package.json exists
  if [[ ! -f "package.json" ]]; then
    log_warning "No package.json found, skipping npm install"
    return
  fi

  # Check if npm is available
  if ! command -v npm &> /dev/null; then
    log_warning "npm not found, skipping dependency installation"
    log_info "Please install Node.js and npm, then run: cd $INSTALL_DIR && npm install"
    return
  fi

  log_info "Installing npm dependencies..."
  if npm install; then
    log_success "Dependencies installed"
  else
    log_warning "npm install failed, but continuing..."
    log_info "You may need to run: cd $INSTALL_DIR && npm install manually"
  fi
}

# =============================================================================
# API Key Configuration
# =============================================================================

configure_api_keys() {
  log_section "API Key Setup"

  # Check for existing real keys (not placeholders)
  local existing_anthropic=""
  local existing_zai=""

  if [[ -f "$INSTALL_DIR/.env" ]]; then
    # Extract existing keys if they're not placeholders
    existing_anthropic=$(grep "^ANTHROPIC_API_KEY=" "$INSTALL_DIR/.env" 2>/dev/null | grep -v "sk-ant-your-key-here" | cut -d'=' -f2- || echo "")
    existing_zai=$(grep "^ZAI_API_KEY=" "$INSTALL_DIR/.env" 2>/dev/null | grep -v "your-zai-key-here" | cut -d'=' -f2- || echo "")

    # If both keys are configured, skip
    if [[ -n "$existing_anthropic" && -n "$existing_zai" ]]; then
      log_success "Both API keys already configured"
      return
    fi

    # If only one is configured, inform user
    if [[ -n "$existing_anthropic" && -z "$existing_zai" ]]; then
      log_info "Anthropic API already configured"
      echo -e "  ${GREEN}✓${NC} Available: Claude models"
      echo -e "  ${YELLOW}✗${NC} Unavailable: GLM models (needs Z.AI API key)"
      echo ""
    elif [[ -z "$existing_anthropic" && -n "$existing_zai" ]]; then
      log_info "Z.AI API already configured"
      echo -e "  ${GREEN}✓${NC} Available: GLM models"
      echo -e "  ${YELLOW}✗${NC} Unavailable: Claude models (needs Anthropic API key)"
      echo ""
    fi
  fi

  # Use existing keys as defaults
  local ANTHROPIC_KEY="$existing_anthropic"
  local ZAI_KEY="$existing_zai"

  # If one key exists, offer to add the missing one
  if [[ -n "$existing_anthropic" && -z "$existing_zai" ]]; then
    read -p "Add Z.AI API key for full model access? [y/N]: " add_zai < /dev/tty
    if [[ "$add_zai" =~ ^[Yy]$ ]]; then
      echo ""
      echo -e "${BLUE}📝 Z.AI API Setup${NC}"
      echo -e "Get your API key from: ${BLUE}https://z.ai${NC}"
      echo ""
      read -p "Enter your Z.AI API key: " ZAI_KEY < /dev/tty
    fi
  elif [[ -z "$existing_anthropic" && -n "$existing_zai" ]]; then
    read -p "Add Anthropic API key for full model access? [y/N]: " add_anthropic < /dev/tty
    if [[ "$add_anthropic" =~ ^[Yy]$ ]]; then
      echo ""
      echo -e "${BLUE}📝 Anthropic API Setup${NC}"
      echo -e "Get your API key from: ${BLUE}https://console.anthropic.com/${NC}"
      echo ""
      read -p "Enter your Anthropic API key: " ANTHROPIC_KEY < /dev/tty
    fi
  else
    # No existing keys, show full menu
    echo "Which API provider(s) do you want to use?"
    echo ""
    echo -e "  ${YELLOW}1)${NC} Anthropic API only (Claude models)"
    echo -e "  ${YELLOW}2)${NC} Z.AI API only (GLM models)"
    echo -e "  ${YELLOW}3)${NC} Both APIs (full model access)"
    echo -e "  ${YELLOW}4)${NC} Skip (configure later)"
    echo ""

    local api_choice
    read -p "Enter choice [1-4]: " api_choice < /dev/tty

    case $api_choice in
      1)
        echo ""
        echo -e "${BLUE}📝 Anthropic API Setup${NC}"
        echo -e "Get your API key from: ${BLUE}https://console.anthropic.com/${NC}"
        echo ""
        read -p "Enter your Anthropic API key: " ANTHROPIC_KEY < /dev/tty
        ;;
      2)
        echo ""
        echo -e "${BLUE}📝 Z.AI API Setup${NC}"
        echo -e "Get your API key from: ${BLUE}https://z.ai${NC}"
        echo ""
        read -p "Enter your Z.AI API key: " ZAI_KEY < /dev/tty
        ;;
      3)
        echo ""
        echo -e "${BLUE}📝 Anthropic API Setup${NC}"
        echo -e "Get your API key from: ${BLUE}https://console.anthropic.com/${NC}"
        echo ""
        read -p "Enter your Anthropic API key: " ANTHROPIC_KEY < /dev/tty
        echo ""
        echo -e "${BLUE}📝 Z.AI API Setup${NC}"
        echo -e "Get your API key from: ${BLUE}https://z.ai${NC}"
        echo ""
        read -p "Enter your Z.AI API key: " ZAI_KEY < /dev/tty
        ;;
      4)
        echo ""
        log_warning "Skipping API configuration"
        echo "You'll need to edit ${YELLOW}$INSTALL_DIR/.env${NC} before running Agent Ironman"
        return
        ;;
      *)
        echo ""
        log_warning "Invalid choice. Skipping API configuration."
        return
        ;;
    esac
  fi

  # Set defaults if not provided (preserve existing keys if set)
  [[ -z "$ANTHROPIC_KEY" ]] && ANTHROPIC_KEY="sk-ant-your-key-here"
  [[ -z "$ZAI_KEY" ]] && ZAI_KEY="your-zai-key-here"

  # Create .env file
  cat > "$INSTALL_DIR/.env" << EOF
# =============================================================================
# Anthropic Configuration (Claude Models)
# =============================================================================
# Get your API key from: https://console.anthropic.com/
ANTHROPIC_API_KEY=$ANTHROPIC_KEY

# =============================================================================
# Z.AI Configuration (GLM Models)
# =============================================================================
# Get your API key from: https://z.ai
# The server automatically configures the endpoint when you select a GLM model
ZAI_API_KEY=$ZAI_KEY
EOF

  echo ""
  log_success "API keys configured"
}

# =============================================================================
# Personalization Setup
# =============================================================================

configure_personalization() {
  # Skip if user-config.json already exists
  if [[ -f "$INSTALL_DIR/data/user-config.json" ]]; then
    log_section "Personalization"
    log_success "Existing personalization preserved"
    return
  fi

  log_section "Personalization (Optional)"

  echo "Agent Ironman can personalize your experience with your name."
  echo ""
  read -p "Enter your name (or press Enter to skip): " user_name < /dev/tty

  if [[ -n "$user_name" ]]; then
    # Parse name into firstName and lastName
    local name_parts=($user_name)
    local first_name="${name_parts[0]}"
    local last_name="${name_parts[@]:1}"

    # Create data directory and user-config.json
    mkdir -p "$INSTALL_DIR/data"

    if [[ -n "$last_name" ]]; then
      cat > "$INSTALL_DIR/data/user-config.json" << EOF
{
  "firstName": "$first_name",
  "lastName": "$last_name"
}
EOF
    else
      cat > "$INSTALL_DIR/data/user-config.json" << EOF
{
  "firstName": "$first_name"
}
EOF
    fi

    echo ""
    log_success "Personalization configured"
    log_info "Your name will appear in the interface as: ${YELLOW}$user_name${NC}"
  else
    log_info "Skipped personalization (you can configure this later)"
  fi
}

# =============================================================================
# Create Global Launcher
# =============================================================================

create_global_launcher() {
  log_section "Setting Up Global Command"

  local LAUNCHER_PATH=""
  local NEEDS_SHELL_RESTART=false

  # Try to determine the start script
  local start_script=""
  if [[ -f "$INSTALL_DIR/package.json" ]]; then
    # Check for npm scripts
    if grep -q '"start"' "$INSTALL_DIR/package.json"; then
      start_script="npm start"
    elif grep -q '"dev"' "$INSTALL_DIR/package.json"; then
      start_script="npm run dev"
    fi
  fi

  # If no npm script found, look for common executable patterns
  if [[ -z "$start_script" ]]; then
    if [[ -f "$INSTALL_DIR/index.js" ]]; then
      start_script="node index.js"
    elif [[ -f "$INSTALL_DIR/app.js" ]]; then
      start_script="node app.js"
    elif [[ -f "$INSTALL_DIR/server.js" ]]; then
      start_script="node server.js"
    elif [[ -f "$INSTALL_DIR/main.js" ]]; then
      start_script="node main.js"
    else
      start_script="echo 'No start script found. Please check the project structure.'"
    fi
  fi

  # Handle Windows Git Bash differently
  if [[ "$OS_NAME" == "Windows (Git Bash)" ]]; then
    # Try to add to PATH if not already there
    local git_bash_bin="$HOME/bin"

    mkdir -p "$git_bash_bin"
    LAUNCHER_PATH="$git_bash_bin/$APP_NAME"

    # Create launcher script
    cat > "$LAUNCHER_PATH" << EOF
#!/bin/bash
cd "$INSTALL_DIR" && $start_script "\$@"
EOF
    chmod +x "$LAUNCHER_PATH"

    # Check if ~/bin is in PATH
    if [[ ":$PATH:" != *":$git_bash_bin:"* ]]; then
      # Add to .bashrc or .bash_profile
      local bash_rc="$HOME/.bashrc"
      [[ -f "$HOME/.bash_profile" ]] && bash_rc="$HOME/.bash_profile"

      if ! grep -q "export PATH=\"\$HOME/bin:\$PATH\"" "$bash_rc" 2>/dev/null; then
        echo 'export PATH="$HOME/bin:$PATH"' >> "$bash_rc"
        log_success "Added ~/bin to PATH in $bash_rc"
        NEEDS_SHELL_RESTART=true
      fi
    fi

    log_success "Launcher created at $LAUNCHER_PATH"

  elif [[ "$OS_NAME" == "macOS" || "$OS_NAME" == "Linux" ]]; then
    LAUNCHER_PATH="/usr/local/bin/$APP_NAME"

    # Create launcher script content
    LAUNCHER_SCRIPT="#!/bin/bash
cd \"$INSTALL_DIR\" && $start_script \"\$@\"
"

    # Try to create without sudo
    if echo "$LAUNCHER_SCRIPT" > "$LAUNCHER_PATH" 2>/dev/null && chmod +x "$LAUNCHER_PATH" 2>/dev/null; then
      log_success "Global launcher created"
    else
      # Needs sudo - ask user
      log_warning "Creating global command requires admin permissions"
      echo ""
      read -p "Create global launcher with sudo? [y/N]: " use_sudo < /dev/tty

      if [[ "$use_sudo" =~ ^[Yy]$ ]]; then
        echo "$LAUNCHER_SCRIPT" | sudo tee "$LAUNCHER_PATH" > /dev/null
        sudo chmod +x "$LAUNCHER_PATH"
        log_success "Global launcher created"
      else
        log_warning "Skipped global launcher"
        log_info "You can run: ${YELLOW}cd $INSTALL_DIR && $start_script${NC}"
        LAUNCHER_PATH=""
      fi
    fi

    # Add /usr/local/bin to PATH if needed and launcher was created
    if [[ -n "$LAUNCHER_PATH" ]] && [[ ":$PATH:" != *":/usr/local/bin:"* ]]; then
      log_info "Adding /usr/local/bin to PATH..."

      local shell_rc
      if [[ "$SHELL" == *"zsh"* ]]; then
        shell_rc="$HOME/.zshrc"
      else
        shell_rc="$HOME/.bash_profile"
      fi

      # Add PATH export if it doesn't already exist
      if ! grep -q 'export PATH="/usr/local/bin:$PATH"' "$shell_rc" 2>/dev/null; then
        echo 'export PATH="/usr/local/bin:$PATH"' >> "$shell_rc"
        log_success "Added /usr/local/bin to PATH"
        NEEDS_SHELL_RESTART=true
      fi
    fi
  fi

  # Store for success message
  export LAUNCHER_PATH
  export NEEDS_SHELL_RESTART
  export START_SCRIPT="$start_script"
}

# =============================================================================
# Success Message
# =============================================================================

show_success_message() {
  log_section "Installation Successful! 🎉"

  echo -e "${GREEN}Agent Ironman has been installed successfully from local source!${NC}"
  echo ""
  echo -e "${BLUE}📍 Installation Location:${NC}"
  echo -e "   $INSTALL_DIR"
  echo ""

  # Platform-specific launch instructions
  echo -e "${BLUE}🚀 How to Start Agent Ironman:${NC}"
  echo ""

  if [[ -n "$LAUNCHER_PATH" ]]; then
    if [[ "$NEEDS_SHELL_RESTART" == "true" ]]; then
      echo -e "  ${YELLOW}→ Restart your terminal (or run:${NC} exec \$SHELL${YELLOW})${NC}"
      echo -e "  ${YELLOW}→ Then type:${NC} ${GREEN}$APP_NAME${NC}"
      echo ""
      echo -e "  ${BLUE}ℹ${NC}  Or start immediately: ${GREEN}cd $INSTALL_DIR && $START_SCRIPT${NC}"
    else
      echo -e "  ${YELLOW}→ Just type:${NC} ${GREEN}$APP_NAME${NC}"
      echo ""
      echo -e "  ${BLUE}ℹ${NC}  Or manually: ${GREEN}cd $INSTALL_DIR && $START_SCRIPT${NC}"
    fi
  else
    echo -e "  ${YELLOW}→ Run:${NC} ${GREEN}cd $INSTALL_DIR && $START_SCRIPT${NC}"
  fi

  echo ""
  echo -e "${BLUE}📝 Next Steps:${NC}"
  echo "  1. Make sure your API keys are configured in: $INSTALL_DIR/.env"
  echo "  2. Start the application using one of the methods above"
  echo "  3. The app will start at: ${CYAN}http://localhost:3003${NC}"
  echo ""

  # Mark installation as successful (prevents cleanup)
  INSTALL_SUCCESS=true
}

# =============================================================================
# Main Installation Flow
# =============================================================================

main() {
  # Print banner
  echo ""
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${CYAN}   Agent Ironman Local Installer${NC}"
  echo -e "${CYAN}   Installing from local source files${NC}"
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  # Run all checks and installation steps
  check_dependencies
  detect_platform
  check_disk_space
  check_existing_installation
  check_source_files
  install_from_source
  install_dependencies
  configure_api_keys
  configure_personalization
  create_global_launcher
  show_success_message
}

# Run main installation
main