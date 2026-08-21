#!/usr/bin/env python3
from pathlib import Path
import sys
ROOT=Path(__file__).resolve().parents[1]
checks=[]
def require(path, token, label):
    text=(ROOT/path).read_text(errors='replace')
    checks.append((token in text,label))
def absent(path, token, label):
    text=(ROOT/path).read_text(errors='replace')
    checks.append((token not in text,label))
# Navigation and shell
require('App.js','createBottomTabNavigator','real bottom-tab navigator')
for name in ['Home','Downloads','Library','Links','Settings']:
    require('App.js',f'name="{name}"',f'{name} primary tab')
require('App.js','Math.max(insets.bottom','bottom safe-area tab padding')
require('src/components/Screen.js','KeyboardAvoidingView','keyboard avoidance')
# Home/incoming/clipboard
require('App.js','sharedUrl','incoming shared URL route')
require('src/screens/HomeScreen.js','clipboardSuggestion','clipboard suggestion')
require('src/screens/HomeScreen.js','accessibilityLiveRegion','Home status announcements')
# Library
for token,label in [('Select','visible selection entry'),('Rename','rename action'),('Export/save','export action'),('Copy source URL','copy source action'),('Re-analyse','re-analysis action'),('Export selected','batch export'),('Retry library load','library retry state')]:
    require('src/screens/LibraryScreen.js',token,label)
require('src/screens/LibraryScreen.js','minHeight:48','Library touch targets')
# Settings
for token,label in [('Mobile-data warning','mobile-data setting'),('Filename conflict policy','filename conflict setting'),('Playback history retention','history retention setting'),('Clear playback history','clear history action'),('Clear player cache','cache management'),('Start in fullscreen','fullscreen preference')]:
    require('src/screens/SettingsScreen.js',token,label)
require('src/context/SettingsContext.js','writeChain','serialised settings writes')
require('src/context/SettingsContext.js','if(!hydrated)','settings hydration write gate')
require('src/services/settingsService.js','invalid data shape','strict settings persistence')
# Downloads/policy
require('src/context/DownloadContext.js',"status:'waiting'",'explicit policy waiting state')
require('src/context/DownloadContext.js','confirmMobileData','one-transfer mobile confirmation')
require('src/context/DownloadContext.js',"['NETWORK_UNAVAILABLE','HTTP_ERROR']",'policy waits excluded from retry budget')
require('src/utils/transferPolicy.js','MOBILE_DATA_CONFIRMATION_REQUIRED','mobile policy decision')
require('src/utils/transferPolicy.js','batteryStates.CHARGING','charging state check')
require('src/services/storageService.js','invalid schema','strict download persistence')
require('src/screens/DownloadsScreen.js','Retry history load','download recovery state')
# Import
require('src/services/importService.js','copyToCacheDirectory:false','no document-picker cache double-copy')
require('src/services/importService.js','Large managed import','large import disclosure')
require('src/services/importService.js','INSUFFICIENT_STORAGE','import storage preflight')
# Player
require('src/screens/PlayerScreen.js',"'playingChange'",'playback-driven keep-awake event')
require('src/screens/PlayerScreen.js','activateKeepAwakeAsync','imperative keep-awake')
require('src/screens/PlayerScreen.js','settings.defaultFullscreen','fullscreen preference consumed')
require('src/screens/PlayerScreen.js','player.audioTrack=','audio track selection')
require('src/screens/PlayerScreen.js','player.subtitleTrack=','subtitle track selection')
require('src/screens/PlayerScreen.js','classifyPlayerError','classified player errors')
absent('src/screens/PlayerScreen.js','useKeepAwake(','always-mounted keep-awake removed')
# Touch target checks in primary interactive screens
for path in ['src/screens/HomeScreen.js','src/screens/LinksScreen.js','src/screens/DownloadsScreen.js','src/screens/LibraryScreen.js','src/screens/SettingsScreen.js','src/screens/PlayerScreen.js']:
    require(path,'minHeight:48',f'48dp-class touch target in {Path(path).name}')
fail=[label for ok,label in checks if not ok]
if fail:
    print('UI/UX STATIC ACCEPTANCE: FAIL')
    for x in fail: print('-',x)
    sys.exit(1)
print('UI/UX STATIC ACCEPTANCE: PASS')
print('Checks:',len(checks))
