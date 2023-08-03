"use client"
import * as StompJs from "@stomp/stompjs"
import {useState} from "react";

export default function Home() {
    const [text, setText] = useState("");
    const [callBackData, setCallBackData] = useState("");
    const stompClient = new StompJs.Client({
        brokerURL: 'ws://localhost:8080/gs-guide-websocket'
    });

    stompClient.onConnect = (frame) => {
        console.log('Connected: ' + frame);
        stompClient.subscribe('/topic/greetings', (message) => {
            console.log("callback: " + message);
            setCallBackData(message.body);
        });
    };

    stompClient.onWebSocketError = (error) => {
        console.error('Error with websocket', error);
    };

    stompClient.onStompError = (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
    };
    const handleConnect = () => {
        stompClient.activate();
    }
    const handleDisConnect = () => {
        stompClient.deactivate();
    }

    const handleSend = () => {
        console.log(text);
        stompClient.publish({
            destination: "/app/hello",
            body: JSON.stringify({'name': text}),
            headers: {
                "content-type": "application/json",
            },
            skipContentLengthHeader: true
        });
    }
    return (
        <>
            <div>MAIN</div>
            <button onClick={handleConnect}>Connect</button>
            <button onClick={handleDisConnect}>DisConnect</button>

            <input value={text} onChange={(e) => setText(e.target.value)}/>
            <button onClick={handleSend}>Send</button>
            <div>{callBackData}</div>

        </>
    )
}
