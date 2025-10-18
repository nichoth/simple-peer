declare module 'streamx' {
  export interface DuplexOptions {
    allowHalfOpen?: boolean
    objectMode?: boolean
  }

  export interface ReadableState {
    ended: boolean
  }

  export class Duplex {
      constructor(opts?: DuplexOptions)

      // Event emitter methods
      emit(event: string | symbol, ...args: any[]): boolean
      on(event: string | symbol, listener: (...args: any[]) => void): this
      once(event: string | symbol, listener: (...args: any[]) => void): this
      removeListener(event: string | symbol, listener: (...args: any[]) => void): this

      // Stream methods
      push(chunk: any, encoding?: string): boolean
      end(chunk?: any, encoding?: string, callback?: () => void): this
      destroy(error?: Error): this

      // Stream properties
      destroyed: boolean
      _readableState: ReadableState

      // Methods that can be overridden
      _write(chunk: any, callback: (error?: Error | null) => void): void
      _final(callback: (error?: Error | null) => void): void
      _destroy(callback: () => void, error?: Error): void
      _read(size?: number): void
  }
}
