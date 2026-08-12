@echo off
title ArchPharma Backend
cd /d "%~dp0"
echo ====================================================
echo Starting ArchPharma NestJS Backend in Dev Mode...
echo ====================================================
npm.cmd run start:dev
pause
