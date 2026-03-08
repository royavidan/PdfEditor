import React, { useState, createContext } from 'react'

export const BloonsContext = createContext({
    bloons: {},
    addBloon: () => { },
    removeBloon: () => { },
    modifyBloon: () => { }
})

export default ({ children }) => {
    const [bloons, setBloons] = useState([])
    const [lastBloon, setLastBloon] = useState(null)

    const addBloon = (bloonId, bloon) => setBloons(bloons => ({ ...bloons, [bloonId]: bloon }))
    const removeBloon = bloonId => setBloons(bloons => Object.fromEntries(Object.entries(bloons).filter(([id]) => id !== bloonId)))
    const modifyBloon = addBloon

    return (
        <BloonsContext.Provider
            value={{ bloons, lastBloon, addBloon, removeBloon, modifyBloon }}
        >
            {children}
        </BloonsContext.Provider>
    )
}
