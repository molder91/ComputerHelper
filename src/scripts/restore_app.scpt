-- 恢复隐藏的应用程序
on run argv
    try
        set appBundleID to item 1 of argv
        
        tell application "System Events"
            -- 通过 Bundle ID 打开应用
            tell application id appBundleID
                reopen
                activate
            end tell
        end tell
        
        return "SUCCESS"
    on error errMsg
        return "ERROR:" & errMsg
    end try
end run
