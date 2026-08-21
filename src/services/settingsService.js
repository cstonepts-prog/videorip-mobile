import AsyncStorage from '@react-native-async-storage/async-storage';
import {DEFAULT_SETTINGS,validateSettings,isSettingsObject} from '../utils/settingsUtils';
export {DEFAULT_SETTINGS,validateSettings} from '../utils/settingsUtils';
const SETTINGS_KEY='@videorip/settings/v2';
export async function loadSettings(){
  const raw=await AsyncStorage.getItem(SETTINGS_KEY);
  if(!raw)return {...DEFAULT_SETTINGS};
  let parsed;
  try{parsed=JSON.parse(raw);}catch{throw new Error('Stored settings are not valid JSON.');}
  if(!isSettingsObject(parsed))throw new Error('Stored settings have an invalid data shape.');
  return validateSettings(parsed);
}
export async function saveSettings(settings){const validated=validateSettings(settings);await AsyncStorage.setItem(SETTINGS_KEY,JSON.stringify(validated));return validated;}
export async function resetSettings(){await AsyncStorage.removeItem(SETTINGS_KEY);return {...DEFAULT_SETTINGS};}
