#!/usr/bin/env python3
from pathlib import Path
import json, sys
ROOT=Path(__file__).resolve().parents[1]; errors=[]; checks_run=0

def check(condition,message):
 global checks_run; checks_run+=1
 if not condition: errors.append(message)

package=json.loads((ROOT/'package.json').read_text()); app=json.loads((ROOT/'app.json').read_text()); version=(ROOT/'VERSION').read_text().strip()
check(package['version']==app['expo']['version']==version=='2.0.0','VideoRip v2 release identity mismatch')
check(app['expo']['android']['package']=='app.videorip.mobile','Android package identity changed')
check(app['expo']['ios']['bundleIdentifier']=='app.videorip.mobile','iOS bundle identity changed')
check(app['expo'].get('platforms')==['android','ios'],'Platform lock must remain Android/iOS')
check(app['expo'].get('userInterfaceStyle')=='light','Light default theme missing')
check(app['expo'].get('scheme')=='videorip','VideoRip deep-link scheme missing')
for dep in ['@react-navigation/bottom-tabs','expo','expo-video','expo-document-picker','expo-image-picker','expo-screen-orientation','expo-network','expo-battery','expo-clipboard','expo-keep-awake','expo-sharing','react','react-native','react-native-safe-area-context']:
 check(dep in package['dependencies'],f'Missing dependency: {dep}')
for path in ['assets/icon.png','assets/adaptive-icon.png','assets/monochrome-icon.png','assets/notification-icon.png','assets/splash-icon.png']:
 check((ROOT/path).is_file() and (ROOT/path).stat().st_size>100,f'Missing/empty branding asset: {path}')
adaptive=app['expo']['android'].get('adaptiveIcon',{}); check(adaptive.get('foregroundImage')=='./assets/adaptive-icon.png','Adaptive icon foreground not configured'); check(adaptive.get('monochromeImage')=='./assets/monochrome-icon.png','Monochrome icon not configured'); check(app['expo'].get('icon')=='./assets/icon.png','Base app icon not configured')
plugins=app['expo'].get('plugins',[]); plugin_names={p[0] if isinstance(p,list) else p for p in plugins}
for required in ['expo-document-picker','expo-image-picker','expo-screen-orientation','expo-video','expo-system-ui','expo-sharing']: check(required in plugin_names,f'Missing config plugin: {required}')
app_text='\n'.join(p.read_text(errors='replace') for p in ROOT.glob('**/*.js') if 'node_modules' not in p.parts)
for token,message in [
 ('useSafeAreaInsets','Safe-area inset consumption missing'),('Math.max(insets.bottom','Bottom system inset handling missing'),('OrientationLock.LANDSCAPE','Landscape fullscreen orientation missing'),('OrientationLock.PORTRAIT_UP','Portrait restoration missing'),('enterFullscreen','Explicit fullscreen entry missing'),('DocumentPicker.getDocumentAsync','System document picker missing'),('ImagePicker.launchImageLibraryAsync','Media picker missing'),('useIncomingShare','Incoming share handling missing'),('@videorip/library/v2','Persistent v2 library missing'),('application/dash+xml','DASH classification missing'),('.m3u8','HLS classification missing'),('discoverMediaCandidatesFromHtml','Public-page candidate discovery missing'),('speedBps','Transfer speed/ETA model missing'),('retrying','Retry state missing'),('concurrentDownloads','Configurable transfer concurrency missing'),('wifiOnly','Wi-Fi policy missing'),('chargingOnlyLargeTransfers','Charging policy missing'),('exportDiagnostics','Diagnostics export missing'),('availableSubtitleTracks','Subtitle track capability missing'),('availableAudioTracks','Audio track capability missing'),('activateKeepAwakeAsync','Playback-driven keep-awake support missing')]: check(token in app_text,message)
for screen in ['HomeScreen.js','DownloadsScreen.js','LibraryScreen.js','LinksScreen.js','SettingsScreen.js','PlayerScreen.js','DetailsScreen.js']: check((ROOT/'src/screens'/screen).is_file(),f'Missing screen: {screen}')
for service in ['settingsService.js','diagnosticsService.js','linkAnalysisService.js','libraryService.js','importService.js','downloadService.js']: check((ROOT/'src/services'/service).is_file(),f'Missing service: {service}')
app_js=(ROOT/'App.js').read_text(); check('createBottomTabNavigator' in app_js,'React Navigation bottom-tab navigator missing');
for label in ['Home','Downloads','Library','Links','Settings']: check(f'name="{label}"' in app_js,f'Primary tab missing: {label}')
check((ROOT/'.htaccess').is_file(),'Root .htaccess missing'); check('NSAllowsArbitraryLoads' not in json.dumps(app),'Global arbitrary network load enabled'); check(app['expo']['android'].get('allowBackup') is False,'Android allowBackup must remain false')
for doc in ['docs/FEATURE_LOCK.md','docs/BUILD_SPEC.md','docs/ROADMAP.md','docs/LLM_EXECUTION_PROMPT.md','docs/VERIFICATION.md']: check((ROOT/doc).is_file(),f'Authoritative v2 document missing: {doc}')
if errors:
 print('STATIC VERIFICATION: FAIL'); [print('-',e) for e in errors]; sys.exit(1)
print('STATIC VERIFICATION: PASS'); print('Checks:',checks_run)
