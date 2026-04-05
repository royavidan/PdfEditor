import React, { useState, useEffect, createContext, useContext } from 'react'
import { FileContext } from './file-context'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.js'
import { arrayIsEqual, floatIsEqual } from '../utils'

const Point = point => {
    point.x = point[0]
    point.y = point[1]
    return point
}

const diff = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)
const middle = (a, b) => Point([(a.x + b.x) / 2, (a.y + b.y) / 2])

const isCircle = path => path.length >= 10 && arrayIsEqual(path[0], path[path.length - 1])
const isLine = path => path.length === 2

export const PDFContext = createContext({
    text: [],
    symbols: {},
    isLoaded: () => false,
    mousePos: Point([0, 0]),
    setMousePos: () => { }
})

const parseShapes = (fn, args, pageHeight) => {
    global.pageHeight = pageHeight
    const flipY = y => pageHeight - y

    global.fn = fn
    global.args = args

    const shapes = {
        circles: [],
        lines: []
    }

    global.shapes = shapes

    const Shape = (path, transform) => {
        path = path.map(p => [p[0] * transform[0] + p[1] * transform[2] + transform[4], p[0] * transform[1] + p[1] * transform[3] + transform[5]])
        const X = path.map(p => p[0]), Y = path.map(p => p[1])

        path.left = Math.min(...X)
        path.bottom = flipY(Math.min(...Y))
        path.right = Math.max(...X)
        path.top = flipY(Math.max(...Y))
        path.width = path.right - path.left
        path.height = path.bottom - path.top
        path.center = middle(Point([path.left, path.bottom]), Point([path.right, path.top]))
        path.transform = transform
        for (let i = 0; i < path.length; i++) path[i] = Point([path[i][0], flipY(path[i][1])])
        return path
    }

    const Circle = path => {
        path.radius = ((path.bottom - path.top) + (path.right - path.left)) / 2
        path.isInside = point => diff(point, path.center) <= path.radius
        return path
    }

    const Line = path => {
        path.slope = (path[1].y - path[0].y) / (path[1].x - path[0].x)
        path.len = diff(path[0], path[1])
        path.cross = point => floatIsEqual((point.x - path[0].x) / (point.y - path[0].y), (path[1].x - point.x) / (path[1].y - point.y))
        path.distance = point => {
            if (path.slope === 0) {
                if (point.x >= path.left && point.x <= path.right) return Math.abs(point.y - path[0].y)
                return Math.min(diff(point, path[0]), diff(point, path[1]))
            }
            if (!Number.isFinite(path.slope)) {
                if (point.y >= path.top && point.y <= path.bottom) return Math.abs(point.x - path[0].x)
                return Math.min(diff(point, path[0]), diff(point, path[1]))
            }
            const x = (point.x / path.slope + point.y + path.slope * path[0].x - path[0].y) / (path.slope + 1 / path.slope)
            if (x < path.left || x > path.right) return Math.min(diff(point, path[0]), diff(point, path[1]))
            const y = path.slope * (x - path[0].x) + path[0].y
            return diff(point, Point([x, y]))
        }
        return path
    }

    //STEP 1: read paths
    const paths = []
    global.paths = paths
    let transforms = [[1, 0, 0, 1, 0, 0]]

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

            case pdfjs.OPS.constructPath: {
                let path = []
                let index = 0, hasCurves = false
                for (let j = 0; j < args[i][0].length; j++) {
                    switch (args[i][0][j]) {
                        case pdfjs.OPS.moveTo:
                            if (j) {
                                if (!hasCurves) {
                                    paths.push(Shape(path, transforms[0]))
                                    paths[paths.length - 1].i = i
                                }
                                hasCurves = false
                                path = [args[i][1].slice(index, index + 2)]
                            } else {
                                path.push(args[i][1].slice(index, index + 2))
                            }
                            index += 2
                            break
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
                if (!hasCurves) {
                    paths.push(Shape(path, transforms[0]))
                    paths[paths.length - 1].i = i
                }
            } break

            default:
                break
        }
    }

    //STEP 2: Identify shapes
    for (const path of paths) {
        if (isCircle(path)) shapes.circles.push(Circle(path))
        else if (isLine(path)) shapes.lines.push(Line(path))
    }

    return shapes
}

