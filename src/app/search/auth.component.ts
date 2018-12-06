import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit
} from '@angular/core';
import {
  ActivatedRoute,
  Params,
  Router
} from '@angular/router';

import {
  AuthService,
  IS_BROWSER,
  PrincipalService,
  TranslationService,
} from '../shared';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'auth-logout',
  templateUrl: 'auth-logout.component.html',
  styleUrls: ['auth.component.scss']
})
export class AuthLogoutComponent implements OnInit {

  constructor(
    @Inject(IS_BROWSER) public isBrowser: boolean,
    public router: Router,
    public principalService: PrincipalService
  ) {
  }

  ngOnInit(): void {

    this.principalService.logout();

    if (this.isBrowser) {
      setTimeout(() => {
        this.router.navigate(['/']);
      }, 3 * 1000);
    } else {
      this.router.navigate(['/']);
    }
  }
}


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'auth-new-password',
  templateUrl: 'auth-new-password.component.html',
  styleUrls: ['auth.component.scss'],
})
export class NewPasswordModalComponent {

  error: string;

  token: string;

  loading: boolean = false;
  passwordSent: boolean = false;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private translation: TranslationService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {

    this.route.queryParams.subscribe((params: Params) => {
      this.token = params.token;
    });
  }

  onInput() {
    this.error = '';
  }

  sendNewPassword(password: string) {

    if (!this.authService.isValidPassword(password)) {
      this.error = this.translation.translate('auth_password_hint', 'Password needs to be at least 8 characters long');
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.sendNewPassword(password, this.token)
      .subscribe(() => {

        this.passwordSent = true;
        this.changeDetectorRef.markForCheck();

        this.router.navigate(['/' + this.translation.activeLocale]);
      }, err => {

        this.error = err.message;
        this.loading = false;
        this.changeDetectorRef.markForCheck();
      });
  }
}
