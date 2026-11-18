@echo off
echo ======================================================================
echo Launching CampusShare Full-Stack System
echo Backend: http://127.0.0.1:8000
echo Frontend: http://localhost:5173
echo ======================================================================
start "CampusShare Django Backend" cmd /k run_backend.bat
start "CampusShare React Frontend" cmd /k run_frontend.bat
echo Both services launched in separate windows!
