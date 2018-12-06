import {
  Injectable,
  ComponentRef,
  ComponentFactoryResolver,
  ViewContainerRef,
  Type,
  Component,
  ViewChild,
  Directive,
  Injector,
  ApplicationRef,
  EmbeddedViewRef
} from '@angular/core';
import {
  Observable,
  Subject
} from 'rxjs';


function createOverlay(className: string): HTMLElement {

  const el = document.createElement('div');
  el.setAttribute('class', className);

  document.body.appendChild(el);

  return el;
}


export class WeModalRef<T> {

  private _onClose: Subject<any> = new Subject();

  componentInstance: T;

  private _hostEl: HTMLElement;

  protected get hostEl(): HTMLElement {

    if (!this._hostEl) {
      this._hostEl = (this._containerRef.hostView as EmbeddedViewRef<any>).rootNodes[0] as HTMLElement;
    }

    return this._hostEl;
  }

  constructor(private _containerRef: ComponentRef<any>, private _appRef: ApplicationRef,
              private overlayRef?: OverlayRef) {
  }

  close(modalResult?: any) {

    if (this.overlayRef) {
      this.overlayRef.detach();
    }

    this._appRef.detachView(this._containerRef.hostView);
    this._containerRef.destroy();

    const hostEl = this.hostEl;

    if (hostEl && hostEl.parentNode) {
      hostEl.parentNode.removeChild(hostEl);
    }

    this._onClose.next(modalResult);
  }

  onClose(): Observable<any> {
    return this._onClose.asObservable();
  }

}


@Directive({
  selector: '[host]',
})
export class HostDirective {
  constructor(public viewContainerRef: ViewContainerRef) {
  }
}


@Component({
  selector: 'modal-container',
  styleUrls: ['modal.scss'],
  template: `
    <div class="modal-dialog">
      <div class="modal-content" [ngStyle]="contentStyle">
        <button *ngIf="showCloseButton" (click)="close()" class="btn-close">
          <span class="lnr lnr-cross"></span>
        </button>
        <div class="modal-body">
          <ng-template host></ng-template>
        </div>
      </div>
    </div>
  `,
  host: {
    '[class]': 'containerClass'
  },
})
export class ModalContainer {

  @ViewChild(HostDirective) modalHost: HostDirective;

  private _onCloseButtonClick: Subject<any> = new Subject();

  showCloseButton: boolean = false;
  contentStyle: any = {};
  containerClass: string;

  constructor() {
  }

  onCloseButtonClick(): Observable<any> {
    return this._onCloseButtonClick.asObservable();
  }

  close() {
    this._onCloseButtonClick.next(null);
  }
}


export class ModalInjector<T> implements Injector {

  constructor(private _parentInjector: Injector,
              private _modalRef: WeModalRef<T>) {
  }

  get(token: any, notFoundValue?: any): any {

    if (token === WeModalRef) {
      return this._modalRef;
    }

    return this._parentInjector.get(token, notFoundValue);
  }
}

export class PopupInjector<T> implements Injector {

  constructor(private _parentInjector: Injector,
              private _modalRef: WeAbsolutePopupRef<T>) {
  }

  get(token: any, notFoundValue?: any): any {

    if (token === WeAbsolutePopupRef) {
      return this._modalRef;
    }

    return this._parentInjector.get(token, notFoundValue);
  }
}


class OverlayRef {

  backDrop: boolean;

  private elBackdrop: HTMLElement = null;

  private _backdropClick: Subject<any> = new Subject<any>();

  constructor(private parentElement: HTMLElement) {
  }

  get backdropClick(): Observable<any> {
    return this._backdropClick.asObservable();
  }

  attach(): void {
    this.attachBackdrop();
  }

  detach(): void {
    this.detachBackdrop();
  }

  private attachBackdrop() {

    this.elBackdrop = document.createElement('div');

    this.elBackdrop.classList.add('overlay-backdrop');

    this.parentElement.appendChild(this.elBackdrop);

    this.elBackdrop.addEventListener('click', () => this._backdropClick.next(null));

    requestAnimationFrame(() => {
      this.elBackdrop.classList.add('overlay-backdrop-show');
    });
  }

  private detachBackdrop() {

    const el = this.elBackdrop;

    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }

  }

}


export interface ModalParams {
  showCloseButton?: boolean;
  showBackDrop?: boolean;
  width?: string | number;
  height?: string | number;
  maxWidth?: string | number;
  maxHeight?: string | number;
  containerClass?: string;
}


@Injectable()
export class ModalService {

  elOverlay: HTMLElement;

  constructor(
    private _componentFactoryResolver: ComponentFactoryResolver,
    private _injector: Injector,
    private _applicationRef: ApplicationRef
  ) {
  }

