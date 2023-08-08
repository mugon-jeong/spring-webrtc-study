package com.example.webrtc.socket.sample3;

import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.stereotype.Controller;
@Slf4j
@Controller
public class SocketController3 {

    // message types, used in signalling:
    // SDP Offer message
    private static final String MSG_TYPE_OFFER = "offer";
    // SDP Answer message
    private static final String MSG_TYPE_ANSWER = "answer";
    // New ICE Candidate message
    private static final String MSG_TYPE_ICE = "ice";
    // join room data message
    private static final String MSG_TYPE_JOIN = "join";
    // leave room data message
    private static final String MSG_TYPE_LEAVE = "leave";

    @MessageMapping("/room/{roomId}")
    @SendTo("/sub/room/{roomId}")
    private String joinRoom(@DestinationVariable("roomId") String roomId, @Header("simpSessionId") String sessionId, @Payload WebSocketMessage message) {
        // roomId
        log.info("Joining room 1: {}", roomId);
        log.info("Joining room 2: {}", message);
        switch (message.getType()){
            case MSG_TYPE_JOIN -> {

            }
        }
        return roomId;
    }
}
