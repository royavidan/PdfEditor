const fs = require('fs')
const path = require('path')

const SYMBOLS = Object.fromEntries(['dia', 'depth', 'straightness', 'flatness', 'circlarity', 'cylindricity', 'surface profile', 
    'perpendicularity', 'angularity', 'parallelism', 'symmetry', 'true position', 'concentricity', 'run out'].map(s => [s, 0]))

for (let i = 1; fs.existsSync(path.join(__dirname, 'data', `test${i}`)); i++) {
    if (!fs.existsSync(path.join(__dirname, 'data', `test${i}`, 'data.json')))
        fs.writeFileSync(path.join(__dirname, 'data', `test${i}`, 'data.json'), JSON.stringify([{ text: [], symbols: [] }], null, 4))
    if (!fs.existsSync(path.join(__dirname, 'data', `test${i}`, 'symbols.json')))
        fs.writeFileSync(path.join(__dirname, 'data', `test${i}`, 'symbols.json'), JSON.stringify([SYMBOLS], null, 4))
    if (!fs.existsSync(path.join(__dirname, 'data', `test${i}`, 'modList.json')))
        fs.writeFileSync(path.join(__dirname, 'data', `test${i}`, 'modList.json'), JSON.stringify([], null, 4))
}