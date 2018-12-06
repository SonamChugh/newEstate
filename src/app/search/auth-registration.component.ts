import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  Optional
} from '@angular/core';
import {
  AuthService,
  PrincipalService,
  TranslationService,
  WeModalRef
} from '../shared';
import { Router } from '@angular/router';
import { LoginPartial } from './login-partial';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'auth-registration',
  templateUrl: 'auth-registration.component.html',
  styleUrls: ['auth.component.scss']
})
export class AuthRegistrationComponent {

  title: string;
  error: string;
  loading: boolean = false;
  registrationSent: boolean = false;
  @Input() origin: string;
  @Input() ref: string;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    public authService: AuthService,
    public router: Router,
    public principalService: PrincipalService,
    public translation: TranslationService,
    private loginPartial: LoginPartial,
    @Optional() public modalRef: WeModalRef<AuthRegistrationComponent>
  ) {
  }

  register(email: string, password: string): void {

    this.error = '';
    this.loading = true;

    this.authService.register(email, password)
      .subscribe(res => {

        const user = this.principalService.createUser(
          res.user.id, res.user.user, res.user.email);

        this.principalService.update(user, res.token);

        if (res.login && this.modalRef) {

          this.modalRef.close();

        } else if (this.modalRef) {

          this.loading = false;
          this.registrationSent = true;
          this.title = '';
        }

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
      .then(() => {

        if (this.modalRef) {
          this.modalRef.close();
        }
      });
  }

  loginWithGoogle(): void {

  }
}
