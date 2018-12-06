import {
  Component,
  Input,
  HostListener,
  ChangeDetectionStrategy,
  ElementRef,
  ViewChild,
  OnInit,
  ChangeDetectorRef,
  OnDestroy
} from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import {
  GoogleAnalyticsService,
  TranslationService,
  gaEvents,
  getGaPageByRoute,
  BetaService,
  PrincipalService,
  LoginOrigin,
  ModalService
} from '../shared';
import { AuthActiveForm } from './auth-active-form';
import { AuthLoginRegistrationComponent } from './auth-login-registration.component';
import { LoginPartial } from './login-partial';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'page-header',
  styleUrls: ['header.component.scss'],
  templateUrl: 'header.component.html'
})
export class HeaderComponent implements OnInit, OnDestroy {

  @Input() color: 'black' | 'white' = 'black';

  profileMenuVisibility: boolean;

  @ViewChild('userMenu') userMenuRef: ElementRef;

  private subscriptions: Subscription[] = [];

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    public elementRef: ElementRef,
    private router: Router,
    private translation: TranslationService,
    private googleAnalyticsService: GoogleAnalyticsService,
    private betaService: BetaService,
    public principal: PrincipalService,
    private loginPartial: LoginPartial,
    private modalService: ModalService
  ) {
  }

  ngOnInit(): void {

    this.subscriptions.push(
      this.principal.principalUpdated()
        .subscribe(() => this.changeDetectorRef.markForCheck())
    );
  }

  ngOnDestroy(): void {

    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onLogoClick(): void {

    const event = gaEvents.logo;
    const page = getGaPageByRoute(this.router.url);

    this.googleAnalyticsService.sendEvent(event.category, event.action, `${page}`, event.value);

    this.betaService.onLogoClick();
  }

  onAccountClick(): void {

    this.profileMenuVisibility = !this.profileMenuVisibility;

    const event = gaEvents.account;
    const page = getGaPageByRoute(this.router.url);

    this.googleAnalyticsService.sendEvent(event.category, event.action, `${page}`, event.value);
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

    this.openAuthDialog(AuthActiveForm.Login, LoginOrigin.UserMenu);

    const event = gaEvents.login;
    const page = getGaPageByRoute(this.router.url);

    this.googleAnalyticsService.sendEvent(event.category, event.action, `${page}`, event.value);
  }

  toggleSignUpDialog(): void {

    this.openAuthDialog(AuthActiveForm.Register, LoginOrigin.UserMenu);

    const event = gaEvents.register;
    const page = getGaPageByRoute(this.router.url);

    this.googleAnalyticsService.sendEvent(event.category, event.action, `${page}`, event.value);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {

    if (this.userMenuRef) {

      const el = <HTMLElement>this.userMenuRef.nativeElement;
      const target = <HTMLElement>event.target;

      if (this.profileMenuVisibility && !el.contains(target)) {
        this.profileMenuVisibility = false;
      }
    }
  }
}

