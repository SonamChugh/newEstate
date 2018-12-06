import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import { Router } from '@angular/router';

import {
  AuthService,
  GoogleAnalyticsService,
  LoginOrigin,
  LoginResponse,
  PrincipalService,
  TranslationService,
  UtmService,
  VipStatus,
} from '../shared';
import { LoginPartial } from './login-partial';
import { validateEmail } from '../util';
import { AuthActiveForm } from './auth-active-form';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'auth-login-registration',
  templateUrl: 'auth-login-registration.component.html',
  styleUrls: ['auth.component.scss']
})
export class AuthLoginRegistrationComponent implements OnInit {

  @Input() origin: LoginOrigin;
  @Input() ref: string;
  @Input() title: string;
  @Input() subTitle: string;
  @Input() activeForm: AuthActiveForm = AuthActiveForm.Login;

  @Output() onClose = new EventEmitter();
  @Output() onTabSwitch = new EventEmitter<{ activeForm: AuthActiveForm }>();

  AuthActiveForm = AuthActiveForm;

  error: string;
  loading: boolean = false;

  buttonResetRequestDisabled: boolean;

  success: string;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    public authService: AuthService,
    private router: Router,
    public principalService: PrincipalService,
    public translation: TranslationService,
    private googleAnalyticsService: GoogleAnalyticsService,
    private utmService: UtmService,
    private loginPartial: LoginPartial,
  ) {
  }

  ngOnInit(): void {
  }

  private authenticate(res: LoginResponse): void {
    const user = this.principalService.createUser(res.user.id, res.user.user, res.user.email);
    this.principalService.update(user, res.token);
  }

  login(email: string, password: string): void {

    this.loading = true;

    this.authService.login(email, password)
      .subscribe((res: LoginResponse) => {

        this.loading = false;

        this.authenticate(res);

        this.onClose.emit();

        if (res.user.vip_status === VipStatus.Requested) {
          this.router.navigate(['/' + this.translation.activeLocale, 'vip']);
        }

        this.changeDetectorRef.markForCheck();

      }, (err) => {

        this.error = err.message === 'invalid' ? this.translation.strings.invalidedata : err.message;
        this.loading = false;

        this.changeDetectorRef.markForCheck();
      });
  }

  sendRecoveryRequest(email: string): void {

    if (validateEmail(email)) {

      this.buttonResetRequestDisabled = true;

      this.changeDetectorRef.markForCheck();

      this.authService.sendResetPassword(email)
        .subscribe(() => {

          this.success = this.translation.translate('resetsentemail',
            'Email sent with a link to reset your password');

          this.changeDetectorRef.markForCheck();

        }, (err) => {

          this.error = err.message;
          this.buttonResetRequestDisabled = false;

          this.changeDetectorRef.markForCheck();
        });
    } else {

      this.error = this.translation.translate('invalid_email', 'Invalid email');
    }
  }

  register(email: string, password: string): void {

    this.error = '';
    this.loading = true;

    this.authService.register(email, password)
      .subscribe(res => {

        const user = this.principalService.createUser(
          res.user.id, res.user.user, res.user.email);

        this.principalService.update(user, res.token);

        if (res.login && res.user.vip_status === VipStatus.Requested) {

          this.router.navigate(['/' + this.translation.activeLocale, 'vip']);
        }

        this.onClose.emit();

        this.changeDetectorRef.markForCheck();
      }, err => {

        this.error = err.message;
        this.loading = false;
        this.changeDetectorRef.markForCheck();
      });
  }

  loginWithFacebook(): void {

    this.loginPartial
      .loginWithFacebook(this.router.url, this.origin, this.ref)
      .then(res => {

        if (res.user.vip_status === VipStatus.Requested) {
          this.router.navigate(['/' + this.translation.activeLocale, 'vip']);
        }

        this.onClose.emit();
      });
  }

  loginWithGoogle(): void {

  }

  logout(): void {

    this.principalService.logout();

    this.router.navigate(['/']);
  };

  tabSwitched(activeForm: AuthActiveForm): void {
    this.error = '';
    this.onTabSwitch.emit({activeForm: activeForm})
  }
}
