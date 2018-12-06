import {
  Component,
  ViewChild
} from '@angular/core';
import {
  TestBed,
  ComponentFixture,
  async
} from '@angular/core/testing';

import { MapWrapperComponent } from './map-wrapper.component';
import {
  ConfigService,
  IS_BROWSER
} from '../shared';


describe('MapWrapperComponent', () => {

  let fixture: ComponentFixture<MapWrapperContainerComponent>;
  let mapWrapper: MapWrapperComponent;
  let map: google.maps.Map;

  const samplePosition = {lat: 43.6023319, lng: 7.006491};

  beforeEach(async(() => {

    TestBed.configureTestingModule({
      imports: [],
      providers: [
        ConfigService,
        {
          provide: IS_BROWSER,
          useValue: true
        },
      ],
      declarations: [
        MapWrapperComponent,
        MapWrapperContainerComponent,
      ],
    }).compileComponents().then(() => {

      fixture = TestBed.createComponent(MapWrapperContainerComponent);
      mapWrapper = fixture.componentInstance.mapWrapper;
    });

  }));

  let originalTimeout;

  beforeEach((done) => {

    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

    mapWrapper.onMapInit().subscribe(() => {
      map = mapWrapper.map;
      done();
    });
  });

  it('should set sample map center', () => {
    mapWrapper.setCenter(mapWrapper.sampleLocation);
  });

  it('should set sample marker and fit to bounds', () => {

    mapWrapper.updateMarkers([
      samplePosition
    ], {
      fitBounds: true
    });

  });

  it('should draw a circle', () => {

    map.setZoom(14);

    mapWrapper.setCenter(samplePosition);
    mapWrapper.drawCircle(new google.maps.LatLng(samplePosition.lat, samplePosition.lng), 600);
  });

  it('should draw a polygon', () => {

    mapWrapper.setCenter(samplePosition);
    map.setZoom(14);

    const coords = [
      {lat: 43.6023319, lng: 7.002491},
      {lat: 43.6023319, lng: 7.007491},
      {lat: 43.6011319, lng: 7.007491},
      {lat: 43.6001319, lng: 7.001491},
      {lat: 43.6023319, lng: 7.002491},
    ];

    const polygon = new google.maps.Polygon({
      paths: coords,
      strokeColor: '#229cff',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#229cff',
      fillOpacity: 0.35
    });

    polygon.setMap(map);
  });

});


@Component({
  selector: 'map-wrapper-container',
  template: `
    <map-wrapper style="display: block; height: 400px;"></map-wrapper>
  `
})
class MapWrapperContainerComponent {
  @ViewChild(MapWrapperComponent) mapWrapper;
}
