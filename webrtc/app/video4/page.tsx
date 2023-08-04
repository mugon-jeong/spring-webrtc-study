"use client";
import { CompatClient, Stomp } from "@stomp/stompjs";
import React, { useEffect, useRef, useState } from "react";
import uuid from "react-uuid";
import SockJS from "sockjs-client";
const Page = () => {
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
            destination: `/pub/room/${roomId}/ice`,
            body: JSON.stringify({
              type: "ICE",
              roomId: roomId,
              sender: user,
              ice: e.candidate,
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

  const sendHandler = () => {
    if (!client.current) return;
    client.current.send(
      "/app/hello",
      {},
      JSON.stringify({
        name: text,
      })
    );
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
        destination: `/pub/room/${roomId}/offer`,
        body: JSON.stringify({
          type: "OFFER",
          roomId: roomId,
          sender: user,
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
        destination: `/pub/room/${roomId}/answer`,
        body: JSON.stringify({
          type: "OFFER",
          roomId: roomId,
          sender: user,
          answer: answerSdp,
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

    client.current!.subscribe(`/sub/room/${roomId}`, ({ body }) => {
      // const data = JSON.parse(body);
      console.log("Join Res", body);
      // 기존 유저가 존재하면 offer 생성
      if (body !== user) {
        // remote description 등록
        // answer 전송
        createOffer();
      }
    });

    client.current!.subscribe(`/sub/room/${roomId}/offer`, ({ body }) => {
      const data = JSON.parse(body);
      console.log("Get Offer" + data.sender + ":" + user);

      // 내가 만든 오퍼가 아닐때
      if (data.sender !== user) {
        console.log("offer sdp", data.sdp);
        // remote description 등록
        // answer 전송
        createAnswer(data.sdp);
      }
    });
    client.current!.subscribe(
      `/sub/room/${roomId}/answer`,
      async ({ body }) => {
        const data = JSON.parse(body);
        console.log("Get Answer" + data.sender + ":" + user);
        // 내가 만든 answer가 아닐때
        if (data.sender !== user) {
          // remote description 등록
          // answer 등록
          if (!pcRef.current) return;
          await pcRef.current.setRemoteDescription(data.answer);
        }
      }
    );
    client.current!.subscribe(`/sub/room/${roomId}/ice`, ({ body }) => {
      const data = JSON.parse(body);
      console.log("Get ice" + data.sender + ":" + user);
      // 내가 만든 오퍼가 아닐때
      if (data.sender !== user) {
        // remote description 등록
        // ice 등록
        pcRef.current!.addIceCandidate(data.ice);
      }
    });
  };

  const connectHandler = () => {
    client.current = Stomp.over(() => {
      const sock = new SockJS("http://172.30.1.12:8080/signal");
      return sock;
    });
    client.current.connect({}, () => {
      subscribe();
      client.current!.publish({
        destination: `/pub/room/${roomId}`,
        body: JSON.stringify({
          type: "JOIN",
          roomId: roomId,
          sender: user,
        }),
      });
    });
  };
  useEffect(() => {
    // 소켓 연결
    connectHandler();
    // peer 커넥션 생성
    // peerConnection 생성
    // iceServer는 stun 설정이고 google의 public stun server 사용
    pcRef.current = new RTCPeerConnection();

    getMedia();
  }, [client.current]);
  return (
    <div>
      <div>version4</div>

      <button onClick={connectHandler}>Connect</button>
      <button onClick={handleDisConnect}>DisConnect</button>

      <input value={text} onChange={(e) => setText(e.target.value)} />
      <button onClick={sendHandler}>Send</button>
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
