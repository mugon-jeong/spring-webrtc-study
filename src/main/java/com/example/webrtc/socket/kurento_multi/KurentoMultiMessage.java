package com.example.webrtc.socket.kurento_multi;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import lombok.Builder;
import org.kurento.client.IceCandidate;

import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Builder
public record KurentoMultiMessage(
        String id,
        String name,
        String room,
        String response,
        String message,
        IceCandidate candidate,
        Object sdpAnswer,
        Object sdpOffer,
        List<String> data
) {
    public String toJson(ObjectMapper objectMapper) {
        try {
            return objectMapper.writeValueAsString(this);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }
}
