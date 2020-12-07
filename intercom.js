var	sip_wss_url = 'wss://homeassistant.local:4443/ws'
var sip_server = 'homeassistant.local'
var sip_username = '8003'
var sip_password = '123456'
var sip_doorbell_username = '9903'

var remoteAudio = document.getElementById('remote');
var messageSpace = document.getElementById('log');
let acceptCallBtn = document.getElementById('btn-accept-call');
let rejectCallBtn = document.getElementById('btn-reject-call');
let endCallBtn = document.getElementById('btn-end-call');
let makeCallBtn = document.getElementById('btn-make-call');
acceptCallBtn.style.display = 'none';
rejectCallBtn.style.display = 'none';
endCallBtn.style.display = 'none';
makeCallBtn.style.display = 'none';

 JsSIP.debug.disable();



function initJsSIP() {
  // Audio
  //   Local audio stream (input from mic, output to speaker) is handled
  //   by getUserMedia which is called under the covers by JSSIP.
  //   getUserMedia checks that the user has
  //   given permission for this code to access the mic/speaker.
  //   Remote:
  //   The html tag and element <audio> represents the peer's audio stream to listen to.

  //console.log('Loading SIPPhone');
  messageSpace.innerHTML = 'Loading SIPPhone';

  let socket = new JsSIP.WebSocketInterface(sip_wss_url);
  let configuration = {
      sockets  : [ socket ],
      uri      : `sip:${sip_username}@${sip_server}`,
      password : sip_password
  };
  //Create a new SIP User Agent, and start it (connect to SIP server, Register, etc.)
  this.sipPhone = new JsSIP.UA(configuration);
  this.sipPhone.start();


  // Register callbacks for outgoing call events.
  // It appears the following eventHandlers are JsSIP.RTCSession Events which can
  // also be registered during Session Outgoing Events, which is what I'll do for now.
  var eventHandlers = {
      'progress': function(e) {
        //console.log('call is in progress');
        messageSpace.innerHTML = 'call is in progress';
      },
      'failed': function(e) {
        //console.log('call failed with cause: '+ e.cause);
        messageSpace.innerHTML = 'call failed with cause: '+ e.cause;
      },
      'ended': function(e) {
        //console.log('call ended with cause: '+ e.cause);
        messageSpace.innerHTML = 'call ended with cause: '+ e.cause;
      },
      'confirmed': function(e) {
        //console.log('call confirmed');
        messageSpace.innerHTML = 'call confirmed';
      },
  };

  let callOptions = {
    //'eventHandlers'   : eventHandlers,
    mediaConstraints: { audio: true, video: false },
    rtcOfferConstraint: {offerToReceiveAudio: true, offerToReceiveVideo: false}
  };

  //Register callbacks to tell us SIP Registration events
  this.sipPhone.on("registered", () => {
    //console.log('SIPPhone Registered with SIP Server');
    messageSpace.innerHTML = 'SIPPhone Registered with SIP Server';
    acceptCallBtn.style.display = 'none';
    rejectCallBtn.style.display = 'none';
    endCallBtn.style.display = 'none';
    makeCallBtn.style.display = 'inline-flex';
  });
  this.sipPhone.on("unregistered", () => {
    //console.log('SIPPhone Unregistered with SIP Server');
    messageSpace.innerHTML = 'SIPPhone Unregistered with SIP Server';
    acceptCallBtn.style.display = 'none';
    rejectCallBtn.style.display = 'none';
    endCallBtn.style.display = 'none';
    makeCallBtn.style.display = 'none';
  });
  this.sipPhone.on("registrationFailed", () => {
    //console.log('SIPPhone Failed Registeration with SIP Server');
    messageSpace.innerHTML = 'SIPPhone Failed Registeration with SIP Server';
    acceptCallBtn.style.display = 'none';
    rejectCallBtn.style.display = 'none';
    endCallBtn.style.display = 'none';
    makeCallBtn.style.display = 'none';
  });

  //Register a callback when a new WebRTC media session is established
  //  which occurs on incoming or outgoing calls.
  this.sipPhone.on("newRTCSession", function(data){
      let session = data.session;
      let peerconnection = session.connection
      if (session.direction === "incoming") {
          console.log('Session - Incoming call from ' + session.remote_identity );
          messageSpace.innerHTML = 'Session - Incoming call from ' + session.remote_identity ;
          acceptCallBtn.style.display = 'inline-flex';
          rejectCallBtn.style.display = 'none';
          endCallBtn.style.display = 'none';
          makeCallBtn.style.display = 'none';

          //Register for various incoming call session events
          session.on("accepted", () => {
              console.log('Incoming - call accepted');
              messageSpace.innerHTML = 'Incoming - call accepted';
              acceptCallBtn.style.display = 'none';
              rejectCallBtn.style.display = 'none';
              endCallBtn.style.display = 'inline-flex';
              makeCallBtn.style.display = 'none';
              });
          session.on("confirmed", () => {
            console.log('Incoming - call confirmed');
            messageSpace.innerHTML = 'Incoming - call confirmed';
          });
          session.on("ended", () => {
            console.log('Incoming - call ended');
            messageSpace.innerHTML = 'Incoming - call ended'; 
            acceptCallBtn.style.display = 'none';
            rejectCallBtn.style.display = 'none';
            endCallBtn.style.display = 'none';
            makeCallBtn.style.display = 'inline-flex';
          // cleanup  
          });
          session.on("failed", () =>{
            console.log('Incoming - call failed');
            messageSpace.innerHTML = 'Incoming - call failed'; 
            acceptCallBtn.style.display = 'none';
            rejectCallBtn.style.display = 'none';
            endCallBtn.style.display = 'none';
            makeCallBtn.style.display = 'inline-flex';
            //cleanup
          });
          session.on("peerconnection", () => {
              session.connection.addEventListener("addstream", (e) => {
                  console.log('Incoming - adding audiostream');
                  messageSpace.innerHTML = 'Incoming - adding audiostream';
                  acceptCallBtn.style.display = 'none';
                  rejectCallBtn.style.display = 'none';
                  endCallBtn.style.display = 'inline-flex';
                  makeCallBtn.style.display = 'none';
                  remoteAudio.srcObject = e.stream;
                  remoteAudio.play();
              })
          });
          acceptCallBtn.addEventListener('click', () => {
              session.answer(callOptions);
              acceptCallBtn.style.display = 'none';
              rejectCallBtn.style.display = 'none';
              endCallBtn.style.display = 'inline-flex';
              makeCallBtn.style.display = 'none';
          });
          endCallBtn.addEventListener('click', () => {
              session.terminate();
              acceptCallBtn.style.display = 'none';
              rejectCallBtn.style.display = 'none';
              endCallBtn.style.display = 'none';
              makeCallBtn.style.display = 'inline-flex';
          });
          rejectCallBtn.addEventListener('click', () => {
              session.answer(callOptions);
              setTimeout(() => {
                  session.terminate();
              }, 1000);
              acceptCallBtn.style.display = 'none';
              rejectCallBtn.style.display = 'none';
              endCallBtn.style.display = 'none';
              makeCallBtn.style.display = 'inline-flex';
          });
      }
      if (session.direction === "outgoing") {
          console.log('Session - Outgoing Call Event');
          messageSpace.innerHTML = 'Session - Outgoing Call Event';
          acceptCallBtn.style.display = 'none';
          rejectCallBtn.style.display = 'none';
          endCallBtn.style.display = 'inline-flex';
          makeCallBtn.style.display = 'none';
          endCallBtn.addEventListener('click', () => session.terminate());
          //Register for various call session events:
          session.on('progress', function(e) {
              console.log('Outgoing - call is in progress');
              messageSpace.innerHTML = 'Outgoing - call is in progress';
              acceptCallBtn.style.display = 'none';
              rejectCallBtn.style.display = 'none';
              endCallBtn.style.display = 'inline-flex';
              makeCallBtn.style.display = 'none';
          });
          session.on('failed', function(e) {
              console.log('Outgoing - call failed with cause: '+ e.cause);
              messageSpace.innerHTML = 'Outgoing - call failed with cause: '+ e.cause;
              if (e.cause === JsSIP.C.causes.SIP_FAILURE_CODE) {
                  console.log('  Called party may not be reachable');
                  messageSpace.innerHTML = 'Called party may not be reachable';
              };
              acceptCallBtn.style.display = 'none';
              rejectCallBtn.style.display = 'none';
              endCallBtn.style.display = 'none';
              makeCallBtn.style.display = 'inline-flex';
              //droidCard.cleanup(hass);
          });
          session.on('confirmed', function(e) {
              console.log('Outgoing - call confirmed');
              messageSpace.innerHTML = 'Outgoing - call confirmed';
              acceptCallBtn.style.display = 'none';
              rejectCallBtn.style.display = 'none';
              endCallBtn.style.display = 'inline-flex';
              makeCallBtn.style.display = 'none';
          });
          session.on('ended', function(e) {
              console.log('Outgoing - call ended with cause: '+ e.cause);
              messageSpace.innerHTML = 'Outgoing - call ended with cause: '+ e.cause;
              acceptCallBtn.style.display = 'none';
              rejectCallBtn.style.display = 'none';
              endCallBtn.style.display = 'none';
              makeCallBtn.style.display = 'inline-flex';
              //droidCard.cleanup(hass);
          });
          //Note: peerconnection never fires for outoing, but I'll leave it here anyway.
          session.on("peerconnection", () => {
            session.connection.addEventListener("addstream", (e) => {
                console.log('Outgoing - Peer Connection');
                messageSpace.innerHTML = 'Outgoing - Peer Connection';
                acceptCallBtn.style.display = 'none';
                rejectCallBtn.style.display = 'none';
                endCallBtn.style.display = 'inline-flex';
                makeCallBtn.style.display = 'none';
                remoteAudio.srcObject = e.stream;
                remoteAudio.play();
            })
          });
          // to są moje testy!!!

          session.connection.ontrack_xxx = function(e) {
            console.log('Outgoing - on track - addstream');
            messageSpace.innerHTML = 'Outgoing - addstream';
            acceptCallBtn.style.display = 'none';
            rejectCallBtn.style.display = 'none';
            endCallBtn.style.display = 'inline-flex';
            makeCallBtn.style.display = 'none';
            remoteAudio.srcObject = e.streams[0];
            remoteAudio.play();
          };
          //Note: 'connection' is the RTCPeerConnection instance - set after calling ua.call().
          //    From this, use a WebRTC API for registering event handlers.
          //Note: Was not able to get session.connection.onaddtrack = function(e) to work (teraz jest onaddstream = )
          session.connection.onaddstream = function(e) {
              console.log('Outgoing - addstream');
              messageSpace.innerHTML = 'Outgoing - addstream';
              acceptCallBtn.style.display = 'none';
              rejectCallBtn.style.display = 'none';
              endCallBtn.style.display = 'inline-flex';
              makeCallBtn.style.display = 'none';
              remoteAudio.srcObject = e.streams[0];
              remoteAudio.play();
          };
          //Handle Browser not allowing access to mic and speaker
          session.on("getusermediafailed", function(DOMError) {
              console.log('Get User Media Failed Call Event ' + DOMError );
              messageSpace.innerHTML = 'Get User Media Failed Call Event ' + DOMError;
          });
      }

  });

  let MakeCallBtn = document.getElementById('btn-make-call');
  MakeCallBtn.addEventListener('click', () => {
      console.log('Calling '+`sip:${sip_doorbell_username}@${sip_server}`);
      messageSpace.innerHTML = 'Calling '+`sip:${sip_doorbell_username}`;
      this.sipPhone.call(`sip:${sip_doorbell_username}@${sip_server}`, callOptions);
  });
}
