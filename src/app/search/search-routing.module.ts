import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { LocaleGuardService } from '../shared';

import { HomeComponent } from './home.component';
import { AuthLoginComponent } from './auth-login.component';
import { AuthRegistrationComponent } from './auth-registration.component';
import { AuthLogoutComponent } from './auth.component';
import { DynamicContentPageComponent } from './static/static.component';
import { SearchComponent } from './search.component';
import { AuthLoginFacebookCallbackComponent } from './auth-login-facebook.component';
import { AuthLoginGoogleCallbackComponent } from './auth-login-google-callback.component';
import { VipComponent } from './vip.component';
import { VipLandingComponent } from './vip-landing.component';
import { VipGuardService } from './vip-guard.service';
import { VipLandingGuardService } from './vip-landing-guard.service';


@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: 'thanks',
        component: HomeComponent
      },
      {
        path: 'auth/login/facebook',
        component: AuthLoginFacebookCallbackComponent
      },
      {
        path: 'auth/login/google',
        component: AuthLoginGoogleCallbackComponent
      },
      // as popup
      {
        path: 'unsubscribe',
        component: HomeComponent
      },
      {
        path: 'auth/login',
        component: AuthLoginComponent
      },
      {
        path: 'auth/logout',
        component: AuthLogoutComponent
      },
      {
        path: 'auth/register',
        component: AuthRegistrationComponent
      },

      {
        path: 'legal',
        component: DynamicContentPageComponent,
        canActivate: [LocaleGuardService]
      },
      {
        path: 'about',
        component: DynamicContentPageComponent,
        canActivate: [LocaleGuardService]
      },
      // legacy url (see SearchComponent#constructor for the redirect logic)
      {
        path: 'search',
        component: SearchComponent,
        canActivate: [LocaleGuardService]
      },
      // legacy
      {
        path: 'search/:search',
        component: SearchComponent,
        canActivate: [LocaleGuardService]
      },
      // legacy
      {
        path: 'search/:locale/:search',
        component: SearchComponent,
      },
      {
        path: 'reference/:ref',
        component: SearchComponent,
        canActivate: [LocaleGuardService]
      },

      {
        path: ':locale',
        canActivate: [LocaleGuardService],
        children: [
          {
            path: 'reference/:ref',
            component: SearchComponent,
          },
          {
            path: 'search',
            component: SearchComponent,
          },
          {
            path: 'search/:search',
            component: SearchComponent
          },
          {
            path: 'vip',
            component: VipComponent,
            canActivate: [VipGuardService]
          },
          {
            path: 'get-vip',
            component: VipLandingComponent,
            canActivate: [VipLandingGuardService]
          },
          {
            path: 'legal',
            component: DynamicContentPageComponent
          },
          {
            path: 'owners',
            component: DynamicContentPageComponent
          },
          {
            path: 'career',
            component: DynamicContentPageComponent
          },
          {
            path: 'partners',
            component: DynamicContentPageComponent
          },
          {
            path: 'about',
            component: DynamicContentPageComponent
          },
          {
            path: 'reset',
            component: HomeComponent
          },
          {
            path: 'verify',
            component: HomeComponent
          },
          {
            path: '',
            component: HomeComponent,
          },
        ],
      },

      // put them last as there is :locale which can match to /about, /unsubscribe, etc.
      {
        path: '',
        component: HomeComponent,
        canActivate: [LocaleGuardService]
      },
    ])
  ]
})
export class SearchRoutingModule {
}
