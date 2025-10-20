// Basic browser test to verify test infrastructure
import { test } from '@substrate-system/tapzero'

test('browser environment check', t => {
    t.plan(3)
    t.ok(typeof window !== 'undefined', 'window exists')
    t.ok(typeof document !== 'undefined', 'document exists')
    t.equal(process.browser, true, 'process.browser is true')
})

test('basic arithmetic', t => {
    t.plan(2)
    t.equal(1 + 1, 2, 'math works')
    t.ok(true, 'assertions work')
})