  open<T>(component: Type<T>, params: ModalParams = {}): WeModalRef<T> {

    this.elOverlay = this.elOverlay || createOverlay('modal-overlay');

    const overlayRef = new OverlayRef(this.elOverlay);

    overlayRef.attach();

    const modalContainerRef = this.attachModalContainer(ModalContainer);

    const componentFactory = this._componentFactoryResolver.resolveComponentFactory(component);

    const modalContainerEl = (modalContainerRef.hostView as EmbeddedViewRef<any>).rootNodes[0] as HTMLElement;

    this.elOverlay.appendChild(modalContainerEl);

    const modalComponent = modalContainerRef.instance;

    const modalViewContainerRef = modalComponent.modalHost.viewContainerRef;

    const modalRef = new WeModalRef<T>(modalContainerRef, this._applicationRef, overlayRef);

    const componentRef = modalViewContainerRef.createComponent(componentFactory, modalViewContainerRef.length,
      new ModalInjector(this._injector, modalRef));

    modalRef.componentInstance = componentRef.instance;

    overlayRef.backdropClick.subscribe(() => modalRef.close());

    if (params.showCloseButton) {
      modalComponent.showCloseButton = true;
      modalComponent.onCloseButtonClick().subscribe(() => modalRef.close());
    }

    this.applyParams(modalComponent, params);

    return modalRef;
  }

  applyParams(component: ModalContainer, params: ModalParams): void {

    if (params.width) {
      component.contentStyle.width = isNaN(+params.width) ? params.width : `${params.width}px`;
    }

    if (params.height) {
      component.contentStyle.height = isNaN(+params.height) ? params.height : `${params.height}px`;
    }

    if (params.maxWidth) {
      component.contentStyle.maxWidth = params.maxWidth;
    }

    if (params.maxHeight) {
      component.contentStyle.maxHeight = params.maxHeight;
    }

    if (params.containerClass) {
      component.containerClass = params.containerClass;
    }
  }

  attachModalContainer<T>(component: Type<T>): ComponentRef<T> {

    const modalContainerFactory = this._componentFactoryResolver.resolveComponentFactory(component);
    const componentRef = modalContainerFactory.create(this._injector);

    this._applicationRef.attachView(componentRef.hostView);

    return componentRef;
  }

}


@Component({
  selector: 'popup-container',
  styleUrls: ['popup.scss'],
  template: `
    <div class="popup-body">
      <button *ngIf="showCloseButton" (click)="close()" class="btn-close">
        <i class="fa fa-times" aria-hidden="true"></i>
      </button>
      <div class="popup-content">
        <ng-template host></ng-template>
      </div>
    </div>
  `
})
export class PopupContainer {

  @ViewChild(HostDirective) popupHost: HostDirective;

  private _onCloseButtonClick: Subject<any> = new Subject();

  showCloseButton: boolean = false;

  constructor() {
  }

  onCloseButtonClick(): Observable<any> {
    return this._onCloseButtonClick.asObservable();
  }

  close() {
    this._onCloseButtonClick.next(null);
  }
}


export class WeAbsolutePopupRef<T> extends WeModalRef<T> {

  componentInstance: T;

  x: number;
  y: number;

  setPosition(x: number, y: number): void {

    this.x = x;
    this.y = y;

    this.hostEl.style.left = x + 'px';
    this.hostEl.style.top = y + 'px';
  }
}


@Injectable()
export class PopupService {

  elOverlay: HTMLElement;

  constructor(private componentFactoryResolver: ComponentFactoryResolver,
              private applicationRef: ApplicationRef, private injector: Injector) {

  }

  create<T>(component: Type<T>): WeAbsolutePopupRef<T> {

    this.elOverlay = this.elOverlay || createOverlay('popup-overlay');

    const popupComponentRef = this.attachContainer(PopupContainer);

    const containerEl = (popupComponentRef.hostView as EmbeddedViewRef<any>).rootNodes[0] as HTMLElement;

    this.elOverlay.appendChild(containerEl);

    const popupRef = new WeAbsolutePopupRef<T>(popupComponentRef, this.applicationRef);

    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(component);
    const hostRef = popupComponentRef.instance.popupHost.viewContainerRef;

    const componentRef = hostRef.createComponent(componentFactory, hostRef.length,
      new PopupInjector(this.injector, popupRef));

    popupRef.componentInstance = componentRef.instance;

    return popupRef;
  }

  private attachContainer<T>(component: Type<T>): ComponentRef<T> {

    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(component);
    const componentRef = componentFactory.create(this.injector);

    this.applicationRef.attachView(componentRef.hostView);

    return componentRef;
  }

}
