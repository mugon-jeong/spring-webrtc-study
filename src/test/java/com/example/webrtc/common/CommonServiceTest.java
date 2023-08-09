package com.example.webrtc.common;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

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
}
