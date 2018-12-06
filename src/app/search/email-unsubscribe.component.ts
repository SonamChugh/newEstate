import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';
import {
  ActivatedRoute,
  Params
} from '@angular/router';

import {
  EmailService,
  TranslationService
} from '../shared';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'email-unsubscribe',
  styleUrls: ['email-unsubscribe.component.scss'],
  templateUrl: 'email-unsubscribe.component.html'
})
export class EmailUnsubscribeComponent implements OnInit {

  code: string;

  text: string;
  buttonText: string;
  textResubscribed: string;
  performUnsubscribing: boolean = true;
  buttonSubscribeDisabled: boolean = false;

  progressBarMode: 'determinate' | 'indeterminate' = 'indeterminate';

  error: string;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private translation: TranslationService,
    private route: ActivatedRoute,
    private emailService: EmailService
  ) {

    this.buttonText = translation.strings.undounsuscribe || 'Unsubscribed by mistake? Subscribe again!';
    this.textResubscribed = translation.strings.suscribedok || 'Successfully subscribed';
    this.text = translation.strings.unsuscribedok || 'Unsubscribed';

    this.route
      .queryParams
      .subscribe((params: Params) => {
        this.code = params.code;
      });
  }

  ngOnInit(): void {

    this.emailService.sendUnsubscribe(this.code)
      .subscribe(() => {
        this.performUnsubscribing = false;
        this.toggleProgressBar();
        this.changeDetectorRef.markForCheck();
      }, err => {
        this.error = err.message;
        this.toggleProgressBar();
        this.changeDetectorRef.markForCheck();
      });
  }

  toggleProgressBar(): void {
    this.progressBarMode = this.progressBarMode === 'determinate' ? 'indeterminate' : 'determinate';
  }

  sendSubscribe() {

    this.buttonSubscribeDisabled = true;

    this.emailService.sendSubscribe(this.code)
      .subscribe(() => {
        this.text = this.textResubscribed;
        this.toggleProgressBar();
        this.changeDetectorRef.markForCheck();
      }, err => {
        this.error = err.message;
        this.toggleProgressBar();
        this.changeDetectorRef.markForCheck();
      });
  }
}
