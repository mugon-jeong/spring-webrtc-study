package com.example.webrtc.socket.kurento_multi;

import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.kurento.client.Continuation;
import org.kurento.client.MediaPipeline;
import org.springframework.web.socket.WebSocketSession;

import javax.annotation.PreDestroy;
import java.io.Closeable;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
public class Room implements Closeable {
    private final ConcurrentHashMap<String, UserSession> participants = new ConcurrentHashMap<String, UserSession>();
    private final MediaPipeline pipeline;

    @Getter
    private final String name;

    public Room(String roomName, MediaPipeline pipeline) {
        this.pipeline = pipeline;
        this.name = roomName;
        log.info("ROOM {} has been created", roomName);
    }

    public UserSession join(String userName, WebSocketSession session) throws IOException {
        log.info("ROOM {}: adding participant {}", this.name, userName);
        UserSession participant = new UserSession(userName, this.name, session, this.pipeline);
        joinRoom(participant);
        participants.put(participant.getName(), participant);
        sendParticipantNames(participant);
        return participant;
    }

    private Collection<String> joinRoom(UserSession newParticipant) {
        KurentoMultiMessage message = KurentoMultiMessage.builder()
                .id("newParticipantArrived")
                .name(newParticipant.getName())
                .build();
        ArrayList<String> participantsList = new ArrayList<>(participants.values().size());
        log.info("ROOM {}: notifying other participants of new participant {}", name, newParticipant.getName());

        for (UserSession participant : this.getParticipants()) {
            try {
                participant.sendMessage(message);
            } catch (IOException e) {
                log.debug("ROOM {}: participant {} could not be notified", name, participant.getName(), e);
            }
            participantsList.add(participant.getName());
        }
        return participantsList;
    }

    private void removeParticipant(String name) {
        participants.remove(name);

        log.info("ROOM {}: notifying all users that {} is leaving the room", this.name, name);
        List<String> unnotifiedParticipants = new ArrayList<>();
        KurentoMultiMessage message = KurentoMultiMessage.builder()
                .id("participantLeft")
                .name(name)
                .build();
        for (UserSession participant : this.getParticipants()) {
            try {
                participant.cancelVideoFrom(name);
                participant.sendMessage(message);
            } catch (IOException e) {
                unnotifiedParticipants.add(participant.getName());
            }
        }
        if (!unnotifiedParticipants.isEmpty()) {
            log.info("ROOM {}: The users {} could not be notified that {} left the room", this.name, unnotifiedParticipants, name);
        }
    }

    public void sendParticipantNames(UserSession user) throws IOException {
        List<String> participantArray = new ArrayList<>();
        for (UserSession participant : this.getParticipants()) {
            if(!participant.equals(user)){
                participantArray.add(participant.getName());
            }
        }
        KurentoMultiMessage message = KurentoMultiMessage.builder()
                .id("existingParticipants")
                .data(participantArray)
                .build();
        log.info("PARTICIPANT {}: sending a list of {} participants", user.getName(), participantArray.size());
        user.sendMessage(message);
    }

    public Collection<UserSession> getParticipants() {
        return participants.values();
    }

    public UserSession getParticipant(String name) {
        return participants.get(name);
    }

    public void leave(UserSession user) throws IOException {
        log.info("PARTICIPANT {}: Leaving room {}", user.getName(), this.name);
        this.removeParticipant(user.getName());
        user.close();
    }

    @PreDestroy
    private void shutdown() {
        this.close();
    }

    @Override
    public void close() {
        for (final UserSession user : participants.values()) {
            try {
                user.close();
            } catch (IOException e) {
                log.info("ROOM {}: Could not invoke close on participant {}", this.name, user.getName(), e);
            }
        }

        participants.clear();

        pipeline.release(new Continuation<Void>() {

            @Override
            public void onSuccess(Void result) throws Exception {
                log.info("ROOM {}: Released Pipeline", Room.this.name);
            }

            @Override
            public void onError(Throwable cause) throws Exception {
                log.info("PARTICIPANT {}: Could not release Pipeline", Room.this.name);
            }
        });

        log.info("Room {} closed", this.name);
    }
}
