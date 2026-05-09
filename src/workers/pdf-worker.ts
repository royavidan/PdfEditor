import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.js'

import { arrayIsEqual, floatIsEqual, findOne } from '../utils'
import type { TextItem, PDFOperatorList } from 'pdfjs-dist/types/src/display/api'
import type { Position, Border } from '../types'
import type { Text, Symbol, SymbolType, Transform } from '../context/pdf-context'

type Point = Position & [number, number]

interface Shape extends Array<Point>, Border {
    width: number
    height: number
    center: Point
    transform: Transform
}

interface Circle extends Shape {
    radius: number
    isInside(point: Point): boolean
}

interface HalfCircle extends Shape {
    radius: number
    full: boolean
    realCenter: Point
    isInside(point: Point): boolean
}

interface Line extends Shape {
    slope: number
    angle: number
    len: number
    cross(point: Point): boolean
    distance(point: Point): number
    perpendicular(line: Line, epsilon?: number): boolean
}

const Point = (point: [number, number]): Point => {
    const p = point as Point
    p.x = point[0]
    p.y = point[1]
    return p
}

const diff = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)
const middle = (a: Point, b: Point) => Point([(a.x + b.x) / 2, (a.y + b.y) / 2])

const isCircle = (path: Point[]) => path.length >= 10 && arrayIsEqual(path[0], path[path.length - 1])
const isLine = (path: Point[]) => path.length === 2

const parseShapes = (fn: number[], args: any[], pageHeight: number) => {
    const flipY = (y: number) => pageHeight - y

    const shapes = {
        circles: [] as Circle[],
        lines: [] as Line[],
        halfCircles: [] as HalfCircle[],
        trapezoids: [] as Shape[]
    }

    const Shape = (path: Point[], transform: Transform) => {
        const p = path.map(p => [p[0] * transform[0] + p[1] * transform[2] + transform[4], p[0] * transform[1] + p[1] * transform[3] + transform[5]]) as unknown as Shape
        const X = path.map(p => p[0]), Y = path.map(p => p[1])

        p.left = Math.min(...X)
        p.bottom = flipY(Math.min(...Y))
        p.right = Math.max(...X)
        p.top = flipY(Math.max(...Y))
        p.width = p.right - p.left
        p.height = p.bottom - p.top
        p.center = middle(Point([p.left, p.bottom]), Point([p.right, p.top]))
        p.transform = transform
        for (let i = 0; i < p.length; i++) p[i] = Point([p[i][0], flipY(p[i][1])])
        return p
    }

    const Circle = (path: Shape) => {
        const p = path as Circle
        p.radius = ((p.bottom - p.top) + (p.right - p.left)) / 2
        p.isInside = point => diff(point, p.center) <= p.radius
        return p
    }

    //Top Only
    const HalfCircle = (path: Shape) => {
        const p = path as HalfCircle
        p.radius = (p.right - p.left) / 2
        p.full = arrayIsEqual(p[0], p[p.length - 1])
        p.realCenter = Point([p.center.x, p.bottom])
        p.isInside = point => diff(point, p.realCenter) <= p.radius && point.y <= p.bottom
        return p
    }

    const Line = (path: Shape) => {
        const p = path as Line
        p.slope = (p[1].y - p[0].y) / (p[1].x - p[0].x)
        p.angle = -Math.atan2(p[1].y - p[0].y, p[1].x - p[0].x)
        if (p.angle < 0) p.angle += Math.PI
        p.len = diff(p[0], p[1])
        p.cross = point => floatIsEqual((point.x - p[0].x) / (point.y - p[0].y), (p[1].x - point.x) / (p[1].y - point.y))
        p.distance = point => {
            if (p.slope === 0) {
                if (point.x >= p.left && point.x <= p.right) return Math.abs(point.y - p[0].y)
                return Math.min(diff(point, p[0]), diff(point, p[1]))
            }
            if (!Number.isFinite(p.slope)) {
                if (point.y >= p.top && point.y <= p.bottom) return Math.abs(point.x - p[0].x)
                return Math.min(diff(point, p[0]), diff(point, p[1]))
            }
            const x = (point.x / p.slope + point.y + p.slope * p[0].x - p[0].y) / (p.slope + 1 / p.slope)
            if (x < p.left || x > p.right) return Math.min(diff(point, p[0]), diff(point, p[1]))
            const y = p.slope * (x - p[0].x) + p[0].y
            return diff(point, Point([x, y]))
        }
        // p.perpendicular = line => ((!Number.isFinite(p.slope) && line.slope === 0) || (!Number.isFinite(line.slope) && p.slope === 0) || floatIsEqual(p.slope * line.slope, -1))
        p.perpendicular = (line, epsilon) => floatIsEqual(Math.abs(p.angle - line.angle), Math.PI / 2, epsilon)
        return p
    }

    //STEP 1: read paths
    const paths: Shape[] = []
    let transforms: Transform[] = [[1, 0, 0, 1, 0, 0]]

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
                let path: Point[] = []
                let index = 0, hasCurves = false
                for (let j = 0; j < args[i][0].length; j++) {
                    switch (args[i][0][j]) {
                        case pdfjs.OPS.moveTo:
                            if (j) {
                                if (!hasCurves) {
                                    paths.push(Shape(path, transforms[0]))
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
                }
            } break

            default:
                break
        }
    }

    //STEP 2: Identify shapes
    for (const path of paths) {
        const slope = (p1: Point, p2: Point) => (p2.y - p1.y) / (p2.x - p1.x)
        const edge = arrayIsEqual(path[0], path[path.length - 1]) ? path[path.length - 2] : path[path.length - 1]
        if (path.length >= 7 && floatIsEqual(path[0].x, path.left) && floatIsEqual(edge.x, path.right) && floatIsEqual(path[0].y, edge.y))
            shapes.halfCircles.push(HalfCircle(path))
        else if (path.length === 5 && arrayIsEqual(path[0], path[path.length - 1])
            && floatIsEqual(slope(path[0], path[1]), slope(path[2], path[3]))
            && floatIsEqual(diff(path[0], path[1]), diff(path[2], path[3]))
            && floatIsEqual(diff(path[1], path[2]), diff(path[3], path[4]))) {
            shapes.trapezoids.push(path)
        }
        else if (isCircle(path)) shapes.circles.push(Circle(path))
        else if (isLine(path)) shapes.lines.push(Line(path))
    }

    return shapes
}

