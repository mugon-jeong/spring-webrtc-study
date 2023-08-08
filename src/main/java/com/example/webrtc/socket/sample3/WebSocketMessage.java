package com.example.webrtc.socket.sample3;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class WebSocketMessage {
    private String from; // 보내는 유저 UUID
    private String type; // 메시지 타입
    private String roomId; // roomId
    private Object candidate; // ice
    private Object sdp; // sdp 정보
}
