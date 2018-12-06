import { NgModule } from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export const modules = [
  MatSlideToggleModule,
  MatButtonToggleModule,
  MatProgressBarModule,
  MatProgressSpinnerModule,
];


@NgModule({
  imports: modules,
  exports: modules
})
export class MaterialModule {
}
