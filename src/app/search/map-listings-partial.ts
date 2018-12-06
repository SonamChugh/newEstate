import { Injectable } from '@angular/core';

import { MapWrapperComponent } from './map-wrapper.component';
import {
  Listing,
  Polygon,
  PopupService,
  AccommodationTypeValue,
  WeAbsolutePopupRef
} from '../shared';
import { LocationRef } from './location-ref';
import {
  attachBodyClick,
  Cluster,
  getBodySize,
  getOffset,
  Offset
} from '../util';
import { PropertyPopupComponent } from './property-popup.component';
import {
  Observable,
  Subject
} from 'rxjs';


const CLASS_HOVER = 'hover';
const POPUP_WIDTH = 320;
const POPUP_HEIGHT = 120;


export interface MapPopupOptions {
  isMobile?: boolean;
}


@Injectable()
export class MapListingsPartial {

  latestSearchViewBounds: google.maps.LatLngBounds;
  latestSearchViewZoom: number;
  isMobile: boolean;

  getFavoriteStatus: (listing: Listing) => boolean;

  private mapPolygons: google.maps.Polygon[] = [];
  private listingIdToMarkerIndex: { [id: number]: number };
  private locations: LocationRef[] = [];

  private fitBounds: boolean = true;

  private markers: google.maps.Marker[];

  private chosenCluster: Cluster;
  private clusterCircleOver: google.maps.Circle;

  private propertyPopupRef: WeAbsolutePopupRef<PropertyPopupComponent>;

  private _mapWrapper: MapWrapperComponent;

  private _listingActivate: Subject<Listing> = new Subject();
  private _listingFavorite: Subject<Listing> = new Subject();

  get mapWrapper(): MapWrapperComponent {
    return this._mapWrapper;
  }

  set mapWrapper(value: MapWrapperComponent) {
    this._mapWrapper = value;
  }

  get listingActivate(): Observable<Listing> {
    return this._listingActivate.asObservable();
  }

  get listingFavorite(): Observable<Listing> {
    return this._listingFavorite.asObservable();
  }

  constructor(
    private popupService: PopupService
  ) {
  }

  setMarkers(listings: Listing[], defaultCoordinates?: google.maps.LatLngLiteral[]): void {

    this.listingIdToMarkerIndex = {};

    this.locations.splice(0, this.locations.length);

    for (let i = 0, el: Listing; el = listings[i]; ++i) {

      this.listingIdToMarkerIndex[el.id] = i;

      if (el.vlat && el.vlon) {

        this.locations.push({
          lat: el.vlat,
          lng: el.vlon,
          payload: el
        })
      }
    }

    if (this.locations.length) {

      this.markers = this.mapWrapper.updateMarkers(this.locations, {
        fitBounds: this.fitBounds,
        bounds: this.latestSearchViewBounds
      });

    } else if (defaultCoordinates && defaultCoordinates.length) {

      this.markers = this.mapWrapper.updateMarkers(defaultCoordinates, {
        forcedIconText: '0',
        fitBounds: this.fitBounds
      });
    } else {

      this.mapWrapper.updateMarkers([]);
    }
  }

  correctClusterIcon(cluster: Cluster): void {

    const markers = cluster.getMarkers();

    if (markers.length === 1) {

      const index = this.markers.indexOf(markers[0]);
      const locationRef = this.locations[index];

      if (locationRef) {

        const listing = <Listing> locationRef.payload;

        const className = listing.type === AccommodationTypeValue.Villa ? 'fa-home' : 'fa-building';

        cluster.clusterIcon.addClass('fa');
        cluster.clusterIcon.addClass(className);
        cluster.clusterIcon.setText('');
      }
    }
  }

  setPolygons(polygons: Polygon[]): void {

    this.mapPolygons.forEach((el) => el.setMap(null));

    for (const polygon of polygons) {

      this.mapPolygons.push(
        this.mapWrapper.drawPolygon(polygon.coordinates)
      );
    }
  }

  addClassOnHover(listingId: number): void {

    if (!this.listingIdToMarkerIndex) {
      return;
    }

    if (this.mapWrapper) {

      const index = this.listingIdToMarkerIndex[listingId] || -1;

      if (index > -1) {
        this.mapWrapper.setMarkerClassList(index, [CLASS_HOVER]);
      }
    }
  }

  removeClassOnHover(listingId: number): void {

    if (!this.listingIdToMarkerIndex) {
      return;
    }

    if (this.mapWrapper) {

      const index = this.listingIdToMarkerIndex[listingId] || -1;

      if (index > -1) {
        this.mapWrapper.removeMarkerClassList(index, [CLASS_HOVER]);
      }
    }
  }

  filterCurrentListingByBounds(bounds: google.maps.LatLngBounds): Listing[] {

    const result: Listing[] = [];

    for (const location of this.locations) {

      const listing = <Listing>location.payload;

      if (bounds.contains(location)) {
        result.push(listing);
      }
    }

    return result;
  }

