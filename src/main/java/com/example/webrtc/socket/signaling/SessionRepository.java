package com.example.webrtc.socket.signaling;

import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

// 기능 : 웹소켓에 필요한 세션 정보를 저장, 관리 (싱글톤)
@Slf4j
@Component
@NoArgsConstructor
public class SessionRepository {
    private static SessionRepository sessionRepositoryRepo;

    // 세션 저장 1) clientsInRoom : 방 Id를 key 값으로 하여 방마다 가지고 있는 Client들의 session Id 와 session 객체를 저장
    private final Map<String, Map<String, WebSocketSession>> clientsInRoom = new HashMap<>();

    // 세션 저장 2) roomIdToSession : 참가자들 각각의 데이터로 session 객체를 key 값으로 하여 해당 객체가 어느방에 속해있는지를 저장
    private final Map<WebSocketSession, String> roomIdToSession = new HashMap<>();

    // Session 데이터를 공통으로 사용하기 위해 싱글톤으로 구현
    public static SessionRepository getInstance(){
        if(sessionRepositoryRepo == null){
            synchronized (SessionRepository.class){
                sessionRepositoryRepo = new SessionRepository();
            }
        }
        return sessionRepositoryRepo;
    }

    // 해당 방의 ClientList 조회
    public Map<String, WebSocketSession> getClientList(String roomId) {
        return clientsInRoom.get(roomId);
    }

    // 해당 방 존재 유무 조회
    public boolean hasRoom(String roomId){
        return clientsInRoom.containsKey(roomId);
    }

    // 해당 session이 어느방에 있는지 조회
    public String getRoomId(WebSocketSession session){
        return roomIdToSession.get(session);
    }

    // 해당 room에 세션을 저장 및 수정해서 저장
    public void addClientInNewRoom(String roomId, String userId, WebSocketSession session) {
        Map<String, WebSocketSession> newClient = new HashMap<>();
        newClient.put(userId, session);
        clientsInRoom.put(roomId, newClient);
    }

    // 해당 room에서 끊어진 Client session 하나만 지우고 다시 저장
    public void deleteClient(String roomId, WebSocketSession session) {
        Map<String, WebSocketSession> clientList = clientsInRoom.get(roomId);
        String removeKey = "";
        for(Map.Entry<String, WebSocketSession> oneClient : clientList.entrySet()){
            if(oneClient.getKey().equals(session.getId())){
                removeKey = oneClient.getKey();
            }
        }
        log.info("========== 지워질 session id : " + removeKey);
        clientList.remove(removeKey);

        // 끊어진 세션을 제외한 나머지 세션들을 다시 저장
        clientsInRoom.put(roomId, clientList);
    }

    // 하나의 Client session 정보만 추가하기
    public void addClient(String roomId,String userId, WebSocketSession session) {
        clientsInRoom.get(roomId).put(userId, session);
    }

    // 방정보 모두 삭제 (방 폭파시 연계 작동)
    public void deleteAllclientsInRoom(Long roomId){
        clientsInRoom.remove(roomId);
    }

    // room에 속한 Clients 조회
    public Map<WebSocketSession, String> searchRoomIdToSession(String roomId) {
        return Optional.of(roomIdToSession.entrySet()
                        .stream()
                        .filter(entry ->  entry.getValue() == roomId)
                        .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue)))
                .orElseThrow(
                        () -> new IllegalArgumentException("RoodIdToSession 정보 없음!")
                );
    }

    // 이 세션이 어느 방에 들어가 있는지 저장
    public void saveRoomIdToSession(WebSocketSession session, String roomId) {
        roomIdToSession.put(session, roomId);
    }

    // 세션 삭제
    public void deleteRoomIdToSession(WebSocketSession session) {
        roomIdToSession.remove(session);
    }
}
