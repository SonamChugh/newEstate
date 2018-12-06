import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  Optional,
  ViewChild,
  ElementRef
} from '@angular/core';
import { Router } from '@angular/router';

import {
  AuthService,
  GoogleAnalyticsService,
  LoginResponse,
  ModalService,
  PrincipalService,
  TranslationService,
  UtmService,
  WeModalRef
} from '../shared';
import { LoginPartial } from './login-partial';
import { validateEmail } from '../util';
import { AuthRegistrationComponent } from './auth-registration.component';
import { FormLoginComponent } from './form-login.component';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'auth-login',
  templateUrl: 'auth-login.component.html',
  styleUrls: ['auth.component.scss']
})
export class AuthLoginComponent implements OnInit {

  @Input() origin: string;
  @Input() ref: string;
  @Input() title: string;
  @Input() subTitle: string;

  error: string;
  loading: boolean = false;

  resetRequestSent: boolean;
  buttonResetRequestDisabled: boolean;

  @ViewChild(FormLoginComponent, {read: ElementRef}) formLogin: ElementRef;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    public authService: AuthService,
    private router: Router,
    public principalService: PrincipalService,
    public translation: TranslationService,
    public modalService: ModalService,
    private googleAnalyticsService: GoogleAnalyticsService,
    private utmService: UtmService,
    private loginPartial: LoginPartial,
    @Optional() public modalRef: WeModalRef<AuthLoginComponent>
  ) {
  }

  ngOnInit(): void {
  }

  login(email: string, password: string): void {

    this.loading = true;

    this.authService.login(email, password)
      .subscribe((res: LoginResponse) => {

        this.loading = false;

        const user = this.principalService.createUser(res.user.id, res.user.user, res.user.email);
        this.principalService.update(user, res.token);

        // either close modal or redirect to the main page
        // depends on how we open the login page
        if (this.modalRef) {
          this.modalRef.close();
        }

        this.changeDetectorRef.markForCheck();

      }, (err) => {

        this.error = err.message === 'invalid' ? this.translation.strings.invalidedata : err.message;
        this.loading = false;

        this.changeDetectorRef.markForCheck();
      });
  }

  toggleSignUp(): void {

    if (this.modalRef) {

      this.modalRef.close();

      const modalRef = this.modalService.open(AuthRegistrationComponent, this.loginPartial.getPopupParams());

      modalRef.componentInstance.title = this.translation.strings.titlesignup;
      modalRef.componentInstance.origin = this.origin;
      modalRef.componentInstance.ref = this.ref;
    } else {

      this.router.navigate(['/auth/register']);
    }
  }

  sendRecoveryRequest(email: string): void {

    if (validateEmail(email)) {

      this.buttonResetRequestDisabled = true;

      this.changeDetectorRef.markForCheck();

      this.authService.sendResetPassword(email)
        .subscribe(() => {

          this.resetRequestSent = true;
          this.changeDetectorRef.markForCheck();

        }, (err) => {

          this.error = err.message;
          this.resetRequestSent = false;
          this.buttonResetRequestDisabled = false;

          this.changeDetectorRef.markForCheck();
        });
    } else {

      this.error = this.translation.translate('invalid_email', 'Invalid email');
    }
  }

  loginWithFacebook(): void {

    this.loginPartial
      .loginWithFacebook(this.router.url, this.origin, this.ref)
      .then(() => {

        if (this.modalRef) {
          this.modalRef.close();
        }
      });
  }

  loginWithGoogle(): void {

  }

  logout(): void {

    this.principalService.logout();

    this.router.navigate(['/']);
  };
}
