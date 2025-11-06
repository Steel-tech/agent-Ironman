#!/bin/bash
set -e

echo "🚀 Agent Ironman Simple Installer"
echo "================================="

# Configuration
APP_NAME="agent-ironman"
INSTALL_DIR="$HOME/Applications/agent-ironman-app"

# Create install directory
echo "📁 Creating installation directory..."
mkdir -p "$INSTALL_DIR"

# Copy files
echo "📋 Copying files..."
cp -r * "$INSTALL_DIR/" 2>/dev/null || true

# Install dependencies
echo "📦 Installing dependencies..."
cd "$INSTALL_DIR"
if command -v npm &> /dev/null && [[ -f "package.json" ]]; then
    npm install
else
    echo "⚠️  npm not found or no package.json - skipping dependency install"
fi

# Create basic .env if it doesn't exist
if [[ ! -f ".env" ]]; then
    echo "⚙️  Creating basic configuration..."
    cat > .env << 'EOF'
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

PORT=3003
EOF
fi

# Create launcher script
echo "🔧 Creating launcher command..."
LAUNCHER_SCRIPT="#!/bin/bash
cd \"$INSTALL_DIR\" && npm start
"

# Try to create global launcher
if echo "$LAUNCHER_SCRIPT" > "/usr/local/bin/$APP_NAME" 2>/dev/null; then
    chmod +x "/usr/local/bin/$APP_NAME"
    echo "✅ Global command created: agent-ironman"
else
    echo "⚠️  Could not create global command (may need sudo)"
    echo "💡 You can run manually: cd $INSTALL_DIR && npm start"
fi

echo ""
echo "🎉 Installation complete!"
echo ""
echo "📍 Location: $INSTALL_DIR"
echo "🚀 To start: agent-ironman"
echo "🌐 App will run at: http://localhost:3003"
echo ""
echo "⚙️  Don't forget to edit $INSTALL_DIR/.env with your API keys!"