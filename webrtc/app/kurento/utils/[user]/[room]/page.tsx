"use client"
import React, {useEffect, useRef, useState} from "react";
import KurentoVideo from "@/app/kurento/multi/[user]/[room]/kurento_video";
import * as kurentoUtils from "kurento-utils";

let localStream: MediaStream
const serverURL = "172.30.1.12"
let pcs: any;
const Page = ({params}: { params: { user: string, room: string } }) => {
    const {room, user} = params
    const myVideoRef = useRef<HTMLVideoElement>(null);
    const socket = useRef<WebSocket>();
    const [users, setUsers] = useState<Array<{
        id: string,
        stream: MediaStream,
    }>>([]);

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

    function receiveVideo(sender: string) {

        let options = {
            onicecandidate: (candidate: any, wp: any) => {
                console.log("Local candidate" + JSON.stringify(candidate));
                let message = {
                    id: 'onIceCandidate',
                    candidate: candidate,
                    name: sender
                };
                sendMessage(message);
            },
            peerConnection: new RTCPeerConnection({
                iceServers: [
                    {
                        urls: "stun:stun.l.google.com:19302",
                    },
                ],
            })
        }

        let webRtc = kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options,
            (error) => {
                if (error) {
                    return console.error(error);
                }

                setUsers((oldUsers) => oldUsers.filter((participant) => participant.id !== sender));
                setUsers((oldUsers) => [
                    ...oldUsers,
                    {
                        id: sender,
                        stream: webRtc.getRemoteStream(),
                    },
                ]);
                webRtc.generateOffer((error1, sdp) => {
                    if (error) return console.error("sdp offer error")
                    console.log('Invoking SDP offer callback function');
                    let msg = {
                        id: "receiveVideoFrom",
                        name: sender,
                        sdpOffer: sdp
                    };
                    sendMessage(msg)
                });
            });
        pcs = {...pcs, [sender]: webRtc};
    }

    function onExistingParticipants(name: string) {
        let constraints = {
            audio: true,
            video: {
                mandatory: {
                    maxWidth: 320,
                    maxFrameRate: 15,
                    minFrameRate: 15
                }
            }
        };
        console.log(name + " registered in room " + room);

        var options = {
            localVideo: localStream,
            mediaConstraints: constraints,
            onicecandidate: (candidate: any, wp: any) => {
                console.log("Local candidate" + JSON.stringify(candidate));
                let message = {
                    id: 'onIceCandidate',
                    candidate: candidate,
                    name: name
                };
                sendMessage(message);
            },
            peerConnection: new RTCPeerConnection({
                iceServers: [
                    {
                        urls: "stun:stun.l.google.com:19302",
                    },
                ],
            })
        }
        let webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendonly(options,
            (error) => {
                if (error) {
                    return console.error(error);
                }
                webRtcPeer.generateOffer((error1, sdp) => {
                    if (error) return console.error("sdp offer error")
                    console.log('Invoking SDP offer callback function');
                    var msg = {
                        id: "receiveVideoFrom",
                        name: name,
                        sdpOffer: sdp
                    };
                    sendMessage(msg)
                });
            });

        pcs = {...pcs, [name]: webRtcPeer};
    }

    const sendMessage = (message: any) => {
        var jsonMessage = JSON.stringify(message);
        console.log('Sending message: ' + message.id + ":" + message.name);
        socket.current!.send(jsonMessage);
    }
    const register = () => {
        sendMessage({
            id: "joinRoom",
            name: user,
            room: room,
        })
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
        socket.current = new WebSocket(`ws://${serverURL}:8080/kurento`);
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
                    onExistingParticipants(user)
                    if (parsedMessage.data.length > 0) {
                        console.log("Exist participants: " + parsedMessage.data);
                        parsedMessage.data.forEach((sender: string) => {
                            console.log("Received: " + sender)
                            receiveVideo(sender)
                        })
                    }
                    break;
                case 'newParticipantArrived':
                    console.log("newParticipantArrived: " + parsedMessage.name);
                    receiveVideo(parsedMessage.name);
                    break;
                case 'participantLeft':
                    pcs[parsedMessage.name]?.close()
                    // pcs.remove(parsedMessage.name)
                    break;
                case 'receiveVideoAnswer':
                    console.log("receiveVideoAnswer from: " + parsedMessage.name)
                    const pc: kurentoUtils.WebRtcPeer = pcs[parsedMessage.name];
                    pc.processAnswer(parsedMessage.sdpAnswer, (error) => {
                        if (error) return console.error(error)
                    })
                    break;
                case 'iceCandidate':
                    let icePc: kurentoUtils.WebRtcPeer = pcs[parsedMessage.name]
                    icePc.addIceCandidate(parsedMessage.candidate, (error) => {
                        if (error) return console.error(error)
                    })
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
    )
}

export default Page