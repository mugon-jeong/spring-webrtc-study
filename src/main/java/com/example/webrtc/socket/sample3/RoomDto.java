package com.example.webrtc.socket.sample3;

import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.Map;
@Data
@Builder
@EqualsAndHashCode
public class RoomDto {
    private String roomId;
    private Map<String, String> userList;
}
