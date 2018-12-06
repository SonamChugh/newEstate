import {
  NgModule,
  ModuleWithProviders
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import {
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';

import {
  ListingMapper,
  ListingVideoResourceMapper
} from './listing/listing';
import { CityMapper } from './city';

import { ApiService } from './api.service';
import { CacheService } from './cache.service';
import { SearchService } from './search.service';
import { FavoriteService } from './favorite/favorite.service';
import { TranslationService } from './translation.service';
import { CookieService } from './cookie.service';
import { ConfigService } from './config.service';
import { AuthService } from './auth/auth.service';
import { PrincipalService } from './auth/principal.service';
import { EmailService } from './email/email.service';
import { ModalContainer, HostDirective, ModalService, PopupContainer, PopupService } from './modal.service';
import { AdWordsMockService, AdWordsService } from './adwords.service';
import { FacebookTrackService, FacebookTrackMockService } from './facebook-track.service';
import { GoogleAnalyticsService, GoogleAnalyticsMockService } from './google-analytics.service';
import { UtmService } from './utm.service';


import { NotEmptyPipe } from './pipe/not-empty.pipe';
import { CurrencyThousandPipe } from './pipe/thousand.pipe';
import { LineBreakPipe } from './pipe/line-break.pipe';
import { TranslatePipe } from './pipe/translate.pipe';

import { IS_BROWSER } from './injection-token';
import { TokenInterceptor } from './auth/token.interceptor';
import { AcceptLanguageInterceptor } from './accept-language.interceptor';


export function adWordsServiceFactory(isBrowser: boolean) {
  return !isBrowser || /localhost/.test(document.location.host)
    ? new AdWordsMockService()
    : new AdWordsService();
}


export function facebookTrackServiceFactory(isBrowser: boolean) {
  return !isBrowser || /localhost/.test(document.location.host)
    ? new FacebookTrackMockService()
    : new FacebookTrackService();
}


export function googleAnalyticsServiceFactory(isBrowser: boolean) {
  return !isBrowser || /localhost/.test(document.location.host)
    ? new GoogleAnalyticsMockService()
    : new GoogleAnalyticsService();
}


const MODULES = [
  // Do NOT include UniversalModule, HttpModule, or JsonpModule here
  CommonModule,
  RouterModule,
  FormsModule,
  ReactiveFormsModule
];

const PIPES = [
  NotEmptyPipe,
  CurrencyThousandPipe,
  LineBreakPipe,
  TranslatePipe,
];

const COMPONENTS = [
  HostDirective,
  ModalContainer,
  PopupContainer,
];

export const PROVIDERS = [
  {
    provide: HTTP_INTERCEPTORS,
    useClass: TokenInterceptor,
    multi: true
  },
  {
    provide: HTTP_INTERCEPTORS,
    useClass: AcceptLanguageInterceptor,
    multi: true
  },
  {
    provide: SearchService,
    useClass: SearchService
  },
  TranslationService,
  ApiService,
  CacheService,
  ConfigService,
  CookieService,
  AuthService,
  PrincipalService,
  EmailService,
  ModalService,
  PopupService,
  UtmService,
  {
    provide: FavoriteService,
    useClass: FavoriteService
  },
  {
    provide: AdWordsService,
    useFactory: adWordsServiceFactory,
    deps: [IS_BROWSER]
  },
  {
    provide: FacebookTrackService,
    useFactory: facebookTrackServiceFactory,
    deps: [IS_BROWSER]
  },
  {
    provide: GoogleAnalyticsService,
    useFactory: googleAnalyticsServiceFactory,
    deps: [IS_BROWSER]
  },
  ListingMapper,
  ListingVideoResourceMapper,
  CityMapper,
];

@NgModule({
  imports: [
    ...MODULES
  ],
  declarations: [
    ...PIPES,
    ...COMPONENTS
  ],
  exports: [
    ...MODULES,
    ...PIPES,
    ...COMPONENTS
  ],
  entryComponents: [
    ModalContainer,
    PopupContainer,
  ]
})
export class SharedModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: SharedModule,
      providers: [
        ...PROVIDERS
      ]
    };
  }
}
