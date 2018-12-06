import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  ApiService,
  DeviceFormFactorValue,
  SearchService
} from '../shared';


@Injectable({
  providedIn: 'root'
})
export class ListingService {

  constructor(
    private api: ApiService,
    private searchService: SearchService,
  ) {
  }

  getPreviewImageUrls(ref: number): Observable<string[]> {
    return this.searchService.getListingPhotos(ref, null, DeviceFormFactorValue.Mobile)
      .pipe(
        map(res => res.images)
      );
  }
}

