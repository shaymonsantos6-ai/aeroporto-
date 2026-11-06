@echo off
chcp 65001 >nul
cd /d "%~dp0"
where py >nul 2>nul
if not errorlevel 1 ( py -3 iniciar_aeroporto.py & goto fim )
where python >nul 2>nul
if not errorlevel 1 ( python iniciar_aeroporto.py & goto fim )
echo Python nao encontrado. Instale em https://www.python.org/downloads (marque "Add Python to PATH")
echo ou use iniciar.bat, que nao precisa de Python.
:fim
pause
