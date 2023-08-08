package com.example.webrtc.socket.sample2;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.Set;

@Slf4j
//@Controller
@RequiredArgsConstructor
public class SocketControllerSample2 {
    // 테스트용 세션 리스트.
    private final Set<String> sessionIdList;
    private final SimpMessagingTemplate template;

    // 실시간으로 들어온 세션 감지하여 전체 세션 리스트 반환
    @MessageMapping("/room/{roomId}")
    @SendTo("/sub/room/{roomId}")
    private String joinRoom(@DestinationVariable("roomId") String roomId, @Payload SocketMessage message) {
        // roomId
        log.info("Joining room 1: {}", roomId);
        log.info("Joining room 2: {}", message);
        sessionIdList.add(message.sender);
        log.info("sessionIdList: {}", sessionIdList);
        return sessionIdList.stream().toList().get(0);
    }

    @MessageMapping("/room/{roomId}/offer")
    @SendTo("/sub/room/{roomId}/offer")
    private OfferMessage offerRoom(@DestinationVariable("roomId") String roomId, @Payload OfferMessage message) {
        // roomId
        log.info("Offer room 1: {}",roomId);
        log.info("Offer room 2: {}",message.getSender());
        return message;
    }

    @MessageMapping("/room/{roomId}/answer")
    @SendTo("/sub/room/{roomId}/answer")
    private AnswerMessage answerRoom(@DestinationVariable("roomId") String roomId, @Payload AnswerMessage message) {
        // roomId
        log.info("Answer room 1: {}",roomId);
        log.info("Answer room 2: {}",message.getSender());
        return message;
    }

    @MessageMapping("/room/{roomId}/ice")
    @SendTo("/sub/room/{roomId}/ice")
    private IceMessage iceRoom(@DestinationVariable("roomId") String roomId, @Payload IceMessage message) {
        // roomId
        log.info("ice room 1: {}",roomId);
        log.info("ice room 2: {}",message.getSender());
        return message;
    }
}
