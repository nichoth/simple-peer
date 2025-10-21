// Type declarations for test environment
declare namespace NodeJS {
    interface Process {
        browser?:boolean
    }
}

// Declare tapzero module with proper exports
declare module '@substrate-system/tapzero' {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
    export interface Test {
        name: string
        _planned: null | number
        _actual: number
        done: boolean

        /**
         * Plan the number of assertions
         */
        plan(n: number, timeoutMS?: number): void

        /**
         * Deep equality assertion
         */
        deepEqual<T>(actual: T, expected: T, msg?: string): void

        /**
         * Equality assertion
         */
        equal<T>(actual: T, expected: T, msg?: string): void

        /**
         * Not equal assertion
         */
        notEqual(actual: unknown, expected: unknown, msg?: string): void

        /**
         * Truthy assertion
         */
        ok(actual: unknown, msg?: string): void

        /**
         * Fail assertion
         */
        fail(msg?: string): void

        /**
         * Assert that the test passes with an optional message
         * @param msg Optional message
         */
        pass(msg?: string): void

        /**
         * End the test early
         */
        end(): void

        /**
         * Set a timeout for the test
         * @param ms Timeout in milliseconds
         */
        timeoutAfter(ms: number): void
    }

    export type TestFn = (t: Test) => (void | Promise<any>)

    /**
     * Test class
     */
    // eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
    export class Test {
        constructor(name: string, fn: TestFn, runner: any)
        name: string
        _planned: null | number
        _actual: number
        _resolve?: () => void
        TIMEOUT_MS: number
        done: boolean

        plan(n: number, timeoutMS?: number): void
        deepEqual<T>(actual: T, expected: T, msg?: string): void
        equal<T>(actual: T, expected: T, msg?: string): void
        notEqual(actual: unknown, expected: unknown, msg?: string): void
        ok(actual: unknown, msg?: string): void
        fail(msg?: string): void
        pass(msg?: string): void
        end(): void
        timeoutAfter(ms: number): void
    }

    /**
     * Define a test
     */
    export function test(name: string, fn?: TestFn): void
}
