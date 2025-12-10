# UV Package Manager Integration - Windows Setup
# For The Pauli Effect - pauli-comic-funnel project
# © 2025

@echo off
setlocal enabledelayedexpansion

echo ===================================
echo.
echo 🚀 Pauli Effect UV Setup (Windows)
echo.
echo ===================================
echo.

REM Step 1: Install uv
echo 📦 Step 1: Installing uv...
where uv >nul 2>nul
if %errorlevel% == 0 (
    echo    ✅ uv is already installed
    uv --version
) else (
    echo    Installing uv from astral.sh...
    echo    (Alternative: pip install uv)
    pip install uv
    if %errorlevel% neq 0 (
        echo    ❌ Failed to install uv
        exit /b 1
    )
)
echo.

REM Step 2: Verify Python
echo 🐍 Step 2: Checking Python...
python --version
echo.

REM Step 3: Install Python versions with uv
echo 📌 Step 3: Installing Python versions with uv...
echo    Installing Python 3.9, 3.10, 3.11, 3.12...
uv python install 3.9 3.10 3.11 3.12
echo    ✅ Python versions installed
echo.

REM Step 4: Create virtual environment
echo 🔧 Step 4: Creating virtual environment...
uv venv .venv --python 3.11
if %errorlevel% neq 0 (
    echo    ❌ Failed to create venv
    exit /b 1
)
echo    ✅ Virtual environment created at .venv\
echo.

REM Step 5: Activate venv
echo 📥 Step 5: Activating environment...
call .venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo    ⚠️  Could not activate venv automatically
    echo    Run manually: .venv\Scripts\activate.bat
) else (
    echo    ✅ Environment activated
)
echo.

REM Step 6: Sync dependencies
echo 🏢 Step 6: Syncing workspace dependencies...
uv sync --all-extras
if %errorlevel% neq 0 (
    echo    ❌ Failed to sync dependencies
    exit /b 1
)
echo    ✅ Dependencies synced
echo.

REM Step 7: Generate lock file
echo 🔒 Step 7: Generating lock file...
uv lock
if %errorlevel% neq 0 (
    echo    ⚠️  Could not generate lock file
) else (
    echo    ✅ uv.lock created
)
echo.

REM Step 8: Verify installation
echo ✨ Step 8: Verification...
echo.
python --version
for /f "delims=" %%i in ('python -c "import sys; print(sys.executable)"') do set PYEXE=%%i
echo    Location: !PYEXE!
echo.

REM Check JARVIS dependencies
cd JARVIS_Universal_Agent_v2.0
python -c "import anthropic, openai, playwright; print('   ✅ Core dependencies available')" 2>nul
cd ..
echo.

echo ===================================
echo ✅ Setup Complete!
echo ===================================
echo.
echo 📋 Next Steps:
echo.
echo 1. Activate the environment:
echo    .venv\Scripts\activate
echo.
echo 2. Run JARVIS agent:
echo    cd JARVIS_Universal_Agent_v2.0
echo    python jarvis_agent.py
echo.
echo 3. Install in development mode:
echo    uv pip install -e JARVIS_Universal_Agent_v2.0[dev]
echo.
echo 4. Run tests:
echo    uv run pytest
echo.
echo 5. Update dependencies:
echo    uv sync --upgrade
echo.
echo 6. Add new packages:
echo    uv add ^<package-name^>
echo.
echo 📚 Documentation:
echo    https://docs.astral.sh/uv/
echo.
echo ===================================
pause
