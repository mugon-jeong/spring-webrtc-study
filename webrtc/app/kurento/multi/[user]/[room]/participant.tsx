"use client";
import {useEffect, useRef} from "react";

const Participant = ({stream, participant}: any) => {
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
            <div>{participant}</div>
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
export default Participant;
