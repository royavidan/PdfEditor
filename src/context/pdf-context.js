import React, { useState, useEffect, createContext, useContext } from 'react'
import { FileContext } from './file-context'
import pdfjs from '@bundled-es-modules/pdfjs-dist/build/pdf'

export const PDFContext = createContext({
    text: [],
    symbols: {
        phi: []
    },
    isEmpty: () => true
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
    const flipY = y => pageHeight - y

    global.fn = fn
    global.args = args

    const shapes = {
        circles: [],
        lines: []
    }

    const Shape = (path, transform) => {
        const X = path.map(p => p[0]), Y = path.map(p => p[1])

        path.left = Math.min(...X)
        path.bottom = flipY(Math.min(...Y))
        path.right = Math.max(...X)
        path.top = flipY(Math.max(...Y))
        path.width = path.right - path.left
        path.height = path.top - path.bottom
        path.center = middle(Point([path.left, path.bottom]), Point([path.right, path.top]))
        path.transform = transform
        path.angle = -Math.atan2(transform[1], transform[0]) * (180 / Math.PI)
        for (let i = 0; i < path.length; i++) path[i] = Point([path[i][0], flipY(path[i][1])])
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
    let transforms = [[1,0,0,1,0,0]]

    for (let i = 0; i < fn.length; i++) {
        switch (fn[i]) {
            case pdfjs.OPS.transform:
                transforms[0] = args[i]
                break

            case pdfjs.OPS.save:
                transforms.unshift(transforms[0])
                break

            case pdfjs.OPS.restore:
                transforms.shift()
                break

            case pdfjs.OPS.constructPath:
                const path = []
                let index = 0, hasCurves = false
                for (let j = 0; j < args[i][0].length; j++) {
                    const op = j === 0 && args[i][0][0] === pdfjs.OPS.moveTo ? pdfjs.OPS.lineTo : args[i][0][j]
                    switch (op) {
                        case pdfjs.OPS.lineTo:
                            path.push(args[i][1].slice(index, index + 2))
                            index += 2
                            break
                        case pdfjs.OPS.curveTo:
                            //TODO: curves
                            hasCurves = true
                            break
                        case pdfjs.OPS.closePath:
                            path.push(path[0])
                            break
                        default:
                            //TODO: ??
                            break
                    }
                }
                if (!hasCurves) paths.push(Shape(path, transforms[0]))
                break

            default:
                break
        }
    }

    console.log(`paths=${paths.length}`)

    global.paths = paths

    //STEP 2: Identify shapes
    for (const path of paths) {
        if (isCircle(path)) shapes.circles.push(Circle(path))
        else if (isLine(path)) shapes.lines.push(Line(path))
    }

    console.log(`Shapes: circles=${shapes.circles.length}, lines=${shapes.lines.length}`)

    return shapes
}

async function extractPDFData(fileData) {
    console.log('Loading PDF context')
    const loadingTask = pdfjs.getDocument({ data: fileData })
    const pdfDocument = await loadingTask.promise
    const page = await pdfDocument.getPage(1)
    const opList = await page.getOperatorList()
    const textContent = await page.getTextContent()
    const viewport = page.getViewport({ scale: 1 })
    const { circles, lines } = parseShapes(opList.fnArray, opList.argsArray, viewport.height)
    const text = textContent.items.map(item => ({
        str: item.str,
        top: viewport.height - (item.transform[5] + item.height),
        left: item.transform[4],
        width: item.width,
        height: item.height,
        right: item.transform[4] + item.width,
        bottom: viewport.height - item.transform[5],
        angle: -Math.atan2(item.transform[1], item.transform[0]) * (180 / Math.PI)
    }))

    const symbols = { phi: [] }
    
    for (const circle of circles) {
        //TODO: assuming the line goes down
        const match = lines.filter(l => diff(Point([circle.center.x, circle.top]), l[0]) < 10 && diff(Point([circle.center.x, circle.bottom]), l[1]) < 10 && l.distance(circle.center) < 10)
        if (match.length === 1) {
            console.log('found phi')
            symbols.phi.push([circle, match[0]])
        }
    }

    return { text, symbols }
}

export default ({ children }) => {
    const { data: fileData, isFileLoaded } = useContext(FileContext)
    const [text, setText] = useState([])
    const [symbols, setSymbols] = useState({})

    const isEmpty = () => text.length === 0 && Object.keys(symbols).length === 0

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
            value={{ text, symbols, isEmpty }}
        >
            {children}
        </PDFContext.Provider>
    )
}
