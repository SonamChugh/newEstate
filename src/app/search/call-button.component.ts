import { Component } from '@angular/core';


@Component({
  selector: 'call-button',
  template: `
    <button class="btn-icon">
      <span class="button__a2-animated"></span>
      <span class="button__a3-animated"></span>
      <i class="fa fa-envelope" aria-hidden="true"></i>
    </button>
  `,
  styleUrls: ['call-button.component.scss']
})
export class CallButtonComponent {

}
