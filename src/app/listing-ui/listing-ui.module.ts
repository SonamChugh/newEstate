import { NgModule } from '@angular/core';

import { SharedModule } from '../shared';

import { ListingCardFooterComponent } from './listing-card-footer.component';


@NgModule({
  imports: [
    SharedModule
  ],
  declarations: [
    ListingCardFooterComponent
  ],
  exports: [
    ListingCardFooterComponent
  ]
})
export class ListingUiModule {

}
