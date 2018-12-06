import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'header-right',
  template: '<ng-content></ng-content>'
})
export class HeaderRightComponent implements OnInit {
  constructor(
    private changeDetectorRef: ChangeDetectorRef,
  ) {
  }

  ngOnInit(): void {
  }
}
