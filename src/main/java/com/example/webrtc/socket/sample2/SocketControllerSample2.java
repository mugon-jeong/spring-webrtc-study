package com.example.webrtc.socket.sample2;

import com.example.webrtc.socket.sample.HelloMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;

@Slf4j
//@Controller
@RequiredArgsConstructor
public class SocketControllerSample2 {
    // 테스트용 세션 리스트.
    private final ArrayList<TestSession> sessionIdList;
    private final SimpMessagingTemplate template;

    // 실시간으로 들어온 세션 감지하여 전체 세션 리스트 반환
    @MessageMapping("/signal")
    @SendTo("/sub/signal")
    private String joinRoom(String message) {

        // 현재 들어온 세션 저장.
        log.info("Joining room:{}", message);

        return message;
    }

    @MessageMapping("/hello")
    @SendTo("/sub/greetings")
    public String greeting(HelloMessage message)throws Exception{
        Thread.sleep(1000);
        log.info("Greetings: {}", message);
        return "Hello, "+ message.getName()+"!";
    }
}
