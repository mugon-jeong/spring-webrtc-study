package com.example.webrtc.common;

import com.example.webrtc.socket.kurento_multi.KurentoMultiMessage;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
@Slf4j
public class CommonServiceTest {
    @Test
    void mapTest(){
        Map<String, List<String>> rooms = new HashMap<String, List<String>>();
        rooms.put("roomA", new ArrayList<>());

        List<String> roomA = rooms.get("roomA");
        roomA.add("userA");
        System.out.println("roomA"+rooms.get("roomA"));
        assertThat(rooms.get("roomA").size()).isEqualTo(1);
        assertThat(rooms.get("roomA").get(0)).isEqualTo("userA");

        List<String> roomA2 = rooms.get("roomA");
        roomA2.add("userB");
        System.out.println("roomA2"+rooms.get("roomA"));
        assertThat(rooms.get("roomA").size()).isEqualTo(2);
        assertThat(rooms.get("roomA").get(0)).isEqualTo("userA");
        assertThat(rooms.get("roomA").get(1)).isEqualTo("userB");

    }

    @Test
    void toJsonTest() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();
        KurentoMultiMessage message = KurentoMultiMessage.builder()
                .id("iceCandidate")
                .name("name")
                .build();

        log.info("toJson: {}", message.toJson(objectMapper));

    }
}
