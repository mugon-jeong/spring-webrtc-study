"use client"
import React, {useEffect, useRef, useState} from 'react';
import SockJS from 'sockjs-client';
import {Client} from "@stomp/stompjs"

const Page = () => {
    const socketURL = "http://192.168.35.47:8080/signal"
    const roomId = "roomA"
    const sender = "nickNameA"
    const [isConnect, setIsConnect] = useState(false);
    const client = useRef<Client>();
    // 자신의 비디오
    const myVideoRef = useRef<HTMLVideoElement>(null);
    // peerConnection
    const pcRef = useRef<RTCPeerConnection>();
    const handleConnect = () => {
        console.log("handleConnect()")
        connect()
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
                if(!pcRef.current){
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
        client.current.subscribe(
            '/topic/greetings',
            async ({ body }) => {
                const data = JSON.parse(body);
                console.log(data);
            },
        );
    };

    const connect = () => {
        client.current = new Client({
            webSocketFactory: () => new SockJS(`http://192.168.35.47:8080/gs-guide-websocket`),
            debug() {},
            onConnect: () => {
                subscribe();
                client.current.publish({
                    destination: `pub/signal`,
                    // body: JSON.stringify({
                    //     type: 'ENTER',
                    //     roomId: roomId,
                    //     sender,
                    // }),
                    body: JSON.stringify({message:"hi"}),
                });
            },
            onStompError: (frame) => {
                console.log(`Broker reported error: ${frame.headers.message}`);
                console.log(`Additional details: ${frame.body}`);
            },
        });
        client.current.activate();
    };
    const disconnect = () => {
        client.current.deactivate();
    };

    const handleSend = () => {

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