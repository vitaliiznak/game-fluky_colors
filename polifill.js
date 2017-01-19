'use strict'
const reduce = Function.bind.call(Function.call, Array.prototype.reduce);
const isEnumerable = Function.bind.call(Function.call, Object.prototype.propertyIsEnumerable);
const concat = Function.bind.call(Function.call, Array.prototype.concat);
const keys = Reflect.ownKeys;
if (!Object.values) {
    Object.values = (O) => reduce(keys(O), (v, k) => concat(v, typeof k === 'string' && isEnumerable(O, k) ? [O[k]] : []), []);
}
if (!Object.entries) {
    Object.entries = (O) => reduce(keys(O), (e, k) => concat(e, typeof k === 'string' && isEnumerable(O, k) ? [
        [k, O[k]]
    ] : []), []);
}

//from 
//https://medium.com/@_jh3y/throttling-and-debouncing-in-javascript-b01cad5c8edf#.jlqokoxtu
//or
//https://remysharp.com/2010/07/21/throttling-function-calls
function debounce(callback, delay) {
    let timeout;

    return function() {
        const context = this,
            args = arguments;

        clearTimeout(timeout);

        timeout = setTimeout(() => callback.apply(context, args), delay);
    };
};

function throttle(func, limit) {
    let inThrottle,
        lastFunc,
        throttleTimer;
    return function() {
        const context = this,
            args = arguments;
        if (inThrottle) {
            clearTimeout(lastFunc);
            return lastFunc = setTimeout(function() {
                func.apply(context, args);
                inThrottle = false;
            }, limit);
        } else {
            func.apply(context, args);
            inThrottle = true;
            return throttleTimer = setTimeout(() => inThrottle = false, limit);
        }
    };
};
/*END POLIFILL*/