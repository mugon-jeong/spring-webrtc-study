export class KurentoParticipant {
    user: string;
    rtcPeer: RTCPeerConnection;
    stream: MediaStream | undefined

    constructor(user: string) {
        this.user = user;
        this.rtcPeer = new RTCPeerConnection({
            iceServers: [
                {
                    username: 'user',
                    credential: 's3cr3t',
                    urls: 'turn:192.168.35.47:3478?transport=tcp'
                },
            ],
        });
        console.log(this.user + ": RTCPeer: " + this.rtcPeer);
    }

    addLocalstream(localStream: MediaStream) {
        localStream.getTracks().forEach((track) => {
            this.rtcPeer.addTrack(track, localStream);
        });
    }

    onIceCandidate(sender: string) {
        let candidate;
        this.rtcPeer.onicecandidate = (e) => {
            if (e.candidate) {
                candidate = e.candidate;
            }
        };
        if(candidate){
            return {
                id: 'onIceCandidate',
                candidate: candidate,
                name: sender
            };
        }
    }
    dispose(){
        console.log('Disposing participant ' + this.user);
        this.rtcPeer.close();
    }
}