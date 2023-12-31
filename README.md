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

# Kurento media server
```shell
## linux
docker run -d --name kurento --network host \
    kurento/kurento-media-server:7.0.0
    
## mac or windows
docker run --rm -d \
    -p 8888:8888/tcp \
    -p 5000-5050:5000-5050/udp \
    -e KMS_MIN_PORT=5000 \
    -e KMS_MAX_PORT=5050 \
    kurento/kurento-media-server:7.0.0
```

## spring vm options
```shell
-Dkms.url=ws://<KMS IP>:<PORT>/kurento
```


## turn
- run
```shell
docker run -d -p 3478:3478 -p 3478:3478/udp -p 5349:5349 -p 5349:5349/udp -e LISTENING_PORT=3478 -e REALM=kurento.org -e USER=user -e PASSWORD=s3cr3t --name kurento-coturn kurento/coturn-auth
```
```shell
docker run -ti --rm --net=host -e LISTENING_PORT=3478 -e REALM=kurento.org -e USER=user -e PASSWORD=s3cr3t --name kurento-coturn kurento/coturn-auth
```
- create user
```shell
docker exec -ti coturn turnadmin -a -b /var/local/turndb -u user -r kurento.org -p s3cr3t
```
- delete user
```shell
docker exec -ti coturn turnadmin -d -b /var/local/turndb -u user -r kurento.org
```