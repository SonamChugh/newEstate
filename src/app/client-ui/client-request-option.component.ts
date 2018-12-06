import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';

import { ClientRequest } from '../client';
import {
  SaleRent,
  SearchService,
  TranslationService
} from '../shared';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'client-request-option',
  templateUrl: 'client-request-option.component.html',
  styleUrls: ['client-request-option.component.scss']
})
export class ClientRequestOptionComponent implements OnInit {

  @Input() request: ClientRequest;

  SaleRent = SaleRent;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private translation: TranslationService,
    private searchService: SearchService,
  ) {
  }

  ngOnInit(): void {
  }

  getRequestTypesFormatted(request: ClientRequest): string {

    return Array.from(request.types)
      .map(type => this.translation.translate(type))
      .join(', ');
  }

  getRequestCitiesFormatted(request: ClientRequest): string {

    return Array.from(request.cities)
      .map(id => this.getCityNameById(id))
      .filter(el => el)
      .join(', ');
  }

  getCityNameById(id: number): string {
    const option = this.searchService.getCityOptionById(id);
    return option ? option.shortText : '';
  }
}
