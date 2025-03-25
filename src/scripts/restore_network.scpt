-- AppleScript网络恢复脚本

-- 开启Wi-Fi
do shell script "networksetup -setairportpower en0 on"
delay 1

-- 启用Wi-Fi网络服务
do shell script "networksetup -setnetworkserviceenabled \"Wi-Fi\" on"
delay 1

return "网络恢复完成"
