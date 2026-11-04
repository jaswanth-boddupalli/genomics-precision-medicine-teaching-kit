#!/usr/bin/env bash
# ===============================================================================
# The Complete Genomics to Precision Medicine Atlas - Bash Launcher
# ===============================================================================

echo "==============================================================================="
echo "  [Genomics Atlas] Starting Precision Medicine Knowledge Graph Server..."
echo "==============================================================================="

cd "/d/Genomics" || cd "D:/Genomics" || cd "$(dirname "$0")"

# Open in default browser
if which xdg-open > /dev/null; then
  xdg-open "http://localhost:8000" &
elif which open > /dev/null; then
  open "http://localhost:8000" &
elif which cmd.exe > /dev/null; then
  cmd.exe /c start "http://localhost:8000" &
fi

# Run Python 3 server
PYTHON_EXE="/c/Users/jaszz/AppData/Local/Programs/Python/Python314/python.exe"
if [ ! -f "$PYTHON_EXE" ]; then
  PYTHON_EXE="python"
fi

"$PYTHON_EXE" server.py

