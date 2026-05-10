import type React from 'react'
import PropTypes from 'prop-types'

export type ContextProvider = (props: { children: React.ReactNode }) => JSX.Element

export type Permutation<T> = (arg: T) => T

export type ControllerProps<T> = { children(data: T): JSX.Element }

export type Position = { x: number, y: number }

export type Border = {
    left: number
    top: number
    right: number
    bottom: number
}

export type FullResult<T, E = Error> = {
    success: true
    data: T
} | {
    success: false
    error: E
}

export const Position = PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired
})

export const Null = PropTypes.oneOf([null])

export interface SimpleWorker<I, O, E = Error> {
    terminate(): void
    postMessage(message: FullResult<O, E>): void
    onmessage(event: Omit<MessageEvent, 'data'> & { data: I }): void
}

export interface WorkerUsage<I, O, E = Error> {
    terminate(): void
    postMessage(message: I): void
    onmessage(event: Omit<MessageEvent, 'data'> & { data: FullResult<O, E> }): void
}

export type OneOf<T extends Record<string, Record<any, any>>, S extends string = 'type'> = keyof T extends infer K ? K extends keyof T ? {
    [P in S | keyof T[K]]: P extends S ? K : T[K][P]
} : never : never