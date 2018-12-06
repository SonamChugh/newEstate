import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Inject,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { Location } from '@angular/common';
import {
  ActivatedRoute,
  Params,
  Router
} from '@angular/router';
import {
  combineLatest,
  forkJoin,
  Observable,
  of,
  Subject,
  Subscription
} from 'rxjs';
import {
  debounceTime,
  map,
  switchMap,
  tap
} from 'rxjs/operators';

import {
  DEVICE_FORM_FACTOR,
  DeviceFormFactor,
  gaEvents,
  getGaListingLabel,
  getGaPageByRoute,
  GoogleAnalyticsService,
  IS_BROWSER,
  Listing,
  ModalService,
  PrincipalService,
  SaleRent,
  SearchService,
  SortValue,
  TranslationService,
  VipStatus,
  VipStatusInfo
} from '../shared';
import {
  ClientRequest,
  ClientService,
  FeedbackValue,
} from '../client';
import { FavoritePartial } from './favorite-partial.service';
import {
  clearObject,
  Cluster,
  findObjectById,
  getScrollingElement,
  getBodyScrollTop,
  getBodySize,
  handleSetChange,
} from '../util';
import { MapWrapperComponent } from './map-wrapper.component';
import { MapListingsPartial } from './map-listings-partial';
import { ClientRequestEditFormComponent } from './client-request-edit-form.component';
import { VerifyEmailComponent } from './verify-email.component';
import { FooterComponent } from './footer.component';
import { HeaderComponent } from './header.component';
import { SearchMobileView } from './search-mobile-view';
import { WhiteOption } from '../component/white-option';
import { DetailsCameFrom } from './details-came-from';
import { VipFinishRegistrationComponent } from './vip-finish-registration.component';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'vip-page',
  templateUrl: 'vip.component.html',
  styleUrls: ['vip.component.scss'],
  providers: [
    FavoritePartial,
    MapListingsPartial,
  ]
})
export class VipComponent implements OnInit, AfterViewInit, OnDestroy {
  requests: ClientRequest[];
  listings: Listing[];
  listingsFiltered: Listing[];

  isMobileView: boolean;

  mapUpdating: boolean;

  activeRequest: ClientRequest;

  requestId: number;

  queryParams: Params;

  isMapEventsInitialized: boolean;

  @ViewChild(MapWrapperComponent) mapWrapper: MapWrapperComponent;

  listingsSelected = new Set<number>();
  error: string;

  vipStatus: VipStatus;
  VipStatus = VipStatus;

  requestVipListingsCount: number;
  topMessage: string;

  SaleRent = SaleRent;

  isVerification: boolean;

  mobileView: SearchMobileView = SearchMobileView.List;
  SearchMobileView = SearchMobileView;

  private mapResize = new Subject();

  private subscriptions: Subscription[] = [];

  private bodyWidth: number;
  private bodyHeight: number;
  private bodyScrollTop: number;

  private headerHeight: number;
  private footerHeight: number;

  private mobileMapHeaderHeight: number;

  private feedbackButtonsDisabled = new Set<number>();
  private listingFeedbackValue: { [listingId: number]: FeedbackValue } = {};

  FeedbackValue = FeedbackValue;

  categoryToCount: { [value: number]: number } = {};

  sort: any = SortValue.LastModifiedFirst;
  category: string;

  categoryOptions: WhiteOption[];

  categoryOptionValueToFeedbackValue: { [value: string]: number } = {};
  categoryFeedbackValueToOptionValue: { [value: number]: string } = {};

  loading: boolean;

  get sortOptions(): WhiteOption[] {
    return this.searchService.sortOptions;
  }

