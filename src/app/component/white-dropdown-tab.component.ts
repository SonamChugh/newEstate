import {
  Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ViewEncapsulation,
  HostListener, OnChanges, SimpleChanges
} from '@angular/core';

import { WhiteDropDownComponent, DropDownChangeEvent } from './white-dropdown.component';
import { WhiteOption } from './white-option';


export interface DropDownTab {
  name: string;
  options: WhiteOption[]
}


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'white-dropdown-tab',
  styleUrls: ['white-dropdown.component.scss'],
  templateUrl: 'white-dropdown-tab.component.html'
})
export class WhiteDropDownTabComponent<T> extends WhiteDropDownComponent<T> implements OnChanges {

  @Input() open: boolean = false;
  @Input() title: string;
  @Input() multiple: boolean = false;
  @Input() tabs: DropDownTab[];
  @Input() checkedValues: Set<T>;
  @Input() enableInlineTags: boolean = true;

  @Output() change: EventEmitter<DropDownChangeEvent> = new EventEmitter<DropDownChangeEvent>();

  activeTabIndex: number;

  ngOnInit(): void {

    super.ngOnInit();

    this.initOptions();
  }

  initOptions() {

    if (this.tabs && this.tabs.length) {

      for (let tab of this.tabs) {
        this.setDictRec(tab.options);
      }

      this.activeTabIndex = 0;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {

    const selectedValueChange = changes['selectedValue'];
    const tabsChange = changes['tabs'];

    if (tabsChange && tabsChange.currentValue) {
      this.initOptions();
    }

    if (selectedValueChange) {
      this.currentIndex = this.getIndexByValue(selectedValueChange.currentValue);
    }

    if (this.multiple && this.enableInlineTags && changes.checkedValues) {
      setTimeout(() => this.calculateTagsVisibility(), 1000);
    }
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize(e) {

    if (this.enableInlineTags && this.multiple && this.checkedValues.size) {
      this.calculateTagsVisibility();
    }
  }
}
