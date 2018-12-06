import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  Output
} from '@angular/core';
import {
  ActivatedRoute,
  Router
} from '@angular/router';
import { SwPush } from '@angular/service-worker';
import {
  combineLatest,
  from
} from 'rxjs';
import {
  debounceTime,
  switchMap
} from 'rxjs/operators';

import { environment } from '../../environments/environment';

import {
  BetaService,
  DEVICE_FORM_FACTOR,
  DeviceFormFactor,
  DeviceFormFactorValue,
  gaEvents,
  getGaPageByRoute,
  GoogleAnalyticsService,
  IS_BROWSER,
  LoginOrigin,
  ModalService,
  PrincipalService,
  PushService,
  TranslationService
} from '../shared';
import { LoginPartial } from './login-partial';
import { AuthLoginRegistrationComponent } from './auth-login-registration.component';
import { AuthActiveForm } from './auth-active-form';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'user-drop-down-menu',
  styleUrls: ['user-drop-down-menu.component.scss'],
  templateUrl: 'user-drop-down-menu.component.html'
})
export class UserDropDownMenuComponent {

  @Input() open: boolean;
  @Input() color: 'black' | 'white' = 'black';

  @Output() close: EventEmitter<void> = new EventEmitter<void>();

  ref: string;

  subscribed: boolean;

  private subscribingInProgress: boolean;

  get isMobile(): boolean {
    return this.deviceFormFactor === DeviceFormFactorValue.Mobile;
  }

  constructor(
    public elementRef: ElementRef,
    private changeDetectorRef: ChangeDetectorRef,
    public translation: TranslationService,
    public principalService: PrincipalService,
    private modalService: ModalService,
    public route: ActivatedRoute,
    private router: Router,
    @Inject(DEVICE_FORM_FACTOR) private deviceFormFactor: DeviceFormFactor,
    @Inject(IS_BROWSER) public isBrowser: boolean,
    private googleAnalyticsService: GoogleAnalyticsService,
    public _betaService: BetaService,
    private swPush: SwPush,
    private pushService: PushService,
    private loginPartial: LoginPartial
  ) {

    combineLatest(
      this.route.queryParams,
      this.route.params,
    )
      .pipe(
        debounceTime(10)
      )
      .subscribe((results) => {

        const queryParams = results[0];
        const params = results[1];

        this.ref = queryParams.ref || params.ref || null;
      });

    // this.swPush.messages.subscribe(data => {
    //   console.log('push message >>>>>>>>>>>>>>', data);
    // });

    this.swPush.subscription.subscribe(sub => {

      // if (sub) {
      //   console.log('active subscription', sub.toJSON(), JSON.stringify(sub.toJSON()));
      // } else {
      //   console.log('no active subscription');
      // }

      this.subscribed = !!sub;

      this.changeDetectorRef.markForCheck();
    });
  }

  openAuthDialog(activeForm: AuthActiveForm, origin: LoginOrigin, ref: string = null): void {

    const modalRef = this.modalService.open(AuthLoginRegistrationComponent, this.loginPartial.getPopupParams());

    modalRef.componentInstance.activeForm = activeForm;
    modalRef.componentInstance.title = this.loginPartial.getAuthPopupTitle(activeForm);
    modalRef.componentInstance.origin = origin;
    modalRef.componentInstance.ref = ref;
    modalRef.componentInstance.onClose
      .subscribe(() => modalRef.close());
    modalRef.componentInstance.onTabSwitch
      .subscribe(({activeForm}) => {
        modalRef.componentInstance.title = this.loginPartial.getAuthPopupTitle(activeForm);
      });
  }

  toggleSignInDialog(): void {

    this.open = false;
    this.close.emit();

    this.openAuthDialog(AuthActiveForm.Login, LoginOrigin.UserMenu, this.ref);

    const event = gaEvents.login;
    const page = getGaPageByRoute(this.router.url);

    this.googleAnalyticsService.sendEvent(event.category, event.action, `${page}`, event.value);
  }

  toggleSignUpDialog(): void {

    this.open = false;
    this.close.emit();

    this.openAuthDialog(AuthActiveForm.Register, LoginOrigin.UserMenu, this.ref);

    const event = gaEvents.register;
    const page = getGaPageByRoute(this.router.url);

    this.googleAnalyticsService.sendEvent(event.category, event.action, `${page}`, event.value);
  }

  onSlideChanged(checked: boolean): void {

    if (this.subscribingInProgress) {
      return;
    }

    this.subscribingInProgress = true;

    if (checked) {

      from(this.swPush.requestSubscription({serverPublicKey: environment.vapidPublicKey}))
        .pipe(
          switchMap(sub => this.pushService.saveSubscription(sub))
        )
        .subscribe(() => {
          console.log('You have been successfully subscribed to notifications');
        }, (err) => {
          console.error('failed to subscribe', err);

          this.subscribed = false;

          this.changeDetectorRef.markForCheck();

        }, () => {
          this.subscribingInProgress = false;
          this.changeDetectorRef.markForCheck();
        });

    } else {

      from(this.swPush.unsubscribe())
        .subscribe(() => {
          console.log(`You have been unsubscribed`);

          this.subscribingInProgress = false;
          this.changeDetectorRef.markForCheck();
        })
    }
  }

  logout(): void {

    this.principalService.logout();

    this.close.emit();
  }
}
