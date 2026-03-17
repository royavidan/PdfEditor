import React, { useState, useEffect, createContext, useContext } from 'react'
import { FileContext } from './file-context'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf'

export const KnownSymbols = {
    phi: Symbol('phi')
}

export const PDFContext = createContext({
    text: [],
    symbols: {}
})

const Point = point => {
    point.x = point[0]
    point.y = point[1]
    return point
}
const arrayIsEqual = (a, b) => a.length === b.length && a.every((e, i) => e === b[i])
const floatIsEqual = (a, b) => Math.abs(a - b) < 0.0001
const diff = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)
const middle = (a, b) => Point([(a.x + b.x) / 2, (a.y + b.y) / 2])
const mergeRects = (...rects) => [0, 1, 2, 3].map(i => (i >= 2 ? Math.max : Math.min)(...rects.map(rect => rect[i])))

const isCircle = path => path.length >= 10 && arrayIsEqual(path[0], path[path.length - 1])
const isLine = path => path.length === 2

const parseShapes = (fn, args, pageHeight) => {
    const Y = y => pageHeight - y

    const shapes = {
        circles: [],
        lines: []
    }

    const Shape = (path, rect) => {
        path.rect = rect
        path.left = rect[0]
        path.bottom = Y(rect[1])
        path.right = rect[2]
        path.top = Y(rect[3])
        path.center = middle(Point([path.left, path.bottom]), Point([path.right, path.top]))
        for (let i = 0; i < path.length; i++) path[i] = Point([path[i][0], Y(path[i][1])])
        return path
    }

    const Circle = path => {
        path.radius = diff(path.center, path.top)
        path.isInside = point => diff(point, path.center) <= path.radius
        return path
    }

    const Line = path => {
        path.slope = (path[1].y - path[0].y) / (path[1].x - path[0].x)
        path.len = diff(path[0], path[1])
        path.cross = point => floatIsEqual((point.x - path[0].x) / (point.y - path[0].y), (path[1].x - point.x) / (path[1].y - point.y))
        path.distance = point => Math.abs((path[1].x - path[0].x) * (path[0].y - point.y) - (path[0].x - point.x) * (path[1].y - path[0].y)) / path.len
        return path
    }

    //STEP 1: read paths
    const paths = []

    for (let i = 0; i < fn.length; i++) {
        switch (fn[i]) {
            case pdfjsLib.OPS.constructPath:
                const obj = args[i][1][0]
                const path = []
                for (let j = 0; j < obj.length; j++) {
                    //TODO: curves
                    if (obj[j] === 4) path.push(path[0]) //Close shape
                    else { //MoveTo, LineTo (I expect only LineTo except the first)
                        path.push(obj.slice(j + 1, j + 3))
                        j += 2
                    }
                }
                paths.push(Shape(path, args[i][2]))
                break

            default:
                break
        }
    }

    //STEP 2: Identify shapes
    for (const path of paths) {
        if (isCircle(path)) shapes.circles.push(Circle(path))
        else if (isLine(path)) shapes.lines.push(Line(path))
    }

    return paths
}

async function extractPDFData(fileData) {
    const loadingTask = pdfjsLib.getDocument({ data: fileData })
    const pdfDocument = await loadingTask.promise
    const page = await pdfDocument.getPage(1)
    const opList = await page.getOperatorList()
    const textContent = await page.getTextContent()
    const viewport = page.getViewport({ scale: 1 })
    const { circles, lines } = parseShapes(opList.fnArray, opList.argsArray, viewport.height)
    const text = textContent.items.map(item => ({
        str: item.str,
        top: viewport.height - item.transform[5],
        left: item.transform[4],
        width: item.width,
        height: item.height
    }))

    const symbols = { [KnownSymbols.phi]: [] }
    
    for (const circle of circles) {
        //TODO: assuming the line goes down
        const match = lines.filter(l => diff(Point(circle.center.x, circle.top), l[0]) < 10 && diff(Point(circle.center.x, circle.bottom), l[1]) < 10 && l.distance(circle.center) < 10)
        if (match.length === 1) symbols[KnownSymbols.phi].push([circle, match[0]])
    }

    return { text, symbols }
}

export default ({ children }) => {
    const { data: fileData, isFileLoaded } = useContext(FileContext)
    const [text, setText] = useState([])
    const [symbols, setSymbols] = useState({})

    useEffect(() => {
        if (isFileLoaded()) {
            extractPDFData(fileData).then(({ text, symbols }) => {
                setText(text)
                setSymbols(symbols)
            })
        }
    }, [fileData, isFileLoaded])

    return (
        <PDFContext.Provider
            value={{ text, symbols }}
        >
            {children}
        </PDFContext.Provider>
    )
}
