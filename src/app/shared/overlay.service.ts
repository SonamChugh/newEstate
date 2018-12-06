import {
  // Inject,
  Injectable,
  // Renderer2
} from '@angular/core';
// import { DOCUMENT } from '@angular/platform-browser';

import { Overlay } from '@angular/cdk/overlay';


@Injectable({
  providedIn: 'root'
})
export class OverlayService {

  constructor(
    // @Inject(DOCUMENT) private document: Document,
    // private renderer: Renderer2,
    private overlay: Overlay,
  ) {
  }

  show(): void {

    const overlayRef = this.overlay.create();
    console.log(overlayRef);

    // overlayRef.detach();
  }

  hide(): void {

  }
}
