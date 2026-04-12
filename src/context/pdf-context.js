import React, { useState, useEffect, createContext, useContext } from 'react'
import { FileContext } from './file-context'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.js'
import { arrayIsEqual, floatIsEqual, findOne } from '../utils'

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
    isLoaded: () => false
})

const parseShapes = (fn, args, pageHeight) => {
    global.pageHeight = pageHeight
    const flipY = y => pageHeight - y

    global.fn = fn
    global.args = args

    const shapes = {
        circles: [],
        lines: [],
        halfCircles: []
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

    //Top Only
    const HalfCircle = path => {
        path.radius = (path.right - path.left) / 2
        path.full = arrayIsEqual(path[0], path[path.length - 1])
        path.realCenter = Point([path.center.x, path.bottom])
        path.isInside = point => diff(point, path.realCenter) <= path.radius && point.y <= path.bottom
        return path
    }

    const Line = path => {
        path.slope = (path[1].y - path[0].y) / (path[1].x - path[0].x)
        path.angle = -Math.atan2(path[1].y - path[0].y, path[1].x - path[0].x)
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
        path.perpendicular = line => ((!Number.isFinite(path.slope) && line.slope === 0) || (!Number.isFinite(line.slope) && path.slope === 0) || floatIsEqual(path.slope * line.slope, -1))
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
                        case pdfjs.OPS.closePath:
                            if (path[0] !== path[path.length - 1]) path.push(path[0])
                            break
                        default:
                            hasCurves = true
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
        const edge = arrayIsEqual(path[0], path[path.length - 1]) ? path[path.length - 2] : path[path.length - 1]
        if (path.length >= 7 && floatIsEqual(path[0].x, path.left) && floatIsEqual(edge.x, path.right) && floatIsEqual(path[0].y, edge.y))
            shapes.halfCircles.push(HalfCircle(path))
        else if (isCircle(path)) shapes.circles.push(Circle(path))
        else if (isLine(path)) shapes.lines.push(Line(path))
    }

    return shapes
}

function fixPlusMinus(lines, text) {
    lines.forEach((line, index) => line.index = index)
    const linesToRemove = new Set()
    const horizontal = lines.filter(l => l.len < 20 && l.slope === 0), vertical = lines.filter(l => l.len < 20 && !Number.isFinite(l.slope))

    //STEP 1: find plus signs
    const plus = []
    for (const h of horizontal) {
        const v = vertical.find(l => floatIsEqual(diff(l.center, h.center), 0) && floatIsEqual(l.len, h.len))
        if (v) plus.push({ h, v })
    }

    //STEP 2: find plusminus
    const addPlusMinus = (plus, minus, angle) => {
        const shapes = [plus.h, plus.v, minus]
        shapes.forEach(s => linesToRemove.add(s.index))
        const r = {
            left: Math.min(...shapes.map(s => s.left)),
            right: Math.max(...shapes.map(s => s.right)),
            top: Math.min(...shapes.map(s => s.top)),
            bottom: Math.max(...shapes.map(s => s.bottom)),
            str: '±',
            transform: [1, 0, 0, 1, 0, 0],
            angle
        }
        r.width = r.right - r.left
        r.height = r.bottom - r.top
        if (angle) {
            r.left += r.width
            r.right += r.width
        }
        r.plusminus = true
        text.push(r)
    }
    for (const { h, v } of plus) {
        const hminus = horizontal.find(l => floatIsEqual(l.len, h.len) && diff(l.center, v[0].y < v[1].y ? v[1] : v[0]) < l.len / 5)
        if (hminus) addPlusMinus({ h, v }, hminus, 0)

        const vminus = vertical.find(l => floatIsEqual(l.len, v.len) && diff(l.center, h[0].x < h[1].x ? h[1] : h[0]) < l.len / 5)
        if (vminus) addPlusMinus({ h, v }, vminus, -Math.PI / 2)
    }
    lines.forEach(l => delete l.index)
    return linesToRemove
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
    let { circles, lines, halfCircles } = parseShapes(opList.fnArray, opList.argsArray, viewport.height)
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
    const linesToRemove = fixPlusMinus(lines, text)
    lines = lines.filter((_, i) => !linesToRemove.has(i))
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
        depth: [],

        straightness: [],
        flatness: [],
        circlarity: [],
        cylindricity: [],
        'surface profile': [],
        perpendicularity: [],
        angularity: [],
        parallelism: [],
        symmetry: [],
        'true position': [],
        concentricity: [],
        'run out': []
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

        //DIAMETER:
        const closeLines = lines.filter(l => l.distance(circle.center) < centerDistance)
        if (closeLines.length === 1) {
            const match = closeLines[0]
            const [top, bottom] = match[0].y < match[1].y ? match : [match[1], match[0]]
            if (diff(Point([circle.center.x, circle.top]), top) < edgeDistance && diff(Point([circle.center.x, circle.bottom]), bottom) < edgeDistance) {
                symbols.dia.push(addRects({ circle, line: match }))
            }
        }

        //POSITION:
        {
            const horizontal = findOne(closeLines, l => l.len < circle.width * 2.5 && floatIsEqual(l.slope, 0))
            const vertical = findOne(closeLines, l => l.len < circle.width * 2.5 && !Number.isFinite(l.slope))
            if (horizontal && vertical) {
                symbols['true position'].push(addRects({ circle, horizontal, vertical }))
            }
        }

        //CONCENTRICITY:
        const innerCircle = findOne(circles, c => diff(circle.center, c.center) < centerDistance
            && c.left > circle.left && c.right < circle.right && c.top > circle.top && c.bottom < circle.bottom)
        if (innerCircle) {
            symbols.concentricity.push(addRects({ outer: circle, inner: innerCircle }))
        }

        //CYLINDRICITY:
        const tangentLines = lines.filter(l => floatIsEqual(l.distance(circle.center), circle.radius))
        if (tangentLines.length === 2 && floatIsEqual(tangentLines[0].slope, tangentLines[1].slope)) {
            symbols.cylindricity.push(addRects({ top: tangentLines[0], bottom: tangentLines[1], circle }))
        }
    }

    for (const line of lines) {
        if (line.len > 15) continue
        //PARALLELISM:
        if (line.slope && Number.isFinite(line.slope)) {
            const parallelLine = findOne(lines, l => floatIsEqual(l.slope, line.slope) && l.left > line.left && floatIsEqual(l.len, line.len)
                && Math.min(diff(l[0], line[0]), diff(l[1], line[0])) < l.len / 2)
            if (parallelLine) {
                symbols.parallelism.push(addRects({ left: line, right: parallelLine }))
            }
        }

        //PERPENDICULARITY (and depth):
        const touchOne = (l, p) => floatIsEqual(Math.min(diff(l[0], p), diff(l[1], p)), 0)
        const perpendicularLine = findOne(lines, l => touchOne(line, l.center) && line.perpendicular(l))
        if (perpendicularLine) {
            const between = (val, limits) => val >= limits[0] && val <= limits[1]
            const untouchedPoint = floatIsEqual(diff(perpendicularLine.center, line[0])) ? line[1] : line[0]
            const limitAngles = [55, 65].map(a => a * Math.PI / 180)
            const right = findOne(lines, l => l.len < line.len && touchOne(l, untouchedPoint) && between(l.angle - line.angle, limitAngles))
            const left = findOne(lines, l => l.len < line.len && touchOne(l, untouchedPoint) && between(line.angle - l.angle, limitAngles))
            if (right && left) symbols.depth.push(addRects({ base: line, perpendicular: perpendicularLine, right, left }))
            else symbols.perpendicularity.push(addRects({ base: line, perpendicular: perpendicularLine }))
        }

        //SYMMETRY:
        const symmetricLines = lines.filter(l => floatIsEqual(l.slope, line.slope) && l.len < line.len && diff(l.center, line.center) < line.len / 2)
        if (symmetricLines.length === 2 && floatIsEqual(symmetricLines[0].len, symmetricLines[1].len) && diff(line.center, middle(symmetricLines[0].center, symmetricLines[1].center)) < line.len / 2) {
            symbols.symmetry.push(addRects({ top: symmetricLines[0], bottom: symmetricLines[1], middle: line }))
        }

        //ANGULARITY:
        const angularLine = findOne(lines, l => (l[0] === line[0] || l[0] === line[1] || l[1] === line[0] || l[1] === line[1]) && floatIsEqual(l.slope - line.slope, -0.75))
        if (angularLine) {
            symbols.angularity.push(addRects({ flat: line, angular: angularLine }))
        }

        //FLATNESS:
        const flatTopLine = findOne(lines, l => floatIsEqual(l.slope, line.slope) && floatIsEqual(l.len, line.len) && l.left > line.left && l.top > line.top && diff(l.center, line.center) < l.len)
        if (flatTopLine) {
            const l1 = line[0].x < line[1].x ? [line[0], line[1]] : [line[1], line[0]]
            const l2 = flatTopLine[0].x < flatTopLine[1].x ? [flatTopLine[0], flatTopLine[1]] : [flatTopLine[1], flatTopLine[0]]
            const leftLine = findOne(lines, l => (diff(l[0], l1[0]) < 0.5 && diff(l[1], l2[0]) < 0.5) || (diff(l[1], l1[0]) < 0.5 && diff(l[0], l2[0]) < 0.5))
            const rightLine = findOne(lines, l => (diff(l[0], l1[1]) < 0.5 && diff(l[1], l2[1]) < 0.5) || (diff(l[1], l1[1]) < 0.5 && diff(l[0], l2[1]) < 0.5))
            if (leftLine && rightLine && floatIsEqual(leftLine.len, rightLine.len)) {
                symbols.flatness.push(addRects({ left: leftLine, right: rightLine, top: flatTopLine, bottom: line }))
            }
        }
    }

    for (const halfCircle of halfCircles) {
        //SURFACE PROFILE:
        symbols['surface profile'].push(addRects({ arc: halfCircle }))
    }

    global.text = text
    global.symbols = symbols

    return { text, symbols }
}

export default ({ children }) => {
    const { data: fileData, isFileLoaded } = useContext(FileContext)
    const [text, setText] = useState(null)
    const [symbols, setSymbols] = useState(null)

    const isLoaded = () => text !== null && symbols !== null

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
            value={{ text, symbols, isLoaded }}
        >
            {children}
        </PDFContext.Provider>
    )
}
