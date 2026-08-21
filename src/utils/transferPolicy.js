export function decideNetworkPolicy(settings={},network=null,allowMobileDataOnce=false){
  if(network?.isConnected===false)return{code:'NETWORK_UNAVAILABLE',message:'No network connection is available.',policyWait:false};
  const type=String(network?.type||'').toUpperCase();
  if(settings.wifiOnly&&type!=='WIFI')return{code:'WIFI_REQUIRED',message:'Waiting for Wi-Fi because Wi-Fi-only mode is enabled.',policyWait:true};
  if(!settings.wifiOnly&&settings.mobileDataWarning&&type==='CELLULAR'&&!allowMobileDataOnce)return{code:'MOBILE_DATA_CONFIRMATION_REQUIRED',message:'Mobile data confirmation is required before this transfer starts.',policyWait:true};
  return null;
}
export function needsExternalPower(settings={},expectedBytes=0,batteryState=null,batteryStates={}){
  const threshold=Number(settings.chargingOnlyThresholdMb||500)*1024*1024;
  if(!settings.chargingOnlyLargeTransfers||!Number.isFinite(Number(expectedBytes))||Number(expectedBytes)<threshold)return false;
  return ![batteryStates.CHARGING,batteryStates.FULL].includes(batteryState);
}
