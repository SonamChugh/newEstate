import {
  Component, Type, Directive, ElementRef, Input, OnInit, ViewChild, ViewContainerRef,
  ComponentFactoryResolver, EventEmitter, Output, ViewEncapsulation, ComponentRef, ApplicationRef
} from '@angular/core';

import { requestFullscreen, exitFullscreen } from '../util/dom';


@Directive({
  selector: '[overlay-host]',
})
export class OverlayHostDirective {
  constructor(public viewContainerRef: ViewContainerRef) {
  }
}


export interface VideoOverlay {
  video: ListingVideoComponent;
}


@Component({
  encapsulation: ViewEncapsulation.Emulated,
  selector: 'listing-video',
  styles: [
      `
      :host {
        display: block;
        position: relative;
      }
    `
  ],
  template: `
    <div [class]="containerClass">
      <div class="video-container">
        <video #video
               [loop]="loop"
               [autoplay]="autoplay"
               (ended)="ended.emit($event)"
               (pause)="onPause()"
               (play)="onPlay()"
               [muted]="muted"
               playsinline>
          <source [src]="source" type="video/mp4">
        </video>
      </div>
      <ng-template overlay-host></ng-template>
    </div>
  `,
})
export class ListingVideoComponent implements OnInit {

  @Input() containerClass: string;
  @Input() source: string;
  @Input() loop: boolean;
  @Input() autoplay: boolean = false;
  @Input() muted: boolean = false;
  @Output() ended: EventEmitter<any> = new EventEmitter();

  isPaused: boolean = false;

  @ViewChild(OverlayHostDirective) private overlayHost: OverlayHostDirective;
  @ViewChild('video') private videoRef: ElementRef;

  private overlayComponentRef: ComponentRef<VideoOverlay>;

  private get videoEl(): HTMLVideoElement {
    return <HTMLVideoElement>this.videoRef.nativeElement;
  }

  constructor(public elementRef: ElementRef, private componentFactoryResolver: ComponentFactoryResolver,
              private _applicationRef: ApplicationRef) {
  }

  ngOnInit(): void {
  }

  onPause(): void {
    this.isPaused = true;
  }

  onPlay(): void {
    this.isPaused = false;
  }

  pause(): void {
    this.videoEl.pause();
    this.isPaused = true;
  }

  play(): void {
    this.videoEl.play();
    this.isPaused = false;
  }

  activateFullScreen(): void {
    const el = this.elementRef.nativeElement.firstElementChild;
    requestFullscreen(el);
  }

  exitFullScreen(): void {
    exitFullscreen();
  }

  loadOverlay<T extends VideoOverlay>(componentType: Type<T>): T {

    const factory = this.componentFactoryResolver.resolveComponentFactory(componentType);

    const containerRef = this.overlayHost.viewContainerRef;
    containerRef.clear();

    const component = containerRef.createComponent(factory);
    component.instance.video = this;

    this.overlayComponentRef = component;

    return component.instance;
  }

  removeOverlay(): void {

    this._applicationRef.detachView(this.overlayComponentRef.hostView);
    this.overlayComponentRef.destroy();

    this.overlayHost.viewContainerRef.clear();

    this.overlayComponentRef = null;
  }
}
