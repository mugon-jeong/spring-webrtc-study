"use client";
import {useEffect, useRef} from "react";

const Video = ({stream, socketID}: any) => {
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
            <div>{socketID}</div>
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
export default Video;
