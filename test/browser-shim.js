// Browser shims for Node.js globals
export const process = {
    browser: true,
    env: {},
    version: '',
    versions: {},
    nextTick: (fn, ...args) => Promise.resolve().then(() => fn(...args)),
    cwd: () => '/',
    chdir: () => {}
}

export { Buffer } from 'buffer'

// Additional Node.js globals needed for tape
export const __dirname = '/'
export const __filename = '/test.js'
