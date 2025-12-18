@echo off
echo ========================================
echo Ejecutando migracion SQL...
echo ========================================
echo.

REM Intentar ejecutar la migracion usando mysql desde Laragon
REM Ajusta la ruta si tu instalacion de Laragon esta en otro lugar
set MYSQL_PATH=C:\laragon\bin\mysql\mysql-8.0.30\bin\mysql.exe

REM Si no existe en esa ruta, intentar otras rutas comunes de Laragon
if not exist "%MYSQL_PATH%" set MYSQL_PATH=C:\laragon\bin\mysql\mysql-8.0.30\bin\mysql.exe
if not exist "%MYSQL_PATH%" set MYSQL_PATH=C:\laragon\bin\mysql\mysql-8.0.24\bin\mysql.exe
if not exist "%MYSQL_PATH%" set MYSQL_PATH=C:\laragon\bin\mysql\mysql-8.0.30\bin\mysql.exe

REM Si aun no existe, intentar usar mysql desde PATH
where mysql >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Usando mysql desde PATH...
    mysql -u root -p personajes < "%~dp0add_showing_round_intro_mid_turn_simple.sql"
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo ========================================
        echo Migracion completada exitosamente!
        echo ========================================
    ) else (
        echo.
        echo ========================================
        echo Error al ejecutar la migracion.
        echo ========================================
        echo.
        echo Por favor, ejecuta manualmente en phpMyAdmin o HeidiSQL:
        echo.
        echo USE personajes;
        echo ALTER TABLE games ADD COLUMN showingRoundIntroMidTurn BOOLEAN DEFAULT FALSE;
        echo.
        pause
    )
) else (
    echo.
    echo ========================================
    echo No se encontro mysql en el PATH.
    echo ========================================
    echo.
    echo Por favor, ejecuta la migracion manualmente:
    echo.
    echo OPCION 1 - Desde phpMyAdmin (http://localhost:8080):
    echo   1. Selecciona la base de datos 'personajes'
    echo   2. Ve a la pestaña SQL
    echo   3. Ejecuta: ALTER TABLE games ADD COLUMN showingRoundIntroMidTurn BOOLEAN DEFAULT FALSE;
    echo.
    echo OPCION 2 - Desde HeidiSQL o cualquier cliente MySQL:
    echo   Ejecuta el archivo: add_showing_round_intro_mid_turn_simple.sql
    echo.
    pause
)
