import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import { validateEmail } from '../util';
import { AuthService, TranslationService } from '../shared';


export interface RegisterClickEvent {
  email: string;
  password: string;
}


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'form-registration',
  templateUrl: 'form-registration.component.html',
  styleUrls: ['form-registration.component.scss']
})

export class FormRegistrationComponent implements OnInit {

  @Input() error: string;
  @Output() errorChange = new EventEmitter<string>();

  @Input() success: string;

  @Input() buttonDisabled: boolean;
  @Input() buttonText: string;
  @Input() formHint: boolean;

  @Output() registerClick = new EventEmitter<RegisterClickEvent>();
  @Output() facebookLoginClick = new EventEmitter<void>();
  @Output() googleLoginClick = new EventEmitter<void>();

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private translation: TranslationService,
    private authService: AuthService
  ) {
  }

  ngOnInit(): void {
  }

  onRegistrationButtonClick(email: string, password: string): void {

    if (!validateEmail(email)) {
      this.error = this.translation.translate('auth_incorrect_email', 'Please enter a correct email');
    } else if (!this.authService.isValidPassword(password)) {
      this.error = this.translation.translate('auth_incorrect_password', 'Password needs to be at least 8 characters long');
    } else {
      this.registerClick.emit({email: email, password: password});
    }
  }

  onInput(): void {

    if (this.error) {
      this.error = '';
      this.errorChange.emit(this.error);
    }
  }
}
