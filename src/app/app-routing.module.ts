import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { PageNotFoundComponent } from './common/page-not-found.component';


@NgModule({
  imports: [
    RouterModule.forChild([
      {path: '404', component: PageNotFoundComponent},
      {path: '**', component: PageNotFoundComponent}
    ])
  ],
})
export class AppRoutingModule {
}
