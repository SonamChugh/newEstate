import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  Inject,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { ActivatedRoute, DefaultUrlSerializer, Params, PRIMARY_OUTLET, Router, UrlSegment } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { combineLatest, forkJoin, Observable, of, Subject, Subscription } from 'rxjs';
import { catchError, debounceTime, map, switchMap, tap } from 'rxjs/operators';

import {
  AdWordsService,
  City,
  ConfigService,
  DEVICE_FORM_FACTOR,
  DeviceFormFactor,
  FacebookTrackService,
  FavoriteService,
  gaEvents,
  getGaListingLabel,
  getGaPageByRoute,
  GoogleAnalyticsService,
  IS_BROWSER,
  Listing,
  ListingImagesResponse,
  ListingVideoResource,
  LocaleShort,
  LoginOrigin,
  ModalService,
  PopupService,
  PrincipalService,
  RequestSource,
  SaleRent,
  SearchParams,
  SearchService,
  SortValue,
  TranslationService,
  UtmService,
  WeModalRef
} from '../shared';
import { DropDownChangeEvent } from '../component/white-dropdown.component';
import { ButtonGroupChangeEvent } from '../component/button-group.component';

import { MapWrapperComponent } from './map-wrapper.component';
import { HeaderComponent } from './header.component';
import { FooterComponent } from './footer.component';
import { ContactForm, ContactFormPopupComponent } from './contact-form.component';
import { AuthLoginComponent } from './auth-login.component';

import {
  animate as myAnimate,
  clearObject,
  Cluster,
  debounce,
  EasingFunctions,
  flatten,
  getScrollingElement,
  getBodyScrollTop,
  getBodySize,
  isLandscape,
  isNullOrUndefined,
  onFullscreenChange,
  setBodyScrollTop,
  upperCaseFirstLetter
} from '../util';

import { PhotosViewerComponent } from './photos-viewer.component';
import { ListingVideoComponent } from './listing-video.component';

import { VideoService } from './video.service';
import { FavoritePartial } from './favorite-partial.service';
import { MapListingsPartial } from './map-listings-partial';
import { DetailsCameFrom } from './details-came-from';
import { PropertyPopupComponent } from './property-popup.component';
import { SearchMobileView } from './search-mobile-view';


export type ViewType = 'search' | 'details' | 'favorites';


export enum ViewTypeValue {
  Favorites = 'favorites',
  Search = 'search',
  Details = 'details'
}


@Component({
  changeDetection: ChangeDetectionStrategy.Default,
  encapsulation: ViewEncapsulation.Emulated,
  selector: 'search-page',
  styleUrls: ['search.component.scss'],
  templateUrl: 'search.component.html',
  providers: [
    FavoritePartial,
    MapListingsPartial,
  ]
})
export class SearchComponent implements OnInit, AfterViewInit, OnDestroy {

  searchParams: SearchParams = new SearchParams();

  view: ViewType;
  cameFromView: ViewType;

  ViewTypeValue = ViewTypeValue;
  SortValue = SortValue;

  loading: boolean = true;
  isMobileView: boolean;
  mobileView: SearchMobileView = SearchMobileView.List;
  mobileFiltersLoading: boolean = false;
  mobilePropertiesFound: number = null;

  isRightColumnMobileLoadedOnce: boolean = false;

  availableResults: Listing[] = [];
  results: Listing[] = [];
  visibleResults = [];
  listingSelected = {};

  ref: number;
  listing: Listing;
  listingImages: string[];
  listingImagesRemaining: number;

  private listingImagesUpdated = new Subject();

  ribbonImagesCount: number = 2;

  similarListings: Listing[];

  secret: string;
  secretImagesCode: string;

  currentPage: number = 0;
  limit: number = 10;

  buttonBottomFormDisabled: boolean = true;

  requestSending: boolean = false;

  queryParams: Params;
  locale: LocaleShort;
  rawSearchQuery: string;

  error: string;

  bodyHeight: number;
  bodyWidth: number;

  bodyScrollTop: number = 0;
  searchBodyScrollTop: number = 0;
  mobileHeaderTop: number = 0;

  bottomOffsetTriggerThreshold: number = 450;

  mapUpdating: boolean = true;

  isSearchBarVisible: boolean;

  cityIdDict: { [id: number]: City } = {};

  subscriptions: Subscription[] = [];

  bedroomsTitle: string;
  surfaceTitle: string;
  budgetSaleTitle: string;
  budgetRentTitle: string;

  listingSaleRent: SaleRent | null;

  SaleRent = SaleRent;

  backUrl: string;
  backUrlQueryParams: Params;

  // url is like '/en/reference/123456'
  urlIsReference: boolean;

  // when we return from details view to search view
  // we don't need update list
  skipListUpdate: boolean = false;
  mapLoginButtonVisible: boolean = false;
  isMapEventsInitialized: boolean = false;

  from: DetailsCameFrom | null;
  DetailsCameFrom = DetailsCameFrom;

  get totalPages(): number {
    return Math.ceil(this.results.length / this.limit);
  }

  private _headerHeight: number;
  private _searchBarHeight: number;
  private _footerHeight: number;

  get headerHeight(): number {

    if (!this._headerHeight) {
      const el = this.header.elementRef.nativeElement;
      this._headerHeight = el.offsetHeight;
    }

    return this._headerHeight;
  }

