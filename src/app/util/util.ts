export function isNullOrUndefined(val: any): boolean {
  return val === null || val === undefined;
}


export function clearObject(object: any) {
  for (const key in object) delete object[key];
}


export function getTimestamp(date: Date = new Date()): number {
  return Math.round(date.getTime() / 1000);
}


export function hashCodeString(str: string): string {
  let hash = 0;
  if (str.length === 0) {
    return hash + '';
  }
  for (let i = 0; i < str.length; i++) {
    let char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash + '';
}


export function validateEmail(email: string): boolean {
  if (!email) {
    return false;
  }
  const re = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
  return re.test(email);
}


export function validatePhoneNumber(phone: string): boolean {
  const re = /^[\s0-9\-\+]+$/i;
  return re.test(phone);
}


function getExtension(s: string) {
  let i = s.lastIndexOf('.');
  return (i < 0) ? '' : s.substr(i + 1);
}


export function thousandFormat(input: string): string {

  const l = Math.ceil(input.length / 3);
  const reverse = input.split('').reverse();
  const res = [];

  for (let i = 0; i < l; ++i) {
    res.push(reverse.slice(i * 3, i * 3 + 3).reverse().join(''));
  }

  return res.reverse().join(' ');
}

export function findObjectById<T extends { id: number }>(id: number, objects: T[]): T {

  for (const object of objects) {
    if (object.id === id) {
      return object;
    }
  }

  return null;
}

export function makeArray<T>(val: T | T[]): T[] {

  if (!val) {
    return [];
  }

  if (!Array.isArray(val)) {
    return [val];
  }

  return val;
}

export function upperCaseFirstLetter(s: string): string {

  if (!s.length) {
    return '';
  }

  return s[0].toUpperCase() + s.slice(1);
}


export function flatten<T>(arrays: T[][]): T[] {
  return [].concat.apply([], arrays);
}


export function handleSetChange<T>(obj: Set<T>, value: T): void {

  if (obj.has(value)) {
    obj.delete(value);
  } else {
    obj.add(value);
  }
}


export function isString(s: any): boolean {
  return typeof(s) === 'string' || s instanceof String;
}


export function isNumber(s: any): boolean {
  return typeof(s) === 'number' || s instanceof Number;
}


export function isBoolean(s: any): boolean {
  return typeof(s) === 'boolean' || s instanceof Boolean;
}


export function isPrimitive(s: any): boolean {
  return isString(s) || isNumber(s) || isBoolean(s);
}


export function copyPrimitiveFields<T>(from: T, to: T): T {

  for (const field of Object.keys(from)) {

    if (isString(from[field]) ||
      isNumber(from[field]) ||
      isBoolean(from[field]) ||
      from[field] instanceof Date) {

      to[field] = from[field];
    }
  }

  return to;
}


export const loadTimestamp = getTimestamp();
