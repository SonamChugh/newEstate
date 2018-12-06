import {
  Component,
  Output,
  EventEmitter,
  ElementRef,
  Inject
} from '@angular/core';
import {
  Observable,
  Subject
} from 'rxjs';

import { LocationRef } from './location-ref';
import {
  MarkerCluster,
  Cluster,
  loadScript
} from '../util';
import {
  ConfigService,
  IS_BROWSER
} from '../shared';


export declare type ClusterCalculator = (markers: google.maps.Marker[], numStyles: number) => { index: number, text: string };


export interface MarkerOptions {
  forcedIconText?: string;
  fitBounds?: boolean;
  bounds?: google.maps.LatLngBounds
}


@Component({
  selector: 'map-wrapper',
  template: `
    <div style="min-height: 100%;"></div>`,
})
export class MapWrapperComponent {

  @Output()
  onMapInit(): Observable<any> {
    return this._onMapInit.asObservable();
  }

  onZoomChanged(): Observable<number> {
    return this._onZoomChanged.asObservable();
  }

  private _onMapInit: EventEmitter<any> = new EventEmitter();

  map: google.maps.Map;
  private markerCluster: MarkerCluster;

  dragEnd: EventEmitter<google.maps.LatLngBounds> = new EventEmitter();
  boundsChanged: EventEmitter<google.maps.LatLngBounds> = new EventEmitter();
  clusterClick: EventEmitter<Cluster> = new EventEmitter();
  clusterOver: EventEmitter<Cluster> = new EventEmitter();
  clusterOut: EventEmitter<Cluster> = new EventEmitter();
  clusterDraw: EventEmitter<Cluster> = new EventEmitter();
  private _onZoomChanged: Subject<number> = new Subject();

  zoom: number = 7;
  sampleLocation: LocationRef = {lat: 44.6528, lng: 7.010};

  center: google.maps.LatLng;

  mapInitialized: boolean = false;

  private markers: google.maps.Marker[] = [];

  private originalCalculator: ClusterCalculator;

  constructor(public elementRef: ElementRef,
              public config: ConfigService,
              @Inject(IS_BROWSER) public isBrowser: boolean) {

    this.init();
  }

  init() {

    if (this.isBrowser) {
      this.initMap();
    }
  }

  initMap() {

    const url = `https://maps.googleapis.com/maps/api/js?key=${this.config.googleMapApiKey}`;

    loadScript(url)
      .then(() => {

        this.map = new google.maps.Map(this.elementRef.nativeElement.firstElementChild, {
          zoom: this.zoom,
          scrollwheel: true,
          gestureHandling: 'greedy',
        } as any);

        this.mapInitialized = true;
        this.markerCluster = this.createMarkerCluster();
        this.originalCalculator = this.markerCluster.getCalculator();

        this.bindEvents();

        this._onMapInit.emit({map: this.map});
      });
  }

  static getBounds(markers: google.maps.Marker[]): google.maps.LatLngBounds {

    const bounds = new google.maps.LatLngBounds();

    for (let i = 0, marker; marker = markers[i]; ++i) {
      bounds.extend(marker.getPosition());
    }
    return bounds;
  };

  getZoom(): number {
    return this.map.getZoom();
  }

  setZoom(value: number) {
    this.map.setZoom(value);
  }

