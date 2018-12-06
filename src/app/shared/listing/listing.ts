import { Injectable } from '@angular/core';

import { getTimestamp } from '../../util';
import { databaseToBoolean } from '../model-helper';


export class ListingStatus {
  static Normal = 'a';
  static Sold = 'c';
}


export enum AccommodationTypeValue {
  Apartment = 'apartment',
  Villa = 'villa',
  Land = 'land'
}


export class ListingVideoResource {
  id: number;
  duration: number;
  imagePreviewSmall: string;
  track_mp4_720p: string;
  track_webm_720p: string;
  meta: any;
}


@Injectable()
export class ListingVideoResourceMapper {
  map(obj: ListingVideoResource, data: any): ListingVideoResource {

    obj.id = parseInt(data.id, 10);

    obj.meta = data.meta ? JSON.parse(data.meta) : {};

    obj.imagePreviewSmall = obj.meta.image_preview_small;
    obj.track_mp4_720p = obj.meta.track_mp4_720p;
    obj.track_webm_720p = obj.meta.track_webm_720p;

    return obj;
  }
}


export class Listing {

  id: number;

  title: string;
  ref: number;

  cityName: string;
  cityNameEn: string;

  sale: number;
  rent: number;

  vid: number;

  refcheck: string;

  status: string;

  type: AccommodationTypeValue;

  surface: string;

  ters: number;
  land: number;

  bedroomsNumber: number;
  bathroomsNumber: number;
  personsNumber: number;

  text: string;

  totpr: number;
  rentpr: string;

  vlat: number;
  vlon: number;

  region: string;

  pointplace: number;

  pricePublished: boolean;

  newBuild: boolean;

  badgeEnabled: boolean;

  secretKey: string;

  coverImage: string;
  coverImageMedium: string;
  coverImageSmall: string;

  publishedAt: number;

  confidential: boolean;

  videoResources: ListingVideoResource[];

  isSold(): boolean {
    return this.status === ListingStatus.Sold;
  }

  isPublishedRecently(): boolean {
    return this.publishedAt && getTimestamp() - this.publishedAt < 60 * 24 * 3600;
  }
}


@Injectable()
export class ListingMapper {

  constructor(private listingVideoResourceMapper: ListingVideoResourceMapper) {
  }

  map(object: Listing, data: any): Listing {

    for (let key in data) {
      if (data.hasOwnProperty(key)) {
        object[key] = data[key];
      }
    }

    object.id = parseInt(data.id, 10);
    object.ref = parseInt(data.ref, 10);

    object.cityName = data.city_name;
    object.cityNameEn = data.city_name_en;

    object.status = data.status;

    object.bedroomsNumber = data.nbchambr ? +data.nbchambr : null;
    object.bathroomsNumber = data.nbsdb ? +data.nbsdb : null;
    object.personsNumber = data.nbpers ? +data.nbpers : null;

    object.vlat = Number(data.vlat);
    object.vlon = Number(data.vlon);
    object.sale = data.sale ? Number(data.sale) : 0;
    object.rent = data.rent ? Number(data.rent) : 0;
    object.totpr = data.totpr ? Number(data.totpr) : 0;
    object.pricePublished = databaseToBoolean(data.pubpr);
    object.pointplace = data.pointplace ? Number(data.pointplace) : null;
    object.land = data.land ? Number(data.land) : 0;
    object.ters = data.ters ? Number(data.ters) : 0;
    object.newBuild = data.newbuild === '1';
    object.secretKey = data.skey || null;

    object.publishedAt = data.published_at ? +data.published_at : null;
    object.badgeEnabled = data.badge_enabled ? data.badge_enabled === '1' : null;

    object.coverImage = data.cover_image;
    object.coverImageMedium = data.cover_image_medium;
    object.coverImageSmall = data.cover_image_small;

    if (data.video_resources && data.video_resources.length) {
      object.videoResources = data.video_resources.map(el => this.listingVideoResourceMapper.map(new ListingVideoResource(), el));
    } else {
      object.videoResources = [];
    }

    object.confidential = data.confidential;

    return object;
  }
}
