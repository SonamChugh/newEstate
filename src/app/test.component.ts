import { Component } from '@angular/core';

@Component({
  selector: 'test-root',
  template: `<h1>{{title}}</h1>`,
})
export class TestComponent {
  title = 'Hello';
}
