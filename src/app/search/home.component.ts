import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Location } from '@angular/common';
import {
  ActivatedRoute,
  Router
} from '@angular/router';
import {
  Overlay,
  OverlayRef
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Subscription } from 'rxjs';

import {
  AdWordsService,
  AuthService,
  SaleRent,
  ConfigService,
  gaEvents,
  getGaPageByRoute,
  GoogleAnalyticsService,
  IS_BROWSER,
  LocaleShort,
  ModalService,
  PrincipalService,
  SearchParams,
  SearchService,
  TranslationService,
  WeModalRef,
  City,
} from '../shared';

import {
  getScrollingElement,
  getBodySize,
  handleSetChange,
  animate,
  EasingFunctions,
} from '../util';

import { WhiteOption } from '../component/white-option';

import { NewPasswordModalComponent } from './auth.component';
import { VerifyEmailComponent } from './verify-email.component';

import { HeaderComponent } from './header.component';
import { ContactFormPopupComponent } from './contact-form.component';
import { EmailUnsubscribeComponent } from './email-unsubscribe.component';
import { ThanksForRequestComponent } from './thanks-for-request.component';


enum Target {
  Index = 0,
  Thanks = 1,
  Verify = 2,
  NewPassword = 5,
  Unsubscribe = 6,
}


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'home',
  styleUrls: ['home.component.scss'],
  templateUrl: 'home.component.html'
})
export class HomeComponent implements OnInit, OnDestroy {

  @ViewChild(HeaderComponent) header: HeaderComponent;
  @ViewChild('videoContainer') videoContainerRef: ElementRef;

  bodyScrollTop: number = 0;

  target: Target;

  isMobileView: boolean;
  searchBarIsVisible: boolean = false;

  searchParams: SearchParams = new SearchParams();

  translationChanged: Subscription;

  bodyWidth: number;
  bodyHeight: number;

  callButtonVisible: boolean;

  overlayRef: OverlayRef;

  indexGalleryItems: any[] = [];

  @ViewChild('searchBlock') searchBlockRef: ElementRef;

