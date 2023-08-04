package com.example.webrtc.socket.sample2;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

@JsonInclude(JsonInclude.Include.NON_NULL)
@ToString
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class IceMessage {
    String type;
    String roomId;
    String sender;
    Object ice;
}