async function extractPDFData(fileData) {
    console.log('Loading PDF context')
    const loadingTask = pdfjs.getDocument({ data: fileData })
    const pdfDocument = await loadingTask.promise
    const page = await pdfDocument.getPage(1)
    const opList = await page.getOperatorList()
    const viewport = page.getViewport({ scale: 1 })
    const textContent = await page.getTextContent()
    global.textContent = textContent
    const { circles, lines } = parseShapes(opList.fnArray, opList.argsArray, viewport.height)
    const text = textContent.items.filter(item => item.str.trim()).map(item => ({
        str: item.str,
        top: viewport.height - (item.transform[5] + item.height),
        left: item.transform[4],
        width: Math.abs(item.width),
        height: Math.abs(item.height),
        right: item.transform[4] + Math.abs(item.width),
        bottom: viewport.height - item.transform[5],
        transform: item.transform,
        angle: -Math.atan2(item.transform[1], item.transform[0])
    }))
    text.forEach(t => {
        if (t.angle) {
            const x = t.transform[4], y = viewport.height - t.transform[5], a = -t.angle, w = t.width, h = t.height
            const cos = Math.cos(a), sin = Math.sin(a)
            const points = [
                [x, y],
                [x - h * sin, y - h * cos],
                [x - h * sin + w * cos, y - h * cos - w * sin],
                [x + w * cos, y - w * sin]
            ]
            const X = points.map(p => p[0]), Y = points.map(p => p[1])
            t.border = {
                left: Math.min(...X),
                right: Math.max(...X),
                top: Math.min(...Y),
                bottom: Math.max(...Y)
            }
        } else {
            t.border = t
        }
    })

    const symbols = {
        dia: [],

        perpendicularity: [],
        parallelism: [],
        'true position': [],
        concentricity: []
    }
    const addRects = base => {
        const shapes = Object.values(base).filter(s => typeof s === 'object')
        base.left = Math.min(...shapes.map(s => s.left))
        base.right = Math.max(...shapes.map(s => s.right))
        base.top = Math.min(...shapes.map(s => s.top))
        base.bottom = Math.max(...shapes.map(s => s.bottom))
        base.width = base.right - base.left
        base.height = base.bottom - base.top
        return base
    }

    for (const circle of circles) {
        if (circle.width > 15) continue
        const edgeDistance = circle.radius * 1.5, centerDistance = circle.radius * 0.5
        const closeLines = lines.filter(l => l.distance(circle.center) < centerDistance)
        //DIAMETER:
        const matchPhi = l => {
            const [top, bottom] = l[0].y < l[1].y ? l : [l[1], l[0]]
            //TODO: confirm that position isn't included here by mistake (shouldn't)
            return diff(Point([circle.center.x, circle.top]), top) < edgeDistance && diff(Point([circle.center.x, circle.bottom]), bottom) < edgeDistance
        }
        if (closeLines.length === 1 && matchPhi(closeLines[0])) {
            const line = closeLines[0]
            symbols.dia.push(addRects({ circle, line }))
        }

        //POSITION:
        const match = [
            closeLines.filter(l => l.len < circle.width * 2.5 && floatIsEqual(l.slope, 0)),
            closeLines.filter(l => l.len < circle.width * 2.5 && !Number.isFinite(l.slope))
        ]
        if (match[0].length === 1 && match[1].length === 1) {
            const horizontal = match[0][0], vertical = match[1][0]
            symbols['true position'].push(addRects({ circle, horizontal, vertical }))
        }

        //CONCENTRICITY:
        const innerCircles = circles.filter(c => diff(circle.center, c.center) < centerDistance
            && c.left > circle.left && c.right < circle.right && c.top > circle.top && c.bottom < circle.bottom)
        if (innerCircles.length === 1) {
            symbols.concentricity.push(addRects({ outer: circle, inner: innerCircles[0] }))
        }
    }

    for (const line of lines) {
        if (line.len > 15) continue
        //PARALLELISM:
        const parallelLines = lines.filter(l => floatIsEqual(l.slope, line.slope) && l.left > line.left && floatIsEqual(l.len, line.len)
            && Math.min(diff(l[0], line[0]), diff(l[1], line[0]) < l.len / 2))
        if (parallelLines.length === 1) {
            symbols.parallelism.push(addRects({ left: line, right: parallelLines[0] }))
        }

        //PERPENDICULARITY:
        const perpendicularLines = lines.filter(l => (floatIsEqual(diff(line.center, l[0]), 0) || floatIsEqual(diff(line.center, l[1]), 0))
            && ((!Number.isFinite(l.slope) && line.slope === 0) || (!Number.isFinite(line.slope) && l.slope === 0) || floatIsEqual(l.slope * line.slope, -1)))
        if (perpendicularLines.length === 1) {
            symbols.perpendicularity.push(addRects({ base: line, perpendicular: perpendicularLines[0] }))
        }
    }

    global.text = text
    global.symbols = symbols

    return { text, symbols }
}

export default ({ children }) => {
    const { data: fileData, isFileLoaded } = useContext(FileContext)
    const [text, setText] = useState(null)
    const [symbols, setSymbols] = useState(null)
    const [mousePos, _setMousePos] = useState(Point([0, 0]))

    const isLoaded = () => text !== null && symbols !== null
    const setMousePos = pos => _setMousePos(Point([pos.x, pos.y]))

    useEffect(() => {
        if (isFileLoaded()) {
            extractPDFData(fileData).then(({ text, symbols }) => {
                setText(text)
                setSymbols(symbols)
            })
        } else {
            setText(null)
            setSymbols(null)
        }
    }, [fileData, isFileLoaded])

    return (
        <PDFContext.Provider
            value={{ text, symbols, isLoaded, mousePos, setMousePos }}
        >
            {children}
        </PDFContext.Provider>
    )
}
