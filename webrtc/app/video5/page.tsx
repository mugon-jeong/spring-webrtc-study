"use client";
import React, { useEffect, useRef, useState } from "react";
import uuid from "react-uuid";
const peerConnectionConfig = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};
const Page = () => {
  const user = uuid().substring(0, 8);
  const roomId = "roomA";
  const socket = useRef<WebSocket>();
  // 자신의 비디오
  const myVideoRef = useRef<HTMLVideoElement>(null);
  // 다른 사람의 비디오
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  // peerConnection
  const pcRef = useRef<RTCPeerConnection>();
  const getMedia = async () => {
    try {
      // 자신의 스트림 정보
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      if (myVideoRef.current) {
        myVideoRef.current.srcObject = stream;
      }
      // 스트림을 peerConnection 등록
      stream.getTracks().forEach((track) => {
        if (!pcRef.current) {
          return;
        }
        pcRef.current.addTrack(track, stream);
      });
    } catch (e) {
      console.log(e);
    }
  };

  const handleMuteMyVideo = async () => {
    if (!myVideoRef.current || !myVideoRef.current.srcObject) return;
    const stream: any | MediaStream = myVideoRef.current.srcObject;
    stream.getAudioTracks().forEach((track: any) => {
      track.enabled = !track.enabled;
    });
  };

  const handleCamera = async () => {
    if (!myVideoRef.current || !myVideoRef.current.srcObject) return;
    const stream: any | MediaStream = myVideoRef.current.srcObject;
    stream.getVideoTracks().forEach((track: any) => {
      track.enabled = !track.enabled;
    });
  };

  function handleNewICECandidateMessage(ice: any) {
    let candidate = new RTCIceCandidate(ice);
    console.log("Adding received ICE candidate: " + JSON.stringify(candidate));
    pcRef.current!.addIceCandidate(candidate);
  }

  const handleAnswerMessage = (sdp: any) => {
    if (!pcRef.current) return;
    pcRef.current.setRemoteDescription(sdp);
  };

  // 생성자가 참가자에게 전달할 answer 생성
  const createAnswer = async (sdp: any) => {
    // sdp : 참가자에게서 전달받은 offer
    console.log("createAnswer");
    if (!(pcRef.current && socket.current)) {
      return;
    }
    try {
      // 참가자가 전달해준 offer를 RemoteDescription에 등록
      await pcRef.current!.setRemoteDescription(sdp);
      // answer 생성
      const answerSdp = await pcRef.current?.createAnswer();
      // answer를 LocalDescription에 등록(생성자 기준)
      pcRef.current!.setLocalDescription(answerSdp);
      console.log("sent the answer");
      sendToServer({
        type: "answer",
        roomId: roomId,
        from: user,
        sdp: answerSdp,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const createOffer = async () => {
    if (!pcRef.current) {
      console.error("peerConnection Disconnected");
      return;
    }
    try {
      // offer 생성
      await pcRef.current
        .createOffer()
        .then((sdp) => {
          // 자신의 sdp로 LocalDescription 설정
          return pcRef.current!.setLocalDescription(sdp);
        })
        .then(() => {
          // offer 전달
          sendToServer({
            type: "offer",
            roomId: roomId,
            from: user,
            sdp: pcRef.current!.localDescription,
          });
          console.log("sent the offer");
        });
    } catch (e) {
      console.error(e);
    }
  };

  /** peerConnection 과 관련된 이벤트 처리
   * 다른 peer 와 연결되었을 때 remote_video show 상태로로, 끊졌을때는 remote_video 를 hide 상태로 변경
   * **/
  function handleICEConnectionStateChangeEvent() {
    let status = pcRef.current!.iceConnectionState;

    if (status === "connected") {
      console.log("status : " + status);
    } else if (status === "disconnected") {
      console.log("status : " + status);
    }
  }

  const handleTrackEvent = (event: RTCTrackEvent) => {
    console.log("Track Event: set stream to remote video element");
    remoteVideoRef.current!.srcObject = event.streams[0];
  };

  const handleICECandidateEvent = (event: RTCPeerConnectionIceEvent) => {
    console.log("call handleICECandidateEvent");
    if (event.candidate === null) {
      console.log("[iceCandidate] cut");
      return;
    }
    if (event.candidate) {
      sendToServer({
        from: user,
        roomId: roomId,
        type: "candidate",
        candidate: event.candidate,
      });
      console.log("ICE Candidate Event: ICE candidate sent");
    }
  };
  const createPeerConnection = () => {
    console.log("[createPeerConnection]");
    // event handlers for the ICE negotiation process
    pcRef.current!.onicecandidate = handleICECandidateEvent;
    pcRef.current!.ontrack = handleTrackEvent;
    // pcRef.current!.oniceconnectionstatechange =
    //   handleICEConnectionStateChangeEvent;
  };
  const sendToServer = (msg: Object) => {
    let msgJSON = JSON.stringify(msg);
    socket.current!.send(msgJSON);
  };

  useEffect(() => {
    // 소켓 연결
    socket.current = new WebSocket("ws://localhost:8080/signal");
    pcRef.current = new RTCPeerConnection(peerConnectionConfig);
    socket.current.onopen = () => {
      console.log("Connected to the signaling server");
      socket.current!.send(
        JSON.stringify({
          type: "join_room",
          from: user,
          roomId: roomId,
        })
      );
    };

    if (socket.current) {
      socket.current.onmessage = (msg) => {
        console.log("Get message", msg.data);
        var content = JSON.parse(msg.data);
        switch (content.type) {
          // when somebody wants to call us
          case "all_users":
            console.log("JOIN_ROOM", content);
            if (content.allUsers.length > 0) {
              // connection 생성
              console.log("나는 두번째 참가자");
              console.log("offer 생성");
              createOffer();
            } else {
              console.log("나는 방 생성자");
            }
            break;
          case "offer":
            if (content.from == user) return;
            console.log("signal OFFER receive");
            createAnswer(content.sdp);
            break;
          case "answer":
            if (content.from == user) return;
            console.log("signal ANSWER receive");
            handleAnswerMessage(content.sdp);
            break;
          case "candidate":
            console.log("signal Candidate receive");
            // if (content.from == user) return;
            handleNewICECandidateMessage(content.candidate);
            break;
          default:
            break;
        }
      };
    }
    if (pcRef.current) {
      getMedia();
      createPeerConnection();
    }

    return () => {
      console.log("clean up");
      socket.current?.close();
    };
  }, [pcRef.current]);
  return (
    <div>
      <div>version5</div>
      <div>내비디오</div>
      <video
        id="remotevideo"
        style={{
          width: 240,
          height: 240,
          backgroundColor: "black",
        }}
        ref={myVideoRef}
        autoPlay
        controls
      />
      <button onClick={handleMuteMyVideo}>Mute</button>
      <button onClick={handleCamera}>Camera</button>

      <div>남 비디오</div>
      <video
        id="remotevideo"
        style={{
          width: 240,
          height: 240,
          backgroundColor: "black",
        }}
        ref={remoteVideoRef}
        autoPlay
        controls
      />
      <button onClick={createPeerConnection}>ICE</button>
    </div>
  );
};

export default Page;
