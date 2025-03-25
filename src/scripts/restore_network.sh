#!/bin/bash

# 恢复网络连接的脚本
echo "正在恢复网络连接..."

# 开启Wi-Fi电源
echo "正在开启Wi-Fi电源..."
networksetup -setairportpower en0 on
sleep 1

# 启用Wi-Fi网络服务
echo "正在启用Wi-Fi网络服务..."
networksetup -setnetworkserviceenabled "Wi-Fi" on
sleep 1

# 刷新DNS缓存
echo "正在刷新DNS缓存..."
dscacheutil -flushcache
sleep 1

echo "网络恢复操作完成"
exit 0
