package com.example.webrtc.socket.signaling;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.*;
@EnableWebSocket
@Configuration
public class SignalingWebSocketConfig implements WebSocketConfigurer {

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(signalHandler(), "/signal")
                .setAllowedOriginPatterns("*"); // allow all origins
    }


    @Bean
    public WebSocketHandler signalHandler() {
        return new WebRTCSignalHandler();
    }
}
