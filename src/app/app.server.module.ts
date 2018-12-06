import { APP_INITIALIZER, Injector, NgModule } from '@angular/core';
import { APP_BASE_HREF } from '@angular/common';
import { ServerModule, ServerTransferStateModule } from '@angular/platform-server';
import { ModuleMapLoaderModule } from '@nguniversal/module-map-ngfactory-loader';
import { REQUEST, RESPONSE } from '@nguniversal/express-engine/tokens';

import { AppModule } from './app.module';
import { AppComponent } from './app.component';
import { DEVICE_FORM_FACTOR, DeviceFormFactor, IS_BROWSER, REQ, RES, TranslationService } from './shared';

import { environment } from '../environments/environment';


export function appInitFactory(injector: Injector) {

  return () => {

    const request = injector.get(REQUEST);
    const translationService = injector.get(TranslationService);

    const cookies = request.cookies || {};
    const lang = cookies.lang || translationService.lang;
    return translationService
      .loadAndSetStrings(lang)
      .toPromise();
  };
}


export function getDeviceFormFactor(injector: Injector): DeviceFormFactor {

  let res: DeviceFormFactor;
  const req = injector.get(REQUEST);

  const userAgent = req.header('user-agent');

  // todo: add tablet
  if (/mobile/i.test(userAgent)) {
    res = 'mobile';
  } else {
    res = 'desktop';
  }

  return res;
}

@NgModule({
  imports: [
    // The AppServerModule should import your AppModule followed
    // by the ServerModule from @angular/platform-server.
    AppModule,
    ServerModule,
    ModuleMapLoaderModule,
    ServerTransferStateModule,
  ],
  providers: [
    {
      provide: IS_BROWSER,
      useValue: false
    },
    {
      provide: APP_BASE_HREF,
      useValue: environment.baseApiUrl
    },
    {
      provide: REQ,
      useExisting: REQUEST,
    },
    {
      provide: RES,
      useExisting: RESPONSE,
    },
    {
      provide: DEVICE_FORM_FACTOR,
      useFactory: getDeviceFormFactor,
      deps: [Injector],
    },
    {
      provide: APP_INITIALIZER,
      useFactory: appInitFactory,
      deps: [Injector],
      multi: true,
    },
  ],
  // Since the bootstrapped component is not inherited from your
  // imported AppModule, it needs to be repeated here.
  bootstrap: [AppComponent],
})
export class AppServerModule {
}
