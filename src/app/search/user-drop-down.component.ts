import { Component, ElementRef, HostListener } from '@angular/core';


@Component({
  selector: 'user-drop-down',
  styles: [
      `
      .dropdown-arrow {
        background: url('data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/PjxzdmcgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDQ4IDQ4IiB3aWR0aD0iNDgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTE0IDIwbDEwIDEwIDEwLTEweiIvPjxwYXRoIGQ9Ik0wIDBoNDh2NDhoLTQ4eiIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==') no-repeat right center;
        background-size: 24px;
      }

      .user-dropdown-container {
        display: inline-block;
        color: #4A4A4A;
        vertical-align: middle;
        height: auto;
        position: relative;
        text-align: left;
        width: 55px;
        padding: 0 5px;
      }

    `
  ],
  template: `
    <div class="user-dropdown-container dropdown-arrow">
      <i (click)="open = !open" class="fa fa-user-circle fa-2x" aria-hidden="true"></i>
      <user-drop-down-menu [open]="open"></user-drop-down-menu>
    </div>
  `
})
export class UserDropDownComponent {

  open: boolean;

  constructor(public elementRef: ElementRef) {

  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {

    const el = <HTMLElement>this.elementRef.nativeElement;
    const target = <HTMLElement>event.target;

    if (this.open && !el.contains(target)) {
      this.open = false;
    }
  }
}



