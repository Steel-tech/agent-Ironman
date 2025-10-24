Agent Ironman Application - macOS
==============================

Setup (First Time):
1. Open the .env file in a text editor
2. Add your Anthropic API key (get from https://console.anthropic.com/)
   Replace: ANTHROPIC_API_KEY=sk-ant-your-key-here
   With: ANTHROPIC_API_KEY=sk-ant-your-actual-key

To Run:
- Double-click the 'agent-ironman' file
- Or run from terminal: ./agent-ironman
- The app will start at http://localhost:3003
- Your browser should open automatically

First Run:
- On first launch, Bun runtime will be auto-installed (takes ~5 seconds)
- Subsequent launches are instant

Data Storage:
- Sessions stored in ~/Documents/agent-ironman/
- All your conversations are saved locally

Requirements:
- macOS 11+ (Big Sur or later)
- Anthropic API key (for Claude models)
- Internet connection (for first-time Bun install)

Troubleshooting:
- If port 3003 is busy, kill the process: lsof -ti:3003 | xargs kill -9
- Make sure .env file has your real API key

Enjoy!
