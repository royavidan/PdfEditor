declare module 'react-files' {
    import type React from 'react'

    interface ImagePreview {
        type: 'image'
        url: string
    }

    interface FilePreview {
        type: 'file'
    }

    type Preview = FilePreview | ImagePreview

    export interface FileData extends File {
        id: string
        extension: string
        sizeReadable: number
        preview: Preview
    }

    export type FileError = {
        code: number
        message: string
    }

    export type FilesErrorHandler = (err: FileError, file: FileData) => void

    interface FilesProps {
        accepts?: string[]
        children?: React.JSX.Element | ((isDragging: boolean) => React.JSX.Element)
        className?: string
        clickable?: boolean
        dragActiveClassName?: string
        inputProps?: React.HTMLAttributes<HTMLInputElement>
        multiple?: boolean
        maxFiles?: number
        maxFileSize?: number
        minFileSize?: number
        name?: string
        onChange?(files: FileData[]): void
        onDragEnter?: React.DragEventHandler<HTMLDivElement>
        onDragLeave?: React.DragEventHandler<HTMLDivElement>
        onError?: FilesErrorHandler
        style?: React.CSSProperties
    }

    declare function Files(props: FilesProps): React.JSX.Element

    export default Files
}