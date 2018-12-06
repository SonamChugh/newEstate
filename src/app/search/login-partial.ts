import {
  Inject,
  Injectable
} from '@angular/core';

import { getBodySize } from '../util';

import {
  AuthService,
  DEVICE_FORM_FACTOR,
  DeviceFormFactor,
  DeviceFormFactorValue,
  FacebookTrackService,
  gaEvents,
  getGaPageByRoute,
  GoogleAnalyticsService,
  LoginOrigin,
  LoginResponse,
  ModalParams,
  PrincipalService,
  TranslationService,
  UtmService
} from '../shared';
import { AuthActiveForm } from './auth-active-form';


function getWindowParams(): string {

  const width = 640;
  const height = 640;
  const dualScreenLeft = window.screenLeft != undefined ? window.screenLeft : screen['left'];
  const dualScreenTop = window.screenTop != undefined ? window.screenTop : screen['top'];
  const size = getBodySize();
  const left = ((size.width / 2) - (width / 2)) + dualScreenLeft;
  const top = ((size.height / 2) - (height / 2)) + dualScreenTop;

  return `width=${width},height=${height},top=${top},left=${left}`;
}


@Injectable({
  providedIn: 'root'
})
export class LoginPartial {

  get isMobile(): boolean {
    return this.deviceFormFactor === DeviceFormFactorValue.Mobile;
  }

  constructor(
    private translation: TranslationService,
    private facebookTrackService: FacebookTrackService,
    private googleAnalyticsService: GoogleAnalyticsService,
    private principalService: PrincipalService,
    private authService: AuthService,
    private utmService: UtmService,
    @Inject(DEVICE_FORM_FACTOR) private deviceFormFactor: DeviceFormFactor
  ) {
  }

  loginWithFacebook(url: string, origin: LoginOrigin = '', ref: string = ''): Promise<LoginResponse> {

    return new Promise((resolve, reject) => {

      const oAuthUrl = this.authService.getFacebookOAuthUrl(origin || '', ref, this.utmService.serialize());

      window.open(oAuthUrl, 'facebook login', getWindowParams());

      const onMessage = (ev: MessageEvent) => {

        const data = ev.data;

        if (typeof data === 'object' && data.user) {

          const user = this.principalService.createUser(data.user.id, data.user.user, data.user.email);
          const token = <string>data.token;

          this.principalService.update(user, token);

          window.removeEventListener('message', onMessage, false);

          resolve(data);
        }
      };

      window.addEventListener('message', onMessage, false);

      this.facebookTrackService.track('AddToCart', {});

      const event = gaEvents.loginFb;
      const page = getGaPageByRoute(url);

      this.googleAnalyticsService.sendEvent(event.category, event.action, `${page} - facebook login`, event.value);

    });
  }

  loginWithGoogle(url: string): Promise<void> {

    return new Promise((resolve, reject) => {

      const oAuthUrl = this.authService.getGoogleOAuthUrl();

      window.open(oAuthUrl, 'google login', getWindowParams());

      // const onMessage = (ev: MessageEvent) => {
      //
      //   const data = ev.data;
      //
      //   if (typeof data === 'object' && data.user) {
      //
      //     const user = <User>data.user;
      //     const token = <string>data.token;
      //
      //     this.principalService.update(user, token);
      //
      //     window.removeEventListener('message', onMessage, false);
      //
      //     resolve();
      //   }
      // };
      //
      // window.addEventListener('message', onMessage, false);
      //
      // this.facebookTrackService.track('AddToCart', {});
      //
      // const event = gaEvents.loginGoogle;
      // const page = getGaPageByRoute(url);
      //
      // this.googleAnalyticsService.sendEvent(event.category, event.action, `${page} - facebook login`, event.value);

    });
  }

  getPopupParams(): ModalParams {

    const {width, height} = getBodySize();

    return {
      showCloseButton: true,
      width: this.isMobile ? `${width}px` : '500px',
      height: this.isMobile ? `${height}px` : null,
      maxWidth: `${width}px`,
      maxHeight: `${height}px`
    }
  }

  getAuthPopupTitle(activeForm: AuthActiveForm): string {

    switch (activeForm) {
      case AuthActiveForm.Login:
        return this.translation.translate('titlesignin');
      case AuthActiveForm.PasswordRecovery:
        return this.translation.translate('btnresetpass');
      case AuthActiveForm.Register:
        return this.translation.translate('titlesignup');
    }
  }
}