  handleClusterClick(cluster: Cluster): void {

    if (this.chosenCluster && this.chosenCluster !== cluster && this.propertyPopupRef) {
      this.propertyPopupRef.close();
    }

    const markersLength = cluster.markers.length;
    const clusterIcon = cluster.clusterIcon;
    const markers = cluster.getMarkers();

    if (markersLength === 1) {

      const index = this.markers.indexOf(markers[0]);
      const listing = <Listing> this.locations[index].payload;

      // it was tapped once (mobile logic)
      if (this.chosenCluster) {

        this.propertyPopupRef.close();

        this._listingActivate.next(listing);

      } else {

        this.propertyPopupRef = this.showPropertyPopup(listing, cluster);

        clusterIcon.el.classList.add('hover');

        this.chosenCluster = cluster;
      }

    } else {

      this.mapWrapper.fitToBounds(cluster.getBounds());
    }
  }

  handleClusterOver(cluster: Cluster, isOver: boolean): void {

    const bounds = cluster.getBounds();
    const markersLength = cluster.markers.length;
    const clusterIcon = cluster.clusterIcon;
    const defaultRadius = 1000;

    let chosenListing;

    for (const location of this.locations) {

      if (bounds.contains(location)) {

        const listing = <Listing>location.payload;

        if (markersLength === 1) {
          chosenListing = listing;
        }
      }
    }

    if (this.clusterCircleOver) {
      this.clusterCircleOver.setMap(null);
    }

    if (this.propertyPopupRef) {
      this.propertyPopupRef.close();
    }

    if (isOver) {

      let radius = chosenListing ? chosenListing.pointplace : defaultRadius;
      this.clusterCircleOver = this.mapWrapper.drawCircle(cluster.getCenter(), radius || defaultRadius);

      if (chosenListing) {

        clusterIcon.el.classList.add('hover');

        this.propertyPopupRef = this.showPropertyPopup(chosenListing, cluster);
        this.chosenCluster = cluster;
      }
    }
  }

  showPropertyPopup(listing: Listing, cluster: Cluster): WeAbsolutePopupRef<PropertyPopupComponent> {

    const mapWrapperEl = <HTMLElement>this.mapWrapper.elementRef.nativeElement;
    const offset = MapListingsPartial.calculatePopupOffset(mapWrapperEl, cluster.clusterIcon.el);
    const propertyPopupRef = this.popupService.create(PropertyPopupComponent);
    const instance = propertyPopupRef.componentInstance;

    propertyPopupRef.setPosition(offset.left, offset.top);

    const subscription = propertyPopupRef
      .onClose()
      .subscribe(() => {

        this.propertyPopupRef = null;

        if (this.chosenCluster) {
          this.chosenCluster.clusterIcon.el.classList.remove('hover');
          this.chosenCluster = null;
        }

        subscription.unsubscribe();
      });

    const hostEl = instance.elementRef.nativeElement;

    hostEl.classList.add('scaled');
    requestAnimationFrame(() => hostEl.classList.remove('scaled'));

    attachBodyClick([
      instance.elementRef.nativeElement,
      cluster.clusterIcon.el
    ], () => propertyPopupRef.close());

    instance.listing = listing;
    instance.isFavorite = this.isFavorite(listing);
    instance.isMobile = this.isMobile;

    instance.onFavoriteClick.subscribe(() => {
      this._listingFavorite.next(listing);

      instance.isFavorite = this.isFavorite(listing);
    });

    instance.onListingActivate.subscribe(() => {
      propertyPopupRef.close();
      this._listingActivate.next(listing);
    });

    return propertyPopupRef;
  }

  private isFavorite(listing: Listing): boolean {
    return this.getFavoriteStatus && this.getFavoriteStatus(listing);
  }

  private static calculatePopupOffset(mapWrapperEl: HTMLElement, clusterIconEl: HTMLElement): Offset {

    const bodySize = getBodySize();
    const iconOffset = getOffset(clusterIconEl);
    const iconWidth = clusterIconEl.offsetWidth;
    const iconHeight = clusterIconEl.offsetHeight;
    const mapOffset = getOffset(mapWrapperEl);

    // available sizes relatively the cluster icon
    const leftWidth = iconOffset.left - mapOffset.left - iconWidth / 2;
    const rightWidth = bodySize.width - iconOffset.left - iconWidth / 2;
    const topHeight = iconOffset.top - mapOffset.top - iconWidth / 2;

    const correctionPadding = 10;

    let correctionOffsetLeft = POPUP_WIDTH / 2 - leftWidth;

    if (correctionOffsetLeft < 0) {
      correctionOffsetLeft = 0;
    } else if (correctionOffsetLeft > 0) {
      correctionOffsetLeft -= correctionPadding;
    }

    let correctionOffsetRight = POPUP_WIDTH / 2 - rightWidth;

    if (correctionOffsetRight < 0) {
      correctionOffsetRight = 0;
    } else if (correctionOffsetRight > 0) {
      correctionOffsetRight += correctionPadding;
    }

    const offsetLeft = iconOffset.left - POPUP_WIDTH / 2 + correctionOffsetLeft - correctionOffsetRight;
    const offsetTop = topHeight > POPUP_HEIGHT
      ? iconOffset.top - POPUP_HEIGHT : iconOffset.top + iconHeight + correctionPadding;

    return {
      top: offsetTop,
      left: bodySize.width <= POPUP_WIDTH ? 0 : offsetLeft,
    }
  }
}
