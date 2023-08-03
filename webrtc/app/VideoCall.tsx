"use client"
import {useEffect, useRef} from "react";
import {io, Socket} from "socket.io-client";

const VideoCall = () => {
    // 소켓 연결 주소
    const socketURL = "";
    //  name
    const roomName = "";
    // 소켓정보
    const socketRef = useRef<Socket>();
    // 자신의 비디오
    const myVideoRef = useRef<HTMLVideoElement>(null);
    // 다른 사람의 비디오
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    // peerConnection
    const pcRef = useRef<RTCPeerConnection>();

    // 자신의 미디어 스트림 받기
    const getMedia = async () => {
        try {
            // 자신의 스트림 정보
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            })
            if (myVideoRef.current) {
                myVideoRef.current.srcObject = stream;
            }
            // 스트림을 peerConnection 등록
            stream.getTracks().forEach((track) => {
                if (!pcRef.current) {
                    return;
                }
                pcRef.current.addTrack(track, stream);
            })
            // iceCandidate 이벤트
            pcRef.current!.onicecandidate = (e) => {
                if (e.candidate) {
                    if (!socketRef.current) {
                        return;
                    }
                    console.log("recv candidate")
                    socketRef.current?.emit("candidate", e.candidate, roomName)
                }
            }
            // 남의 stream 데이터 track 등록
            pcRef.current!.ontrack = (e) => {
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = e.streams[0];
                }
            }
        } catch (e) {
            console.error(e);
        }
    }

    // peerA가 peerB에게 보내줄 sdp가 담긴 offer 생성
    const createOffer = async () => {
        console.log("createOffer")
        if (!(pcRef.current && socketRef.current)) {
            return;
        }
        try {
            // offer 생성
            const sdp = await pcRef.current?.createOffer();
            // 자신의 sdp로 LocalDescription 설정
            pcRef.current?.setLocalDescription(sdp);
            console.log("sent the offer");
            // offer 전달
            socketRef.current?.emit("offer", sdp, roomName);
        } catch (e) {
            console.error(e)
        }
    }
    // peerB가 peerA에게 전달할 answer 생성
    const createAnswer = async (sdp: RTCSessionDescription) => {
        // sdp : PeerA에게서 전달받은 offer
        console.log("createAnswer")
        if (!(pcRef.current && socketRef.current)) {
            return;
        }
        try {
            // PeerA가 전달해준 offer를 RemoteDescription에 등록
            pcRef.current?.setRemoteDescription(sdp);
            // answer 생성
            const answerSdp = await pcRef.current?.createAnswer();
            // answer를 LocalDescription에 등록(PeerB 기준)
            pcRef.current?.setLocalDescription(answerSdp);
            console.log("sent the answer");
            socketRef.current?.emit("answer", answerSdp, roomName);
        } catch (e) {
            console.error(e);
        }
    }

    useEffect(() => {
        // 소켓 연결
        socketRef.current = io(socketURL);

        // peerConnection 생성
        // iceServer는 stun 설정이고 google의 public stun server 사용
        pcRef.current = new RTCPeerConnection({
            iceServers: [
                {
                    urls: "stun:stun.l.google.com:19302"
                }
            ]
        })
        // 기존 유저가 있고, 새로운 유저가 들어왔다면 오퍼 생성
        socketRef.current?.on("all_users", (allUsers: Array<{ id: string }>) => {
            if (allUsers.length > 0) {
                createOffer();
            }
        })

        // offer를 전달받은 PeerB
        // offer를 들고 만들어둔 answer 함수 실행
        socketRef.current?.on("getOffer", (sdp: RTCSessionDescription) => {
            console.log("recv offer")
            createAnswer(sdp);
        })

        // answer를 전달받을 PeerA
        // answer를 전달 받아 PeerA의 RemoteDescription에 등록
        socketRef.current?.on("getAnswer", (sdp: RTCSessionDescription) => {
            console.log("recv answer");
            if (!pcRef.current) {
                return;
            }
            pcRef.current?.setRemoteDescription(sdp);
        })

        // 서로의 candidate를 전달받아 등록
        socketRef.current?.on("getCandidate", async (candidate: RTCIceCandidate) => {
            if (!pcRef.current) {
                return;
            }
            await pcRef.current?.addIceCandidate(candidate);
        })

        // 마운트시 해당 방의 roomName을 서버에 전달
        socketRef.current?.emit("join_room", {
            room: roomName
        });

        getMedia();

        return () => {
            // 언마운트시 socket disconnect
            if (socketRef.current) {
                socketRef.current?.disconnect();
            }
            if (pcRef.current) {
                pcRef.current?.close();
            }
        }

    }, [])
    return (
        <div>
            <video
                id="remotevideo"
                style={{
                    width: 240,
                    height: 240,
                    backgroundColor: "black"
                }}
                ref={myVideoRef}
                autoPlay
            />
            <video
                id="remotevideo"
                style={{
                    width: 240,
                    height: 240,
                    backgroundColor: "black"
                }}
                ref={remoteVideoRef}
                autoPlay
            />
        </div>
    )
}