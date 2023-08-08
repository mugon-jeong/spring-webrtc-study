package com.example.webrtc.socket.signaling;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.util.List;
import java.util.Objects;

// 기능 : 프론트에 응답하는 시그널링용 Message
// WebRTC 연결 시 사용되는 클래스
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class WebSocketMessage {
    private String from; // 보내는 유저 UUID
    private String type; // 메시지 타입
    private String roomId; // roomId
    List<String> allUsers;
    private Object candidate; // 상태
    private Object sdp; // sdp 정보
}
