import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  OnInit,
  Output
} from '@angular/core';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'white-dropdown-chip',
  templateUrl: 'white-dropdown-chip.component.html',
  styleUrls: ['white-dropdown-chip.component.scss']
})

export class WhiteDropdownChipComponent implements OnInit {

  @Output() remove = new EventEmitter();

  constructor() {
  }

  ngOnInit(): void {
  }
}
