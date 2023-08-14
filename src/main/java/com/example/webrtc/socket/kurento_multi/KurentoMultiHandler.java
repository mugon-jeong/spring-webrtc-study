package com.example.webrtc.socket.kurento_multi;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.kurento.client.IceCandidate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Objects;

@Slf4j
@RequiredArgsConstructor
@Component
public class KurentoMultiHandler extends TextWebSocketHandler {
    private final RoomManager roomManager;
    private final UserRegistry registry;
    private final ObjectMapper objectMapper = new ObjectMapper();
    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        KurentoMultiMessage getMessage = objectMapper.readValue(message.getPayload(), KurentoMultiMessage.class);
        UserSession user = registry.getBySession(session);

        if(user != null) {
            log.info("Incoming message from user '{}': {}", user.getName(), getMessage);
        }else {
            log.info("Incoming message from new user {}", getMessage);
        }

        switch (getMessage.id()){
            case "joinRoom" -> {
                joinRoom(getMessage, session);
            }
            case "receiveVideoFrom" -> {
                UserSession sender = registry.getByName(getMessage.name());
                Objects.requireNonNull(user).receiveVideoFrom(sender, getMessage.sdpOffer().toString());
            }
            case "leaveRoom" -> {
                leaveRoom(Objects.requireNonNull(user));
            }
            case "onIceCandidate" -> {
                if(user != null){
                    IceCandidate candidate = getMessage.candidate();
                    IceCandidate iceCandidate = new IceCandidate(candidate.toString(), candidate.getSdpMid(), candidate.getSdpMLineIndex());
                    user.addCandidate(iceCandidate, getMessage.name());
                }
            }
            default -> {
                log.info("Incoming message id: {}", getMessage.id());
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        UserSession user = registry.removeBySession(session);
        roomManager.getRoom(user.getRoomName()).leave(user);
    }

    private void joinRoom(KurentoMultiMessage getMessage, WebSocketSession session) throws IOException {
        log.info("PARTICIPANT {}: trying to join room {}", getMessage.name(), getMessage.room());
        Room room = roomManager.getRoom(getMessage.room());
        UserSession user = room.join(getMessage.name(), session);
        registry.register(user);
    }

    private void leaveRoom(UserSession user) throws IOException {
        Room room = roomManager.getRoom(user.getRoomName());
        room.leave(user);
        if(room.getParticipants().isEmpty()){
            roomManager.removeRoom(room);
        }
    }
}
