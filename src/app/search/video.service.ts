import { Injectable, ApplicationRef, Injector, ComponentFactoryResolver } from '@angular/core';
// import { DomPortalHost, ComponentPortal } from '@angular/cdk/portal';
import { ListingVideoComponent } from './listing-video.component';


@Injectable({
  providedIn: 'root'
})
export class VideoService {

  private parentElement: HTMLElement;
  private el: HTMLElement;
  private elNextEl: HTMLElement;

  private fullscreenActive: boolean;

  constructor(private _applicationRef: ApplicationRef, _injector: Injector,
              private _componentFactoryResolver: ComponentFactoryResolver) {
  }

  makeFullScreen(listingVideo: ListingVideoComponent): void {

    // const host = new DomPortalHost(document.body, this._componentFactoryResolver);

    if (this.fullscreenActive) {
      return;
    }

    const containerEl = listingVideo.elementRef.nativeElement as HTMLElement;

    this.parentElement = containerEl.parentElement;
    this.el = containerEl;
    this.elNextEl = this.el.nextElementSibling as HTMLElement;

    document.body.appendChild(containerEl);
    document.body.classList.add('no-scroll');

    containerEl.classList.add('video-fullscreen-mobile');

    this.fullscreenActive = true;
  }

  clearFullScreen(): void {

    if (this.fullscreenActive) {

      this.el.classList.remove('video-fullscreen-mobile');
      document.body.classList.remove('no-scroll');

      if (this.elNextEl) {
        this.parentElement.insertBefore(this.el, this.elNextEl);
      } else {
        this.parentElement.appendChild(this.el);
      }

      this.parentElement = null;
      this.el = null;
      this.elNextEl = null;

      this.fullscreenActive = false;
    }
  }

  isFullscreen(): boolean {
    return this.fullscreenActive;
  }
}
