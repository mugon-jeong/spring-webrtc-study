package com.example.webrtc;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.example.webrtc.socket.sample3")
public class WebrtcTestApplication {

    public static void main(String[] args) {
        SpringApplication.run(WebrtcTestApplication.class, args);
    }

}