  @ViewChild('fixedContainer') private fixedContainer: ElementRef;
  @ViewChild('mobileMapHeader') private mobileMapHeader: ElementRef;
  @ViewChild(FooterComponent, {read: ElementRef}) private footer: ElementRef;
  @ViewChild(HeaderComponent, {read: ElementRef}) private header: ElementRef;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private zone: NgZone,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private location: Location,
    private principalService: PrincipalService,
    private searchService: SearchService,
    private clientService: ClientService,
    public favoritePartial: FavoritePartial,
    public translation: TranslationService,
    private googleAnalyticsService: GoogleAnalyticsService,
    @Inject(DEVICE_FORM_FACTOR) private deviceFormFactor: DeviceFormFactor,
    @Inject(IS_BROWSER) public isBrowser: boolean,
    private mapListingsPartial: MapListingsPartial,
    private modalService: ModalService
  ) {

    this.categoryOptions = this.makeCategoryOptions();

    for (let option of this.categoryOptions) {
      this.categoryOptionValueToFeedbackValue[option.value] = option.payload;
      this.categoryFeedbackValueToOptionValue[option.payload] = option.value as string;
    }
  }

  ngOnInit(): void {

    this.init();
  }

  ngAfterViewInit(): void {

    if (this.isBrowser) {
      this.updateSizes();
    }
  }

  ngOnDestroy(): void {

    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  init(): void {

    this.isMobileView = this.deviceFormFactor === 'mobile' || this.deviceFormFactor === 'tablet';

    if (this.isBrowser) {

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
          this.onFavoriteClicked(listing);
        });
    }

    combineLatest(
      this.activatedRoute.url,
      this.activatedRoute.queryParams
    )
      .pipe(
        switchMap(results => {

          this.loading = true;

          const [segments, params] = results;

          this.feedbackButtonsDisabled.clear();

          this.queryParams = params;
          this.isVerification = params.verify === '1';
          this.sort = params.sort || SortValue.LastModifiedFirst;
          this.mobileView = params.sv === SearchMobileView.Map ? SearchMobileView.Map : SearchMobileView.List;

          this.category = params.category || null;

          if (!this.category && params.ncu !== '1') {
            // if user didn't change categories manually we set a default value
            this.category = this.categoryOptions[0].value as string;
          }

          this.requestId = params.request_id ? +params.request_id : null;

          return forkJoin(
            this.updateMessage(),
            this.updateRequests()
          );
        }),
        switchMap(() => {

          this.activeRequest = this.requestId ? findObjectById(this.requestId, this.requests) : null;

          return this.updateListings();
        }),
        switchMap(() => this.filterAndSetListings()),
      )
      .subscribe(() => {

        if (this.requests && this.requests.length && !this.activeRequest) {
          this.onRequestChanged(this.requests[0].id);
          return;
        }

        this.error = '';

        if (this.isBrowser) {

          this.updateSizes();

          // when all requests are cached, all code are executed in a single tick,
          // so header elements are not in DOM yet,
          // so, we add some delay to ensure html in DOM
          requestAnimationFrame(() => this.updateMap(true));

          if (this.isVerification) {

            const dialogRef = this.modalService.open(VerifyEmailComponent, {
              showCloseButton: true,
              width: this.isMobileView ? `100vw` : '400px',
              height: this.isMobileView ? `100vh` : '500px',
              maxWidth: `100vw`,
              maxHeight: `100vh`,
            });

            dialogRef.onClose()
              .subscribe(() => {

                const params = Object.assign({}, this.queryParams);
                delete params['verify'];
                delete params['token'];

                this.router.navigate(['/', this.translation.activeLocale, 'vip'], {
                  queryParams: params,
                })
              });
          }

          if (!this.requests.length) {

            this.openFinishingDialog();
          }

          this.loading = false;
        }

        this.changeDetectorRef.markForCheck();
      }, err => {
        this.error = err.message;
        this.changeDetectorRef.markForCheck();
      });

    this.subscriptions.push(
      this.translation
        .changed
        .subscribe(() => {

          this.categoryOptions = this.makeCategoryOptions();

          this.router.navigate(['/', this.translation.activeLocale, 'vip'], {
            queryParams: this.queryParams
          });
        })
    );

    this.subscriptions.push(
      this.principalService.principalUpdated()
        .subscribe(() => {
          // it can be only logging out (see vip-guard.service)
          this.router.navigate(['/' + this.translation.activeLocale]);
        })
    );

    this.mapResize
      .pipe(
        debounceTime(250)
      )
      .subscribe(() => {

        if (this.mapWrapper && this.mapWrapper.map) {
          this.mapWrapper.triggerResize();
        }
      });
  }

  updateMessage(): Observable<VipStatusInfo> {

    if (!this.principalService.isAuthenticated) {
      return of({message: '', status: null});
    }

    return this.clientService.getVipInfo(this.requestId)
      .pipe(
        tap(({status, provided_request_vip_count, message}) => {

          this.requestVipListingsCount = provided_request_vip_count;
          this.vipStatus = status;

          const lastClosedMessage = this.clientService.getVipLastClosedTopMessage();

          if (lastClosedMessage !== message) {

            this.topMessage = message;

            if (lastClosedMessage) {

              this.clientService.clearVipLastClosedMessage();
            }
          }
        })
      );
  }

  updateData(): Observable<void> {

    return forkJoin(
      this.updateMessage(),
      this.updateRequests()
    ).pipe(
      switchMap(() => {

        this.activeRequest = this.requestId ? findObjectById(this.requestId, this.requests) : null;

        return this.updateListings();
      }),
      switchMap(() => this.filterAndSetListings()),
      map(() => {
        this.updateSizes();
        this.updateMap(true);
      })
    )
  }

  listingCategoryPredicate(object: Listing): boolean {

    if (!this.category) {
      return true;
    }

    const feedbackValue = this.getFeedbackValue(object.id);
    const optionValue = this.categoryFeedbackValueToOptionValue[feedbackValue];

    return this.category === optionValue;
  }

  filterListings(): Observable<Listing[]> {

    const predicates: ((object: Listing) => boolean)[] = [
      obj => this.listingCategoryPredicate(obj)
    ];

    return of(
      this.listings.filter(listing =>
        predicates.every(p => p(listing)))
    );
  }

  filterAndSetListings(): Observable<Listing[]> {

    return this.filterListings()
      .pipe(
        tap(listings => {
          this.listingsFiltered = listings;
        })
      )
  }

  onRequestChanged(requestId: number): void {

    this.router.navigate([], {
      queryParams: Object.assign({}, this.queryParams, {request_id: requestId})
    }).then();
  }

  updateRequests(): Observable<ClientRequest[]> {

    if (!this.principalService.isAuthenticated) {
      this.requests = [];
      return of([]);
    }

    return this.clientService.getClientRequests()
      .pipe(
        map(collection => {
          this.requests = collection.items;
          return collection.items;
        })
      );
  }

  updateListings(): Observable<Listing[]> {

    if (!this.activeRequest) {
      this.listings = [];
      clearObject(this.categoryToCount);
      clearObject(this.listingFeedbackValue);
      return of([]);
    }

    return this.clientService
      .getClientRequestListings(this.activeRequest.id, this.sort)
      .pipe(
        tap(result => {

          this.listings = result.items;

          clearObject(this.categoryToCount);

          for (let [value, count] of result.feedbackGroupByValue) {
            this.categoryToCount[value] = count;
          }

          clearObject(this.listingFeedbackValue);

          for (let el of result.feedback) {
            this.listingFeedbackValue[el.listingId] = el.value;
          }
        }),
        map(collection => {
          return collection.items;
        })
      );
  }

  onFavoriteClicked(listing: Listing): void {

    const event = gaEvents.addFavorites;
    const page = getGaPageByRoute(this.router.url);

    this.googleAnalyticsService.sendEvent(event.category, event.action,
      `${page} - ${getGaListingLabel(listing)}`, event.value);

    this.favoritePartial.toggleFavorite(listing);
  }

  getCategoryCount(value: string): number {

    const feedbackValue = this.categoryOptionValueToFeedbackValue[value];

    if (feedbackValue === null) {

      return this.listings
        ? this.listings.filter(listing => this.getFeedbackValue(listing.id) === null).length
        : 0;
    }

    return this.categoryToCount[feedbackValue] || 0;
  }

  onFilterClicked(value: string): void {

    this.category = value;

    this.updateUrl(Object.assign({}, this.queryParams, {
      category: this.category || null,
      ncu: 1
    }));
  }

  onSortClicked(sort: SortValue): void {

    this.updateUrl(Object.assign({}, this.queryParams, {sort: sort}));
  }

  updateMap(animateClusters: boolean = true): void {

    if (!this.mapWrapper) {
      return;
    }

    if (!this.mapWrapper.mapInitialized) {

      this.mapWrapper
        .onMapInit()
        .subscribe(() =>
          this.updateMap(animateClusters));
      return;
    }

    if (!this.mapListingsPartial.mapWrapper) {
      this.mapListingsPartial.mapWrapper = this.mapWrapper;
    }

    this.checkAndInitializeMapEvents();

    this.fixMapSize(getScrollingElement());

    this.mapWrapper.triggerResize();

    // const checkedCities = Array.from(this.searchParams.cityValues);
    // const citiesIterate = checkedCities.length ? checkedCities : Object.keys(this.cityIdDict).map(el => +el);
    // const cities = citiesIterate.map(id => this.cityIdDict[id]) as City[];

    // when there are no results we just display checked cities coordinates with "zero" cluster icon
    // const defaultCoordinates = cities.map(city => {
    //   return {lat: city.lat, lng: city.lon};
    // });

    // this.mapListingsPartial.setPolygons(
    //   flatten(cities.map(city => city.polygons)));

    this.mapListingsPartial.setMarkers(this.listings);

    // if (this.mapListingsPartial.latestSearchViewZoom) {
    //   this.mapWrapper.setZoom(this.mapListingsPartial.latestSearchViewZoom);
    // }

    // a little of animation
    if (animateClusters) {
      setTimeout(() => this.mapWrapper && this.mapWrapper.toggleClustersAnimation(), 700)
    }
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

          // this.mapListingsPartial.latestSearchViewBounds = bounds;
          // this.mapListingsPartial.latestSearchViewZoom = this.mapWrapper.getZoom();
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

  handleDragEnd(bounds: google.maps.LatLngBounds): void {

    // clearObject(this.listingSelected);
    //
    // this.results = this.mapListingsPartial
    //   .filterCurrentListingByBounds(bounds);
    //
    // this.setPageAndUpdate(1);
  }

  handleMapClusterOver(cluster: Cluster, isOver: boolean): void {

    this.mapListingsPartial.handleClusterOver(cluster, isOver);

    this.listingsSelected.clear();

    if (isOver) {

      const listings = this.mapListingsPartial
        .filterCurrentListingByBounds(cluster.getBounds());

      for (let listing of listings) {
        this.listingsSelected.add(listing.id);
      }
    }
  }

  handleMapClusterClick(cluster: Cluster): void {

    this.mapListingsPartial.handleClusterClick(cluster);
  }

  onClusterDraw(cluster: Cluster): void {

    this.mapListingsPartial.correctClusterIcon(cluster);
  }

  onMobileTopMenuSwitchView(): void {

    // const event = this.mobileView === 'map' ? gaEvents.mobileTopMenuDetails : gaEvents.mobileTopMenuShowMap;
    // this.googleAnalyticsService.sendEvent(event.category, event.action, '', event.value);

    this.switchListMap();
  }

  switchListMap(): void {

    const view = this.mobileView === SearchMobileView.List ? SearchMobileView.Map : SearchMobileView.List;
    const queryParams = Object.assign({}, this.queryParams, {sv: view});

    this.updateUrl(queryParams);
  }

  updateUrl(params: Params): void {

    this.router.navigate([], {
      queryParams: params
    });
  }

  openFinishingDialog(): void {

    const dialogRef = this.modalService.open(VipFinishRegistrationComponent, {
      showCloseButton: true,
      width: this.isMobileView ? `${this.bodyWidth}px` : '600px',
      height: this.isMobileView ? `100vh` : null,
      maxHeight: `100vh`,
    });
    const comp = dialogRef.componentInstance;

    comp.request = ClientRequest.init();

    comp.save
      .subscribe(({clientName, clientPhone, request}) => {

        if (!clientName || !clientPhone || this.clientService.validateClientRequest(request).length) {

          comp.error = this.translation.translate('vip_form_request_required_fields_error',
            'Please, fill in all required fields');
          return;
        }

        comp.buttonSaveDisabled = true;

        this.clientService
          .saveInitialClientRequest(clientName, clientPhone, request)
          .subscribe(() => {
            dialogRef.close();
            this.onRequestChanged(request.id);
          }, err => {
            comp.error = err.message;
            comp.buttonSaveDisabled = false;
            comp.update();
          });

      });

    dialogRef.onClose()
      .subscribe(() => {

        const params = Object.assign({}, this.queryParams);
        delete params['finish'];

        this.router.navigate(['/', this.translation.activeLocale, 'vip'], {
          queryParams: params,
        })
      });
  }

  openEditDialog(object: ClientRequest, titleText: string, buttonSaveText: string): void {

    const dialogRef = this.modalService.open(ClientRequestEditFormComponent, {
      showCloseButton: true,
      width: this.isMobileView ? `100vw` : '610px',
      height: this.isMobileView ? `100vh` : null,
      maxHeight: `100vh`,
    });

    const comp = dialogRef.componentInstance;

    comp.object = object;
    comp.buttonSaveText = buttonSaveText;
    comp.titleText = titleText;

    comp.onChange
      .subscribe(() => {
        comp.error = '';
        comp.update();
      });

    comp.onSave
      .subscribe(({object, source}) => {

        source.buttonSaveDisabled = true;

        this.changeDetectorRef.markForCheck();

        this.clientService.saveClientRequest(object)
          .pipe(
            switchMap(() => this.updateRequests())
          )
          .subscribe(() => {

            source.buttonSaveDisabled = false;
            dialogRef.close();

            this.changeDetectorRef.markForCheck();

            if (this.activeRequest && this.activeRequest.id === object.id) {
              this.updateData().subscribe(() => this.changeDetectorRef.markForCheck());
            } else {
              this.onRequestChanged(object.id);
            }

          }, (err) => {

            comp.buttonSaveDisabled = false;
            comp.error = err.message;
            comp.update();
            this.changeDetectorRef.markForCheck();
          });

      });
  }

  editRequest(): void {

    if (!this.activeRequest) {
      return;
    }

    this.openEditDialog(
      this.activeRequest.clone(),
      this.translation.translate('vip_request_edit_title', 'Modify your research'),
      this.translation.translate('vip_request_edit_button_save', 'Save changes')
    );
  }

  createRequest(): void {

    if (!this.requests.length) {

      this.openFinishingDialog();

    } else {

      this.openEditDialog(
        ClientRequest.init(),
        this.translation.translate('vip_request_add_title', 'Add new research'),
        this.translation.translate('vip_request_add_button_save', 'Save new request')
      );
    }
  }

  fixMapSize(body: HTMLElement): void {

    if (!this.fixedContainer) {
      return;
    }

    const el = <HTMLElement>this.fixedContainer.nativeElement;
    const bodyScrollTop = getBodyScrollTop();

    const headerTopOffset = this.headerHeight || this.mobileMapHeaderHeight;

    if (this.isMobileView) {

      el.style.height = `${body.offsetHeight - headerTopOffset}px`;

    } else {

      const top = headerTopOffset - bodyScrollTop;
      const bottomOffset = body.scrollHeight - this.footerHeight - bodyScrollTop - this.bodyHeight;

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

    this.mapResize.next();
  }

  activateListing(listing: Listing): void {

    if (!this.requests.length) {
      this.openFinishingDialog();
      return;
    }

    this.router.navigate(['/' + this.translation.activeLocale, 'reference', listing.ref], {
      queryParams: {
        sale: this.activeRequest.sale,
        return_url: this.location.path(),
        from: DetailsCameFrom.Vip
      }
    });
  }

  isFeedbackButtonsDisabled(listingId: number): boolean {
    return this.feedbackButtonsDisabled.has(listingId);
  }

  toggleFeedbackDisabled(listingId: number): void {
    handleSetChange(this.feedbackButtonsDisabled, listingId);
  }

  getFeedbackValue(listingId: number): FeedbackValue | null {
    return this.listingFeedbackValue.hasOwnProperty(listingId)
      ? this.listingFeedbackValue[listingId]
      : null;
  }

  sendFeedback(requestId: number, listingId: number, value: FeedbackValue): void {

    this.toggleFeedbackDisabled(listingId);

    const currentValue = this.getFeedbackValue(listingId);

    if (currentValue === value) {
      value = null;
    }

    this.clientService
      .setListingFeedback(requestId, listingId, value)
      .subscribe(() => {

        this.toggleFeedbackDisabled(listingId);
        this.listingFeedbackValue[listingId] = value;

        if (currentValue !== null) {
          this.categoryToCount[currentValue] -= 1;
        }

        if (value !== null) {
          if (this.categoryToCount.hasOwnProperty(value)) {
            this.categoryToCount[value] += 1;
          } else {
            this.categoryToCount[value] = 1;
          }
        }

        this.changeDetectorRef.markForCheck();
      });
  }

  onTopMessageCloseClick(): void {

    this.clientService.setVipLastClosedTopMessage(this.topMessage);
    this.topMessage = null;
  }

  makeCategoryOptions(): WhiteOption[] {

    return [
      {
        value: 'not_sorted',
        text: this.translation.translate('vip_filter_feedback_option_none', 'New'),
        payload: null,
        meta: {
          className: 'btn-option-none'
        }
      },
      {
        value: 'shortlisted',
        text: this.translation.translate('vip_filter_feedback_option_yes', 'Selected'),
        payload: 1,
        meta: {
          className: 'btn-option-yes'
        }
      },
      {
        value: 'not_sure',
        text: this.translation.translate('vip_filter_feedback_option_maybe', 'Not sure'),
        payload: 0,
        meta: {
          className: 'btn-option-maybe'
        }
      },
      {
        value: 'archived',
        text: this.translation.translate('vip_filter_feedback_option_no', 'Archived'),
        payload: -1,
        meta: {
          className: 'btn-option-no'
        }
      }
    ];
  }

  updateSizes(): void {

    const size = getBodySize();

    this.bodyWidth = size.width;
    this.bodyHeight = size.height;

    this.mobileMapHeaderHeight = this.mobileMapHeader
      ? this.mobileMapHeader.nativeElement.offsetHeight
      : 0;

    this.headerHeight = this.header
      ? this.header.nativeElement.offsetHeight
      : 0;

    this.footerHeight = this.footer
      ? this.footer.nativeElement.offsetHeight
      : 0;
  }

  @HostListener('window:scroll', ['$event'])
  onScroll() {

    const body = getScrollingElement();
    const scrollTop = getBodyScrollTop();

    // saving value to restore scroll on search or favorites view
    this.bodyScrollTop = scrollTop;

    // if (this.currentPage !== this.totalPages
    //   && body.scrollHeight - scrollTop - body.offsetHeight < this.bottomOffsetTriggerThreshold) {
    //
    //   this.currentPage += 1;
    //
    //   const start = (this.currentPage - 1) * this.limit;
    //
    //   Array.prototype.push.apply(this.visibleResults, this.results.slice(start, start + this.limit));
    // }

    if (!this.isMobileView) {
      this.fixMapSize(body);
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {

    this.bodyHeight = event.target.innerHeight;
    this.bodyWidth = event.target.innerWidth;

    // give some time to display elements
    requestAnimationFrame(() => this.updateSizes());
  }
}
