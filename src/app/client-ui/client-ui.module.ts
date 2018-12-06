import { NgModule } from '@angular/core';

import { SharedModule } from '../shared';

import { ClientRequestOptionComponent } from './client-request-option.component';


@NgModule({
  imports: [
    SharedModule
  ],
  declarations: [
    ClientRequestOptionComponent,
  ],
  exports: [
    ClientRequestOptionComponent,
  ]
})
export class ClientUiModule {

}
