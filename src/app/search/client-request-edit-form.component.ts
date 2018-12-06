import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';

import { handleSetChange } from '../util';

import {
  SearchService,
  SaveEvent
} from '../shared';
import { ClientRequest } from '../client';
import { WhiteOption } from '../component/white-option';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'client-request-edit-form',
  templateUrl: 'client-request-edit-form.component.html',
  styleUrls: ['client-request-edit-form.component.scss']
})
export class ClientRequestEditFormComponent implements OnInit {

  @Input() object: ClientRequest;
  @Input() titleText: string;
  @Input() buttonSaveText: string;
  @Input() buttonSaveDisabled: boolean;
  @Input() buttonSaveVisible: boolean = true;
  @Input() error: string;

  @Output() onSave = new EventEmitter<SaveEvent<ClientRequest, ClientRequestEditFormComponent>>();
  @Output() onChange = new EventEmitter<void>();

  handleSetChange = handleSetChange;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    public searchService: SearchService,
  ) {
  }

  ngOnInit() {
  }

  onSaveClick(): void {

    this.onSave.emit({object: this.object, source: this});
  }

  onValueChanged(): void {

    this.onChange.emit();
  }

  getCityChips(): WhiteOption[] {

    if (!this.object.cities.size) {
      return [];
    }

    return Array.from(this.object.cities)
      .map(id => this.searchService.getCityOptionById(id));
  }

  update(): void {

    this.changeDetectorRef.markForCheck();
  }
}
