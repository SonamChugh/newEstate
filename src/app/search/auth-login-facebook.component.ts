import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  Inject
} from '@angular/core';
import {
  ActivatedRoute,
  Router
} from '@angular/router';
import { switchMap } from 'rxjs/operators';

import {
  AuthService,
  DEVICE_FORM_FACTOR,
  DeviceFormFactor,
  IS_BROWSER,
  PrincipalService,
  TranslationService,
  UtmService
} from '../shared';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'auth-login-facebook-callback',
  template: `
    <div class="loader absolute-center" style="flex-direction: column;">
      <ng-container *ngIf="!error">
        <div>{{translation.strings.checkuser}}</div>
        <mat-spinner style="margin-top: 20px;"></mat-spinner>
      </ng-container>
      <ng-container *ngIf="error">
        <div>{{error}}</div>
      </ng-container>
    </div>
  `
})

export class AuthLoginFacebookCallbackComponent implements OnInit {

  error: string;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    public translation: TranslationService,
    @Inject(IS_BROWSER) public isBrowser: boolean,
    private activatedRoute: ActivatedRoute,
    private authService: AuthService,
    private router: Router,
    private utmService: UtmService,
    private principalService: PrincipalService,
    @Inject(DEVICE_FORM_FACTOR) private deviceFormFactor: DeviceFormFactor
  ) {
  }

  ngOnInit() {
    if (this.isBrowser) {
      this.handleFacebookAuthentication();
    }
  }

  handleFacebookAuthentication() {

    let redirectUrl = this.router.routerState.snapshot.url;

    redirectUrl = (window.location.origin + redirectUrl.slice(0, redirectUrl.indexOf('&code=')));

    this.activatedRoute.queryParams
      .pipe(
        switchMap(params => {

          const origin = params.origin;
          const ref = params.ref;

          this.utmService.deserialize(params);

          return this.authService.loginWithFacebook(params.code, redirectUrl, origin, ref,
            this.deviceFormFactor, this.utmService.serialize());
        })
      )
      .subscribe(res => {

        if (window.opener) {

          window.opener.postMessage(res, location.origin);
          window.close();
        }

      }, err => {

        this.error = 'Server error has occurred. Try again later please.';
        this.changeDetectorRef.markForCheck();
      });
  }
}
