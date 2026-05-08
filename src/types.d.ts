import type React from 'react'

export type ContextProvider = (props: { children: React.ReactNode }) => React.JSX.Element

export type Permutation<T> = (arg: T) => T

export type ControllerProps<T> = { children(data: T): React.JSX.Element }

export type Position = { x: number, y: number }

export type Border = {
    left: number
    top: number
    right: number
    bottom: number
}