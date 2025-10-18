/**
 * @param {any} err - An Error
 * @param {string} code - A string code or props to set on the error
 * @param {Record<string, any>} [props] - Props to set on the error
 * @returns {Error}
 */
export function errCode (err:any, code:string, props?:Record<string, any>) {
    if (!err || typeof err === 'string') {
        throw new TypeError('Please pass an Error to err-code')
    }

    if (!props) {
        props = {}
    }

    if (typeof code === 'object') {
        props = code
        code = ''
    }

    if (code) {
        props.code = code
    }

    try {
        return assign(err, props)
    } catch (_) {
        props.message = err.message
        props.stack = err.stack

        const ErrClass = function () {}

        ErrClass.prototype = Object.create(Object.getPrototypeOf(err))

        const output = assign(new ErrClass(), props)
        return output
    }
}

function assign (obj, props) {
    for (const key in props) {
        Object.defineProperty(obj, key, {
            value: props[key],
            enumerable: true,
            configurable: true,
        })
    }

    return obj
}
