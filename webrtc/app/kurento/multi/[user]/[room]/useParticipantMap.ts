import React, {useState} from 'react';

const useParticipantMap = <K,V>() => {
    const [state, setState] = useState(new Map<K,V>());
    const add = (key:K, value:V) => {
        setState((prev) => new Map([...prev, [key, value]]));
    };

    const get = (key:K) => state.get(key)


    const upsert = (key:K, value:V) => {
        setState((prev) => new Map(prev).set(key, value));
    }

    const remove = (key:K) => {
        setState((prev) => {
            const newState = new Map(prev);
            newState.delete(key);
            return newState;
        });
    }

    const clear = () => {
        setState((prev) => {
            prev.clear();
            return new Map();
        });
    }
    return {state, add, upsert, remove, clear, get};
};

export default useParticipantMap;