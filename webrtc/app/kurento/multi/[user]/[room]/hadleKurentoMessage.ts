import {KurentoParticipant} from "@/app/kurento/multi/[user]/[room]/KurentoParticipant";

interface props {
    participants: {
        state: Map<any, any>,
        add: (key: any, value: any) => void,
        upsert: (key: any, value: any) => void,
        remove: (key: any) => void,
        clear: () => void,
        get: (key: any) => any
    }
}

const hadleKurentoMessage = ({participants}: props) => {
    const onExistingParticipants = async ({user, room, localStream, sendMessage}: {
        user: string,
        room: string,
        localStream: MediaStream
        sendMessage: (message: Object)=> void
    }) => {
        console.log(user + " registered in room " + room);
        const participant = new KurentoParticipant(user);
        console.log(user + "CreatePeerConnection: " + participant);

        // 로컬의 미디어 스트림이 존재하면 PeerConnection에 추가해줍니다.
        if (localStream) {
            participant.addLocalstream(localStream);
        }
        // offer 생성 및 전송
        // offer 생성
        return await participant.rtcPeer.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
        }).then(value => {
            participant.rtcPeer.setLocalDescription(new RTCSessionDescription(value));
            sendMessage({
                id: "receiveVideoFrom",
                sender: user,
                sdpOffer: participant.rtcPeer.localDescription!.sdp,
            });
        });
    }

    const onNewParticipant = (sender: string) => {

    }
    const onParticipantLeft = (name: string) => {
        console.log('Participant ' + name + ' left');
        let participant: KurentoParticipant = participants.get(name);
        participant.dispose();
        participants.remove(name);
    }
    const receiveVideoResponse = ({name, sdpAnswer}: { name: string, sdpAnswer: any }) => {
        let participant: KurentoParticipant = participants.get(name);
        participant.rtcPeer.setRemoteDescription(new RTCSessionDescription(sdpAnswer));
    }
    return {
        onExistingParticipants,
        onNewParticipant,
        onParticipantLeft,
        receiveVideoResponse,
    };
}
export default hadleKurentoMessage;