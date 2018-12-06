import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { Router } from '@angular/router';
import { from, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import {
  animate,
  EasingFunctions,
  getScrollingElement,
  validateEmail
} from '../util';

import {
  AuthService,
  DEVICE_FORM_FACTOR,
  DeviceFormFactor,
  LoginOrigin,
  LoginResponse,
  PrincipalService,
  RegistrationSource,
  TranslationService
} from '../shared';

import { LoginPartial } from './login-partial';
import { ClientService } from '../client';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'vip-landing',
  templateUrl: 'vip-landing.component.html',
  styleUrls: ['vip-landing.component.scss']
})
export class VipLandingComponent implements OnInit, OnDestroy {

  activeForm: 'login' | 'register' | 'password_recovery' = 'register';
  error: string;

  buttonLoginDisabled: boolean;
  buttonRegisterDisabled: boolean;
  buttonSendResetDisabled: boolean;

  resetRequestSent: boolean;

  private subscriptions: Subscription[] = [];

  isMobileView: boolean;

  @ViewChild('register', {read: ElementRef}) registerElementRef: ElementRef;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private router: Router,
    private translation: TranslationService,
    private authService: AuthService,
    private principalService: PrincipalService,
    private loginPartial: LoginPartial,
    private clientService: ClientService,
    @Inject(DEVICE_FORM_FACTOR) private deviceFormFactor: DeviceFormFactor
  ) {
  }

  ngOnInit(): void {

    this.init();
  }

  ngOnDestroy(): void {

    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  init(): void {

    this.isMobileView = this.deviceFormFactor === 'mobile';
  }

  private checkEmail(email: string): boolean {

    if (!validateEmail(email)) {
      this.error = this.translation.translate('auth_incorrect_email', 'Please enter a correct email');
      return false;
    }

    return true;
  }

  private authenticate(res: LoginResponse): void {

    const user = this.principalService.createUser(
      res.user.id, res.user.user, res.user.email);

    this.principalService.update(user, res.token);
  }

  private nextStep(): void {

    this.router.navigate(['/' + this.translation.activeLocale, 'vip']);
  }

  onLoginClicked(email: string, password: string): void {

    if (!this.checkEmail(email)) {
      return;
    }

    this.buttonLoginDisabled = true;

    this.authService.login(email, password)
      .pipe(
        switchMap(res => {
          this.authenticate(res);
          return this.clientService.changeVipStatus();
        })
      )
      .subscribe(() => {

        this.buttonLoginDisabled = false;

        this.nextStep();

        this.changeDetectorRef.markForCheck();

      }, (err) => {

        this.error = err.message;
        this.buttonLoginDisabled = false;

        this.changeDetectorRef.markForCheck();
      });
  }

  onRegisterClicked(email: string, password: string): void {

    if (!this.checkEmail(email)) {
      return;
    }

    if (!this.authService.isValidPassword(password)) {
      this.error = this.translation.translate('auth_incorrect_password', 'Password needs to be at least 8 characters long');
      return;
    }

    this.buttonRegisterDisabled = true;

    this.authService
      .register(email, password, RegistrationSource.Vip)
      .pipe(
        switchMap(res => {
          this.authenticate(res);
          return this.clientService.changeVipStatus();
        })
      )
      .subscribe(() => {

        this.buttonRegisterDisabled = false;
        this.nextStep();

        this.changeDetectorRef.markForCheck();
      }, err => {
        this.error = err.message;
        this.buttonRegisterDisabled = false;
        this.changeDetectorRef.markForCheck();
      });
  }

  onFacebookLoginClicked(): void {

    this.loginPartial.loginWithFacebook(this.router.url, LoginOrigin.Vip)
      .then(() => this.clientService.changeVipStatus().toPromise())
      .then(() => {

        this.nextStep();
        this.changeDetectorRef.markForCheck();
      });
  }

  onGoogleLoginClicked(): void {

    from(this.loginPartial.loginWithGoogle(this.router.url))
      .subscribe(() => {

      });
  }

  passwordRecoveryClicked(email: string): void {

    if (!this.checkEmail(email)) {
      return;
    }

    this.buttonSendResetDisabled = true;

    this.changeDetectorRef.markForCheck();

    this.authService.sendResetPassword(email)
      .subscribe(() => {

        this.resetRequestSent = true;
        this.changeDetectorRef.markForCheck();

      }, (err) => {

        this.error = err.message;
        this.resetRequestSent = false;
        this.buttonSendResetDisabled = false;

        this.changeDetectorRef.markForCheck();
      });
  }

  toggleRegister(): void {

    this.activeForm = 'register';
  }

  togglePasswordRecovery(): void {

    this.activeForm = 'password_recovery';
  }

  onInput(): void {

    if (this.error) {
      this.error = '';
    }
  }

  scrollToForm(): void {

    const el = getScrollingElement();
    const target = this.registerElementRef.nativeElement;

    animate((delta) => {
      el.scrollTop = el.scrollTop + (target.offsetTop - el.scrollTop) * delta;
    }, EasingFunctions.easeInCubic, 700);
  }
}
