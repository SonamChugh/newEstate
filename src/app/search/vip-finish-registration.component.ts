import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Input,
  EventEmitter,
  Output
} from '@angular/core';

import { ClientRequest } from '../client';


export interface VipFinishSaveEvent {
  request: ClientRequest;
  clientName: string;
  clientPhone: string;
}


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'vip-finish-registration',
  templateUrl: 'vip-finish-registration.component.html',
  styleUrls: ['vip-finish-registration.component.scss']
})
export class VipFinishRegistrationComponent implements OnInit {
  @Input() error: string;
  @Output() errorChange = new EventEmitter<string>();

  @Input() request: ClientRequest;
  @Input() buttonSaveDisabled: boolean;

  @Output() save = new EventEmitter<VipFinishSaveEvent>();

  clientName: string;
  clientPhone: string;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
  ) {
  }

  ngOnInit(): void {
  }

  onInput(): void {

    if (this.error) {
      this.error = '';
      this.errorChange.emit(this.error);
    }
  }

  onFinishSaveClick(): void {

    this.save.emit({
      request: this.request,
      clientName: this.clientName,
      clientPhone: this.clientPhone
    });
  }

  update(): void {

    this.changeDetectorRef.markForCheck();
  }
}
