"use client"
import React, {useEffect, useRef} from 'react';

const Page = () => {
    const socket = useRef<WebSocket>();
    const myVideoRef = useRef<HTMLVideoElement>(null);

    const sendMessage = (message:Object)=> {
        let jsonMessage = JSON.stringify(message);
        console.log('Sending message: ' + jsonMessage);
        socket.current!.send(jsonMessage);
    }
    useEffect(()=>{
        socket.current = new WebSocket("ws://localhost:8080/kurento");
        socket.current.onopen = () => {
            console.log("Connected to the signaling server");
            sendMessage({"id":"PRESENTER"})
        };
        socket.current.onmessage = (message)=>{
            var parsedMessage = JSON.parse(message.data);

        }
    },[])
    return (
        <div>
            <div>Kurento</div>
        </div>
    );
};

export default Page;