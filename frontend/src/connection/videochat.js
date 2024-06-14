import React, { useEffect, useState, useRef } from "react";
import Peer from "simple-peer";
import styled from "styled-components";
import { socket } from "../connection/socket";

const Container = styled.div`
  height: 100vh;
  width: 100%;
  flex-direction: column;
`;

const Row = styled.div`
  width: 100%;
`;

const Video = styled.video`
  border: 1px solid blue;
`;

function VideoChatApp(props) {

  const [stream, setStream] = useState();
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState();
  const [callAccepted, setCallAccepted] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const userVideo = useRef();
  const partnerVideo = useRef();

    
      const setupPeerConnection = async () => {
        const configuration = {
          iceServers: [
            {
              urls: 'stun:global.stun.twilio.com:3478',
            },
            {
              urls: 'turn:global.turn.twilio.com:3478',
              username: '',
              credential: '',
            },
          ],
        };
    
        const peerConnection = new RTCPeerConnection(configuration);
    
        // Add event handlers
        peerConnection.onicecandidate = event => {
          if (event.candidate) {
            // Send the ICE candidate to the remote peer
          }
        };
    
        peerConnection.oniceconnectionstatechange = event => {
          if (peerConnection.iceConnectionState === 'failed' || peerConnection.iceConnectionState === 'disconnected') {
            // Handle connection failure
          }
        };
    
        peerConnection.onnegotiationneeded = async () => {
          try {
            await peerConnection.setLocalDescription(await peerConnection.createOffer());
            // Send the local description to the remote peer
          } catch (error) {
            // Handle offer creation/setLocalDescription error
          }
        };
      };
    
      useEffect(() => {
        navigator.mediaDevices
          .getUserMedia({ video: true, audio: true })
          .then((stream) => {
            setStream(stream);
            if (userVideo.current) {
              userVideo.current.srcObject = stream;
            }
          });
    
        // setupPeerConnection();
    

    socket.on("hey", (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setCallerSignal(data.signal);
    });
  }, []);

  function callPeer(id) {
    setIsCalling(true);
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream,
    });
      

    peer.on("signal", (data) => {
      socket.emit("callUser", {
        userToCall: id,
        signalData: data,
        from: props.mySocketId,
      });
    });

    peer.on("stream", (stream) => {
      if (partnerVideo.current) {
        partnerVideo.current.srcObject = stream;
      }
    });

    socket.on("callAccepted", (signal) => {
      setCallAccepted(true);
      peer.signal(signal);
    });
  }

  function acceptCall() {
    setCallAccepted(true);
    setIsCalling(false);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream,
    });
    peer.on("signal", (data) => {
      socket.emit("acceptCall", { signal: data, to: caller });
    });

    peer.on("stream", (stream) => {
      partnerVideo.current.srcObject = stream;
    });
    console.log(callerSignal);
    peer.signal(callerSignal);
  }

  let UserVideo;
  if (stream) {
    UserVideo = (
      <Video
        playsInline
        muted
        ref={userVideo}
        autoPlay
        style={{ width: "60%", height: "60%" }}
      />
    );
  }

  let mainView;

  if (callAccepted) {
    mainView = (
      <Video
        playsInline
        ref={partnerVideo}
        autoPlay
        style={{ width: "60%", height: "60%" }}
      />
    );
  } else if (receivingCall) {
    mainView = (
      <div>
        <h1>{props.opponentUserName} is calling you</h1>
        <button onClick={acceptCall}>
          <h1>Accept</h1>
        </button>
      </div>
    );
  } else if (isCalling) {
    mainView = (
      <div>
        <h1>Currently calling {props.opponentUserName}...</h1>
      </div>
    );
  }
  // else {
  //   mainView = (
  //     <button
  //       onClick={() => {
  //         callPeer(props.opponentSocketId);
  //       }}
  //     >
  //       <h1>Chat with your friend while you play!</h1>
  //     </button>
  //   );
  // }

  return (
    <Container>
      <Row>
        {mainView}
        {UserVideo}
      </Row>
    </Container>
  );
}

export default VideoChatApp;