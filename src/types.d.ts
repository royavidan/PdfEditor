import type React from 'react'

export type ContextProvider = (props: { children: React.ReactNode }) => React.JSX.Element

export type Permutation<T> = (arg: T) => T