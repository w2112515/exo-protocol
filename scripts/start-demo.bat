@echo off
chcp 65001 >nul
title Exo Protocol - One-Shot Demo Launcher

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║           EXO PROTOCOL - ONE-SHOT DEMO                       ║
echo ║           Phase 16: Champion Ready                            ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

:: 获取项目根目录
set "PROJECT_ROOT=%~dp0.."
cd /d "%PROJECT_ROOT%"

echo [1/3] 启动前端服务...
start "Exo Frontend" cmd /k "cd exo-frontend && pnpm dev"

echo [2/3] 等待前端启动 (8秒)...
timeout /t 8 /nobreak >nul

echo [3/3] 打开 Demo 页面...
start "" "http://localhost:3000/demo"

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║  ✅ 准备就绪！                                               ║
echo ║                                                              ║
echo ║  本地: http://localhost:3000/demo                            ║
echo ║  生产: https://exo-frontend-psi.vercel.app/demo              ║
echo ║                                                              ║
echo ║  操作指南:                                                   ║
echo ║    1. 按 F11 全屏                                            ║
echo ║    2. 打开 OBS 开始录制                                      ║
echo ║    3. 按 'X' 键切换恶意模式                                  ║
echo ║    4. 点击 "Reset Demo" 按钮重置状态                        ║
echo ║    5. 参考 docs/VIDEO_RECORDING_SCRIPT.md                    ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 按任意键关闭此窗口...
pause >nul
