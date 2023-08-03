"use client"
import React, {useEffect, useRef, useState} from 'react';
import * as SockJS from 'sockjs-client';
import {Client, Stomp} from "@stomp/stompjs"

const Page = () => {
    const socketURL = "http://192.168.35.47:8080/signal"
    const socketJS = new SockJS("http://192.168.35.47:8080/signal");
    const client = new Client({
        brokerURL: 'ws://localhost:8080/socket',
    });
    const roomId = "roomA"
    const sender = "nickNameA"
    const [isConnect, setIsConnect] = useState(false);
    // 자신의 비디오
    const myVideoRef = useRef<HTMLVideoElement>(null);
    // peerConnection
    const pcRef = useRef<RTCPeerConnection>();
    const handleConnect = () => {
        console.log("handleConnect()")
        client.activate();
        setIsConnect(true)
    }
    const handleDisconnect = () => {
        console.log("handleDisConnect()")
        disconnect()
        setIsConnect(false)
    }

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
                pcRef.current?.addTrack(track, stream);
            })
        } catch (e) {
            console.error(e);
        }
    }

    const handleMuteMyVideo = () => {
        const stream: MediaStream = myVideoRef.current.srcObject;
        stream.getAudioTracks().forEach((track) => {
            track.enabled = !track.enabled
        })
    }

    const handleCamera = () => {
        const stream: MediaStream = myVideoRef.current.srcObject;
        stream.getVideoTracks().forEach((track) => {
            track.enabled = !track.enabled
        })
    }

    const subscribe = () => {
        client.subscribe(
            `/sub/signal`,
            async ({body}) => {
                const data = JSON.parse(body);
                console.log(data);
                switch (data.type) {
                    case 'ENTER':
                        if (data.sender !== sender) {
                            console.log(data);
                            if (!pcRef.current) return;
                            const offer = await pcRef.current.createOffer();
                            pcRef.current.setLocalDescription(offer);
                            client.current.publish({
                                destination: `/sub/signal`,
                                body: JSON.stringify({
                                    type: 'OFFER',
                                    roomId: roomId,
                                    sender,
                                    offer,
                                }),
                            });
                            console.log('오퍼전송');
                        }
                        break;

                    case 'OFFER':
                        if (data.sender !== sender) {
                            console.log('오퍼수신');
                            if (!pcRef.current) return;
                            pcRef.current.setRemoteDescription(data.offer);
                            const answer = await pcRef.current.createAnswer();
                            pcRef.current.setLocalDescription(answer);
                            client.current.publish({
                                destination: `/sub/signal/${roomId}`,
                                body: JSON.stringify({
                                    type: 'ANSWER',
                                    roomId: roomId,
                                    sender,
                                    answer,
                                }),
                            });
                            console.log('엔서전송');
                        }
                        break;
                    case 'ANSWER':
                        if (data.sender !== sender) {
                            console.log('엔서수신');
                            myPeerConnection.setRemoteDescription(data.answer);
                        }
                        break;
                    case 'ICE':
                        if (data.sender !== sender) {
                            console.log('아이스수신');
                            myPeerConnection.addIceCandidate(data.ice);
                        }
                        break;
                    default:
                }
            },
        );
    };

    const connect = () => {
        client.connect({}, () => {
            client.subscribe({
                destination: 'sub/signal',
            }, (response) => {
                console.log("sub", response)
            })
        });
    };
    const disconnect = () => {
        client.disconnect();
    };

    const handleSend = () => {
        client.publish({
            destination: "pub/signal",
            body: JSON.stringify({message: "send"})
        });
    }

    useEffect(() => {
        getMedia();
        // peerConnection 생성
        // iceServer는 stun 설정이고 google의 public stun server 사용
        // pcRef.current = new RTCPeerConnection({
        //     iceServers: [
        //         {
        //             urls: "stun:stun.l.google.com:19302"
        //         }
        //     ]
        // })
    }, [])

    return (
        <>
            <div>
                <>Page</>
                <label htmlFor="connect">WebSocket connection: {isConnect ? "connected" : "notConnected"}</label>
                <button id="connect" onClick={handleConnect} disabled={isConnect}>Connect</button>
                <button id="disconnect" onClick={handleDisconnect} disabled={!isConnect}>Disconnect</button>
            </div>
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
                <button onClick={handleMuteMyVideo}>Mute</button>
                <button onClick={handleCamera}>Camera</button>
            </div>
            <button onClick={handleSend}>send</button>
        </>
    );
};

export default Page;