package com.example.webrtc.socket.kurento_multi;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.kurento.client.KurentoClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class RoomManager {
    private final KurentoClient kurento;
    private final ConcurrentMap<String, Room> rooms = new ConcurrentHashMap<>();

    // Looks for a room in the active room list
    public Room getRoom(String roomName) {
        log.info("Searching for room {}", roomName);
        Room room = rooms.get(roomName);
        if (room == null) {
            log.info("Room {} not existent. Will create now", roomName);
            room = new Room(roomName, kurento.createMediaPipeline());
            rooms.put(roomName, room);
        }
        log.info("Room {} found", roomName);
        return room;
    }

    // Removes a room from the list of available rooms
    public void removeRoom(Room room){
        this.rooms.remove(room.getName());
        room.close();
        log.info("Room {} removed and closed", room.getName());
    }

}
