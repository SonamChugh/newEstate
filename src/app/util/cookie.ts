export interface CookieOptions {
  expires?: any;
  path?: string;
}


export function getCookie(name): any {
  const matches = document.cookie.match(new RegExp(
    "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
  ));
  return matches ? decodeURIComponent(matches[1]) : undefined;
}


export function setCookie(name: string, value: string, options: CookieOptions = {}) {

  let expires = options.expires;

  if (typeof expires == 'number' && expires) {
    const d = new Date();
    d.setTime(d.getTime() + expires * 1000);
    expires = options.expires = d;
  }

  if (expires && expires.toUTCString) {
    options.expires = expires.toUTCString();
  }

  value = encodeURIComponent(value);

  let updatedCookie = name + '=' + value;

  for (const propName in options) {
    updatedCookie += '; ' + propName;
    const propValue = options[propName];
    if (propValue !== true) {
      updatedCookie += '=' + propValue;
    }
  }

  document.cookie = updatedCookie;
}