type Plus = { h: Line, v: Line }
function fixPlusMinus(lines: Line[], text: any[]) {
    //@ts-ignore
    lines.forEach((line, index) => line.index = index)
    const linesToRemove = new Set()
    const horizontal = lines.filter(l => l.len < 20 && l.slope === 0), vertical = lines.filter(l => l.len < 20 && !Number.isFinite(l.slope))

    //STEP 1: find plus signs
    const plus: Plus[] = []
    for (const h of horizontal) {
        const v = vertical.find(l => floatIsEqual(diff(l.center, h.center), 0) && floatIsEqual(l.len, h.len))
        if (v) plus.push({ h, v })
    }

    //STEP 2: find plusminus
    const addPlusMinus = (plus: Plus, minus: Line, angle: number) => {
        const shapes = [plus.h, plus.v, minus]
    //@ts-ignore
        shapes.forEach(s => linesToRemove.add(s.index))
        const r = {
            left: Math.min(...shapes.map(s => s.left)),
            right: Math.max(...shapes.map(s => s.right)),
            top: Math.min(...shapes.map(s => s.top)),
            bottom: Math.max(...shapes.map(s => s.bottom)),
            str: '±',
            transform: [1, 0, 0, 1, 0, 0],
            angle
        } as Text
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
        const hminus = horizontal.find(l => !floatIsEqual(l.top, h.top) && floatIsEqual(l.len, h.len) && (diff(l.center, v[0].y < v[1].y ? v[1] : v[0]) < l.len / 5
            || (diff(l.center, v[0].y < v[1].y ? v[1] : v[0]) < l.len && floatIsEqual(l.left,h.left))))
        if (hminus) addPlusMinus({ h, v }, hminus, 0)

        const vminus = vertical.find(l => !floatIsEqual(l.left, v.left) && floatIsEqual(l.len, v.len) && (diff(l.center, h[0].x < h[1].x ? h[1] : h[0]) < l.len / 5
            || (diff(l.center, h[0].x < h[1].x ? h[1] : h[0]) < l.len && floatIsEqual(l.top, v.top))))
        if (vminus) addPlusMinus({ h, v }, vminus, -Math.PI / 2)
    }
    //@ts-ignore
    lines.forEach(l => delete l.index)
    return linesToRemove
}

