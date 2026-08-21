import React,{useEffect} from 'react';
import {Platform,StatusBar,StyleSheet,Text} from 'react-native';
import {NavigationContainer,useNavigation} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider,useSafeAreaInsets} from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as ScreenOrientation from 'expo-screen-orientation';
import {useIncomingShare} from 'expo-sharing';
import {SettingsProvider} from './src/context/SettingsContext';
import {DownloadProvider} from './src/context/DownloadContext';
import {configureNotificationChannel} from './src/services/notificationService';
import {ingestSharedPayloads} from './src/services/importService';
import {recordDiagnostic} from './src/services/diagnosticsService';
import HomeScreen from './src/screens/HomeScreen';
import DownloadsScreen from './src/screens/DownloadsScreen';
import LibraryScreen from './src/screens/LibraryScreen';
import LinksScreen from './src/screens/LinksScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import PlayerScreen from './src/screens/PlayerScreen';
import DetailsScreen from './src/screens/DetailsScreen';

Notifications.setNotificationHandler({handleNotification:async()=>({shouldShowBanner:true,shouldShowList:true,shouldPlaySound:false,shouldSetBadge:false})});
const Stack=createNativeStackNavigator();
const Tab=createBottomTabNavigator();

function plausibleUrl(value){
  const text=String(value||'').trim();
  try{const u=new URL(text);return ['http:','https:'].includes(u.protocol)?u.toString():null;}catch{return null;}
}

function IncomingShareBridge(){
  const navigation=useNavigation();
  const incoming=useIncomingShare();
  useEffect(()=>{
    if(incoming.isResolving||!incoming.resolvedSharedPayloads?.length)return;
    let live=true;
    (async()=>{
      try{
        const result=await ingestSharedPayloads(incoming.resolvedSharedPayloads);
        if(!live)return;
        if(result.imported.length){navigation.navigate('Library');return;}
        const textPayload=incoming.sharedPayloads?.find(p=>['text','url'].includes(p.shareType)&&p.value);
        const sharedUrl=plausibleUrl(textPayload?.value);
        if(sharedUrl){
          navigation.navigate('Home',{sharedUrl,sharedAt:Date.now()});
          await recordDiagnostic('info','SHARED_URL','Shared URL routed to Home');
        }
      }catch(e){await recordDiagnostic('error','SHARE_INGEST',e.message);}
    })();
    return()=>{live=false;};
  },[incoming.isResolving,incoming.resolvedSharedPayloads,incoming.sharedPayloads,navigation]);
  return null;
}

function TabLabel({focused,children}){
  return <Text numberOfLines={2} maxFontSizeMultiplier={1.5} style={[styles.tabLabel,focused&&styles.tabLabelActive]}>{children}</Text>;
}

function MainTabs(){
  const insets=useSafeAreaInsets();
  useEffect(()=>{ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(()=>{});},[]);
  const common={headerShown:false,tabBarHideOnKeyboard:true,tabBarStyle:{height:66+Math.max(insets.bottom,6),paddingBottom:Math.max(insets.bottom,6),paddingTop:6,backgroundColor:'#FFFFFF',borderTopColor:'#CBD5E1'},tabBarItemStyle:{minHeight:54,paddingHorizontal:2}};
  return <>
    <IncomingShareBridge/>
    <Tab.Navigator initialRouteName="Home" screenOptions={common}>
      <Tab.Screen name="Home" component={HomeScreen} options={{tabBarLabel:({focused})=><TabLabel focused={focused}>Home</TabLabel>}}/>
      <Tab.Screen name="Downloads" component={DownloadsScreen} options={{tabBarLabel:({focused})=><TabLabel focused={focused}>Downloads</TabLabel>}}/>
      <Tab.Screen name="Library" component={LibraryScreen} options={{tabBarLabel:({focused})=><TabLabel focused={focused}>Library</TabLabel>}}/>
      <Tab.Screen name="Links" component={LinksScreen} options={{tabBarLabel:({focused})=><TabLabel focused={focused}>Links</TabLabel>}}/>
      <Tab.Screen name="Settings" component={SettingsScreen} options={{tabBarLabel:({focused})=><TabLabel focused={focused}>Settings</TabLabel>}}/>
    </Tab.Navigator>
  </>;
}

export default function App(){
  useEffect(()=>{configureNotificationChannel().catch(e=>console.warn('Notification channel configuration failed:',e));},[]);
  return <SafeAreaProvider><SettingsProvider><DownloadProvider>
    <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={Platform.OS==='android'}/>
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Main" screenOptions={{headerStyle:{backgroundColor:'#F8FAFC'},headerTintColor:'#0F172A',headerTitleStyle:{fontWeight:'800'},contentStyle:{backgroundColor:'#F8FAFC'}}}>
        <Stack.Screen name="Main" component={MainTabs} options={{headerShown:false}}/>
        <Stack.Screen name="Player" component={PlayerScreen} options={{headerShown:false,animation:'fade'}}/>
        <Stack.Screen name="Details" component={DetailsScreen} options={{title:'Media details'}}/>
      </Stack.Navigator>
    </NavigationContainer>
  </DownloadProvider></SettingsProvider></SafeAreaProvider>;
}

const styles=StyleSheet.create({tabLabel:{fontSize:11,fontWeight:'700',lineHeight:14,textAlign:'center',color:'#64748B'},tabLabelActive:{color:'#0B57D0',fontWeight:'900'}});
