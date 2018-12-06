import {
  APP_INITIALIZER,
  NgModule,
  Injector
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { APP_BASE_HREF, Location } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { ServiceWorkerModule } from '@angular/service-worker';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TransferHttpCacheModule } from '@nguniversal/common';

import { environment } from '../environments/environment';
import Browser from './util/browser';

import {
  SharedModule,
  TranslationService,
  IS_BROWSER,
  REQ,
  RES,
  DEVICE_FORM_FACTOR,
  LocaleShort
} from './shared';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PageNotFoundComponent } from './common/page-not-found.component';
import { SearchModule } from './search/search.module';
import { ComponentModule } from './component/component.module';


export function appInitFactory(injector: Injector) {
  return () => {

    const location = injector.get(Location);
    const translationService = injector.get(TranslationService);

    const localeStr: string = location.path()
      .split('/')
      .filter(chunk => chunk)[0];

    if (localeStr !== translationService.activeLocale && translationService.inLocales(localeStr)) {
      translationService.setActiveLocale(localeStr as LocaleShort);
    }

    return translationService
      .loadAndSetStrings(translationService.activeLocale)
      .toPromise();
  };
}

export function getRequest() {
  return {cookie: document.cookie};
}

export function getResponse() {
  return {};
}


@NgModule({
  declarations: [
    AppComponent,
    PageNotFoundComponent,
  ],
  imports: [
    BrowserModule.withServerTransition({
      appId: 'white'
    }),
    BrowserAnimationsModule,
    RouterModule.forRoot([]),
    HttpClientModule,
    SharedModule.forRoot(),
    ComponentModule,
    SearchModule,
    AppRoutingModule,
    TransferHttpCacheModule,
    ServiceWorkerModule.register('/ngsw-worker.js', {enabled: environment.production}),
  ],
  providers: [
    TranslationService,
    {
      provide: REQ,
      useFactory: getRequest
    },
    {
      provide: RES,
      useFactory: getResponse
    },
    {
      provide: IS_BROWSER,
      useValue: true
    },
    {
      provide: DEVICE_FORM_FACTOR,
      useFactory: () => Browser.getFormFactor()
    },
    {
      provide: APP_BASE_HREF,
      useValue: ''
    },
    {
      provide: APP_INITIALIZER,
      useFactory: appInitFactory,
      deps: [Injector],
      multi: true,
    },
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
