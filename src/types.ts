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

export const Position = PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired
})

export const Null = PropTypes.oneOf([null])