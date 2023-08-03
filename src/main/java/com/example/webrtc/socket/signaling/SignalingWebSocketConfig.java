package com.example.webrtc.socket.signaling;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.*;

//@EnableWebSocketMessageBroker
//@EnableWebSocket
//@Configuration
public class SignalingWebSocketConfig implements WebSocketMessageBrokerConfigurer, WebSocketConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws-stomp")
                .setAllowedOriginPatterns("*")
                .withSockJS(); // 소켓을 지원하지 않는 브라우저라면, sockJS를 사용하도록 설정
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(signalHandler(), "/signal")
                .setAllowedOriginPatterns("*")
                .withSockJS(); // allow all origins
    }

//    @Override
//    public void configureMessageBroker(MessageBrokerRegistry registry) {
//        registry.setApplicationDestinationPrefixes("/pub");
//        registry.enableSimpleBroker("/sub");
//    }

    @Bean
    public WebSocketHandler signalHandler() {
        return new WebRTCSignalHandler();
    }
}
