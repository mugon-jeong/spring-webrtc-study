<img src="./img1.daumcdn.png">

Peer A가 먼저 Room에 들어와 있는 상태이고, 이후 Peer B가 Room에 접속할때

먼저 PeerA는

    브라우저에서 미디어 스트림을 받습니다.(getUserMedia)
    stream을 등록합니다(addStream x,  addTrack)
    createOffer 후에 local sdp를 설정합니다. (createOffer => setLocalDescription)
    PeerB에 offer을 전달합니다. (send offer)

PeerB에서는 offer을 받으면

    PeerA에게서 받은 offer(sdp)로 remote sdp를 설정한다. (setRemoteDescription)
    브라우저 미디어 스트림을 받습니다. (getUserMedia)
    createAnswer후 local sdp 설정합니다. (createAnswer => setLocalDescription)
    PeerA에게 answer을 보냅니다. (send answer)
    PeerA에서는 answer를 전달받고 remote sdp를 설정합니다. (setRemoteDescription)

create-answer 과정이 끝나면 icecandidate로 네트워크 정보를 교환합니다.

    요청자에서 candidate를 보냅니다. (send candidate)
    연결할 peer에서 받은 정보를 저장하고 자신의 candidate를 보내고 (send candidate)
    받는 쪽에서 해당 candidate를 저장합니다. (addICECandidate)

이렇게 해서 두 피어간의 연결이 완료