  fitToBounds(bounds: google.maps.LatLngBounds): void {

    this.center = bounds.getCenter();

    this.map.setCenter(this.center);

    if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
      this.map.setZoom(15);
    } else {
      this.map.fitBounds(bounds);
    }
  }

  setCenter(location: LocationRef): void {
    this.center = new google.maps.LatLng(location.lat, location.lng);
    this.map.setCenter(this.center);
  }

  updateMarkers(
    locations: LocationRef[] | google.maps.LatLngLiteral[],
    options: MarkerOptions = {}): google.maps.Marker[] {

    if (this.markerCluster) {
      this.markerCluster.clearMarkers();
    }

    return this.processLocations(locations, options);
  }

  createMarker(latlng: LocationRef | google.maps.LatLngLiteral): google.maps.Marker {

    return new google.maps.Marker({
      position: latlng,
      label: '',
    });
  }

  createMarkers(locations: (LocationRef | google.maps.LatLngLiteral)[]): google.maps.Marker[] {
    return locations.map(location => this.createMarker(location));
  }

  protected processLocations(
    locations: LocationRef[] | google.maps.LatLngLiteral[],
    options: MarkerOptions = {}): google.maps.Marker[] {

    this.markers = this.createMarkers(locations);

    if (options && options.forcedIconText) {

      this.markerCluster.setCalculator((markers: google.maps.Marker[], numStyles: number) => {

        const results = this.originalCalculator(markers, numStyles);

        return {
          index: results.index,
          text: options.forcedIconText,
        };
      });

      this.markerCluster.addMarkers(this.markers, false);

    } else {

      this.markerCluster.setCalculator(this.originalCalculator);
      this.markerCluster.addMarkers(this.markers, false);
    }

    if (options.fitBounds) {

      if (options.bounds) {
        this.fitToBounds(options.bounds);
      } else {
        const bounds = MapWrapperComponent.getBounds(this.markers);
        this.fitToBounds(bounds);
      }
    }

    return this.markers;
  }

  protected bindEvents(): void {

    this.map.addListener('bounds_changed',
      () => this.boundsChanged.emit(this.map.getBounds()));

    this.map.addListener('dragend',
      () => this.dragEnd.emit(this.map.getBounds()));

    this.map.addListener('zoom_changed', () => {

      const zoom = this.map.getZoom();

      this._onZoomChanged.next(zoom);

      if (this.markerCluster) {

        if (zoom < 12) {
          this.markerCluster.setGridSize(20);
        } else {
          this.markerCluster.setGridSize(1);
        }
      }
    });

    google.maps.event.addListener(this.markerCluster, 'clusterclick',
      (cluster: Cluster) => this.clusterClick.emit(cluster));

    google.maps.event.addListener(this.markerCluster, 'clustermouseover',
      (cluster: Cluster) => this.clusterOver.emit(cluster));

    google.maps.event.addListener(this.markerCluster, 'clustermouseout',
      (cluster: Cluster) => this.clusterOut.emit(cluster));

    this.markerCluster.onClusterDraw()
      .subscribe((cluster: Cluster) => this.clusterDraw.emit(cluster));
  }

  protected createMarkerCluster(): MarkerCluster {

    return new MarkerCluster(this.map, [],
      {
        gridSize: 1,
        minimumClusterSize: 1,
        classNames: ['circle-stroke-animated'],
        zoomOnClick: false,
        styles: [
          {
            height: 35,
            width: 35,
            textColor: '#4a4646',
            textSize: 17,
          }
        ]
      });
  }

  protected findCluster(marker: google.maps.Marker): Cluster {

    if (this.markerCluster) {

      for (let cluster of this.markerCluster.clusters) {

        const markers = cluster.getMarkers();

        for (let m of markers) {

          if (m === marker) {
            return cluster;
          }
        }
      }
    }

    return null;
  }

  drawCircle(center: google.maps.LatLng, radius: number): google.maps.Circle {

    return new google.maps.Circle({
      map: this.map,
      center: center,
      radius: radius,
      fillColor: 'skyblue',
      fillOpacity: 0.5,
      strokeWeight: 0,
    });
  }

  drawPolygon(coords: { lat: number, lng: number }[]): google.maps.Polygon {

    const polygon = new google.maps.Polygon({
      paths: coords,
      strokeColor: '#229cff',
      strokeOpacity: 0.5,
      strokeWeight: 2,
      fillColor: '#229cff',
      fillOpacity: 0.05
    });

    polygon.setMap(this.map);

    return polygon;
  }

  setMarkerClassList(index: number, classNames: string[]): void {

    const marker = this.markers[index];
    const cluster = this.findCluster(marker);

    if (cluster && cluster.clusterIcon.el) {
      for (const className of classNames) {
        cluster.clusterIcon.el.classList.add(className);
      }
    }

  }

  removeMarkerClassList(index: number, classNames: string[]): void {

    const marker = this.markers[index];
    const cluster = this.findCluster(marker);

    if (cluster && cluster.clusterIcon.el) {
      for (const className of classNames) {
        cluster.clusterIcon.el.classList.remove(className);
      }
    }
  }

  toggleClustersAnimation(): void {

    const className = 'hover';

    for (const cluster of this.markerCluster.clusters) {

      const iconEl = cluster.clusterIcon.el;

      if (iconEl) {

        iconEl.classList.add(className);

        const onTransitionEnd = (e: TransitionEvent) => {

          if (e.propertyName === 'transform') {
            iconEl.classList.remove(className);
            iconEl.removeEventListener('transitionend', onTransitionEnd, false);
          }
        };

        iconEl.addEventListener('transitionend', onTransitionEnd, false);
      }
    }
  }

  triggerResize(): void {

    if (!this.map) {
      throw new Error('map is not initialized yet');
    }

    // const center = this.map.getCenter();
    google.maps.event.trigger(this.map, 'resize');
    // this.map.setCenter(center);
  }
}
