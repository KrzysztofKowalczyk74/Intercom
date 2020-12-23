# Intercom
This is simlest possible way of communication with SIP (Asterisk) server and run communication from the web browser.

Current implementation of SIP for Tileboard is intercom-tiles-2.0.js.

It requires following entries in CONFIG. part:


   sip_wss_url: 'wss://servername.local:port/ws', //SIP webRTC server name/location
   sip_server: location.hostname, //again - server address
   sip_username: 'xxx', //sip username for the pannel
   sip_password: 'xxxxxx', //sip password for the pannel
   sip_doorbell_username: 'yyy',  //door bell user name
   sensorHA: 'sensor.domofon', //sensor declared in Home Assistant to let it know what SIP client does
   
 and some global declarations:
 var SIP_INTERCOM = {
   status: 'disconnected',
   log: 'starting...',
   acceptCallBtn: false,
   rejectCallBtn: false,
   endCallBtn: false,
   makeCallBtn: false,
   mediaConstraints: { audio: true, video: false },
   rtcOfferConstraint: {offerToReceiveAudio: true, offerToReceiveVideo: false}
};
var session;

Finally - script is loaded with following command:

  loadScript('Intercom/jssip-3.6.1.min.js');
  loadScript('Intercom/intercom-tiles-2.0.js');

Unfortunately I'm unable to support that code - some parts are just not mind (credits to various places on the internet)
