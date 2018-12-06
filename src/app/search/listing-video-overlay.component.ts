import { Component, ElementRef, OnDestroy, OnInit, EventEmitter, Output } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { ListingVideoComponent, VideoOverlay } from './listing-video.component';

import { onFullscreenChange } from '../util/dom';
import Browser from '../util/browser';
import { VideoService } from './video.service';


export type OverlayState = 'visible' | 'invisible';


export const animations = [
  trigger('overlayTopState', [
    state('visible', style({
      transform: `translateY(0)`,
    })),
    state('invisible', style({
      transform: `translateY(-100%)`,
    })),
    transition('visible => invisible', animate('500ms ease')),
    transition('invisible => visible', animate('500ms ease')),
  ]),
  trigger('overlayBottomState', [
    state('visible', style({
      transform: `translateY(0)`,
    })),
    state('invisible', style({
      transform: `translateY(100%)`,
    })),
    transition('visible => invisible', animate('500ms ease')),
    transition('invisible => visible', animate('500ms ease')),
  ])
];


@Component({
  selector: 'listing-video-overlay',
  animations: animations,
  templateUrl: 'listing-video-overlay.component.html',
  styleUrls: ['listing-video-overlay.component.scss'],
})
export class ListingVideoOverlayComponent implements VideoOverlay, OnInit, OnDestroy {

  @Output() onBackClick: EventEmitter<any> = new EventEmitter();
  @Output() onFavoriteClick: EventEmitter<any> = new EventEmitter();
  @Output() onNextArrowClick: EventEmitter<any> = new EventEmitter();
  @Output() onPrevArrowClick: EventEmitter<any> = new EventEmitter();

  video: ListingVideoComponent;

  isOverlayVisible: boolean = false;
  overlayState: OverlayState = 'invisible';

  isFavorite: boolean;
  isFullScreen: boolean = false;
  isPaused: boolean = false;

  private onMouseMoveObservable: Subject<any> = new Subject();

  private fullScreenCancel: () => any;

  private subscriptions: Subscription[] = [];

  constructor(public elementRef: ElementRef) {

    this.onMouseMoveObservable
      .asObservable()
      .pipe(
        debounceTime(2000)
      )
      .subscribe(() => {
        this.hideOverlay();
      });

    this.fullScreenCancel = onFullscreenChange(() => {
      this.isFullScreen = !this.isFullScreen;
    });
  }

  ngOnInit(): void {

    // showing overlay for user
    requestAnimationFrame(() => this.onMouseMove());

    this.isPaused = !this.video.autoplay;

    this.subscriptions.push(
      this.video.ended
        .subscribe(() => {
          this.isPaused = true;
        })
    )
  }

  ngOnDestroy(): void {
    this.fullScreenCancel();
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onMouseMove(): void {

    if (!this.isOverlayVisible) {
      this.showOverlay();
    }

    this.onMouseMoveObservable.next(null);
  }

  onTouchEnd(): void {
    this.onMouseMove();
  }

  toggleFullScreen(): void {

    if (this.isFullScreen) {
      this.video.exitFullScreen();
    } else {
      this.video.activateFullScreen();
    }
  }

  showOverlay(): void {
    this.overlayState = 'visible';
    this.isOverlayVisible = true;
  }

  hideOverlay(): void {
    this.overlayState = 'invisible';
    this.isOverlayVisible = false;
  }

  toggleOverlay(): void {
    if (this.isOverlayVisible) {
      this.hideOverlay();
    } else {
      this.showOverlay();
    }
  }

  pause() {
    this.video.pause();
    this.isPaused = true;
  }

  play() {
    this.video.play();
    this.isPaused = false;
    this.hideOverlay();
  }

  togglePause(): void {

    if (this.isPaused) {
      this.play();
    } else {
      this.pause();
      this.onMouseMove();
    }
  }

  onPauseLayerClick(): void {
    if (!Browser.isTouch()) {
      this.togglePause();
    }
  }
}


@Component({
  selector: 'listing-video-overlay-simple',
  animations: animations,
  templateUrl: 'listing-video-overlay-simple.component.html',
  styleUrls: ['./listing-video-overlay.component.scss',],
})
export class ListingVideoOverlaySimpleComponent implements VideoOverlay, OnInit, OnDestroy {

  video: ListingVideoComponent;

  private subscriptions: Subscription[] = [];

  private onMouseMoveObservable: Subject<any> = new Subject();

  isOverlayVisible: boolean = false;
  overlayState: OverlayState = 'invisible';

  isPaused: boolean = false;
  isFullScreen: boolean = false;

  onFullScreenChanged = new Subject<any>();

  private fullScreenCancel: () => any;

  constructor(private videoService: VideoService) {

    this.subscriptions.push(
      this.onMouseMoveObservable
        .asObservable()
        .pipe(
          debounceTime(2000)
        )
        .subscribe(() => {
          this.hideOverlay();
        })
    );

    this.fullScreenCancel = onFullscreenChange(() => {
      this.isFullScreen = !this.isFullScreen;
      this.onFullScreenChanged.next(this.isFullScreen);
    });
  }

  ngOnDestroy(): void {
    this.fullScreenCancel();
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  ngOnInit(): void {
  }

  onMouseMove(): void {

    if (!this.isOverlayVisible) {
      this.showOverlay();
    }

    this.onMouseMoveObservable.next(null);
  }

  showOverlay(): void {
    this.overlayState = 'visible';
    this.isOverlayVisible = true;
  }

  hideOverlay(): void {
    this.overlayState = 'invisible';
    this.isOverlayVisible = false;
  }

  pause() {
    this.video.pause();
    this.isPaused = true;
  }

  play() {
    this.video.play();
    this.isPaused = false;
    this.hideOverlay();
  }

  togglePause(): void {

    if (this.isPaused) {
      this.play();
    } else {
      this.pause();
      this.onMouseMove();
    }
  }

  onPauseLayerClick(): void {
    // if (!Browser.isTouch()) {
    //   this.togglePause();
    // }
    this.toggleFullScreen();
  }

  onTouchEnd(): void {
    this.onMouseMove();
  }

  toggleFullScreen(): void {

    if (this.isFullScreen) {
      this.video.exitFullScreen();
    } else {
      this.video.activateFullScreen();
    }
  }
}
