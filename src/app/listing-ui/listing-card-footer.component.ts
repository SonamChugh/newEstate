import {
  ChangeDetectionStrategy,
  Component
} from '@angular/core';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'listing-card-footer',
  template: '<ng-content></ng-content>',
})
export class ListingCardFooterComponent {
}
