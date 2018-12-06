import { NgModule } from '@angular/core';

import { SharedModule } from '../shared';

import { WhiteDropDownComponent } from './white-dropdown.component';
import { WhiteDropDownTabComponent } from './white-dropdown-tab.component';
import { WhiteDropDownFromToComponent } from './white-dropdown-from-to.component';
import { WhiteDropDownOptionComponent } from './white-dropdown-option.component';
import { WhiteDropdownChipComponent } from './white-dropdown-chip.component';
import { WhiteDropdownCustomSelectionComponent } from './white-dropdown-custom-selection.component';
import { ButtonGroupComponent } from './button-group.component';
import {
  PhotosSliderComponent,
  SliderNextDirective,
  SliderPrevDirective,
  SliderItem
} from './photos-slider.component';
import { ImageCarouselComponent } from './image-carousel.component';

import { SafePipe } from './safe.pipe';


const COMPONENTS = [
  SafePipe,

  WhiteDropDownComponent,
  WhiteDropDownTabComponent,
  WhiteDropDownFromToComponent,
  WhiteDropDownOptionComponent,
  WhiteDropdownChipComponent,
  WhiteDropdownCustomSelectionComponent,
  ButtonGroupComponent,

  PhotosSliderComponent,
  SliderNextDirective,
  SliderPrevDirective,
  SliderItem,

  ImageCarouselComponent,
];


const PROVIDERS = [];


@NgModule({
  imports: [
    SharedModule
  ],
  declarations: [
    ...COMPONENTS
  ],
  exports: [
    ...COMPONENTS
  ],
  providers: [
    ...PROVIDERS
  ]
})
export class ComponentModule {
}
