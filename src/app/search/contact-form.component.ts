import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild
} from '@angular/core';
import { Router } from '@angular/router';
import {
  animate,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';
import * as bowser from 'bowser';

import {
  attachBodyClick,
  isNullOrUndefined,
  validateEmail,
  validatePhoneNumber
} from '../util';

import {
  ConfigService,
  FacebookTrackService,
  gaEvents,
  getGaPageByRoute,
  GoogleAnalyticsService,
  Listing,
  PrincipalService,
  RequestSource,
  SaleRent,
  SearchService,
  TranslationService,
  UtmService,
  WeModalRef
} from '../shared';


const animationEasing = '400ms cubic-bezier(0.68, -0.55, 0.265, 1.55)';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'contact-form',
  templateUrl: 'contact-form.component.html',
  styleUrls: ['contact-form.component.scss'],
  animations: [
    trigger('formState', [
      state('active', style({transform: 'translateY(0)'})),
      transition(':enter', [
        style({
          transform: 'translateY(60%)'
        }),
        animate(animationEasing)
      ]),
      transition(':leave', [
        animate(animationEasing, style({transform: 'translateY(60%)'}))
      ])
    ]),
    trigger('containerAnimation', [
      state('active', style({height: '275px'})),
      state('inactive', style({height: '95px'})),
      transition('active => inactive', animate(animationEasing)),
      transition('inactive => active', animate(animationEasing)),
    ])
  ]
})
export class ContactForm {

  @Input() view: 'pink' | 'pink-full' | 'index-top' | 'index-bottom' | 'search-bottom' = 'search-bottom';
  @Input() listing: Listing;
  @Input() listingSaleRent: SaleRent | null;
  @Input() title: string;
  @Input() textareaEnabled: boolean = true;
  @Input() preventRedirect: boolean;

  @Output() onSend = new EventEmitter();
  @Output() onSent = new EventEmitter();
  @Output() onSentError = new EventEmitter();

  @ViewChild('emailEl') emailEl: ElementRef;

  requestSending: boolean = false;

  RequestSource = RequestSource;

  disabled: boolean;

  name: string;
  comment: string;
  email: string;
  agree: boolean = true;

  state: 'active' | 'inactive' = 'inactive';

  error: string;

  buggedIos: boolean;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private translation: TranslationService,
    public searchService: SearchService,
    public config: ConfigService,
    public principalService: PrincipalService,
    public facebookTrackService: FacebookTrackService,
    public router: Router,
    public elementRef: ElementRef,
    private googleAnalyticsService: GoogleAnalyticsService,
    private utmService: UtmService
  ) {

    // https://bugs.webkit.org/show_bug.cgi?id=176896 seems like the bug is relevant for ios 11.0 - 11.2
    this.buggedIos = bowser.safari && bowser.mobile;
  }

  sendRequest(name: string, email: string, comment: string, source: RequestSource): void {

    if (!(validateEmail(email) || validatePhoneNumber(email))) {
      this.error = this.translation.translate('site_request_form_invalid_contact_error', 'Please, enter a correct email or a phone number');
      return;
    }

    this.requestSending = true;
    this.disabled = true;

    const ref = this.listing ? this.listing.ref + (this.listing.refcheck || '') : '';

    let latestSearchBody = this.searchService.latestSearchBody || {};

    if (this.listing) {

      const saleRent: SaleRent = !isNullOrUndefined(this.listingSaleRent) ? this.listingSaleRent : (
        this.listing.sale === 1 ? SaleRent.Sale : (
          this.listing.rent === 1 ? SaleRent.Rent : null
        )
      );

      latestSearchBody = Object.assign(latestSearchBody, {sale: saleRent});
    }

    this.onSend.emit();

    this.searchService.sendFormRequest(name, email, comment, latestSearchBody, source, ref, this.utmService.serialize())
      .subscribe(() => {

        this.requestSending = false;

        this.email = '';
        this.name = '';
        this.comment = '';

        this.onSent.emit();

        if (!this.preventRedirect) {
          this.router.navigate(['/thanks']);
        }
      }, err => {

        this.onSentError.emit();

        this.error = err.message;
        this.requestSending = false;
        this.disabled = false;

        this.changeDetectorRef.markForCheck();

        throw err;
      });

    this.facebookTrackService.track('Purchase', {
      content_type: 'product',
      content_ids: [this.listing ? String(this.listing.ref) : '0'],
      content_name: this.listing ? this.listing.title : '',
      currency: 'EUR',
      value: this.listing ? this.listing.totpr : 0,
    });
  }

  setStateActive(): void {

    this.state = 'active';
    this.changeDetectorRef.markForCheck();

    if (this.buggedIos) {

      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
    }

    attachBodyClick([this.elementRef.nativeElement],
      () => this.setStateInactive());
  }

  setStateInactive(): void {

    this.state = 'inactive';
    this.changeDetectorRef.markForCheck();

    if (this.buggedIos) {
      document.body.style.overflow = '';
      document.body.style.position = '';
    }
  }

  onInput(): void {

    if (this.error) {
      this.error = '';
    }
  }

  onNameBlur(name: string): void {

    const event = gaEvents.requestName;
    const page = getGaPageByRoute(this.router.url);

    this.googleAnalyticsService.sendEvent(event.category, event.action, `${page}`, event.value);
  }

  onEmailBlur(email: string): void {

    const event = gaEvents.requestPhone;
    const page = getGaPageByRoute(this.router.url);

    this.googleAnalyticsService.sendEvent(event.category, event.action, `${page}`, event.value);
  }
}


@Component({
  selector: 'contact-form-popup',
  template: `
    <contact-form [listing]="listing"
                  [title]="title"
                  [textareaEnabled]="textareaEnabled"
                  (onSent)="modalRef.close()"
                  class="large theme-yellow theme-popup">
    </contact-form>
  `
})
export class ContactFormPopupComponent {

  @Input() listing: Listing;
  @Input() title: string;
  @Input() textareaEnabled: boolean;

  constructor(public modalRef: WeModalRef<ContactFormPopupComponent>) {
  }
}
