// @flow
function isObject(test: any): boolean {
    return (typeof test === 'object' || test instanceof Object)
        && (test !== null)
        && !Array.isArray(test);
}

function isFunction(test: any): boolean {
    return test && {}.toString.call(test) === '[object Function]';
}

function hasFunctionsInParameters(parameters: any[] = []): boolean {
    for (let i = 0; i < parameters.length; i += 1) {
        const parameter = parameters[i];
        if (isObject(parameter)) {
            if (hasFunctionsInParameters(Object.values(parameter))) {
                return true;
            }
        } else if (isFunction(parameter)) {
            return true;
        }
    }
    return false;
}

const maxInt32 = 2147483647;

export default {
    isObject,
    isFunction,
    hasFunctionsInParameters,
    maxInt32,
};