  get activeLocale(): LocaleShort {
    return this.translation.activeLocale;
  }

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    public searchService: SearchService,
    private translation: TranslationService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    public configService: ConfigService,
    private modalService: ModalService,
    private authService: AuthService,
    public principalService: PrincipalService,
    public adWordsService: AdWordsService,
    public location: Location,
    private googleAnalyticsService: GoogleAnalyticsService,
    @Inject(IS_BROWSER) public isBrowser: boolean,
    private overlay: Overlay,
  ) {

    if (this.isBrowser) {
      window['home'] = this;
    }
  }

  ngOnInit(): void {
    this.init();
  }

  ngOnDestroy(): void {

    if (this.translationChanged) {
      this.translationChanged.unsubscribe();
    }
  }

  init() {

    this.searchParams.sale = SaleRent.Sale;

    this.translationChanged = this.translation.changed
      .subscribe(() => {

        this.router.navigate(['/', this.translation.activeLocale,
          ...this.activatedRoute.snapshot.url.map(el => el.path)]);
      });

    this.activatedRoute
      .url
      .subscribe(segments => {

        this.searchService.getCitiesQueued()
          .subscribe(cities => {
            this.updateIndexGalleryItems(cities);
            this.changeDetectorRef.markForCheck();
          });

        const path = segments.length ? segments[0].path : '';

        switch (path) {
          case 'thanks':
            this.target = Target.Thanks;
            break;
          case 'verify':
            this.target = Target.Verify;
            break;
          case 'reset':
            this.target = Target.NewPassword;
            break;
          case 'unsubscribe':
            this.target = Target.Unsubscribe;
            break;
          default:
            this.target = Target.Index;
        }

        this.changeDetectorRef.markForCheck();
      });

    if (this.isBrowser) {

      const size = getBodySize();

      this.bodyWidth = size.width;
      this.bodyHeight = size.height;

      this.isMobileView = this.configService.isMobileView(this.bodyWidth);

      this.checkCallButtonVisibility(getScrollingElement().scrollTop);
      this.checkSearchBarVisibility(size.width);

      if (this.target !== Target.Index) {

        const dialogParams = {
          showCloseButton: true,
          width: this.isMobileView ? `${this.bodyWidth}px` : '400px',
          height: this.isMobileView ? `${this.bodyHeight}px` : '500px',
          maxWidth: `${this.bodyWidth}px`,
          maxHeight: `${this.bodyHeight}px`,
        };

        let dialogRef: WeModalRef<any>;

        if (this.target === Target.Verify) {
          dialogRef = this.modalService.open(VerifyEmailComponent, dialogParams);
        } else if (this.target === Target.NewPassword) {
          dialogRef = this.modalService.open(NewPasswordModalComponent, dialogParams);
        } else if (this.target === Target.Unsubscribe) {
          dialogRef = this.modalService.open(EmailUnsubscribeComponent, dialogParams);
        }

        if (dialogRef) {

          dialogRef.onClose()
            .subscribe(() => {
              this.router.navigate(['/', this.translation.activeLocale]);
            });
        }
      }

      this.adWordsService.trackConversionRealEstate('', 'home');

      requestAnimationFrame(() => {

        if (this.videoContainerRef) {

          const video = document.createElement('video') as HTMLVideoElement;

          video.classList.add('index-video');
          video.autoplay = true;
          video.loop = true;
          video.muted = true;
          video.src = this.isMobileView ? '/assets/video/trailer-m.mp4' : '/assets/video/trailer.mp4';

          // webkit
          video.setAttribute('playsinline', 'true');

          this.videoContainerRef.nativeElement.appendChild(video);
        }
      });
    }
  }

  onBuyRentChange(value: number): void {
    this.searchParams.sale = value;
  }

  onCityChanged(cityId: number): void {

    handleSetChange(this.searchParams.cityValues, cityId);
  }

  onSearchButtonClick(): void {

    const event = gaEvents.mainSearch;
    this.googleAnalyticsService.sendEvent(event.category, event.action,
      `${this.searchParams.sale === SaleRent.Sale ? 'Buy' : 'Rent'} - ${Array.from(this.searchParams.cityValues).join(',')}`, event.value);

    this.onSearch();
  }

  showContactFormPopUp(): void {

    const modalRef = this.modalService.open(ContactFormPopupComponent,
      this.configService.getDialogParams(this.isMobileView));

    modalRef.componentInstance.title = this.translation.translate('formcont', 'Contact the agency');
    modalRef.componentInstance.textareaEnabled = false;

    const event = gaEvents.iconRequest;
    const page = getGaPageByRoute(this.router.url);

    this.googleAnalyticsService.sendEvent(event.category, event.action, `${page} - Request`, event.value);
  }

  onSearch(): void {

    const searchUrl = this.searchService.serializeUrl(this.searchParams);

    this.router.navigate([this.translation.lang, 'search', searchUrl]);
  }

  getSearchUrl(lang: LocaleShort, saleWord: string, cityWord: string): string {
    return `/${lang}/search/${saleWord}_${cityWord}`;
  }

  onRequestSend(): void {
    this.showSpinner();
  }

  onRequestSent(): void {

    this.hideSpinner();

    const modalRef = this.modalService.open(ThanksForRequestComponent, {
      showCloseButton: true
    });
    modalRef.componentInstance.buttonClick
      .subscribe(() => {
        modalRef.close();
        this.scrollToSearch();
      });
  }

  onRequestSentError(): void {

    this.hideSpinner();
  }

  showSpinner(): void {

    this.hideSpinner();

    this.overlayRef = this.overlay.create({
      width: '100vw',
      height: '100vh',
      hasBackdrop: true,
      backdropClass: 'index-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block()
    });
    const componentPortal = new ComponentPortal(WhiteSpinnerComponent);
    this.overlayRef.attach(componentPortal);
  }

  hideSpinner(): void {

    if (this.overlayRef) {
      this.overlayRef.detach();
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }

  updateIndexGalleryItems(cities: City[]): void {

    const s = this.translation.strings;
    const lang = this.translation.lang;
    const g = (value: string) => SearchService.prepareCityNameForUrl(this.searchService.getCityName(value));
    const sale = (s.vente || '').trim().toLowerCase();
    const getText = (city) => `${sale} ${city}`;
    const getSearchUrl = (lang: LocaleShort, saleWord: string, cityWord: string) => `/${lang}/search/${saleWord}_${cityWord}`;

    this.indexGalleryItems = cities
      .filter(city => city.indexGallery)
      .map(city => {
        const cityName = this.translation.translate(city.translationKey);

        return {
          img: city.coverImage,
          alt: getText(cityName),
          txt: this.searchService.getCityName(cityName),
          description: city.description,
          id: city.id,
          url: getSearchUrl(lang, sale, g(cityName)),
        };
      });
  }

  scrollToSearch(): void {

    if (!this.searchBlockRef) {
      return;
    }

    const el = getScrollingElement();
    const target = this.searchBlockRef.nativeElement;

    animate((delta) => {
      el.scrollTop = el.scrollTop + (target.offsetTop - el.scrollTop) * delta;
    }, EasingFunctions.easeInCubic, 700);
  }

  onHeaderSearchClick(): void {

    this.scrollToSearch();
  }

  onCreateVipClicked(): void {

    this.router.navigate(['/' + this.translation.activeLocale, 'vip']);
  }

  getCityChips(): WhiteOption[] {

    if (!this.searchParams.cityValues.size) {
      return [];
    }

    return Array.from(this.searchParams.cityValues)
      .map(id => this.searchService.getCityOptionById(id));
  }

  checkSearchBarVisibility(width: number) {

    if (width >= this.configService.searchBarVisibilityThreshold) {
      this.searchBarIsVisible = true;
    }
  }

  checkCallButtonVisibility(scrollTop: number): void {
    this.callButtonVisible = scrollTop > 750;
  }

  @HostListener('window:scroll', ['$event'])
  onScroll(): void {

    this.bodyScrollTop = getScrollingElement().scrollTop;

    this.checkCallButtonVisibility(this.bodyScrollTop);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event): void {

    this.bodyWidth = event.target.innerWidth;
    this.bodyHeight = event.target.innerHeight;

    this.isMobileView = this.configService.isMobileView(this.bodyWidth);

    this.checkSearchBarVisibility(event.target.innerWidth);
  }
}


@Component({
  selector: 'white-spinner',
  styles: [`
    :host {
      display: block;
    }
  `],
  template: `
    <div class="absolute-center">
      <mat-spinner color="warn"></mat-spinner>
    </div>
  `
})
export class WhiteSpinnerComponent {

}
