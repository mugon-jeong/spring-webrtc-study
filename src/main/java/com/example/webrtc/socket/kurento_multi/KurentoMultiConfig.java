package com.example.webrtc.socket.kurento_multi;

import org.kurento.client.KurentoClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.web.socket.server.standard.ServletServerContainerFactoryBean;

@Configuration
@EnableWebSocket
public class KurentoMultiConfig implements WebSocketConfigurer {

    @Bean
    public KurentoClient kurentoClient() {
        return KurentoClient.create();
    }

    @Bean
    public ServletServerContainerFactoryBean createServletServerContainerFactoryBean() {
        ServletServerContainerFactoryBean container = new ServletServerContainerFactoryBean();
        container.setMaxTextMessageBufferSize(32768);
        return container;
    }

    @Bean
    public KurentoMultiHandler kurentoHandler() {
        return new KurentoMultiHandler(roomHandler(), registry());
    }

    @Bean
    public RoomManager roomHandler() {
        return new RoomManager(kurentoClient());
    }

    @Bean
    public UserRegistry registry() {
        return new UserRegistry();
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(kurentoHandler(), "/kurento").setAllowedOriginPatterns("*");
    }
}
