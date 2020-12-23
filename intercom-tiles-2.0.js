//var	sip_wss_url = 'wss://'+ location.hostname +':4443/ws';
//var sip_server = location.hostname;
//var sip_username = '8003';
//var sip_password = '123456';
//var sip_doorbell_username = '8001';  //if of door bell in SIP server
//var sensorHA = 'sensor.domofon';


  //console.log('Loading SIPPhone');
  SIP_INTERCOM.log = 'Loading SIPPhone';

  let socket = new JsSIP.WebSocketInterface(CONFIG.sip_wss_url);
  let configuration = {
      sockets  : [ socket ],
      uri      : `sip:${CONFIG.sip_username}@${CONFIG.sip_server}`,
      password : CONFIG.sip_password
  };
  //Create a new SIP User Agent, and start it (connect to SIP server, Register, etc.)
  var sipPhone = new JsSIP.UA(configuration);
  sipPhone.start();
  updateUI();


  // Register callbacks for outgoing call events.
  // It appears the following eventHandlers are JsSIP.RTCSession Events which can
  // also be registered during Session Outgoing Events, which is what I'll do for now.
  var eventHandlers = {
      'progress': function(e) {
        SIP_INTERCOM.log = 'call is in progress';
      },
      'failed': function(e) {
        //console.log('call failed with cause: '+ e.cause);
        SIP_INTERCOM.log = 'call failed with cause: '+ e.cause;
      },
      'ended': function(e) {
        //console.log('call ended with cause: '+ e.cause);
        SIP_INTERCOM.log = 'call ended with cause: '+ e.cause;
      },
      'confirmed': function(e) {
        //console.log('call confirmed');
        SIP_INTERCOM.log = 'call confirmed';
      },
  };

  let callOptions = {
    //'eventHandlers'   : eventHandlers,
    mediaConstraints: { audio: true, video: false },
    rtcOfferConstraint: {offerToReceiveAudio: true, offerToReceiveVideo: false}
  };


  //Register a callback when a new WebRTC media session is established
  //  which occurs on incoming or outgoing calls.
  sipPhone.on("newRTCSession", function(data){
      var newSession = data.session;
      if(session){ // hangup any existing call
          session.terminate();
      }
      session = newSession;
      var completeSession = function(){
        session = null;
        updateUI();
      };
      let peerconnection = session.connection;
      session.on('ended', completeSession);
      session.on('failed', completeSession);
      session.on('accepted',updateUI);
      session.on('confirmed',function(){
          var localStream = session.connection.getLocalStreams()[0];
        var dtmfSender = session.connection.createDTMFSender(localStream.getAudioTracks()[0])
        session.sendDTMF = function(tone){
          dtmfSender.insertDTMF(tone);
        };
        updateUI();
      });
      session.on('peerconnection', (e) => {
        console.log('peerconnection', e);
        let logError = '';
        const peerconnection = e.peerconnection;

        peerconnection.onaddstream = function (e) {
          console.log('addstream', e);
          // set remote audio stream (to listen to remote audio)
          // remoteAudio is <audio> element on pag
          remoteAudio.srcObject = e.stream;
          remoteAudio.play();
        };

        var remoteStream = new MediaStream();
        console.log(peerconnection.getReceivers());
        peerconnection.getReceivers().forEach(function (receiver) {
          console.log(receiver);
          remoteStream.addTrack(receiver.track);
        });
      });
    
      if(session.direction === 'incoming'){
          incomingCallAudio.play();
      } else {
        console.log('con', session.connection)
        session.connection.addEventListener('addstream', function(e){
          incomingCallAudio.pause();
          remoteAudio.srcObject = e.stream;
        });      
      }
      updateUI();

  });

  function updateHA(){
      var xhttp = new XMLHttpRequest();
      var HAURL = CONFIG.serverUrl +'/api/states/' + CONFIG.sensorHA;
      var dane = {
          "state": SIP_INTERCOM.status,
          "attributes" : {
                            "acceptCallBtn": SIP_INTERCOM.acceptCallBtn,
                            "rejectCallBtn": SIP_INTERCOM.rejectCallBtn,
                            "endCallBtn": SIP_INTERCOM.endCallBtn,
                            "makeCallBtn": SIP_INTERCOM.makeCallBtn,
                            "log": SIP_INTERCOM.log
                          }
        };
      xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
          
        }
      };
      xhttp.open("POST", HAURL, true);
      xhttp.setRequestHeader("Authorization", "Bearer " + CONFIG.authToken);
      xhttp.setRequestHeader("Content-Type", "application/json");
      xhttp.send(JSON.stringify(dane));
  };

  function updateUI(){
    if(session){
        if(session.isInProgress()){
            if(session.direction === 'incoming'){
                SIP_INTERCOM.log = 'Nadchodzace połączenie: ' + session.remote_identity ;
                SIP_INTERCOM.status = 'incomming';
                SIP_INTERCOM.acceptCallBtn = true;
                SIP_INTERCOM.rejectCallBtn = true;
                SIP_INTERCOM.endCallBtn = false;
                SIP_INTERCOM.makeCallBtn = false;
              }else{
                SIP_INTERCOM.status = 'calling',
                SIP_INTERCOM.log = 'Łączę z domofonem' ;
                SIP_INTERCOM.acceptCallBtn = false;
                SIP_INTERCOM.rejectCallBtn = false;
                SIP_INTERCOM.endCallBtn = true;
                SIP_INTERCOM.makeCallBtn = false;            
              }
        }else if(session.isEstablished()){
            SIP_INTERCOM.status = 'connected',
            SIP_INTERCOM.log = 'Połączenie nawiązano';
            SIP_INTERCOM.acceptCallBtn = false;
            SIP_INTERCOM.rejectCallBtn = false;
            SIP_INTERCOM.endCallBtn = true;
            SIP_INTERCOM.makeCallBtn = false;
            incomingCallAudio.pause();
        }
    }else{
        SIP_INTERCOM.status = 'ready',
        SIP_INTERCOM.log = 'Gotowy';
        SIP_INTERCOM.acceptCallBtn = false;
        SIP_INTERCOM.rejectCallBtn = false;
        SIP_INTERCOM.endCallBtn = false;
        SIP_INTERCOM.makeCallBtn = true;
        incomingCallAudio.pause();
    }
    //microphone mute icon
    if(session && session.isMuted().audio){
// muted
    }else{
// unmuted
    }
    updateHA();
};
