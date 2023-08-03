"use client"
import React, {useEffect, useRef, useState} from 'react';
import SockJS from 'sockjs-client';
import {Client, Stomp} from "@stomp/stompjs"

const Page = () => {
    const socketURL = "http://192.168.35.47:8080/webrtc"
    // const SockJs = new SockJS(socketURL);
    // const ws = Stomp.over(SockJs);
    const stompClient = new Client({
        brokerURL: socketURL
    });
    stompClient.onConnect = (frame) => {
        setIsConnect(true);
        console.log('Connected: ' + frame);
        // 연결 성공시 구독
        // stompClient.subscribe('/topic/greetings', (greeting) => {
        //     showGreeting(JSON.parse(greeting.body).content);
        // });
    };
    stompClient.onWebSocketError = (error) => {
        console.error('Error with websocket', error);
    };

    stompClient.onStompError = (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
    };

    const [isConnect, setIsConnect] = useState(false);
    // 자신의 비디오
    const myVideoRef = useRef<HTMLVideoElement>(null);
    // peerConnection
    const pcRef = useRef<RTCPeerConnection>();
    const handleConnect = () => {
        console.log("handleConnect()")
        stompClient.activate();
        setIsConnect(true)
    }
    const handleDisconnect = () => {
        console.log("handleDisConnect()")
        stompClient.deactivate();
        setIsConnect(false)
    }

    const getMedia = async () => {
        try {
            // 자신의 스트림 정보
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            })
            console.log(stream)
            if (myVideoRef.current) {
                myVideoRef.current.srcObject = stream;
            }
        } catch (e) {
            console.error(e);
        }
    }

    useEffect(()=>{
        getMedia();
    },[])

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
            </div>
        </>
    );
};

export default Page;