import { Component, NgModule } from '@angular/core';
import { TestBed, async, inject } from '@angular/core/testing';

import { ModalService } from './modal.service';
import { SharedModule } from './shared.module';


const LEMON_MESSAGE = 'Hello, Lemon!';


describe('modal service', () => {

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ModalService],
      declarations: [],
      imports: [
        SharedModule,
        LemonModule,
      ]
    })
  });

  it('should create modal popup', async(
    inject([ModalService], (service: ModalService) => {

      const modalRef = service.open(LemonModalComponent);

      expect(service.elOverlay.textContent).toContain(LEMON_MESSAGE);
      expect(modalRef.componentInstance).toEqual(jasmine.any(LemonModalComponent));

    })
  ));

  it('should create modal popup with close button', async(
    inject([ModalService], (service: ModalService) => {

      const modalRef = service.open(LemonModalComponent, {showCloseButton: true});

      // todo: need to rework component, now we can't create test fixture and call detectChanges

      // const btn = service.elOverlay.querySelector('.modal-content button.btn-close');
      // expect(btn).toBeTruthy();

    })
  ))

});


@Component({
  template: `
    <h1>${LEMON_MESSAGE}</h1>
  `
})
class LemonModalComponent {

}


@NgModule({
  declarations: [
    LemonModalComponent,
  ],
  entryComponents: [
    LemonModalComponent,
  ]
})
class LemonModule {
}
