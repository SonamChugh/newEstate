import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { serializeQueryParams } from '../../util/url';
import { ApiService } from '../api.service';
import { ConfigService } from '../config.service';

import { DeviceFormFactor } from '../device-form-factor';
import {
  RegistrationSource,
  VipStatus
} from './user';


export class LoginOrigin {
  static Map = 'map';
  static Favorite = 'favorite';
  static Slider = 'slider';
  static UserMenu = 'user_menu';
  static Vip = 'vip';
}


export interface LoginResponse {
  user?: {
    user?: string;
    email?: string;
    id?: number;
    vip_status?: VipStatus
  };
  token?: string;
  login?: boolean;
}


@Injectable()
export class AuthService {

  constructor(
    public api: ApiService,
    private configService: ConfigService
  ) {
  }

  isValidPassword(password: string): boolean {
    return password && password.length >= 8;
  }

  getFacebookOAuthUrl(origin: LoginOrigin, ref: string, payload: { [key: string]: string } = {}): string {

    const params = Object.assign({
      origin: origin,
      ref: ref,
    }, payload);

    const queryString = serializeQueryParams(params, {includeEmpty: false}).replace(/&/g, '%26');
    const redirectUrl = `${this.configService.facebookAuthRedirectUrl}?${queryString}`;

    return `https://www.facebook.com/v2.8/dialog/oauth
?client_id=${this.configService.facebookAppId}&redirect_uri=${redirectUrl}&scope=public_profile,email&display=popup`;
  }

  getGoogleOAuthUrl(): string {
    return `https://accounts.google.com/o/oauth2/v2/auth
?client_id=${this.configService.googleClientId}&redirect_uri=${this.configService.googleAuthRedirectUrl}`;
  }

  login(email: string, password: string): Observable<LoginResponse> {

    const body = {
      email: email,
      password: password
    };

    return this.api.post('/php/login.php', JSON.stringify(body));
  }

  loginWithFacebook(code: string, redirectUri: string, origin: string, ref: string,
                    device: DeviceFormFactor, payload: { [key: string]: string } = {}): Observable<LoginResponse> {

    const queryString = serializeQueryParams(Object.assign({
      code: code,
      redirect_uri: redirectUri,
      origin: origin,
      device: device,
      ref: ref
    }, payload));

    const url = `/php/facebook-login.php?${queryString}`;

    return this.api.get(url)
      .pipe(
        map(response => {

          response.user.id = parseInt(response.user.id, 10);

          return response;
        }));
  }

  register(email: string, password: string, source: RegistrationSource = RegistrationSource.UserMenu): Observable<LoginResponse> {

    const body = {
      email: email,
      password: password,
      source: source
    };

    return this.api.post('/php/register.php', JSON.stringify(body));
  }

  verifyEmail(token: string): Observable<LoginResponse> {

    return this.api.get('/php/verify.php', {
      params: {
        token: token
      }
    });
  }

  sendResetPassword(email: string): Observable<any> {

    const body = {
      email: email
    };

    return this.api.post('/php/reset.php', JSON.stringify(body));
  }

  sendNewPassword(password: string, secret: string): Observable<any> {

    const body = {
      password: password,
      token: secret
    };

    return this.api.post('/php/reset-confirm.php', JSON.stringify(body));
  }
}
