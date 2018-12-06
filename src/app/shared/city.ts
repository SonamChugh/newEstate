import { Injectable } from '@angular/core';

import { Polygon } from './geometry';
import { databaseToBoolean } from './model-helper';


export class City {
  id: number;
  lat: number;
  lon: number;
  name: string;
  description: string;
  parentId: number;
  polygons: Polygon[];
  translationKey: string;
  coverImage: string;
  indexGallery: boolean;
}


@Injectable()
export class CityMapper {

  map(obj: City, data: any): City {

    obj.id = Number(data.id);
    obj.lat = Number(data.lat);
    obj.lon = Number(data.lon);
    obj.name = data.name;
    obj.description = data.description;
    obj.polygons = data.polygons || [];
    obj.parentId = data.parent_id ? Number(data.parent_id) : null;
    obj.translationKey = data.translation_key || null;
    obj.coverImage = data.cover_image;
    obj.indexGallery = databaseToBoolean(data.index_gallery);

    return obj;
  }
}
