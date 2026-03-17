import React, { useState, createContext } from 'react'

export const BloonsContext = createContext({
    bloons: {},
    addBloon: () => { },
    removeBloon: () => { },
    modifyBloon: () => { },
    resetBloons: () => { }
})

export default ({ children }) => {
    const [bloons, setBloons] = useState([])

    const addBloon = (id, bloon) => setBloons(bloons => ({ ...bloons, [id]: bloon }))
    // eslint-disable-next-line eqeqeq
    const removeBloon = id => setBloons(bloons => Object.fromEntries(Object.entries(bloons).filter(e => e[0] != id)))
    const modifyBloon = addBloon
    const resetBloons = () => setBloons({})

    return (
        <BloonsContext.Provider
            value={{ bloons, addBloon, removeBloon, modifyBloon, resetBloons }}
        >
            {children}
        </BloonsContext.Provider>
    )
}
