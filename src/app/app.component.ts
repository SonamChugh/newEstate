import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  Inject,
  HostListener,
  HostBinding
} from '@angular/core';
import {
  Router,
  NavigationStart,
  NavigationEnd,
  ActivatedRoute
} from '@angular/router';

import * as bowser from 'bowser';

import {
  getScrollingElement,
  animate,
  EasingFunctions
} from './util';
import {
  IS_BROWSER,
  GoogleAnalyticsService,
  CookieService,
  TranslationService,
  UtmService,
  BetaService,
  HistoryService,
  SeoService,
  ConfigService,
  PrincipalService
} from './shared';
import { ClientService } from './client';


const COOKIE_CONSENT_KEY = 'CookieConsent';


@Component({
  changeDetection: ChangeDetectionStrategy.Default,
  encapsulation: ViewEncapsulation.None,
  selector: 'app-root',
  template: `
    <router-outlet></router-outlet>

    <div *ngIf="!cookieConsent" class="cookie-consent">
      <span>
        {{'cookiemsg' | translate: 'We use cookies to ensure that we give you the best experience on our website'}}
      </span>
      <button (click)="setCookieConsent()" class="btn-cookie-consent">
        {{'okcookie' | translate: 'Continue'}}
      </button>
    </div>
  `,
})
export class AppComponent implements OnInit {

  cookieConsent: boolean = false;

  @HostBinding('class.cookie-consent-visible') get cookieConsentVisible(): boolean {
    return !this.cookieConsent;
  }

  constructor(
    private router: Router,
    private googleAnalyticsService: GoogleAnalyticsService,
    @Inject(IS_BROWSER) public isBrowser: boolean,
    private cookieService: CookieService,
    private translation: TranslationService,
    private activatedRoute: ActivatedRoute,
    private utmService: UtmService,
    private betaService: BetaService,
    private historyService: HistoryService,
    private seoService: SeoService,
    private config: ConfigService,
    private clientService: ClientService,
    private principalService: PrincipalService
  ) {

    if (this.isBrowser) {
      window['router'] = router;
      window['bowser'] = bowser;
    }

    this.updateCookieConsent();
  }

  ngOnInit(): void {

    this.router.events.subscribe(e => {

      if (e instanceof NavigationStart) {

        let url = e.url;
        const index = url.indexOf('?');
        if (index > 0) {
          url = url.slice(0, index);
        }

        const seo = this.translation.getSeoMetadata(url);
        this.seoService.setWhiteTitle(seo ? seo.title : '');
        this.seoService.setMetaDescription(seo && seo.description ? seo.description : this.config.defaultMetaDescription);

        if (this.isBrowser) {
          this.scrollToTop();
        }

      } else if (e instanceof NavigationEnd) {

        this.googleAnalyticsService.sendPageView(e.urlAfterRedirects);

        this.historyService.addPage(e.urlAfterRedirects);
      }
    });

    this.activatedRoute.queryParams
      .subscribe(params => {
        this.utmService.deserialize(params);
      });

    this.principalService
      .principalUpdated()
      .subscribe(principal => {

        if (!principal.isAuthenticated()) {
          this.clientService.clearVipLastClosedMessage();
        }
      });
  }

  updateCookieConsent(): void {
    this.cookieConsent = this.cookieService.get(COOKIE_CONSENT_KEY) === '1';
  }

  setCookieConsent(): void {
    this.cookieService.set(COOKIE_CONSENT_KEY, '1', {path: '/', expires: 365 * 24 * 3600});
    this.updateCookieConsent();
  }

  scrollToTop() {

    const el = getScrollingElement();

    if (el.scrollTop > 0) {
      animate((delta) => el.scrollTop = el.scrollTop * (1 - delta), EasingFunctions.easeInCubic, 500);
    }
  }

  @HostListener('document:keypress', ['$event'])
  onKeyPress(ev: KeyboardEvent): void {

    this.betaService.onKeyPressed(ev);
  }
}
