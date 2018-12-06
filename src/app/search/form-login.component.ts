import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import {
  gaEvents,
  getGaPageByRoute,
  GoogleAnalyticsService,
  TranslationService
} from '../shared';
import { Router } from '@angular/router';
import { validateEmail } from '../util';
import { AuthActiveForm } from './auth-active-form';


export interface LoginClickEvent {
  email: string;
  password: string;
}


export interface PasswordRecoveryClickEvent {
  email: string;
}


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'form-login',
  templateUrl: 'form-login.component.html',
  styleUrls: ['form-login.component.scss']
})

export class FormLoginComponent implements OnInit {

  @Input() buttonLoginDisabled: boolean;
  @Input() buttonResetRequestDisabled: boolean;

  @Input() error: string;
  @Input() success: string;

  @Input() formHint: string;
  @Input() showRegLink: boolean;
  @Input() isPasswordRecovery: boolean;
  @Input() buttonText: string;

  @Output() errorChange = new EventEmitter<string>();
  @Output() loginClick = new EventEmitter<LoginClickEvent>();
  @Output() passwordRecoveryClick = new EventEmitter<PasswordRecoveryClickEvent>();
  @Output() facebookLoginClick = new EventEmitter<void>();
  @Output() googleLoginClick = new EventEmitter<void>();

  @Output() formSwitched = new EventEmitter<{ activeForm: AuthActiveForm }>();

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private router: Router,
    private googleAnalyticsService: GoogleAnalyticsService,
    public translation: TranslationService
  ) {
  }

  ngOnInit(): void {
  }

  onInput(): void {

    if (this.error) {
      this.error = '';
      this.errorChange.emit(this.error);
    }
  }

  onEmailBlur(email: string): void {

    const event = gaEvents.email;
    const page = getGaPageByRoute(this.router.url);

    this.googleAnalyticsService.sendEvent(event.category, event.action,
      `${page} - ${email}`, event.value);
  }

  onPasswordBlur(password: string): void {

    const event = gaEvents.password;
    const page = getGaPageByRoute(this.router.url);

    this.googleAnalyticsService.sendEvent(event.category, event.action,
      `${page} - ${password ? 'password filled' : ''}`, event.value);
  }

  togglePasswordRecovery(): void {

    this.isPasswordRecovery = !this.isPasswordRecovery;
    this.error = '';

    const activeForm = this.isPasswordRecovery ? AuthActiveForm.PasswordRecovery : AuthActiveForm.Login;
    this.formSwitched.emit({activeForm});
  }

  private checkEmail(email: string): boolean {

    if (!validateEmail(email)) {
      this.error = this.translation.translate('auth_incorrect_email', 'Please enter a correct email');
      return false;
    }

    return true;
  }

  onLoginClicked(email: string, password: string): void {

    if (!this.checkEmail(email)) {
      return;
    }

    this.loginClick.emit({email: email, password: password});
  }

  passwordRecoveryClicked(email: string): void {

    if (!this.checkEmail(email)) {
      return;
    }

    this.passwordRecoveryClick.emit({email: email});
  }
}
