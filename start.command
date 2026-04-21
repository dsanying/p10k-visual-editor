#!/bin/zsh
set -e

cd -- "$(dirname "$0")"

PORT="${PORT:-48731}"
HOST="127.0.0.1"
URL="http://${HOST}:${PORT}/"

if ! command -v node >/dev/null 2>&1; then
  echo "未找到 Node.js。请先安装 Node.js 18 或更高版本。"
  echo "安装后重新双击这个文件。"
  read -r "?按回车退出..."
  exit 1
fi

echo "Powerlevel10k 配置编辑器"
echo "地址：${URL}"
echo

if lsof -ti "tcp:${PORT}" >/dev/null 2>&1; then
  echo "检测到 ${PORT} 端口已经有服务在运行，直接打开浏览器。"
  open "${URL}"
  read -r "?按回车退出..."
  exit 0
fi

echo "正在启动本地服务..."
echo "关闭这个 Terminal 窗口会停止服务。"
echo

npm start &
server_pid=$!

cleanup() {
  kill "${server_pid}" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

for _ in {1..30}; do
  if curl -fsS "${URL}" >/dev/null 2>&1; then
    open "${URL}" >/dev/null 2>&1 &
    wait "${server_pid}"
    exit $?
  fi
  if ! kill -0 "${server_pid}" >/dev/null 2>&1; then
    wait "${server_pid}"
    exit $?
  fi
  sleep 0.2
done

echo "服务启动较慢，请手动打开：${URL}"
wait "${server_pid}"
