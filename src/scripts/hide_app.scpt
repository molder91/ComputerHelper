-- 隐藏当前聚焦的应用程序
on run
    try
        tell application "System Events"
            set frontApp to first application process whose frontmost is true
            set frontAppName to name of frontApp
            set frontAppPath to path of frontApp
            set frontAppBundleID to bundle identifier of frontApp
            
            -- 隐藏应用程序
            tell process frontAppName
                set visible to false
            end tell
            
            -- 返回应用信息以便存储
            return {name:frontAppName, path:frontAppPath, bundleID:frontAppBundleID}
        end tell
    on error errMsg
        return "ERROR:" & errMsg
    end try
end run
