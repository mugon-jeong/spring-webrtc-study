"use client";
import {useEffect, useRef} from "react";

const KurentoVideo = ({stream, name}: {stream:MediaStream, name:string}) => {
    const ref = useRef<HTMLVideoElement>(null);
    useEffect(() => {
        if (ref.current) ref.current.srcObject = stream;
    }, [stream]);
    return (
        <>
            <div style={{
                width: 'fit-content',
                display: 'inline-block'
            }}>
            <div>{name}</div>
            <video
                id="remotevideo"
                style={{
                    width: 240,
                    height: 240,
                    backgroundColor: "black",
                }}
                ref={ref}
                autoPlay
                controls
            />
            </div>
        </>
    );
};
export default KurentoVideo;
