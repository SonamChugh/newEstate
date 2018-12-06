import { isNullOrUndefined } from './util';

export function getSearchParams(): any {
  return parse(window.location.search.slice(1));
}


export function parse(value: string): any {

  const res = {}, a = value.split('&');

  if (a.length === 1 && a[0] === '') {
    return {}
  }

  for (let i = 0, len = a.length; i < len; i++) {
    const chunks = a[i].split('=');
    if (!res[chunks[0]]) {
      res[chunks[0]] = [];
    }
    res[chunks[0]].push(chunks[1]);
  }
  return res;
}

export interface SerializeOptions {
  includeEmpty: boolean;
}

export function serializeQueryParams(params: { [key: string]: string }, options: SerializeOptions = {
  includeEmpty: true
}): string {

  const results: string[] = [];

  for (let key in params) {
    if (params.hasOwnProperty(key)) {

      if (!isNullOrUndefined(params[key])) {

        if (params[key] === '') {
          if (options.includeEmpty) {
            results.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
          }
        } else {
          results.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
        }
      }
    }
  }

  return results.join('&');
}
