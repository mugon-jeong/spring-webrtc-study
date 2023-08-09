"use client";
import { CompatClient, Stomp } from "@stomp/stompjs";
import React, { useEffect, useRef, useState } from "react";
import uuid from "react-uuid";
import SockJS from "sockjs-client";
const Page = () => {
  const peerConnectionConfig = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };
  const user = uuid().substring(0, 8);
  const roomId = "roomA";
  const [text, setText] = useState("");
  const [callBackData, setCallBackData] = useState("");
  const client = useRef<CompatClient>();
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
        pcRef.current?.addTrack(track, stream);
      });

      pcRef.current!.onicecandidate = (e) => {
        console.log("ice", e.candidate);
        if (e.candidate) {
          if (!client.current) {
            return;
          }
          console.log("recv candidate");
          client.current.publish({
            destination: `/pub/room/${roomId}`,
            body: JSON.stringify({
              type: "CANDIDATE",
              roomId: roomId,
              from: user,
              candidate: e.candidate,
            }),
          });
        }
      };

      // 남의 stream 데이터 track 등록
      pcRef.current!.ontrack = (e) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = e.streams[0];
        }
      };
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

  // peerA가 peerB에게 보내줄 sdp가 담긴 offer 생성
  const createOffer = async () => {
    console.log("createOffer");
    if (!(pcRef.current && client.current)) {
      return;
    }
    try {
      // offer 생성
      const sdp = await pcRef.current?.createOffer();
      // 자신의 sdp로 LocalDescription 설정
      pcRef.current!.setLocalDescription(sdp);
      console.log("sent the offer");
      // offer 전달
      client.current.publish({
        destination: `/pub/room/${roomId}`,
        body: JSON.stringify({
          type: "OFFER",
          roomId: roomId,
          from: user,
          sdp: sdp,
        }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  // peerB가 peerA에게 전달할 answer 생성
  const createAnswer = async (sdp: any) => {
    // sdp : PeerA에게서 전달받은 offer
    console.log("createAnswer");
    if (!(pcRef.current && client.current)) {
      return;
    }
    try {
      // PeerA가 전달해준 offer를 RemoteDescription에 등록
      await pcRef.current!.setRemoteDescription(sdp);
      // answer 생성
      const answerSdp = await pcRef.current?.createAnswer();
      // answer를 LocalDescription에 등록(PeerB 기준)
      pcRef.current!.setLocalDescription(answerSdp);
      console.log("sent the answer");
      client.current.publish({
        destination: `/pub/room/${roomId}`,
        body: JSON.stringify({
          type: "ANSWER",
          roomId: roomId,
          from: user,
          sdp: answerSdp,
        }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDisConnect = () => {
    if (!client.current) return;
    client.current.disconnect();
  };
  const subscribe = () => {
    if (!client.current) return;

    client.current!.subscribe(`/sub/room/${roomId}`, async ({ body }) => {
      const content = JSON.parse(body);
      console.log("content", content);
      console.log("TYPE: " + content.type);
      switch (content.type) {
        case "JOIN":
          if (content.allUsers.length > 0) {
            console.log("방 참가: " + roomId);
            createOffer();
          } else {
            console.log("방 생성: " + roomId);
          }
          break;
        case "OFFER":
          console.log("GET OFFER: ", content.sdp);
          // remote description 등록
          // answer 전송
          if (content.from !== user) {
            createAnswer(content.sdp);
          }

          break;
        case "ANSWER":
          console.log("GET ANSWER: ", content.sdp);
          if (content.from !== user) {
            if (pcRef.current) {
              await pcRef.current.setRemoteDescription(content.sdp);
            }
          }
          break;
        case "CANDIDATE":
          console.log("GET ICE CANDIDATE: ", content.candidate);
          if (content.from !== user) {
            if (pcRef.current) {
              // let candidate = new RTCIceCandidate(content.candidate);
              await pcRef.current.addIceCandidate(content.candidate);
            }
          }

          break;
      }
    });
  };

  const connectHandler = () => {
    client.current = Stomp.over(() => {
      const sock = new SockJS("https://localhost:8080/signal");
      return sock;
    });
    client.current.connect({}, () => {
      subscribe();
      client.current!.publish({
        destination: `/pub/room/${roomId}`,
        body: JSON.stringify({
          type: "JOIN",
          roomId: roomId,
          from: user,
        }),
      });
    });
  };
  useEffect(() => {
    pcRef.current = new RTCPeerConnection();
    // 소켓 연결
    connectHandler();
    // peer 커넥션 생성
    // peerConnection 생성
    // iceServer는 stun 설정이고 google의 public stun server 사용
    getMedia();
  }, [client.current]);
  return (
    <div>
      <div>version4</div>

      <button onClick={connectHandler}>Connect</button>
      <button onClick={handleDisConnect}>DisConnect</button>

      <input value={text} onChange={(e) => setText(e.target.value)} />
      <div>{callBackData}</div>
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
      <button onClick={createOffer}>send Offer</button>
    </div>
  );
};

export default Page;
