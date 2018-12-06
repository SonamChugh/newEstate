import {
  ElementRef,
  Injectable
} from '@angular/core';


@Injectable({
  providedIn: 'root'
})
export class PageSizePartial {

  footer: ElementRef;

  constructor() {
  }
}
