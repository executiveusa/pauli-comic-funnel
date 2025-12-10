#!/bin/bash
# UV Package Manager Installation & Setup Guide
# For The Pauli Effect - pauli-comic-funnel project
# © 2025

set -e

echo "=================================="
echo "🚀 Pauli Effect UV Setup"
echo "=================================="
echo ""

# Step 1: Install uv
echo "📦 Step 1: Installing uv..."
if command -v uv &> /dev/null; then
    echo "   ✅ uv is already installed"
    uv --version
else
    echo "   Installing uv from astral.sh..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    # Add uv to PATH for this session
    export PATH="$HOME/.local/bin:$PATH"
fi
echo ""

# Step 2: Verify Python
echo "🐍 Step 2: Checking Python versions..."
echo "   Current Python:"
python --version || echo "   ⚠️  Python not found in PATH"
echo ""

# Step 3: Install/Pin Python versions
echo "📌 Step 3: Installing Python versions with uv..."
echo "   Installing Python 3.9, 3.10, 3.11, 3.12..."
uv python install 3.9 3.10 3.11 3.12
echo "   ✅ Python versions installed"
echo ""

# Step 4: Create virtual environment
echo "🔧 Step 4: Creating virtual environment..."
uv venv .venv --python 3.11
echo "   ✅ Virtual environment created at .venv/"
echo ""

# Step 5: Activate and sync dependencies
echo "📥 Step 5: Syncing dependencies..."
if [ -z "$VIRTUAL_ENV" ]; then
    if [ -f ".venv/bin/activate" ]; then
        source .venv/bin/activate
        echo "   ✅ Activated: $VIRTUAL_ENV"
    elif [ -f ".venv/Scripts/activate" ]; then
        source .venv/Scripts/activate
        echo "   ✅ Activated: $VIRTUAL_ENV"
    fi
fi
echo ""

# Step 6: Sync all workspace members
echo "🏢 Step 6: Syncing workspace dependencies..."
uv sync --all-extras
echo "   ✅ Dependencies synced"
echo ""

# Step 7: Install development tools
echo "🛠️  Step 7: Installing development tools..."
uv pip install pre-commit
echo "   ✅ Development tools installed"
echo ""

# Step 8: Generate lock file
echo "🔒 Step 8: Generating lock file..."
uv lock
echo "   ✅ uv.lock created (reproducible builds)"
echo ""

# Step 9: Verify installation
echo "✨ Step 9: Verification..."
echo ""
echo "   Python info:"
python --version
python -c "import sys; print(f'   Location: {sys.executable}')"
echo ""
echo "   Installed packages (JARVIS):"
cd JARVIS_Universal_Agent_v2.0
python -c "import anthropic, openai, playwright; print('   ✅ Core dependencies available')"
cd ..
echo ""

# Step 10: Print next steps
echo "=================================="
echo "✅ Setup Complete!"
echo "=================================="
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Activate the environment:"
echo "   source .venv/bin/activate  (Linux/macOS)"
echo "   .venv\\Scripts\\activate     (Windows)"
echo ""
echo "2. Run JARVIS agent:"
echo "   cd JARVIS_Universal_Agent_v2.0"
echo "   python jarvis_agent.py"
echo ""
echo "3. Install in development mode:"
echo "   uv pip install -e JARVIS_Universal_Agent_v2.0[dev]"
echo ""
echo "4. Run tests:"
echo "   uv run pytest"
echo ""
echo "5. Update dependencies:"
echo "   uv sync --upgrade"
echo ""
echo "6. Add new packages:"
echo "   uv add <package-name>"
echo ""
echo "📚 Documentation:"
echo "   https://docs.astral.sh/uv/"
echo ""
echo "Questions? Check:"
echo "   pyproject.toml (workspace config)"
echo "   JARVIS_Universal_Agent_v2.0/pyproject.toml (JARVIS config)"
echo ""
