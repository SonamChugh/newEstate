import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import {
  AuthService,
  PrincipalService,
  TranslationService
} from '../shared';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'verify-email',
  template: `

    <div class="verify-title">
      {{'verify_email_title' | translate: 'Verifying your email'}}
    </div>

    <mat-progress-bar [mode]="progressBarMode"></mat-progress-bar>

    <div *ngIf="error" class="alert-error">{{error}}</div>
    <div *ngIf="success" class="alert-success">{{success}}</div>
  `,
  styleUrls: ['verify-email.component.scss']
})
export class VerifyEmailComponent implements OnInit {
  error: string;
  success: string;

  progressBarMode: 'determinate' | 'indeterminate' = 'indeterminate';

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private activatedRoute: ActivatedRoute,
    private translation: TranslationService,
    private authService: AuthService,
    private principalService: PrincipalService,
  ) {
  }

  toggleProgressBar(): void {
    this.progressBarMode = this.progressBarMode === 'determinate' ? 'indeterminate' : 'determinate';
  }

  ngOnInit(): void {

    const params = this.activatedRoute.snapshot.queryParams;
    const token = params.token;
    const tErrorKey = 'auth_verification_failed';

    if (!token) {
      this.error = this.translation.translate(tErrorKey, 'Verification failed');
      this.toggleProgressBar();
      this.changeDetectorRef.markForCheck();
    } else {

      this.authService.verifyEmail(token)
        .subscribe(res => {

          this.success = this.translation
            .translate('auth_verification_done', 'Verification has been successfully completed');
          this.toggleProgressBar();

          const user = this.principalService.createUser(res.user.id, res.user.user, res.user.email);
          this.principalService.update(user, res.token);

          this.changeDetectorRef.markForCheck();
        }, err => {

          this.error = err.message;
          this.toggleProgressBar();

          this.changeDetectorRef.markForCheck();
        });
    }
  }
}
