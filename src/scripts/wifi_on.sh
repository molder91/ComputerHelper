#!/bin/bash
# 简单直接的Wi-Fi开启脚本

# 使用直接命令开启Wi-Fi
/usr/sbin/networksetup -setairportpower en0 on
/usr/sbin/networksetup -setnetworkserviceenabled "Wi-Fi" on

# 输出状态确认
echo "Wi-Fi开启命令已执行"
exit 0
