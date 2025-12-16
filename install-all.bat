@echo off
echo Instalando dependencias del proyecto...
echo.
echo Instalando dependencias de la raiz...
call npm install
echo.
echo Instalando dependencias del backend...
cd backend
call npm install
cd ..
echo.
echo Instalando dependencias del frontend...
cd frontend
call npm install
cd ..
echo.
echo ¡Instalacion completada!
pause

