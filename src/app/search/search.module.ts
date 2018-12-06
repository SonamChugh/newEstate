import { NgModule } from '@angular/core';
import { OverlayModule } from '@angular/cdk/overlay';

import { SharedModule } from '../shared';
import { MaterialModule } from '../material.module';

import { ComponentModule } from '../component/component.module';
import { SearchRoutingModule } from './search-routing.module';

import { ClientUiModule } from '../client-ui';
import { ListingUiModule } from '../listing-ui';

import { HeaderComponent } from './header.component';
import { HeaderRightComponent } from './header-right.component';
import { FooterComponent } from './footer.component';
import { LanguageSelectorComponent } from './language-selector.component';
import { MobileFiltersComponent } from './mobile-filters.component';
import { UserDropDownComponent } from './user-drop-down.component';
import { UserDropDownMenuComponent } from './user-drop-down-menu.component';

import {
  HomeComponent,
  WhiteSpinnerComponent
} from './home.component';

import { EmailUnsubscribeComponent } from './email-unsubscribe.component';
import { VerifyEmailComponent } from './verify-email.component';
import { DynamicContentPageComponent } from './static/static.component';
import { FormLoginComponent } from './form-login.component';
import { FormRegistrationComponent } from './form-registration.component';
import { AuthLoginComponent } from './auth-login.component';
import { AuthRegistrationComponent } from './auth-registration.component';
import { AuthLoginRegistrationComponent } from './auth-login-registration.component';
import {
  AuthLogoutComponent,
  NewPasswordModalComponent
} from './auth.component';

import { SearchComponent } from './search.component';
import { ListingCardComponent } from './listing-card.component';
import { ListingDescriptionComponent } from './listing-description.component';
import { PhotosViewerComponent } from './photos-viewer.component';
import { MapWrapperComponent } from './map-wrapper.component';
import { PropertyPopupComponent } from './property-popup.component';
import { ContactForm, ContactFormPopupComponent } from './contact-form.component';
import {
  ListingVideoComponent,
  OverlayHostDirective
} from './listing-video.component';
import {
  ListingVideoOverlayComponent,
  ListingVideoOverlaySimpleComponent
} from './listing-video-overlay.component';
import { CallButtonComponent } from './call-button.component';
import { AuthLoginFacebookCallbackComponent } from './auth-login-facebook.component';
import { AuthLoginGoogleCallbackComponent } from './auth-login-google-callback.component';
import { ClientRequestEditFormComponent } from './client-request-edit-form.component';
import { VipComponent } from './vip.component';
import { VipLandingComponent } from './vip-landing.component';
import { VipFinishRegistrationComponent } from './vip-finish-registration.component';
import { ThanksForRequestComponent } from './thanks-for-request.component';


@NgModule({
  imports: [
    OverlayModule,
    SharedModule,
    ComponentModule,
    SearchRoutingModule,
    MaterialModule,
    ClientUiModule,
    ListingUiModule,
  ],
  providers: [],
  declarations: [

    HomeComponent,
    WhiteSpinnerComponent,
    UserDropDownMenuComponent,
    UserDropDownComponent,
    MobileFiltersComponent,
    HeaderComponent,
    HeaderRightComponent,
    FooterComponent,
    LanguageSelectorComponent,

    FormLoginComponent,
    FormRegistrationComponent,
    AuthLoginComponent,
    AuthRegistrationComponent,
    AuthLoginRegistrationComponent,
    AuthLogoutComponent,
    NewPasswordModalComponent,
    EmailUnsubscribeComponent,
    VerifyEmailComponent,
    AuthLoginFacebookCallbackComponent,
    AuthLoginGoogleCallbackComponent,
    ClientRequestEditFormComponent,
    DynamicContentPageComponent,
    SearchComponent,
    ListingCardComponent,
    ListingDescriptionComponent,
    PhotosViewerComponent,
    MapWrapperComponent,
    PropertyPopupComponent,
    ContactForm,
    ContactFormPopupComponent,
    ListingVideoComponent,
    OverlayHostDirective,
    ListingVideoOverlayComponent,
    ListingVideoOverlaySimpleComponent,
    CallButtonComponent,
    VipComponent,
    VipLandingComponent,
    VipFinishRegistrationComponent,
    ThanksForRequestComponent,
  ],
  entryComponents: [
    WhiteSpinnerComponent,
    PropertyPopupComponent,
    ContactFormPopupComponent,
    ListingVideoOverlayComponent,
    ListingVideoOverlaySimpleComponent,
    EmailUnsubscribeComponent,
    VerifyEmailComponent,
    NewPasswordModalComponent,
    PhotosViewerComponent,
    AuthLoginFacebookCallbackComponent,
    AuthLoginComponent,
    AuthRegistrationComponent,
    AuthLoginRegistrationComponent,
    ClientRequestEditFormComponent,
    VipFinishRegistrationComponent,
    ThanksForRequestComponent,
  ]
})
export class SearchModule {
}
