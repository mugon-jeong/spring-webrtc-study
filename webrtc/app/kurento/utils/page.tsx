"use client"
import React, {useState} from 'react';
import {useRouter} from "next/navigation";

const Page = () => {
    const [user, setUser] = useState("");
    const [room, setRoom] = useState("");
    const router = useRouter();
    return (
        <div>
            <div>kurento multi</div>
            <div>
                <input placeholder={"Username"} value={user} onChange={e => setUser(e.target.value)}/>
                <input placeholder={"Room"} value={room} onChange={e => setRoom(e.target.value)}/>
                <button onClick={()=> router.push(`/kurento/utils/${user}/${room}`)}>Join</button>
            </div>
        </div>
    );
};

export default Page;