  get searchBarHeight(): number {

    if (!this._searchBarHeight) {

      this._searchBarHeight = this.upperFilters
        ? this.upperFilters.nativeElement.offsetHeight
        : 0;
    }

    return this._searchBarHeight;
  }

  get isLeftColumnVisible(): boolean {
    return this.isSearchOrFavorites() && !this.isMobileView;
  }

  contentMarginTop: number;
  mobileHeaderHeight: number;

  fullScreenCancel: () => void;
  isFullScreen: boolean;

  private notifyMapResize = debounce(() => {

    if (this.mapWrapper && this.mapWrapper.map) {
      this.mapWrapper.triggerResize();
    }
  }, 250);

  @ViewChild('fixedContainer') fixedContainer: ElementRef;
  @ViewChild('mobileHeader') mobileHeader: ElementRef;
  @ViewChild('upperFilters') upperFilters: ElementRef;

  @ViewChild(HeaderComponent) header: HeaderComponent;
  @ViewChild(FooterComponent) footer: FooterComponent;
  @ViewChild(MapWrapperComponent) mapWrapper: MapWrapperComponent;
  @ViewChild(ContactForm) contactForm: ContactForm;
  @ViewChild(ListingVideoComponent) listingVideo: ListingVideoComponent;
  @ViewChild(PropertyPopupComponent, {read: ElementRef}) propertyPopup: ElementRef;

  constructor(
    public searchService: SearchService,
    private activatedRoute: ActivatedRoute,
    public translation: TranslationService,
    private zone: NgZone,
    private router: Router,
    public configService: ConfigService,
    private favoriteService: FavoriteService,
    public favoritePartial: FavoritePartial,
    public principalService: PrincipalService,
    private modalService: ModalService,
    public popupService: PopupService,
    public elementRef: ElementRef,
    public adWordsService: AdWordsService,
    public facebookTrackService: FacebookTrackService,
    protected googleAnalyticsService: GoogleAnalyticsService,
    @Inject(IS_BROWSER) public readonly isBrowser: boolean,
    @Inject(DEVICE_FORM_FACTOR) private deviceFormFactor: DeviceFormFactor,
    private utmService: UtmService,
    private videoService: VideoService,
    private mapListingsPartial: MapListingsPartial
  ) {

    if (isBrowser) {
      window['search'] = this;
    }

    this.checkUrl();
  }

  checkUrl(): void {

    const segments = this.activatedRoute.snapshot.url;

    if (segments.length >= 2 && segments[0].path === 'search'
      && TranslationService.LOCALES_ARRAY.indexOf(segments[1].path) !== -1) {

      const paths = segments.slice(2).map(seg => seg.path);

      this.router.navigate([segments[1].path, segments[0].path, ...paths],
        {
          queryParams: this.activatedRoute.snapshot.queryParams
        });
    }
  }

  ngOnInit(): void {
    this.init();
  }

