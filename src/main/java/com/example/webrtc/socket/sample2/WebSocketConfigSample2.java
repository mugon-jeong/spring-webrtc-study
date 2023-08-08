package com.example.webrtc.socket.sample2;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketTransportRegistration;
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfigSample2 implements WebSocketMessageBrokerConfigurer {

//    @Override
//    public void configureWebSocketTransport(WebSocketTransportRegistration registry) {
//        // stomp 최대 버퍼 사이즈를 늘리기 위한 설정
//        registry.setMessageSizeLimit(50000 * 1024);
//        registry.setSendBufferSizeLimit(10240 * 1024);
//        registry.setSendTimeLimit(20000);
//    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/signal")
                .addInterceptors(new HttpHandshakeInterceptor())
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.setApplicationDestinationPrefixes("/pub"); //app
        registry.enableSimpleBroker("/sub"); //topic
    }
}
