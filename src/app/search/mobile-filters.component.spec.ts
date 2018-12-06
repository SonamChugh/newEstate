import { Component, ViewChild } from '@angular/core';
import { TestBed, async } from '@angular/core/testing';

import { MobileFiltersComponent } from './mobile-filters.component';
import { ButtonGroupComponent } from '../component/button-group.component';


describe('test component tests', () => {

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        ButtonGroupComponent,
        MobileFiltersComponent,
        MobileFiltersComponentContainerComponent,
      ],
    }).compileComponents();
  }));

  it(`should render title 'Hello' in a h1 tag`, () => {

    let fixture = TestBed.createComponent(MobileFiltersComponent);
    fixture.detectChanges();

    const el = fixture.debugElement.nativeElement;

    expect(el.querySelector('h1').textContent).toContain('Hello');
  });
});


@Component({
  selector: 'mobile-filteres-container',
  template: `
    <mobile-filters></mobile-filters>
  `
})
class MobileFiltersComponentContainerComponent {
  @ViewChild(MobileFiltersComponent) filters;
}