  ngOnDestroy(): void {

    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  ngAfterViewInit(): void {
  }

  init() {

    if (this.isBrowser) {

      const size = getBodySize();

      this.bodyHeight = size.height;
      this.bodyWidth = size.width;

      this.isMobileView = this.configService.isMobileView(size.width);

      this.mapLoginButtonVisible = true;

      this.ribbonImagesCount = SearchComponent.getRibbonImagesCount(this.bodyWidth) || 1;

      this.mapListingsPartial.isMobile = this.isMobileView;
      this.mapListingsPartial.getFavoriteStatus = (listing: Listing) => this.favoritePartial.isFavorite(listing);

      this.mapListingsPartial
        .listingActivate
        .subscribe(listing => {
          this.activateListing(listing);
        });

      this.mapListingsPartial
        .listingFavorite
        .subscribe(listing => {
          this.onSearchResultFavoriteClick(listing);
        });

    } else {

      this.isMobileView = this.deviceFormFactor === 'mobile';
      this.ribbonImagesCount = this.isMobileView ? 1 : 4;
    }

    this.subscriptions.push(
      this.principalService.principalUpdated()
        .subscribe(() => {

          this.searchService.clearCache();

          this.favoritePartial.init()
            .pipe(
              switchMap(() => this.updateListingData()),
              switchMap(() => this.parseAndSearch())
            )
            .subscribe((properties: Listing[]) => this.handleResults(properties));
        })
    );

    this.subscriptions.push(
      this.translation.changed
        .subscribe(() => this.update())
    );

    this.subscriptions.push(
      forkJoin(
        this.initFavoritesSafe(),
        this.searchService.getCities(),
      )
        .pipe(
          switchMap((results) => {

            const [_, cities] = results;

            cities.forEach(el => this.cityIdDict[el.id] = el);

            return combineLatest(
              this.activatedRoute.url,
              this.activatedRoute.params,
              this.activatedRoute.queryParams,
            );
          }),
          debounceTime(10),
          switchMap(results => {
            const [segments, params, queryParams] = results;
            return this.onUrlChanged(segments, params, queryParams);
          })
        )
        .subscribe(() => {
        }, err => {

          if (err instanceof HttpErrorResponse && err.status === 404) {

            if (this.principalService.isAuthenticated) {
              this.router.navigate(['/']);
            } else if (this.isBrowser) {
              this.showLoginPopup();
            }
          }
        })
    )
  }

  initFavoritesSafe(): Observable<void> {

    return this.favoritePartial.init()
      .pipe(
        catchError(err => {

          return of(null);
        })
      )
  }

  update(): void {

    if (this.urlIsReference) {
      // for urls like /en/reference/<ref>
      this.router.navigate(
        ['/' + this.translation.activeLocale, 'reference', this.ref + this.secret],
        {queryParams: this.queryParams}
      );
    } else {
      // for urls like /en/search/...
      this.onSearch();
    }
  }

  onUrlChanged(segments: UrlSegment[], params: Params, queryParams: Params): Observable<void> {

    const firstPath = segments.length ? segments[0].path : '';
    this.urlIsReference = firstPath === 'reference';

    if (params.search !== this.rawSearchQuery) {
      this.mapListingsPartial.latestSearchViewBounds = null;
      this.mapListingsPartial.latestSearchViewZoom = null;
    }

    this.locale = params.locale || null;
    this.rawSearchQuery = params.search === ViewTypeValue.Favorites ? null : params.search;

    this.queryParams = queryParams;

    this.from = this.queryParams.from || null;

    const ref = params['ref'] || queryParams['ref'] || null;
    const matches = ref ? ref.match(/(\d+)(\D*)/) : null;
    let isSearchBarVisible;

    if (matches) {
      this.ref = Number(matches[1]);
      this.secret = matches[2];
    } else {
      this.ref = null;
      this.secret = null;
    }

    if (ref) {

      this.view = ViewTypeValue.Details;
      isSearchBarVisible = false;

    } else if (params.search === ViewTypeValue.Favorites) {

      this.view = ViewTypeValue.Favorites;
      isSearchBarVisible = !this.isMobileView;

    } else {

      this.view = ViewTypeValue.Search;
      isSearchBarVisible = false;
    }

    this.cameFromView = params.search === ViewTypeValue.Favorites
      ? ViewTypeValue.Favorites
      : (params.search ? ViewTypeValue.Search : null);

    this.mobileView = queryParams.sv || SearchMobileView.List;
    this.secretImagesCode = queryParams.code || null;

    this.listingSaleRent = this.view === ViewTypeValue.Details
      ? (
        this.queryParams.sale === '1'
          ? SaleRent.Sale
          : (
            this.queryParams.sale === '0'
              ? SaleRent.Rent
              : null
          )
      )
      : null;

    if (this.isBrowser) {

      this.initSearchMobileView(this.mobileView);

      requestAnimationFrame(() => {

        this.toggleSearchBar(isSearchBarVisible);

        // on mobile view map is initializing when user clicks on the "map" button
        if (this.mapWrapper) {
          this.checkAndInitializeMapEvents();
        }

        // set correct initial size
        this.fixMapSize(getScrollingElement());
      });
    }

    this.updateSizes();

    return this.updateListingData()
      .pipe(
        switchMap(() => this.parseAndSearch()),
        switchMap(properties => {

          if (this.isBrowser) {

            if (this.isSearchOrFavorites()) {

              this.adWordsService.trackConversionRealEstate('', 'searchresults');

              this.facebookTrackService.track('Search', {
                content_type: 'product_group',
                content_ids: properties.map(el => String(el.ref)),
              });

            } else {

              const ref = this.listing ? this.listing.ref : 0;
              const price = this.listing ? this.listing.totpr : 0;

              this.adWordsService.trackConversionRealEstate(String(this.ref), 'offerdetail', this.listing ? this.listing.totpr : null);

              this.facebookTrackService.track('ViewContent', {
                content_type: 'product',
                content_ids: [String(ref)],
                value: price,
                currency: 'EUR',
              });
            }

            // we may have mapWrapper is not initialized yet
            requestAnimationFrame(() => this.handleResults(properties));
          } else {
            this.handleResults(properties);
          }

          return this.provideSimilarListings();
        }),
        map(res => {
          this.similarListings = res;
        })
      );
  }

  provideListing(): Observable<Listing> {

    if (this.ref) {
      return this.searchService.getListing(
        this.ref, this.listingSaleRent, this.secret);
    }

    return of(null);
  }

  provideListingImages(): Observable<ListingImagesResponse> {

    if (this.ref) {
      return this.searchService.getListingPhotos(
        this.ref, this.secretImagesCode, this.deviceFormFactor);
    }

    return of(null);
  }

  updateListingData(): Observable<any> {

    return forkJoin(
      this.provideListing(),
      this.provideListingImages()
    )
      .pipe(
        tap(([listing, imagesResponse]) => {

          this.listing = listing;

          if (this.view === ViewTypeValue.Details) {
            [this.backUrl, this.backUrlQueryParams] = this.getBackUrl();
          }

          if (imagesResponse) {

            this.listingImages = imagesResponse.images.map(el => this.configService.imgUrl + el);
            this.listingImagesRemaining = imagesResponse.remain;

            this.listingImagesUpdated.next();
          }
        })
      )
  }

  provideSimilarListings(): Observable<Listing[]> {

    if (this.ref) {

      return this.searchService.getSimilarListings(this.ref, this.listingSaleRent, 3);
    }

    return of([]);
  }

  checkAndInitializeMapEvents(): void {

    if (this.isMapEventsInitialized) {
      return;
    }

    this.isMapEventsInitialized = true;
    this.initMapEvents();
  }

  initMapEvents(): void {

    this.subscriptions.push(
      this.mapWrapper.clusterClick
        .subscribe((cluster) =>
          this.zone.run(() => this.handleMapClusterClick(cluster)))
    );

    this.subscriptions.push(
      this.mapWrapper.clusterDraw
        .subscribe((cluster: Cluster) => this.onClusterDraw(cluster))
    );

    this.subscriptions.push(
      this.mapWrapper.boundsChanged
        .subscribe((bounds: google.maps.LatLngBounds) => {

          if (this.isSearchOrFavorites()) {
            this.mapListingsPartial.latestSearchViewBounds = bounds;
            this.mapListingsPartial.latestSearchViewZoom = this.mapWrapper.getZoom();
          }
        })
    );

    if (!this.isMobileView) {

      this.subscriptions.push(
        this.mapWrapper.dragEnd
          .subscribe((bounds: google.maps.LatLngBounds) =>
            this.zone.run(() => this.handleDragEnd(bounds)))
      );

      this.subscriptions.push(
        this.mapWrapper.clusterOver
          .subscribe((cluster) =>
            this.zone.run(() => this.handleMapClusterOver(cluster, true)))
      );

      this.subscriptions.push(
        this.mapWrapper.clusterOut
          .subscribe((cluster) =>
            this.zone.run(() => this.handleMapClusterOver(cluster, false)))
      );

    }
  }

  onClusterDraw(cluster: Cluster): void {

    this.mapListingsPartial.correctClusterIcon(cluster);
  }

  getBackUrl(): [string, Params] {

    const params = Object.assign({}, this.queryParams);
    const returnUrl = params.return_url;

    delete params['ref'];
    delete params['return_url'];

    if (returnUrl) {

      const serializer = new DefaultUrlSerializer();
      const tree = serializer.parse(this.queryParams.return_url);
      const url = tree.root.children[PRIMARY_OUTLET].segments.map(el => '/' + el.path).join('');

      return [url, tree.queryParams];
    } else if (this.cameFromView === ViewTypeValue.Search) {
      return [`/${this.locale}/search/${this.rawSearchQuery}`, params];
    } else if (this.cameFromView === ViewTypeValue.Favorites) {
      return [`/${this.locale}/search/${ViewTypeValue.Favorites}`, params];
    } else if (this.listing) {

      let saleRent;

      if (!isNullOrUndefined(this.listingSaleRent)) {
        saleRent = this.listingSaleRent;
      } else if (this.listing.rent === 1 && this.listing.sale === 0) {
        saleRent = SaleRent.Rent;
      } else {
        saleRent = SaleRent.Sale;
      }

      const city = this.searchService.urlForthCity[this.listing.vid];
      const buyRent = this.searchService.urlForthBuyRent[saleRent];
      const type = this.searchService.urlForthType[this.listing.type];

      return [`/${this.translation.lang}/search/${buyRent}_${city}_${type}`, params];
    }

    return ['', {}];
  }

  initSearchMobileView(value: SearchMobileView): void {

    if (value === SearchMobileView.Map && !this.isRightColumnMobileLoadedOnce) {
      this.isRightColumnMobileLoadedOnce = true;
    }
  }


  closeFavoritesPage(): void {

    this.router.navigate([this.translation.activeLocale, 'search']);
  }

  parseAndSearch(): Observable<Listing[]> {

    if (this.rawSearchQuery && this.view !== ViewTypeValue.Favorites) {

      this.searchService.deserializeUrl(this.rawSearchQuery, this.searchParams);
    }

    this.searchParams.sort = this.queryParams.sort || SortValue.LastModifiedFirst;

    this.updateTitles(this.searchParams);

    if (this.view === ViewTypeValue.Favorites) {

      return this.favoritePartial.getFavoritesCached();

    } else if (this.view === ViewTypeValue.Details) {

      if (this.listing) {
        return of([this.listing]);
      } else {
        return this.searchService.getListingArray(this.ref);
      }

    } else {

      return this.searchService.search(this.searchParams);
    }
  }

  handleResults(properties: Listing[]): void {

    this.availableResults = properties;
    this.results = this.availableResults;

    if (this.isBrowser && !(this.isMobileView && this.isSearchOrFavorites() && this.mobileView === SearchMobileView.List)) {
      this.updateMap();
    }

    if (this.isSearchOrFavorites()) {

      if (this.skipListUpdate) {

        if (this.searchBodyScrollTop > 0) {
          setBodyScrollTop(this.searchBodyScrollTop);
        }

        this.skipListUpdate = false;

      } else {
        this.setPageAndUpdate(1);
      }
    } else if (this.isBrowser) {

      myAnimate((delta) => {
        setBodyScrollTop(getBodyScrollTop() * (1 - delta));
      }, EasingFunctions.easeInCubic, 500);
    }

    this.loading = false;
    this.mapUpdating = false;

    this._searchBarHeight = null;
    this._headerHeight = null;
  }

  updateMap(animateClusters: boolean = true): void {

    if (!this.mapWrapper) {
      return;
    }

    if (!this.mapWrapper.mapInitialized) {
      this.mapWrapper.onMapInit().subscribe(() => this.updateMap(animateClusters));
      return;
    }

    if (!this.mapListingsPartial.mapWrapper) {
      this.mapListingsPartial.mapWrapper = this.mapWrapper;
    }

    this.fixMapSize(getScrollingElement());

    this.mapWrapper.triggerResize();

    const checkedCities = Array.from(this.searchParams.cityValues);
    const citiesIterate = checkedCities.length ? checkedCities : Object.keys(this.cityIdDict).map(el => +el);
    const cities = citiesIterate.map(id => this.cityIdDict[id]) as City[];

    // when there are no results we just display checked cities coordinates with "zero" cluster icon
    const defaultCoordinates = cities.map(city => {
      return {lat: city.lat, lng: city.lon};
    });

    this.mapListingsPartial.setPolygons(
      flatten(cities.map(city => city.polygons)));

    this.mapListingsPartial.setMarkers(
      this.availableResults, defaultCoordinates);

    if (this.mapListingsPartial.latestSearchViewZoom && this.isSearchOrFavorites()) {
      this.mapWrapper.setZoom(this.mapListingsPartial.latestSearchViewZoom);
    }

    // a little of animation
    if (animateClusters) {
      setTimeout(() => this.mapWrapper && this.mapWrapper.toggleClustersAnimation(), 700)
    }
  }

  updateTitles(params: SearchParams): void {

    if (params.budgetFrom || params.budgetTo) {

      this.budgetSaleTitle = this.getFromToTitle(
        this.searchService.formatBudget(params.budgetFrom),
        this.searchService.formatBudget(params.budgetTo),
        {
          postfix: ' €',
          separator: '—'
        }
      ) || this.translation.strings.budget || 'Budget';

      this.budgetRentTitle = this.getFromToTitle(
        this.searchService.formatRentBudget(params.budgetFrom),
        this.searchService.formatRentBudget(params.budgetTo),
        {
          postfix: ' €',
          separator: '—'
        }
      ) || this.translation.strings.budget || 'Budget';

    } else {

      this.budgetSaleTitle = this.translation.strings.budget || 'Budget';
      this.budgetRentTitle = this.translation.strings.budget || 'Budget';
    }

    if (params.surfaceFrom || params.surfaceTo) {

      this.surfaceTitle = this.getFromToTitle(
        this.searchService.formatSurface(params.surfaceFrom),
        this.searchService.formatSurface(params.surfaceTo),
        {separator: '—'}
      ) || this.translation.strings.surface || 'Surface';
    } else {

      this.surfaceTitle = this.translation.strings.surface || '';
    }

    if (params.bedroomsFrom || params.bedroomsTo) {

      this.bedroomsTitle = this.getFromToTitle(
        params.bedroomsFrom ? String(params.bedroomsFrom) : null,
        params.bedroomsTo ? String(params.bedroomsTo) : null
      ) || this.translation.strings.chambres || 'Bedrooms';

    } else {

      this.bedroomsTitle = this.translation.strings.chambres || 'Bedrooms';
    }
  }

  getFromToTitle(from: string, to: string, option: { postfix?: string, separator?: string } = {}): string {

    if (from && to) {
      return `${from} ${option.separator || '..'} ${to}${option.postfix || ''}`;
    } else if (from) {
      return `${upperCaseFirstLetter(this.translation.strings.srchfrom || 'from')} ${from}${option.postfix || ''}`;
    } else if (to) {
      return `${upperCaseFirstLetter(this.translation.strings.srchto || 'to')} ${to}${option.postfix || ''}`;
    } else {
      return '';
    }
  }

  handleBedroomsChange(from: number, to: number): void {

    this.searchParams.bedroomsFrom = from;
    this.searchParams.bedroomsTo = to;

    this.updateTitles(this.searchParams);

    this.onSearch();
  }

  handleSurfaceChange(from: number, to: number): void {

    this.searchParams.surfaceFrom = from;
    this.searchParams.surfaceTo = to;

    this.updateTitles(this.searchParams);

    this.onSearch();
  }

  handleBudgetSaleChange(from: number, to: number): void {

    this.searchParams.budgetFrom = from;
    this.searchParams.budgetTo = to;

    this.updateTitles(this.searchParams);

    this.onSearch();
  }

  handleBudgetRentChange(event: DropDownChangeEvent): void {

    this.onSearch();
  }

  handleMultiple(obj: Set<any>, event: DropDownChangeEvent): void {

    if (event.op === 'add') {
      obj.add(event.option.value);
    } else {
      obj.delete(event.option.value);
    }

    this.onSearch();
  }

  onBuyRentChange(changeEvent: ButtonGroupChangeEvent): void {

    this.searchParams.sale = Number(changeEvent.option.value);

    this.onSearch();
  }

  onNewBuildChange() {
    this.onSearch();
  }

  onButtonGroupMultipleChange<T>(obj: Set<T>, changeEvent: ButtonGroupChangeEvent): void {

    if (changeEvent.op === 'add') {
      obj.add(<any>changeEvent.option.value);
    } else {
      obj.delete(<any>changeEvent.option.value);
    }

    this.onSearch();
  }

  onSearch(): void {

    const searchUrl = this.searchService.serializeUrl(this.searchParams);

    this.router.navigate([this.translation.lang, 'search', searchUrl], {
      queryParams: Object.assign({}, this.queryParams, {
        sort: this.searchParams.sort
      })
    });
  }

  onMobileSearch(): void {

    this.mobileFiltersLoading = true;

    this.searchService.search(this.searchParams)
      .pipe(
        debounceTime(2 * 1000)
      )
      .subscribe((results: Listing[]) => {

        this.mobileFiltersLoading = false;
        this.mobilePropertiesFound = results.length;
      });
  }

  onMobileSearchConfirm(): void {

    const searchUrl = this.searchService.serializeUrl(this.searchParams);

    document.body.style.overflowY = null;

    if (this.rawSearchQuery === searchUrl) {
      this.isSearchBarVisible = false;
    } else {
      this.router.navigate([this.translation.lang, 'search', searchUrl]);
    }
  }

  onMobileFiltersClose(): void {

    this.toggleSearchBar(false);
  }

  isSearchOrFavorites(): boolean {
    return this.view === ViewTypeValue.Search || this.view === ViewTypeValue.Favorites;
  }

  isSearch(): boolean {
    return this.view === ViewTypeValue.Search;
  }

  handleDragEnd(bounds: google.maps.LatLngBounds): void {

    if (this.isSearchOrFavorites()) {

      clearObject(this.listingSelected);

      this.results = this.mapListingsPartial
        .filterCurrentListingByBounds(bounds);

      this.setPageAndUpdate(1);
    }
  }

  handleMapClusterOver(cluster: Cluster, isOver: boolean): void {

    this.mapListingsPartial.handleClusterOver(cluster, isOver);

    clearObject(this.listingSelected);

    if (isOver) {

      const listings = this.mapListingsPartial
        .filterCurrentListingByBounds(cluster.getBounds());

      for (let listing of listings) {
        this.listingSelected[listing.id] = true;
      }
    }
  }

  handleMapClusterClick(cluster: Cluster): void {

    this.mapListingsPartial.handleClusterClick(cluster);

    if (!this.principalService.isAuthenticated) {
      setTimeout(() => this.onMapLoginButtonClick(), 2 * 1000);
    }
  }

  sendRequest(name: string, email: string, comment: string): void {

    this.requestSending = true;

    this.searchService.sendFormRequest(name, email, comment, this.searchService.latestSearchBody,
      RequestSource.SearchListBottom, '', this.utmService.serialize())
      .subscribe((results) => {

        this.requestSending = false;

        this.router.navigate(['/thanks']);
      });

    this.facebookTrackService.track('Purchase', {
      content_type: 'product',
      content_ids: ['4444444'],
    });
  }

  pageRange(len: number, limit: number): number[] {

    const res = [];
    const pages = Math.ceil(len / limit);

    for (let i = 1; i <= pages; ++i) {
      res.push(i);
    }
    return res;
  }

  setPageAndUpdate(index: number): void {

    this.currentPage = index;

    const start = (this.currentPage - 1) * this.limit;

    this.visibleResults = this.results.slice(start, start + this.limit);

    if (this.searchBodyScrollTop > 0) {

      myAnimate((delta) => {
        setBodyScrollTop(getBodyScrollTop() * (1 - delta));
      }, EasingFunctions.easeInCubic, 500, () => {
        this.searchBodyScrollTop = 0;
      });
    }
  }

  onSearchResultFavoriteClick(listing: Listing): void {

    const event = gaEvents.addFavorites;
    const page = getGaPageByRoute(this.router.url);

    this.googleAnalyticsService.sendEvent(event.category, event.action,
      `${page} - ${getGaListingLabel(listing)}`, event.value);

    this.toggleFavorite(listing);
  }

  onReferenceFavoriteClick(listing: Listing): void {

    const event = gaEvents.addFavorites;
    const page = getGaPageByRoute(this.router.url);

    this.googleAnalyticsService.sendEvent(event.category, event.action,
      `${page} - ${getGaListingLabel(listing)}`, event.value);

    this.toggleFavorite(listing);
  }

  toggleFavorite(listing: Listing): void {

    const principal = this.principalService.principal;

    if (!principal.isAuthenticated()) {
      this.showLoginPopup(this.translation.strings.titlesigninheart, LoginOrigin.Favorite);
      return;
    }

    this.favoritePartial.toggleFavorite(listing);
  }

  onItemMouseOver(item: Listing): void {
    this.mapListingsPartial.addClassOnHover(item.id);
  }

  onItemMouseOut(item: Listing): void {
    this.mapListingsPartial.removeClassOnHover(item.id);
  }

  onMapLoginButtonClick(): void {

    this.showLoginPopup(this.translation.strings.getindpos, LoginOrigin.Map);
  }

  showLoginPopup(title: string = '', origin: string = '') {

    const ref = this.listing ? this.listing.ref : null;
    const modalRef = this.modalService.open(AuthLoginComponent, {showCloseButton: true});

    modalRef.componentInstance.title = title;
    modalRef.componentInstance.origin = origin;
    modalRef.componentInstance.ref = String(ref);
  }

  showContactFormPopUp(): void {

    const modalRef = this.modalService.open(ContactFormPopupComponent, {showCloseButton: true});

    modalRef.componentInstance.title = this.translation.strings.formcont || 'Contact the agency';
    modalRef.componentInstance.textareaEnabled = false;
    modalRef.componentInstance.listing = this.listing;

    const event = gaEvents.iconRequest;
    const page = getGaPageByRoute(this.router.url);

    this.googleAnalyticsService.sendEvent(event.category, event.action, `${page} - Request`, event.value);
  }

  sendFavoritesRequest(message: string) {

    this.favoriteService.getUserFavorites()
      .subscribe(listings => {

        const refs = listings.map(el => el.ref);
        const comment = `From favorites: ${refs.join(', ')}\n\n\n${message}`;

        this.sendRequest('', '', comment);
      });
  }

  onMobileTopMenuRequestClick(): void {

    const event = gaEvents.mobileTopMenuRequest;

    this.googleAnalyticsService.sendEvent(event.category, event.action,
      getGaListingLabel(this.listing), event.value);

    this.toggleContactFormPopup();
  }

  toggleContactFormPopup(): void {

    const modalRef = this.modalService.open(ContactFormPopupComponent, {
      showCloseButton: true,
      containerClass: 'contact-form-custom'
    });

    modalRef.componentInstance.listing = this.listing;
  }

  onSortClicked(value: SortValue): void {

    this.searchParams.sort = value;

    this.onSearch();
  }

  onSearchResultListingClick(listing: Listing): void {

    const event = gaEvents.chooseReference;
    this.googleAnalyticsService.sendEvent(event.category, event.action,
      `Found : ${getGaListingLabel(listing)}`, event.value);

    this.activateListing(listing);
  }

  activateListing(listing: Listing): void {

    this.skipListUpdate = true;

    if (this.urlIsReference) {

      const queryParams = Object.assign({}, this.queryParams);

      this.router.navigate(
        ['/' + this.translation.activeLocale, 'reference', listing.ref],
        {queryParams});

    } else {

      const queryParams = Object.assign({}, this.queryParams, {
        ref: listing.ref,
        sv: SearchMobileView.List,
        sale: this.searchParams.sale
      });

      this.router.navigate([], {queryParams});
    }
  }

  onVideoClick(resource: ListingVideoResource): void {

    if (!this.isMobileView) {

      if (!this.fullScreenCancel) {
        this.fullScreenCancel = onFullscreenChange(() => {
          this.isFullScreen = !this.isFullScreen;
        });
      }

      if (this.isFullScreen) {
        this.listingVideo.exitFullScreen();
      } else {
        this.listingVideo.activateFullScreen();
      }
    }
  }

  onRibbonImageClick(index: number): void {

    const event = gaEvents.tapPhoto;

    this.googleAnalyticsService.sendEvent(event.category, event.action,
      getGaListingLabel(this.listing), event.value);

    this.openPhotosViewer(index);
  }

  onSeePhotosClick(): void {

    const event = gaEvents.showPhotos;

    this.googleAnalyticsService.sendEvent(event.category, event.action,
      getGaListingLabel(this.listing), event.value);

    this.openPhotosViewer();
  }

  openPhotosViewer(index: number = 0): void {

    let subscription: Subscription = null;

    const popupRef = this.popupService.create(PhotosViewerComponent);
    const photosViewer = popupRef.componentInstance;

    photosViewer.images = this.listingImages;
    photosViewer.currentIndex = index;
    photosViewer.totalImages = this.listingImages.length + this.listingImagesRemaining;

    photosViewer.prev.subscribe(ev => {

      if (this.listingImagesRemaining > 0 && ev.index === 0) {

        this.showRemainingImagesPopup();

        return;
      }

      photosViewer.prevSlide();
    });

    photosViewer.next.subscribe(ev => {

      if (this.listingImagesRemaining > 0 && ev.index === this.listingImages.length - 1) {
        this.showRemainingImagesPopup();
        return;
      }

      photosViewer.nextSlide();
    });

    photosViewer.close.subscribe(() => {

      popupRef.close();

      if (subscription) {
        subscription.unsubscribe();
        subscription = null;
      }
    });

    subscription = this.listingImagesUpdated.subscribe(() => {
      photosViewer.images = this.listingImages;
      photosViewer.totalImages = this.listingImages.length + this.listingImagesRemaining;
      photosViewer.refreshCurrent();
    });
  }

  showRemainingImagesPopup(): WeModalRef<AuthLoginComponent> {

    const ref = this.listing ? this.listing.ref : this.ref;

    const modalRef = this.modalService.open(AuthLoginComponent, {showCloseButton: true});

    modalRef.componentInstance.title = this.translation.strings.titlemoreimg;
    modalRef.componentInstance.subTitle = `${this.translation.strings.nbmoreimg} ${this.listingImagesRemaining}`;
    modalRef.componentInstance.origin = LoginOrigin.Slider;
    modalRef.componentInstance.ref = String(ref);

    return modalRef;
  }

  onSimilarClick(listing: Listing): void {

    const event = gaEvents.similarListings;

    this.googleAnalyticsService.sendEvent(event.category, event.action,
      getGaListingLabel(listing), event.value);

    this.activateListing(listing);
  }

  toggleSearchBar(value: boolean): void {

    if (this.isSearchBarVisible === value) {
      return;
    }

    this.isSearchBarVisible = value;

    if (this.isBrowser && this.isMobileView) {
      document.body.style.overflowY = value ? 'hidden' : null;
    }
  }

  onButtonShowDescriptionClick(): void {

    const event = gaEvents.showDescription;

    this.googleAnalyticsService.sendEvent(event.category, event.action,
      this.listing ? getGaListingLabel(this.listing) : '', event.value);

    this.switchListMap();
  }

  onRibbonButtonShowLocationClick(): void {

    const event = gaEvents.showMap;

    this.googleAnalyticsService.sendEvent(event.category, event.action,
      getGaListingLabel(this.listing), event.value);

    this.switchListMap();
  }

  onMobileTopMenuSwitchView(): void {

    const event = this.mobileView === 'map' ? gaEvents.mobileTopMenuDetails : gaEvents.mobileTopMenuShowMap;

    this.googleAnalyticsService.sendEvent(event.category, event.action,
      this.listing ? getGaListingLabel(this.listing) : '', event.value);

    this.switchListMap();
  }

  switchListMap(): void {

    const view = this.mobileView === SearchMobileView.List ? SearchMobileView.Map : SearchMobileView.List;
    const queryParams = Object.assign({}, this.queryParams, {sv: view});

    this.router.navigate([], {queryParams: queryParams});
  }

  fixMapSize(body: HTMLElement): void {

    if (!this.fixedContainer) {
      return;
    }

    const el = <HTMLElement>this.fixedContainer.nativeElement;
    const bodyScrollTop = getBodyScrollTop();

    const headerTopOffset = this.isMobileView
      ? this.mobileHeaderHeight
      : this.headerHeight + this.searchBarHeight;

    if (this.isMobileView) {

      let height = body.offsetHeight - headerTopOffset;

      if (this.propertyPopup) {
        height -= this.propertyPopup.nativeElement.offsetHeight;
      }

      el.style.height = `${height}px`;

    } else {

      const top = headerTopOffset - bodyScrollTop;
      const bottomOffset = body.scrollHeight - this._footerHeight - bodyScrollTop - this.bodyHeight;

      let heightOffset = 0;

      if (top > 0) {
        heightOffset += top;
      }

      if (bottomOffset < 0) {
        heightOffset -= bottomOffset;
      }

      el.style.top = `${(top > 0) ? top : 0}px`;
      el.style.height = `calc(100% - ${heightOffset}px)`;
    }

    this.notifyMapResize();
  }

  setMobileHeaderTop(scrollTop: number): void {

    // mobile safari "feature" (bounce effect)
    if (scrollTop < 0) {
      return;
    }

    const el = <HTMLElement>this.mobileHeader.nativeElement;
    const diff = this.bodyScrollTop - scrollTop;
    const isUp = diff > 0;

    let top = el.offsetTop + diff;

    if (top < -this.mobileHeaderHeight) {
      top = -this.mobileHeaderHeight;
    }

    if (top > 0 || scrollTop === 0) {
      top = 0;
    }

    if (top !== this.mobileHeaderTop) {
      el.style.top = `${top}px`;
      this.mobileHeaderTop = top;
    }
  }

  updateSizes(): void {

    this.mobileHeaderHeight = this.mobileHeader
      ? this.mobileHeader.nativeElement.offsetHeight
      : 0;

    this.contentMarginTop = this.isMobileView
      ? (this.mobileHeader ? this.mobileHeaderHeight : 0)
      : 0;

    this._footerHeight = this.footer
      ? this.footer.elementRef.nativeElement.offsetHeight
      : 0;
  }

  static getRibbonImagesCount(bodyWidth: number): number {

    return Math.ceil(bodyWidth / 768);
  }

  @HostListener('window:orientationchange', ['$event'])
  onOrientationChange(ev: any): void {

    if (this.view === 'details' && this.listing && this.listing.videoResources.length) {

      // it is the opposite, because, for some reason, event is triggered before
      // the "window.matchMedia" method will respond correctly
      // "window.matchMedia" is how isLandscape function works

      if (this.isMobileView && !isLandscape()) {
        this.videoService.makeFullScreen(this.listingVideo);
      } else if (this.videoService.isFullscreen()) {
        this.videoService.clearFullScreen();
      }

      this.listingVideo.play();
    }
  }

  @HostListener('window:scroll', ['$event'])
  onScroll(): void {

    const body = getScrollingElement();
    const scrollTop = getBodyScrollTop();

    if (this.isMobileView) {
      this.setMobileHeaderTop(scrollTop);
    }

    if (this.isSearchOrFavorites()) {

      // saving value to restore scroll on search or favorites view
      this.searchBodyScrollTop = scrollTop;
    }

    this.bodyScrollTop = scrollTop;

    if (this.currentPage !== this.totalPages
      && body.scrollHeight - scrollTop - body.offsetHeight < this.bottomOffsetTriggerThreshold) {

      this.currentPage += 1;

      const start = (this.currentPage - 1) * this.limit;

      Array.prototype.push.apply(this.visibleResults, this.results.slice(start, start + this.limit));
    }

    if (this.isSearchOrFavorites() && !this.isMobileView) {
      this.fixMapSize(body);
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event): void {

    this.bodyHeight = event.target.innerHeight;
    this.bodyWidth = event.target.innerWidth;

    this._footerHeight = null;
    this._headerHeight = null;
    this._searchBarHeight = null;

    // give some time to display elements
    requestAnimationFrame(() => this.updateSizes());

    const imagesCount = SearchComponent.getRibbonImagesCount(this.bodyWidth) || 1;

    if (imagesCount > this.ribbonImagesCount) {
      this.ribbonImagesCount = imagesCount;
    }

    this.isMobileView = this.configService.isMobileView(this.bodyWidth);
  }
}
