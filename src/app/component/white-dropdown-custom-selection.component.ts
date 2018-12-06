import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'white-dropdown-custom-selection',
  template: '<ng-content></ng-content>'
})

export class WhiteDropdownCustomSelectionComponent implements OnInit {

  constructor() {
  }

  ngOnInit(): void {
  }
}
