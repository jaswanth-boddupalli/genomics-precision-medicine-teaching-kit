@echo off
title The Complete Genomics to Precision Medicine Atlas
color 0B

echo ===============================================================================
echo   [Genomics Atlas] The Complete Genomics to Precision Medicine Knowledge Graph
echo ===============================================================================
echo.
echo   Navigating to project directory: D:\Genomics
cd /d "D:\Genomics"

:: Check for Python 3.14 or standard python
set PYTHON_EXE=C:\Users\jaszz\AppData\Local\Programs\Python\Python314\python.exe
if not exist "%PYTHON_EXE%" (
    set PYTHON_EXE=python
)

echo   Using Python: %PYTHON_EXE%
echo   Opening Atlas in your default browser: http://localhost:8000
echo.

:: Launch browser in background
start "" "http://localhost:8000"

:: Start the Python server
"%PYTHON_EXE%" server.py

pause

