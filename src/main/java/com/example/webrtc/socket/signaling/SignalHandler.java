package com.example.webrtc.socket.signaling;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

// 기능 : WebRTC를 위한 시그널링 서버 부분으로 요청타입에 따라 분기 처리
@Slf4j
@Component
public class SignalHandler extends TextWebSocketHandler {
    private final SessionRepository sessionRepositoryRepo = SessionRepository.getInstance();  // 세션 데이터 저장소
    private final ObjectMapper objectMapper = new ObjectMapper();
    private static final String MSG_TYPE_JOIN_ROOM = "join_room";
    private static final String MSG_TYPE_OFFER = "offer";
    private static final String MSG_TYPE_ANSWER = "answer";
    private static final String MSG_TYPE_CANDIDATE = "candidate";

    @Override
    public void afterConnectionEstablished(final WebSocketSession session) {
        // 웹소켓이 연결되면 실행되는 메소드
        log.info("afterConnectionEstablished()");
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        try {
            WebSocketMessage webSocketMessage = objectMapper.readValue(message.getPayload(), WebSocketMessage.class);
            String userName = webSocketMessage.getSender();
            String data = webSocketMessage.getData();
            Long roomId = webSocketMessage.getRoomId();
            log.info("origin message INFO");
            log.info("session.ID : {}, getType : {}, getRoomId : {}", session.getId(), webSocketMessage.getType(), roomId);
            switch (webSocketMessage.getType()) {

                // 처음 입장
                case MSG_TYPE_JOIN_ROOM -> {
                    if (sessionRepositoryRepo.hasRoom(roomId)) {
                        log.info("join 0 : 방 있음 : " + roomId);
                        log.info("join 1 : (join 전) Client list - \n {} \n", sessionRepositoryRepo.getClientList(roomId));

                        // 해당 챗룸이 존재하면
                        // 세션 젖아 1) : 방 안의 session List에 새로운 Client session 정보를 저장
                        sessionRepositoryRepo.addClient(roomId, session);
                    } else {
                        log.info("join 0 : 방 없음 : " + roomId);
                        // 해당 챗룸이 존재하지 않으면
                        // 세션 저장 1) : 새로운 방 정보와 새로운 Client session 정보를 저장
                        sessionRepositoryRepo.addClientInNewRoom(roomId, session);
                    }
                    log.info("join 2 : (join 후) Client List - \n {} \n", sessionRepositoryRepo.getClientList(roomId));

                    // 세션 저장 2) : 이 세션이 어느 방에 들어가 있는지 저장
                    sessionRepositoryRepo.saveRoomIdToSession(session, roomId);

                    log.info("join 3 : 지금 세션이 들어간 방 : {}", sessionRepositoryRepo.getRoomId(session));

                    // 방안 참가자 중 자신을 제외한 나머지 사람들의 Session ID를 List로 저장
                    List<String> exportClients = new ArrayList<>();
                    Set<Map.Entry<String, WebSocketSession>> roomInfos = sessionRepositoryRepo.getClientList(roomId).entrySet();
                    for (Map.Entry<String, WebSocketSession> roomInfo : roomInfos) {
                        // 자신 제외
                        if (roomInfo.getValue() != session) {
                            exportClients.add(roomInfo.getKey());
                        }
                    }
                    // 리팩토링
//                    sessionRepositoryRepo.getClientList(roomId).entrySet().stream()
//                            .filter(entry -> entry.getValue() != session)
//                            .map(entry -> exportClients.add(entry.getKey()));

                    log.info("join 4 : allUsers로 Client List : {}", exportClients);

                    // 접속한 본인에게 방안 참가자들의 정보 전송
                    sendMessage(session,
                            new WebSocketMessage().builder()
                                    .type("all_users")
                                    .sender(userName)
                                    .data(data)
                                    .allUsers(exportClients)
                                    .candidate(webSocketMessage.getCandidate())
                                    .sdp(webSocketMessage.getSdp())
                                    .build());
                }
                case MSG_TYPE_OFFER -> {
                }
                case MSG_TYPE_ANSWER -> {
                }
                case MSG_TYPE_CANDIDATE -> {
                    if (sessionRepositoryRepo.hasRoom(roomId)) {
                        Map<String, WebSocketSession> clientList = sessionRepositoryRepo.getClientList(roomId);
                        log.info("{} 5 : 보내는 사람 - {}, 받는 사람 - {}" + webSocketMessage.getType(), session.getId(), webSocketMessage.getReceiver());

                        if (clientList.containsKey(webSocketMessage.getReceiver())) {
                            WebSocketSession ws = clientList.get(webSocketMessage.getReceiver());
                            sendMessage(ws,
                                    new WebSocketMessage().builder()
                                            .type(webSocketMessage.getType())
                                            .sender(session.getId()) // 보낸 사람
                                            .receiver(webSocketMessage.getReceiver()) // 받을 사람
                                            .data(data)
                                            .offer(webSocketMessage.getOffer())
                                            .answer(webSocketMessage.getAnswer())
                                            .candidate(webSocketMessage.getCandidate())
                                            .sdp(webSocketMessage.getSdp())
                                            .build());
                        }
                    }
                }
                default -> {
                    log.info("DEFAULT");
                    log.info("들어온 타입 : {}", webSocketMessage.getType());
                }
            }
        } catch (JsonProcessingException e) {
            log.error("handleTextMessage Error: " + e.getMessage());
        }
    }

    private void sendMessage(WebSocketSession session, WebSocketMessage message) {
        try {
            String json = objectMapper.writeValueAsString(message);
            log.info("발송 to : {}", session.getId());
            log.info("발송 내용 : {}", json);
            session.sendMessage(new TextMessage(json));
        } catch (IOException e) {
            log.error("sendMessage Error: " + e.getMessage());
        }
    }
}
