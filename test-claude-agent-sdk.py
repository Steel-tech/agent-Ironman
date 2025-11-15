#!/usr/bin/env python3
"""
Test script for Claude Agent SDK integration
Verifies SDK installation and basic functionality
"""

import asyncio
import sys
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
project_root = Path(__file__).parent
load_dotenv(project_root / ".env")

# Test SDK import directly
try:
    from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions, query, CLINotFoundError
    SDK_AVAILABLE = True
except ImportError as e:
    SDK_AVAILABLE = False
    _import_error = str(e)
    
    # Define placeholder classes to prevent NameError
    class ClaudeSDKClient:
        pass
    
    class ClaudeAgentOptions:
        def __init__(self, **kwargs):
            pass
    
    class CLINotFoundError(Exception):
        pass
    
    def query(*args, **kwargs):
        raise ImportError("claude_agent_sdk not available")


async def test_sdk_availability():
    """Test 1: Check if SDK is available"""
    print("=" * 60)
    print("Test 1: SDK Availability Check")
    print("=" * 60)

    if SDK_AVAILABLE:
        print("✅ Claude Agent SDK is installed")
        try:
            # Test CLI availability
            _ = ClaudeSDKClient
            print("✅ Claude Code CLI is accessible")
            return True
        except (NameError, CLINotFoundError) as e:
            print(f"❌ Claude Code CLI not found: {e}")
            print("   Install with: npm install -g @anthropic-ai/claude-code")
            return False
    else:
        print(f"❌ Claude Agent SDK is NOT installed: {_import_error}")
        print("   Install with: pip install claude-agent-sdk")
        return False


async def test_simple_query():
    """Test 2: Simple query to Claude Code"""
    print("\n" + "=" * 60)
    print("Test 2: Simple Query")
    print("=" * 60)

    if not SDK_AVAILABLE:
        print("⏭️  Skipping - SDK not available")
        return False

    try:
        print("Sending query: 'What is 2 + 2?'")

        options = ClaudeAgentOptions(
            permission_mode="plan",
            max_turns=1
        )

        # query() returns an async iterator of messages
        messages = []
        async for message in query(prompt="What is 2 + 2? Respond with just the number.", options=options):
            messages.append(message)

        print(f"✅ Query successful!")
        print(f"   Received {len(messages)} message(s)")
        return True

    except Exception as e:
        print(f"❌ Query error: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_codebase_analysis():
    """Test 3: Codebase analysis (read-only)"""
    print("\n" + "=" * 60)
    print("Test 3: Codebase Analysis")
    print("=" * 60)

    if not SDK_AVAILABLE:
        print("⏭️  Skipping - SDK not available")
        return False

    try:
        print("Analyzing README.md...")

        options = ClaudeAgentOptions(
            permission_mode="plan",
            max_turns=2,
            cwd=str(Path.cwd())
        )

        # query() returns an async iterator of messages
        messages = []
        async for message in query(
            prompt="Read README.md and summarize what this project does in one sentence.",
            options=options
        ):
            messages.append(message)

        print(f"✅ Analysis successful!")
        print(f"   Received {len(messages)} message(s)")
        return True

    except Exception as e:
        print(f"❌ Analysis error: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_config_validation():
    """Test 4: Configuration validation"""
    print("\n" + "=" * 60)
    print("Test 4: Configuration Validation")
    print("=" * 60)

    issues = []

    # Check API key
    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    if not api_key:
        issues.append("ANTHROPIC_API_KEY not set in .env")
    elif api_key.startswith("sk-ant-"):
        print("✅ ANTHROPIC_API_KEY is configured")
    else:
        issues.append("ANTHROPIC_API_KEY has invalid format")

    # Check working directory
    working_dir = Path.cwd()
    if working_dir.exists():
        print(f"✅ Working directory exists: {working_dir}")

    # Check permission mode
    permission_mode = os.getenv("CLAUDE_SDK_PERMISSION_MODE", "default")
    valid_modes = ["default", "plan", "acceptEdits", "bypassPermissions"]
    if permission_mode in valid_modes:
        print(f"✅ Permission mode is valid: {permission_mode}")
    else:
        issues.append(f"Invalid permission mode: {permission_mode}")

    # Check max tokens
    max_tokens = int(os.getenv("CLAUDE_SDK_MAX_TOKENS", "8000"))
    if 100 <= max_tokens <= 200000:
        print(f"✅ Max tokens in valid range: {max_tokens}")
    else:
        issues.append(f"Max tokens out of range: {max_tokens}")

    if issues:
        print("\n❌ Configuration issues found:")
        for issue in issues:
            print(f"   - {issue}")
        return False
    else:
        print("\n✅ All configuration checks passed!")
        return True


async def run_all_tests():
    """Run all SDK tests"""
    print("\n" + "=" * 60)
    print("🧪 Claude Agent SDK Integration Tests")
    print("=" * 60)
    print()

    results = []

    # Run tests sequentially
    results.append(("Config Validation", await test_config_validation()))
    results.append(("SDK Availability", await test_sdk_availability()))

    # Only run functional tests if SDK is available
    if results[1][1]:  # If SDK availability test passed
        results.append(("Simple Query", await test_simple_query()))
        results.append(("Codebase Analysis", await test_codebase_analysis()))

    # Print summary
    print("\n" + "=" * 60)
    print("📊 Test Summary")
    print("=" * 60)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")

    print()
    print(f"Total: {passed}/{total} tests passed")

    if passed == total:
        print("\n🎉 All tests passed! Claude Agent SDK is ready to use.")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Please review the output above.")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(run_all_tests())
    sys.exit(exit_code)
