import { Injectable } from '@angular/core';

import { environment } from '../../environments/environment';


@Injectable()
export class ConfigService {

  imgUrl: string;
  resourceUrl: string;
  searchBarVisibilityThreshold: number;
  facebookAppId: string;
  facebookAuthRedirectUrl: string;
  googleClientId: string;
  googleAuthRedirectUrl;
  googleMapApiKey: string;

  defaultMetaDescription = 'White Estate - Недвижимость на Лазурном Берегу Франции. Недвижимость в Монако. Аренда и продажа элитных вилл в Каннах, на Кап Антиба, Кап Ферра, в Больё и в Монако. Новостройки на Лазурном Берегу Франции. Виллы на лазурном берегу купить, продажа недвижимости на лазурном берегу франции, купить виллу во франции.';

  constructor() {
    this.imgUrl = environment.baseImageUrl || '/img';
    this.resourceUrl = '/resource';
    this.searchBarVisibilityThreshold = 768;
    this.facebookAppId = environment.facebookAppId;
    this.facebookAuthRedirectUrl = environment.facebookAuthRedirectUrl;
    this.googleClientId = environment.googleClientId;
    this.googleAuthRedirectUrl = environment.googleClientId;
    this.googleMapApiKey = environment.googleMapApiKey;
  }

  isMobileView(width: number): boolean {
    return width <= this.searchBarVisibilityThreshold;
  }

  getDialogParams(mobileView: boolean): any {
    return {
      showCloseButton: true,
      width: mobileView ? `100vw` : '400px',
      maxWidth: `100vw`,
      maxHeight: `100vh`,
    }
  }
}