function extractPDFPageData(opList: PDFOperatorList, rotation: number, pageHeight: number, textItems: TextItem[]) {
    let { circles, lines, halfCircles, trapezoids } = parseShapes(opList.fnArray, opList.argsArray, pageHeight)
    const text = textItems.filter(item => item.str.trim()).map(item => ({
        str: item.str,
        top: pageHeight - (item.transform[5] + item.height),
        left: item.transform[4],
        width: Math.abs(item.width),
        height: Math.abs(item.height),
        right: item.transform[4] + Math.abs(item.width),
        bottom: pageHeight - item.transform[5],
        transform: item.transform,
        angle: -rotation - Math.atan2(item.transform[1], item.transform[0])
    } as Text))
    const linesToRemove = fixPlusMinus(lines, text)
    lines = lines.filter((_, i) => !linesToRemove.has(i))
    text.forEach(t => {
        if (t.angle) {
            const x = t.transform[4], y = pageHeight - t.transform[5], a = -t.angle, w = t.width, h = t.height
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

    const symbols: Record<SymbolType, Symbol[]> = {
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
    const addRects = (...shapes: Shape[]) => {
        const base = {
            left: Math.min(...shapes.map(s => s.left)),
            right: Math.max(...shapes.map(s => s.right)),
            top: Math.min(...shapes.map(s => s.top)),
            bottom: Math.max(...shapes.map(s => s.bottom))
        } as Symbol
        base.width = base.right - base.left
        base.height = base.bottom - base.top
        return base
    }

    const touchOne = (l: Line, p: Point) => floatIsEqual(Math.min(diff(l[0], p), diff(l[1], p)), 0, 0.1)
    const betweenAngles = (val: number, limits: [number, number]) => (val >= limits[0] && val <= limits[1]) || (Math.PI - val >= limits[0] && Math.PI - val <= limits[1])

    for (const circle of circles) {
        if (circle.width > 15) continue
        const edgeDistance = circle.radius * 1.5, centerDistance = circle.radius * 0.5

        //DIAMETER:
        const closeLines = lines.filter(l => l.distance(circle.center) < centerDistance)
        if (closeLines.length === 1) {
            const match = closeLines[0]
            const [top, bottom] = match[0].y < match[1].y ? match : [match[1], match[0]]
            if (diff(Point([circle.center.x, circle.top]), top) < edgeDistance && diff(Point([circle.center.x, circle.bottom]), bottom) < edgeDistance) {
                symbols.dia.push(addRects(circle, match))
            }
        }

        //POSITION:
        {
            const horizontal = findOne(closeLines, l => l.len < circle.width * 2.5 && floatIsEqual(l.slope, 0))
            const vertical = findOne(closeLines, l => l.len < circle.width * 2.5 && !Number.isFinite(l.slope))
            if (horizontal && vertical) {
                symbols['true position'].push(addRects(circle, horizontal, vertical))
            }
        }

        //CONCENTRICITY:
        const innerCircle = findOne(circles, c => diff(circle.center, c.center) < centerDistance
            && c.left > circle.left && c.right < circle.right && c.top > circle.top && c.bottom < circle.bottom)
        if (innerCircle) {
            symbols.concentricity.push(addRects(circle, innerCircle))
        }

        //CYLINDRICITY:
        const tangentLines = lines.filter(l => floatIsEqual(l.distance(circle.center), circle.radius))
        if (tangentLines.length === 2 && floatIsEqual(tangentLines[0].angle, tangentLines[1].angle)) {
            symbols.cylindricity.push(addRects(circle, ...tangentLines))
        }
    }

    for (const line of lines) {
        if (line.len > 15) continue
        if (line.slope && Number.isFinite(line.slope)) {
            //PARALLELISM:
            const parallelLine = findOne(lines, l => floatIsEqual(l.angle, line.angle, 0.02) && l.left > line.left && floatIsEqual(l.len, line.len, 0.1)
                && Math.min(diff(l[0], line[0]), diff(l[1], line[0])) < l.len / 2)
            if (parallelLine) {
                symbols.parallelism.push(addRects(line, parallelLine))
            }

            //RUN OUT:
            const topPoint = line[0].y < line[1].y ? line[0] : line[1]
            const betweenAngles = (val: number, limits: [number, number]) => (val >= limits[0] && val <= limits[1]) || (Math.PI - val >= limits[0] && Math.PI - val <= limits[1])
            const limitAngles = [5, 25].map(a => a * Math.PI / 180) as [number, number]
            const right = findOne(lines, l => l.len < line.len && touchOne(l, topPoint) && betweenAngles(l.angle - line.angle, limitAngles))
            const left = findOne(lines, l => l.len < line.len && touchOne(l, topPoint) && betweenAngles(line.angle - l.angle, limitAngles))
            if (right && left) symbols['run out'].push(addRects(line, left, right))
        }

        //PERPENDICULARITY (and depth):
        const isInsideRect = (rect: Border, point: Point) => point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom
        if (!floatIsEqual(line.left, line.right) || text.every(t => !isInsideRect(t.border, line[0].y < line[1].y ? line[0] : line[1]))) {
            const perpendicularLine = findOne(lines, l => touchOne(line, l.center) && line.perpendicular(l))
            if (perpendicularLine) {
                const untouchedPoint = floatIsEqual(diff(perpendicularLine.center, line[0]), 0, 0.1) ? line[1] : line[0]
                const limitAngles = [30, 75].map(a => a * Math.PI / 180) as [number, number]
                const right = findOne(lines, l => l.len < line.len && touchOne(l, untouchedPoint) && betweenAngles(l.angle - line.angle, limitAngles))
                const left = findOne(lines, l => l.len < line.len && touchOne(l, untouchedPoint) && betweenAngles(line.angle - l.angle, limitAngles))
                if (right && left) symbols.depth.push(addRects(line, perpendicularLine, left, right))
                else symbols.perpendicularity.push(addRects(line, perpendicularLine))
            }
        }

        //SYMMETRY:
        const symmetricLines = lines.filter(l => floatIsEqual(l.angle, line.angle) && l.len < line.len && diff(l.center, line.center) < line.len / 2)
        if (symmetricLines.length === 2 && floatIsEqual(symmetricLines[0].len, symmetricLines[1].len) && diff(line.center, middle(symmetricLines[0].center, symmetricLines[1].center)) < line.len / 2) {
            symbols.symmetry.push(addRects(line, ...symmetricLines))
        }

        //ANGULARITY:
        const angularLine = findOne(lines, l => (l[0] === line[0] || l[0] === line[1] || l[1] === line[0] || l[1] === line[1]) && floatIsEqual(l.slope - line.slope, -0.75))
        if (angularLine) {
            symbols.angularity.push(addRects(line, angularLine))
        }

        //FLATNESS:
        const flatTopLine = findOne(lines, l => floatIsEqual(l.angle, line.angle) && floatIsEqual(l.len, line.len) && l.left > line.left && l.top < line.top && diff(l.center, line.center) < l.len)
        if (flatTopLine) {
            const l1 = line[0].x < line[1].x ? [line[0], line[1]] : [line[1], line[0]]
            const l2 = flatTopLine[0].x < flatTopLine[1].x ? [flatTopLine[0], flatTopLine[1]] : [flatTopLine[1], flatTopLine[0]]
            const leftLine = findOne(lines, l => (diff(l[0], l1[0]) < 0.5 && diff(l[1], l2[0]) < 0.5) || (diff(l[1], l1[0]) < 0.5 && diff(l[0], l2[0]) < 0.5))
            const rightLine = findOne(lines, l => (diff(l[0], l1[1]) < 0.5 && diff(l[1], l2[1]) < 0.5) || (diff(l[1], l1[1]) < 0.5 && diff(l[0], l2[1]) < 0.5))
            if (leftLine && rightLine && floatIsEqual(leftLine.len, rightLine.len)) {
                symbols.flatness.push(addRects(leftLine, rightLine, flatTopLine, line))
            }
        }
    }

    for (const halfCircle of halfCircles) {
        //SURFACE PROFILE:
        symbols['surface profile'].push(addRects(halfCircle))
    }

    for (const trapezoid of trapezoids) {
        //FLATNESS:
        if ((!floatIsEqual(trapezoid[0].x, trapezoid[1].x) && !floatIsEqual(trapezoid[0].y, trapezoid[1].y))
            || (!floatIsEqual(trapezoid[2].x, trapezoid[1].x) && !floatIsEqual(trapezoid[2].y, trapezoid[1].y))) {
            symbols.flatness.push(addRects(trapezoid))
        }
    }

    return { text, symbols }
}

declare const self: Worker

export interface PdfWorkerData {
    opList: PDFOperatorList
    rotation: number
    pageHeight: number
    textItems: TextItem[]
}

export interface PdfWorkerSuccess {
    success: true
    data: { text: Text[], symbols: Record<SymbolType, Symbol[]> }
}

interface PdfWorkerError {
    success: false
    error: Error
}

export type PdfWorkerResult = PdfWorkerSuccess | PdfWorkerError

self.onmessage = (event: MessageEvent) => {
    for (const { opList, rotation, pageHeight, textItems } of event.data as PdfWorkerData[]) {
        try {
            const data = extractPDFPageData(opList, rotation, pageHeight, textItems)
            self.postMessage({ success: true, data } as PdfWorkerSuccess)
        } catch(e) {
            self.postMessage({ success: false, error: e } as PdfWorkerError)
        }
    }
}