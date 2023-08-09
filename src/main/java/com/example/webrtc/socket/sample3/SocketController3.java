package com.example.webrtc.socket.sample3;

import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.stereotype.Controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Controller
public class SocketController3 {
    Map<String, List<String>> rooms = new HashMap<String, List<String>>();

    // message types, used in signalling:
    // SDP Offer message
    private static final String MSG_TYPE_OFFER = "OFFER";
    // SDP Answer message
    private static final String MSG_TYPE_ANSWER = "ANSWER";
    // join room data message
    private static final String MSG_TYPE_JOIN = "JOIN";
    // leave room data message
    private static final String MSG_TYPE_LEAVE = "leave";
    // New ICE Candidate message
    private static final String MSG_TYPE_CANDIDATE = "CANDIDATE";

    @MessageMapping("/room/{roomId}")
    @SendTo("/sub/room/{roomId}")
    private WebSocketMessage joinRoom(@DestinationVariable("roomId") String roomId, @Payload WebSocketMessage message) {
        WebSocketMessage webSocketMessage = null;
        switch (message.getType()) {
            case MSG_TYPE_JOIN -> {
                if (rooms.containsKey(roomId)) {
                    log.info("join 0 : 방 있음 : {}", roomId);
                    List<String> users = rooms.get(roomId);
                    log.info("join 1 : 방({}) 참가 : {}", roomId, message.getFrom());
                    users.add(message.getFrom());
                    rooms.put(roomId, users);
                } else {
                    log.info("join 0 : 방 생성 : {}", roomId);
                    ArrayList<String> users = new ArrayList<>();
                    users.add(message.getFrom());
                    log.info("join 1 : 방({}) 참가 : {}", roomId, message.getFrom());
                    rooms.put(roomId, users);
                }
                List<String> exceptMeUsers = rooms.get(roomId).stream().filter(s -> !s.equals(message.getFrom())).toList();
                webSocketMessage = WebSocketMessage.builder()
                        .type("ALL_USERS")
                        .from(message.getFrom())
                        .roomId(roomId)
                        .allUsers(exceptMeUsers)
                        .build();
            }
            case MSG_TYPE_OFFER,MSG_TYPE_ANSWER,MSG_TYPE_CANDIDATE -> {
                log.info("{} : 보내는 사람 : {}", message.getType(), message.getFrom());
                List<String> exceptMeUsers = rooms.get(roomId).stream().filter(s -> !s.equals(message.getFrom())).toList();
                webSocketMessage = WebSocketMessage.builder()
                        .type(message.getType())
                        .from(message.getFrom())
                        .roomId(roomId)
                        .allUsers(exceptMeUsers)
                        .candidate(message.getCandidate())
                        .sdp(message.getSdp())
                        .build();
            }
            default -> {
                log.info("DEFAULT");
                log.info("들어온 타입 : {}", message.getType());
            }
        }
        log.info("발송 내용 : {}", webSocketMessage);
        return webSocketMessage;
    }
}
