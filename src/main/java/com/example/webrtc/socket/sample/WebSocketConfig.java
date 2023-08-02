package com.example.webrtc.socket.sample;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    /**
     * 메모리 기반 메시지 브로커
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // /topic 전두사가 있는 대상의 클라이언트로 다시 전달할 수 있도록 enableSimpleBroker호출
        registry.enableSimpleBroker("/topic");
        // @MessageMapping으로 주석이 달린 메서드에 /app 접두사 지정
        registry.setApplicationDestinationPrefixes("/app");
    }


    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // websocket 연결을 위한 엔드포인트 등록
        registry.addEndpoint("/gs-guide-websocket").setAllowedOriginPatterns("*");
    }
}
