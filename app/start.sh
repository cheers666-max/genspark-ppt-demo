#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

# 后端
( cd backend && npm install --silent )

# 前端
( cd frontend && npm install --silent )

# 启动后端（后台）
( cd backend && npm run dev ) &
BACK_PID=$!

# 启动前端
( cd frontend && npm run dev ) &
FRONT_PID=$!

echo "后端 PID=$BACK_PID (http://localhost:4000)"
echo "前端 PID=$FRONT_PID (http://localhost:5173)"
echo "按 Ctrl+C 停止"

trap "kill $BACK_PID $FRONT_PID 2>/dev/null" EXIT
wait
