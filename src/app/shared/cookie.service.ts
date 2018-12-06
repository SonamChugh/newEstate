import { Injectable, Inject } from '@angular/core';

import { IS_BROWSER, REQ } from './injection-token';

import { CookieOptions, getCookie, setCookie } from '../util/cookie';


@Injectable()
export class CookieService {

  constructor(@Inject(REQ) private req: any, @Inject(IS_BROWSER) private isBrowser: boolean) {
  }

  set(name: string, value: string, options: CookieOptions = {}): void {

    if (this.isBrowser) {
      setCookie(name, value, options);
    } else {
      this.req.cookies[name] = value;
    }
  }

  get(name: string): string {

    if (this.isBrowser) {
      return getCookie(name);
    } else {
      return this.req.cookies[name];
    }
  }
}
