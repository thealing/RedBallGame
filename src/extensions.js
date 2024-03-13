Object.clone = function(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(Object.clone);
  }
  const cloned = Object.create(Object.getPrototypeOf(obj));
  for (const key in obj) {
    if (typeof obj[key] === 'function') {
      cloned[key] = obj[key].bind(cloned);
    } else {
      cloned[key] = Object.clone(obj[key]);
    }
  }
  return cloned;
}

Math.clamp = function(x, l, h) {
  return Math.min(Math.max(x, l), h);
}

Array.prototype.top = function() {
  return this[this.length - 1];
}

String.prototype.count = function(str) {
  return this.split(str).length - 1;
}

const oldStringify = JSON.stringify;
const oldParse = JSON.parse;

JSON.stringify = function(value, replacer, space) {
  return oldStringify(value, (key, value) => {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      if (value.constructor.name) {
        value._savedClassName = value.constructor.name;
      }
    }
    if (Array.isArray(value)) {
      const _array = [];
      const _extra = {};
      let hasExtra = false;
      for (const [k, v] of Object.entries(value)) {
        if (k >= 0 && k < value.length) {
          _array[k] = v;
        }
        else {
          _extra[k] = v;
          if (typeof v !== 'function') {
            hasExtra = true;
          }
        }
      }
      if (hasExtra) {
        value = Object.assign({ _array }, _extra);
      }
    }
    if (value instanceof HTMLImageElement) {
      return null;
    }
    return value;
  }, space);
}

JSON.parse = function(text, reviver) {
  return oldParse(text, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (Object.hasOwn(value, '_savedClassName')) {
        if (value._savedClassName != 'Object') {
          Object.setPrototypeOf(value, eval(value._savedClassName + ".prototype"));
        }
        delete value._savedClassName;
      }
      if (Object.hasOwn(value, '_array')) {
        const array = value._array;
        delete value._array;
        for (const [k, v] of Object.entries(value)) {
          if (typeof v !== 'function') {
            array[k] = v;
          }
        }
        value = array;
        Object.setPrototypeOf(value, Array.prototype);
      }
    }
    if (value instanceof HTMLImageElement) {
      return null;
    }
    return value;
  });
}

function setRecursively(target, source) {
  if (Array.isArray(source)) {
    target.length = source.length;
  }
  for (const key in target) {
    if (!Object.hasOwn(source, key)) {
      delete target[key];
    }
  }
  for (const key in source) {
    if (typeof source[key] === 'object' && source[key] !== null && typeof target[key] === 'object' && target[key] !== null) {
      setRecursively(target[key], source[key]);
    }
    else {
      target[key] = source[key];
    }
  }
}

function extendRecursively(target, source) {
  if (Array.isArray(source)) {
    target.length = source.length;
  }
  for (const key in source) {
    if (typeof source[key] === 'object' && source[key] !== null && typeof target[key] === 'object' && target[key] !== null) {
      extendRecursively(target[key], source[key], overwrite);
    }
    else if (!Object.hasOwn(target, key)) {
      target[key] = source[key];
    }
  }
}
