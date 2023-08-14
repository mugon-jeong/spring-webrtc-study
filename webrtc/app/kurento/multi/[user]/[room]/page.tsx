"use client"
import React, {useEffect, useRef, useState} from 'react';
import useParticipantMap from "@/app/kurento/multi/[user]/[room]/useParticipantMap";
import KurentoVideo from "@/app/kurento/multi/[user]/[room]/kurento_video";

let localStream: MediaStream;
let pcs: any;
const Page = ({params}: { params: { user: string, room: string } }) => {
    const {room, user} = params
    const myVideoRef = useRef<HTMLVideoElement>(null);
    // const pcs = useParticipantMap<string, RTCPeerConnection>();
    const socket = useRef<WebSocket>();
    const [users, setUsers] = useState<Array<{
        id: string,
        stream: MediaStream,
        pc: RTCPeerConnection,
    }>>([]);
    const receiveVideo = ({sender}: {
        sender: string
    }) => {
        const pc = new RTCPeerConnection({
            iceServers: [
                {
                    username: 'user',
                    credential: 's3cr3t',
                    urls: 'turn:192.168.35.47:3478?transport=tcp'
                },
            ],
        });

        // offer 생성 및 전송
        pc!.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
        })
            .then((sdp) => {
                // 자신의 sdp로 LocalDescription 설정
                return pc!.setLocalDescription(new RTCSessionDescription(sdp));
            })
            .then(() => {
                // offer 전달
                console.log("From Receiver send Offer: " + sender)
                sendMessage({
                    id: "receiveVideoFrom",
                    name: sender,
                    sdpOffer: pc!.localDescription!.sdp,
                });
                console.log("sent the offer");
            });

        pc.ontrack = (e) => {
            console.log("Received stream store in users")
            setUsers((oldUsers) => oldUsers.filter((participant) => participant.id !== user));
            setUsers((oldUsers) => [
                ...oldUsers,
                {
                    id: sender,
                    stream: e.streams[0],
                    pc,
                },
            ]);
        };
        pcs = {...pcs, [sender]: pc};
    }
    const presnter = ({sender, peerConnectionLocalStream}: {
        sender: string,
        peerConnectionLocalStream: MediaStream
    }) => {
        const pc = new RTCPeerConnection({
            iceServers: [
                {
                    username: 'user',
                    credential: 's3cr3t',
                    urls: 'turn:192.168.35.47:3478?transport=tcp'
                },
            ],
        });

        // offer 생성 및 전송
        pc!.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
        })
            .then((sdp) => {
                // 자신의 sdp로 LocalDescription 설정
                return pc!.setLocalDescription(new RTCSessionDescription(sdp));
            })
            .then(() => {
                // offer 전달
                sendMessage({
                    id: "receiveVideoFrom",
                    name: sender,
                    sdpOffer: pc!.localDescription!.sdp,
                });
                console.log("sent the offer");
            });

        // 로컬의 미디어 스트림이 존재하면 PeerConnection에 추가해줍니다.
        if (peerConnectionLocalStream) {
            peerConnectionLocalStream.getTracks().forEach((track) => {
                pc.addTrack(track, peerConnectionLocalStream);
            });
        }

        pcs = {...pcs, [sender]: pc};
        return pc;
    }
    const leaveRoom = () => {
        sendMessage({
            id: 'leaveRoom'
        });

        for (var key in pcs) {
            pcs.get(key)!.close();
        }
        pcs.clear();
        socket.current!.close();
    }
    const register = () => {
        sendMessage({
            id: "joinRoom",
            name: user,
            room: room,
        })
    }
    const sendMessage = (message: any) => {
        var jsonMessage = JSON.stringify(message);
        console.log('Sending message: ' + message.id + ":" + message.name);
        socket.current!.send(jsonMessage);
    }
    // 나의 미디어 등록
    useEffect(() => {
        // 자신의 스트림 정보
        navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
        }).then((stream) => {
            if (myVideoRef.current) {
                myVideoRef.current.srcObject = stream;
            }
            localStream = stream;
        });
    }, []);
    useEffect(() => {
        socket.current = new WebSocket("ws://192.168.35.47:8080/kurento");
        socket.current.onopen = () => {
            console.log("Connected to the signaling server");
            console.log(`Register user: ${user}, room: ${room}`);
            register();
        };
        socket.current.onmessage = (message) => {
            let parsedMessage = JSON.parse(message.data);
            console.log("Get Message: " + parsedMessage)
            switch (parsedMessage.id) {
                case 'existingParticipants':
                    presnter({sender: user, peerConnectionLocalStream: localStream});
                    if (parsedMessage.data.length > 0) {
                        console.log("Exist participants: " + parsedMessage.data);
                        parsedMessage.data.forEach((sender: string) => {
                            console.log("Received: " + sender)
                            receiveVideo({sender: sender})
                        })
                    }
                    break;
                case 'newParticipantArrived':
                    console.log("newParticipantArrived: " + parsedMessage.name);
                    receiveVideo({sender: parsedMessage.name});
                    break;
                case 'participantLeft':
                    pcs[parsedMessage.name]?.close()
                    // pcs.remove(parsedMessage.name)
                    break;
                case 'receiveVideoAnswer':
                    console.log("receiveVideoAnswer from: "+parsedMessage.name)
                    const pc:RTCPeerConnection = pcs[parsedMessage.name];
                    if (pc) {
                        console.log(parsedMessage.name+" 의 answer 등록")
                        pc.setRemoteDescription({type: "answer", sdp: parsedMessage.sdpAnswer})
                        pc.onicecandidate = (e) => {
                            console.log("ice", e.candidate);
                            if (e.candidate) {
                                if (!socket.current) {
                                    return;
                                }
                                console.log("recv candidate");
                                sendMessage({
                                    id: "onIceCandidate",
                                    candidate: {
                                        candidate: e.candidate.candidate,
                                        sdpMid: e.candidate.sdpMid,
                                        sdpMLineIndex: e.candidate.sdpMLineIndex
                                    },
                                    name: parsedMessage.name
                                });
                            }
                        };
                    }
                    break;
                case 'iceCandidate':
                    let icePc = pcs[parsedMessage.name]
                    if (icePc) {
                        console.log(parsedMessage.name+" 의 ice 등록")
                        let candidate = new RTCIceCandidate(parsedMessage.candidate);
                        icePc.addIceCandidate(candidate);
                    }
                    break;
                default:
                    console.error('Unrecognized message', parsedMessage);
            }
        }

    }, [])

    return (
        <div>
            <div>room: {room} user: {user}</div>

            <div>내 비디오</div>
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
            <div style={{
                display: "flex",
                flexWrap: "wrap",
                width: "100vw",
                gap: "1rem"
            }}>

                {users.map((user) => {
                    return <KurentoVideo key={user.id} stream={user.stream} name={user.id}/>;
                })}
            </div>

            <button onClick={leaveRoom}>Leave Room</button>
        </div>
    );
};

export default Page;