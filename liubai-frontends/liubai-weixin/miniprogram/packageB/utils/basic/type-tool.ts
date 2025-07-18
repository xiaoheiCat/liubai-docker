
export type PartialSth<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type RequireSth<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

export type AnyFunc = (...args: any[]) => any

export type SimpleFunc = () => void

export type BoolFunc = (val: boolean) => void

export type StrFunc = (val: string) => void

export type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}

export type SimplePromise = () => Promise<void>

export type LiuTimeout = ReturnType<typeof setTimeout> | undefined

export type LiuInterval = ReturnType<typeof setInterval> | undefined

export type ValueType = boolean | number | string | null | undefined

export type SimpleObject = Record<string, ValueType | Record<string, ValueType> | Array<ValueType>>
 
 