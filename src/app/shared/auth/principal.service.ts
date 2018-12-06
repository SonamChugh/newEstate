import {
  Injectable,
  Inject
} from '@angular/core';
import {
  Observable,
  Subject
} from 'rxjs';

import {
  IS_BROWSER,
  REQ
} from '../injection-token';

import { Principal } from './principal';
import { User } from './user';

import {
  getCookie,
  setCookie
} from '../../util/cookie';
import { CacheService } from '../cache.service';

const USER_KEY = '_USER';


@Injectable()
export class PrincipalService {

  private _principal: Principal = new Principal();

  private _principalUpdated: Subject<Principal> = new Subject();

  private _token: string;

  get principal(): Principal {
    return this._principal;
  }

  set principal(value: Principal) {
    this._principal = value;
  }

  get token(): string {
    return this._token;
  }

  set token(value: string) {
    this._token = value;
  }

  get id(): number {
    return this.principal.isAuthenticated() ? this.principal.user.id : -1;
  }

  get isAuthenticated(): boolean {
    return this.principal.isAuthenticated();
  }

  get displayName(): string {
    const user = this.principal ? this.principal.user : null;
    return user ? (user.name || user.getEmailWithoutDomain()) : '';
  }

  constructor(
    @Inject(IS_BROWSER) private isBrowser: boolean,
    @Inject(REQ) private req: any,
    private cache: CacheService,
  ) {

    if (!this.isBrowser && !req.cookies) {
      throw new Error('req.cookies not found, check that the cookie parser is used');
    }

    const s = this.isBrowser ? getCookie(USER_KEY) : req.cookies[USER_KEY];

    if (s) {

      try {
        const authData = JSON.parse(s);
        const user = new User();
        const userData = authData.user;
        this.token = authData.token;

        if (userData) {
          this.principal.user = this.createUser(userData.id, userData.name, userData.email);
        }

      } catch (e) {
        console.log('failed to parse auth data');
      }
    }
  }

  principalUpdated(): Observable<Principal> {
    return this._principalUpdated.asObservable();
  }

  logout(): void {

    this.principal.user = null;
    this.token = null;

    if (this.isBrowser) {
      setCookie(USER_KEY, '', {expires: 0, path: '/'});
    } else {
      delete this.req.cookies[USER_KEY];
    }

    this.cache.clear();

    this._principalUpdated.next(this.principal);
  }

  createUser(id: number, name: string, email: string): User {
    const user = new User();
    user.id = id;
    user.name = name;
    user.email = email;
    return user;
  }

  update(user: User, token: string): void {

    this.principal.user = user;
    this.token = token;

    if (this.isBrowser) {
      setCookie(USER_KEY, JSON.stringify({user, token}), {expires: 2 * 365 * 24 * 3600, path: '/'});
    }

    this.cache.clear();

    this._principalUpdated.next(this.principal);
  }
}
