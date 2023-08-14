package com.example.webrtc.socket.kurento_multi;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.kurento.client.*;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.Closeable;
import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
public class UserSession implements Closeable {
    @Getter
    private final String name;
    private final WebSocketSession session;
    private final MediaPipeline pipeline;
    private final String roomName;
    private final WebRtcEndpoint outgoingMedia;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * multi thread 환경에서 동시성을 지원하기 위해 설계
     * 버킷별로 동기화를 진행 (기본 16개 버킷)
     * 빈 Hash 버킷에 노드를 삽입하는 경우 `Compare and Swap`을 이용하여 lock을 사용하지 않고 새로운 Node를 Hash 버킷에 삽입
     * 버킷에 노드가 존재하는 경우 `synchronized`를 이용해 하나의 thread만 접근하도록 제어
     * `get`은 `synchronized` 키워드를 사용하지 않기에 가장최신의 value값을 return
     */
    private final ConcurrentHashMap<String, WebRtcEndpoint> incomingMedia = new ConcurrentHashMap<>();

    public UserSession(String name, String roomName, WebSocketSession session, MediaPipeline pipeline) {
        this.name = name;
        this.session = session;
        this.pipeline = pipeline;
        this.roomName = roomName;
        this.outgoingMedia = new WebRtcEndpoint.Builder(pipeline).build();
        this.outgoingMedia.addIceCandidateFoundListener(new EventListener<IceCandidateFoundEvent>() {
            @Override
            public void onEvent(IceCandidateFoundEvent event) {
                KurentoMultiMessage message = KurentoMultiMessage.builder()
                        .id("iceCandidate")
                        .name(name)
                        .candidate(event.getCandidate())
                        .build();
                try {
                    synchronized (session) {
                        String toJsonMessage = objectMapper.writeValueAsString(message);
                        log.info("addIceCandidateFoundListener onEvent: {}", toJsonMessage);
                        session.sendMessage(new TextMessage(toJsonMessage));
                    }
                } catch (IOException e) {
                    log.error(e.getMessage());
                }
            }
        });
    }

    public WebRtcEndpoint getOutgoingWebRtcPeer() {
        return outgoingMedia;
    }

    public WebSocketSession getSession() {
        return session;
    }

    /**
     * 사용자가 현재 참가한 방
     *
     * @return room
     */
    public String getRoomName() {
        return roomName;
    }

    public void receiveVideoFrom(UserSession sender, String sdpOffer) throws IOException {
        log.info("USER {}: connecting with {} in room {}", this.name, sender.getName(), this.roomName);
        log.info("USER {}: SdpOffer for {} is {}", this.name, sender.getName(), sdpOffer);
        String ipSdpAnswer = this.getEndpointForUser(sender).processOffer(sdpOffer);
        KurentoMultiMessage message = KurentoMultiMessage.builder()
                .id("receiveVideoAnswer")
                .name(sender.getName())
                .sdpAnswer(ipSdpAnswer)
                .build();
        log.info("USER {}: SdpAnswer for {} is {}", this.name, sender.getName(), ipSdpAnswer);
        this.sendMessage(message);
        log.info("gather candidates");
        this.getEndpointForUser(sender).gatherCandidates();
    }

    private WebRtcEndpoint getEndpointForUser(UserSession sender) {
        if (sender.getName().equals(name)) {
            log.info("PARTICIPANT {}: configuring loopback", this.name);
            return outgoingMedia;
        }
        log.info("PARTICIPANT {}: receiving video from {}", this.name, sender.getName());
        WebRtcEndpoint incoming = incomingMedia.get(sender.getName());
        if (incoming == null) {
            log.info("PARTICIPANT {}: create new endpoint for {}", this.name, sender.getName());
            incoming.addIceCandidateFoundListener(new EventListener<IceCandidateFoundEvent>() {
                @Override
                public void onEvent(IceCandidateFoundEvent event) {
                    KurentoMultiMessage message = KurentoMultiMessage.builder()
                            .id("iceCandidate")
                            .name(sender.getName())
                            .candidate(event.getCandidate())
                            .build();
                    try {
                        synchronized (session) {

                            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(message)));
                        }
                    } catch (IOException e) {
                        log.error(e.getMessage());
                    }
                }
            });
            incomingMedia.put(sender.getName(), incoming);
        }
        log.info("PARTICIPANT {}: obtained endpoint for {}", this.name, sender.getName());
        sender.getOutgoingWebRtcPeer().connect(incoming);
        return incoming;
    }

    public void cancelVideoFrom(UserSession sender) {
        this.cancelVideoFrom(sender.getName());
    }

    public void cancelVideoFrom(String senderName) {
        log.info("PARTICIPANT {}: canceling video reception from {}", this.name, senderName);
        WebRtcEndpoint incoming = incomingMedia.remove(senderName);

        log.info("PARTICIPANT {}: removing endpoint for {}", this.name, senderName);
        incoming.release(new Continuation<Void>() {
            @Override
            public void onSuccess(Void result) throws Exception {
                log.info("PARTICIPANT {}: Released successfully incoming EP for {}", UserSession.this.name, senderName);
            }

            @Override
            public void onError(Throwable cause) throws Exception {
                log.info("PARTICIPANT {}: Could not release incoming EP for {}", UserSession.this.name, senderName);
            }
        });
    }

    @Override
    public void close() throws IOException {
        log.info("PARTICIPANT {}: Releasing resources", this.name);
        for (String remoteParticipantName : incomingMedia.keySet()) {
            log.info("PARTICIPANT {}: Released incoming EP for {}", this.name, remoteParticipantName);
            WebRtcEndpoint ep = this.incomingMedia.get(remoteParticipantName);
            ep.release(new Continuation<Void>() {
                @Override
                public void onSuccess(Void result) throws Exception {
                    log.info("PARTICIPANT {}: Released successfully incoming EP for {}", UserSession.this.name, remoteParticipantName);
                }

                @Override
                public void onError(Throwable cause) throws Exception {
                    log.info("PARTICIPANT {}: Could not release incoming EP for {}", UserSession.this.name, remoteParticipantName);
                }
            });
        }
        outgoingMedia.release(new Continuation<Void>() {
            @Override
            public void onSuccess(Void result) throws Exception {
                log.info("PARTICIPANT {}: Released successfully outgoing EP", UserSession.this.name);
            }

            @Override
            public void onError(Throwable cause) throws Exception {
                log.info("PARTICIPANT {}: Could not release outgoing EP", UserSession.this.name);
            }
        });
    }

    public void addCandidate(IceCandidate candidate, String name) {
        if (this.name.compareTo(name) == 0) {
            outgoingMedia.addIceCandidate(candidate);
        } else {
            WebRtcEndpoint endpoint = incomingMedia.get(name);
            if (endpoint != null) {
                endpoint.addIceCandidate(candidate);
            }
        }
    }

    public void sendMessage(KurentoMultiMessage message) throws IOException {
        log.info("USER {}: Sending message {}", name, message);
        synchronized (session) {
            session.sendMessage(new TextMessage(message.toJson(objectMapper)));
        }
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }
        if (!(obj instanceof UserSession other)) {
            return false;
        }
        boolean eq = name.equals(other.name);
        eq &= roomName.equals(other.roomName);
        return eq;
    }

    @Override
    public int hashCode() {
        int result = 1;
        result = 31 * result + roomName.hashCode();
        result = 31 * result + name.hashCode();
        return result;
    }
}
