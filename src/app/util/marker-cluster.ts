import {
  Observable,
  Subject
} from 'rxjs';

/**
 * A Marker Clusterer that clusters markers.
 *
 * @param {google.maps.Map} map The Google map to attach to.
 * @param {Array.<google.maps.Marker>=} opt_markers Optional markers to add to
 *   the cluster.
 * @param {Object=} opt_options support the following options:
 *     'gridSize': (number) The grid size of a cluster in pixels.
 *     'maxZoom': (number) The maximum zoom level that a marker can be part of a
 *                cluster.
 *     'zoomOnClick': (boolean) Whether the default behaviour of clicking on a
 *                    cluster is to zoom into it.
 *     'averageCenter': (boolean) Whether the center of each cluster should be
 *                      the average of all markers in the cluster.
 *     'minimumClusterSize': (number) The minimum number of markers to be in a
 *                           cluster before the markers are hidden and a count
 *                           is shown.
 *     'styles': (object) An object that has style properties:
 *       'url': (string) The image url.
 *       'height': (number) The image height.
 *       'width': (number) The image width.
 *       'anchor': (Array) The anchor position of the label text.
 *       'textColor': (string) The text color.
 *       'textSize': (number) The text size.
 *       'backgroundPosition': (string) The position of the backgound x, y.
 * @constructor
 * @extends google.maps.OverlayView
 */

export class MarkerCluster {

  private map: google.maps.Map;

  markers: google.maps.Marker[] = [];

  private clusters_: Cluster[] = [];

  sizes = [53, 56, 66, 78, 90];
  styles_: any = [];
  ready_: boolean = false;
  gridSize_: number;
  minClusterSize_: number;
  maxZoom: number;
  imagePath_: string;
  imageExtension_: string;
  zoomOnClick_: boolean;
  averageCenter_: boolean;
  prevZoom_: number;

  classNames: string[];

  private _onClustersMade: Subject<Cluster[]> = new Subject();
  private _onClusterDraw: Subject<Cluster> = new Subject();

  get clusters(): Cluster[] {
    return this.clusters_;
  }

  constructor(map: google.maps.Map, markers: google.maps.Marker[], options: any = {}) {

    this.extend(MarkerCluster, google.maps.OverlayView);

    this.map = map;

    this.markers = [];
    this.clusters_ = [];
    this.styles_ = [];
    this.gridSize_ = options['gridSize'] || 60;
    this.minClusterSize_ = options['minimumClusterSize'] || 2;
    this.maxZoom = options['maxZoom'] || null;
    this.styles_ = options['styles'] || [];
    this.imagePath_ = options['imagePath'] || this.MARKER_CLUSTER_IMAGE_PATH_;
    this.imageExtension_ = options['imageExtension'] || this.MARKER_CLUSTER_IMAGE_EXTENSION_;
    this.zoomOnClick_ = true;

    if (options['zoomOnClick'] != undefined) {
      this.zoomOnClick_ = options['zoomOnClick'];
    }

    this.averageCenter_ = false;

    if (options['averageCenter'] != undefined) {
      this.averageCenter_ = options['averageCenter'];
    }

    this.classNames = options.classNames || [];

    this.setupStyles_();

    this.setMap(map);

    this.prevZoom_ = this.map.getZoom();

    // Add the map event listeners
    google.maps.event.addListener(this.map, 'zoom_changed', () => {
      // Determines map type and prevent illegal zoom levels
      let zoom = this.map.getZoom();
      const minZoom = this.map['minZoom'] || 0;
      const mapType = this.map.mapTypes[this.map.getMapTypeId()];
      const maxZoom = Math.min(this.map['maxZoom'] || 100,
        mapType ? mapType.maxZoom : 100);
      zoom = Math.min(Math.max(zoom, minZoom), maxZoom);

      if (this.prevZoom_ != zoom) {
        this.prevZoom_ = zoom;
        this.resetViewport();
      }
    });

    google.maps.event.addListener(this.map, 'idle', () => this.redraw());

    if (markers && (markers.length || Object.keys(markers).length)) {
      this.addMarkers(markers, false);
    }
  }


  /**
   * The marker cluster image path.
   *
   * @type {string}
   * @private
   */
  MARKER_CLUSTER_IMAGE_PATH_ = '../images/m';


  /**
   * The marker cluster image path.
   *
   * @type {string}
   * @private
   */
  MARKER_CLUSTER_IMAGE_EXTENSION_ = 'png';

  onClustersMade(): Observable<Cluster[]> {
    return this._onClustersMade.asObservable();
  }

  onClusterDraw(): Observable<Cluster> {
    return this._onClusterDraw.asObservable();
  }

  emitClusterDraw(cluster: Cluster) {
    this._onClusterDraw.next(cluster);
  }

  /**
   * Extends a objects prototype by anothers.
   *
   * @param {Object} obj1 The object to be extended.
   * @param {Object} obj2 The object to extend with.
   * @return {Object} The new extended object.
   * @ignore
   */
  extend(obj1, obj2) {
    return (function (object) {
      for (var property in object.prototype) {
        this.prototype[property] = object.prototype[property];
      }
      return this;
    }).apply(obj1, [obj2]);
  };


  /**
   * Implementaion of the interface method.
   * @ignore
   */
  onAdd() {
    this.setReady_(true);
  };

  /**
   * Implementaion of the interface method.
   * @ignore
   */
  draw() {
  };

  /**
   * Sets up the styles object.
   *
   * @private
   */
  setupStyles_() {
    if (this.styles_.length) {
      return;
    }

    for (var i = 0, size; size = this.sizes[i]; i++) {
      this.styles_.push({
        url: this.imagePath_ + (i + 1) + '.' + this.imageExtension_,
        height: size,
        width: size
      });
    }
  };

  /**
   *  Fit the map to the bounds of the markers in the clusterer.
   */
  fitMapToMarkers() {
    var markers = this.getMarkers();
    var bounds = new google.maps.LatLngBounds();
    for (var i = 0, marker; marker = markers[i]; i++) {
      bounds.extend(marker.getPosition());
    }

    this.map.fitBounds(bounds);
  };


  /**
   *  Sets the styles.
   *
   *  @param {Object} styles The style to set.
   */
  setStyles(styles) {
    this.styles_ = styles;
  };


  /**
   *  Gets the styles.
   *
   *  @return {Object} The styles object.
   */
  getStyles() {
    return this.styles_;
  };


  /**
   * Whether zoom on click is set.
   *
   * @return {boolean} True if zoomOnClick_ is set.
   */
  isZoomOnClick() {
    return this.zoomOnClick_;
  };

  /**
   * Whether average center is set.
   *
   * @return {boolean} True if averageCenter_ is set.
   */
  isAverageCenter() {
    return this.averageCenter_;
  };


  /**
   *  Returns the array of markers in the clusterer.
   *
   *  @return {Array.<google.maps.Marker>} The markers.
   */
  getMarkers() {
    return this.markers;
  };


  /**
   *  Returns the number of markers in the clusterer
   *
   *  @return {Number} The number of markers.
   */
  getTotalMarkers() {
    return this.markers.length;
  };


  /**
   *  Sets the max zoom for the clusterer.
   *
   *  @param {number} maxZoom The max zoom level.
   */
  setMaxZoom(maxZoom) {
    this.maxZoom = maxZoom;
  };


  /**
   *  Gets the max zoom for the clusterer.
   *
   *  @return {number} The max zoom level.
   */
  getMaxZoom() {
    return this.maxZoom;
  };


  /**
   *  The function for calculating the cluster icon image.
   *
   *  @param {Array.<google.maps.Marker>} markers The markers in the clusterer.
   *  @param {number} numStyles The number of styles available.
   *  @return {Object} A object properties: 'text' (string) and 'index' (number).
   *  @private
   */
  calculator_(markers, numStyles) {

    const count = markers.length;

    let index = 0;
    let dv = count;
    while (dv !== 0) {
      dv = Math.floor(dv / 10);
      index++;
    }

    index = Math.min(index, numStyles);
    return {
      text: count,
      index: index
    };
  };


  /**
   * Set the calculator function.
   *
   * @param {function(Array, number)} calculator The function to set as the
   *     calculator. The function should return a object properties:
   *     'text' (string) and 'index' (number).
   *
   */
  setCalculator(calculator) {
    this.calculator_ = calculator;
  };


  /**
   * Get the calculator function.
   *
   * @return {function(Array, number)} the calculator function.
   */
  getCalculator() {
    return this.calculator_;
  };


  /**
   * Add an array of markers to the clusterer.
   *
   * @param {Array.<google.maps.Marker>} markers The markers to add.
   * @param {boolean=} opt_nodraw Whether to redraw the clusters.
   */
  addMarkers(markers, opt_nodraw) {

    if (markers.length) {
      for (let i = 0, marker; marker = markers[i]; i++) {
        this.pushMarkerTo_(marker);
      }
    } else if (Object.keys(markers).length) {
      for (const marker in markers) {
        this.pushMarkerTo_(markers[marker]);
      }
    }
    if (!opt_nodraw) {
      this.redraw();
    }
  };


  /**
   * Pushes a marker to the clusterer.
   *
   * @param {google.maps.Marker} marker The marker to add.
   * @private
   */
  pushMarkerTo_(marker) {
    marker.isAdded = false;
    if (marker['draggable']) {
      // If the marker is draggable add a listener so we update the clusters on
      // the drag end.
      var that = this;
      google.maps.event.addListener(marker, 'dragend', function () {
        marker.isAdded = false;
        that.repaint();
      });
    }
    this.markers.push(marker);
  };


  /**
   * Adds a marker to the clusterer and redraws if needed.
   *
   * @param {google.maps.Marker} marker The marker to add.
   * @param {boolean=} opt_nodraw Whether to redraw the clusters.
   */
  addMarker(marker, opt_nodraw) {
    this.pushMarkerTo_(marker);
    if (!opt_nodraw) {
      this.redraw();
    }
  };


  /**
   * Removes a marker and returns true if removed, false if not
   *
   * @param {google.maps.Marker} marker The marker to remove
   * @return {boolean} Whether the marker was removed or not
   * @private
   */
  removeMarker_(marker) {
    var index = -1;
    if (this.markers.indexOf) {
      index = this.markers.indexOf(marker);
    } else {
      for (var i = 0, m; m = this.markers[i]; i++) {
        if (m == marker) {
          index = i;
          break;
        }
      }
    }

    if (index == -1) {
      // Marker is not in our list of markers.
      return false;
    }

    marker.setMap(null);

    this.markers.splice(index, 1);

    return true;
  };


  /**
   * Remove a marker from the cluster.
   *
   * @param {google.maps.Marker} marker The marker to remove.
   * @param {boolean=} opt_nodraw Optional boolean to force no redraw.
   * @return {boolean} True if the marker was removed.
   */
  removeMarker(marker, opt_nodraw) {
    const removed = this.removeMarker_(marker);

    if (!opt_nodraw && removed) {
      this.resetViewport();
      this.redraw();
      return true;
    } else {
      return false;
    }
  };


  /**
   * Removes an array of markers from the cluster.
   *
   * @param {Array.<google.maps.Marker>} markers The markers to remove.
   * @param {boolean=} opt_nodraw Optional boolean to force no redraw.
   */
  removeMarkers(markers, opt_nodraw) {
    var removed = false;

    for (var i = 0, marker; marker = markers[i]; i++) {
      var r = this.removeMarker_(marker);
      removed = removed || r;
    }

    if (!opt_nodraw && removed) {
      this.resetViewport();
      this.redraw();
      return true;
    }
  };


  /**
   * Sets the clusterer's ready state.
   *
   * @param {boolean} ready The state.
   * @private
   */
  setReady_(ready) {
    if (!this.ready_) {
      this.ready_ = ready;
      this.createClusters_();
    }
  };


  /**
   * Returns the number of clusters in the clusterer.
   *
   * @return {number} The number of clusters.
   */
  getTotalClusters() {
    return this.clusters_.length;
  };


  /**
   * Returns the google map that the clusterer is associated with.
   *
   * @return {google.maps.Map} The map.
   */
  getMap() {
    return this.map;
  };


  /**
   * Sets the google map that the clusterer is associated with.
   *
   * @param {google.maps.Map} map The map.
   */
  setMap(map) {
    this.map = map;
  };


  /**
   * Returns the size of the grid.
   *
   * @return {number} The grid size.
   */
  getGridSize(): number {
    return this.gridSize_;
  };


  /**
   * Sets the size of the grid.
   *
   * @param {number} pixels The grid size.
   */
  setGridSize(pixels: number): void {
    this.gridSize_ = pixels;
  };


  /**
   * Returns the min cluster size.
   *
   * @return {number} The grid size.
   */
  getMinClusterSize() {
    return this.minClusterSize_;
  };

  /**
   * Sets the min cluster size.
   *
   * @param {number} size The grid size.
   */
  setMinClusterSize(size) {
    this.minClusterSize_ = size;
  };


  /**
   * Extends a bounds object by the grid size.
   *
   * @param {google.maps.LatLngBounds} bounds The bounds to extend.
   * @return {google.maps.LatLngBounds} The extended bounds.
   */
  getExtendedBounds(bounds) {
    const projection = this['getProjection']();

    // Turn the bounds into latlng.
    const tr = new google.maps.LatLng(bounds.getNorthEast().lat(),
      bounds.getNorthEast().lng());
    const bl = new google.maps.LatLng(bounds.getSouthWest().lat(),
      bounds.getSouthWest().lng());

    // Convert the points to pixels and the extend out by the grid size.
    const trPix = projection.fromLatLngToDivPixel(tr);
    trPix.x += this.gridSize_;
    trPix.y -= this.gridSize_;

    const blPix = projection.fromLatLngToDivPixel(bl);
    blPix.x -= this.gridSize_;
    blPix.y += this.gridSize_;

    // Convert the pixel points back to LatLng
    const ne = projection.fromDivPixelToLatLng(trPix);
    const sw = projection.fromDivPixelToLatLng(blPix);

    // Extend the bounds to contain the new bounds.
    bounds.extend(ne);
    bounds.extend(sw);

    return bounds;
  };


  /**
   * Determins if a marker is contained in a bounds.
   *
   * @param {google.maps.Marker} marker The marker to check.
   * @param {google.maps.LatLngBounds} bounds The bounds to check against.
   * @return {boolean} True if the marker is in the bounds.
   * @private
   */

  isMarkerInBounds_(marker, bounds) {
    return bounds.contains(marker.getPosition());
  };


  /**
   * Clears all clusters and markers from the clusterer.
   */
  clearMarkers() {
    this.resetViewport(true);

    // Set the markers a empty array.
    this.markers = [];
  };


  /**
   * Clears all existing clusters and recreates them.
   * @param {boolean} optHide To also hide the marker.
   */
  resetViewport(optHide: boolean = false) {
    // Remove all the clusters
    for (var i = 0, cluster; cluster = this.clusters_[i]; i++) {
      cluster.remove();
    }

    // Reset the markers to not be added and to be invisible.
    for (var i = 0, marker; marker = this.markers[i]; i++) {
      marker.isAdded = false;
      if (optHide) {
        marker.setMap(null);
      }
    }

    this.clusters_ = [];
  };

  /**
   *
   */
  repaint() {
    var oldClusters = this.clusters_.slice();
    this.clusters_.length = 0;
    this.resetViewport();
    this.redraw();

    // Remove the old clusters.
    // Do it in a timeout so the other clusters have been drawn first.
    setTimeout(function () {
      for (var i = 0, cluster; cluster = oldClusters[i]; i++) {
        cluster.remove();
      }
    }, 0);
  };


  /**
   * Redraws the clusters.
   */
  redraw() {
    this.createClusters_();
  };


  /**
   * Calculates the distance between two latlng locations in km.
   * @see http://www.movable-type.co.uk/scripts/latlong.html
   *
   * @param {google.maps.LatLng} p1 The first lat lng point.
   * @param {google.maps.LatLng} p2 The second lat lng point.
   * @return {number} The distance between the two points in km.
   * @private
   */
  distanceBetweenPoints_(p1: google.maps.LatLng, p2: google.maps.LatLng) {

    if (!p1 || !p2) {
      return 0;
    }

    const R = 6371; // Radius of the Earth in km
    const dLat = (p2.lat() - p1.lat()) * Math.PI / 180;
    const dLon = (p2.lng() - p1.lng()) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(p1.lat() * Math.PI / 180) * Math.cos(p2.lat() * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d;
  };


  /**
   * Add a marker to a cluster, or creates a new cluster.
   *
   * @param {google.maps.Marker} marker The marker to add.
   * @private
   */
  addToClosestCluster_(marker) {

    let distance = 40000; // Some large number
    let clusterToAddTo: Cluster = null;
    let pos = marker.getPosition();
    for (let i = 0, cluster; cluster = this.clusters_[i]; i++) {
      let center = cluster.getCenter();
      if (center) {
        let d = this.distanceBetweenPoints_(center, pos);
        if (d < distance) {
          distance = d;
          clusterToAddTo = cluster;
        }
      }
    }

    if (clusterToAddTo && clusterToAddTo.isMarkerInClusterBounds(marker)) {
      clusterToAddTo.addMarker(marker);
    } else {
      let cluster = new Cluster(this);
      cluster.addMarker(marker);
      this.clusters_.push(cluster);
    }
  };


  /**
   * Creates the clusters.
   *
   * @private
   */
  createClusters_() {
    if (!this.ready_) {
      return;
    }

    // Get our current map view bounds.
    // Create a new bounds object so we don't affect the map.
    var mapBounds = new google.maps.LatLngBounds(this.map.getBounds().getSouthWest(),
      this.map.getBounds().getNorthEast());
    var bounds = this.getExtendedBounds(mapBounds);

    for (let i = 0, marker; marker = this.markers[i]; ++i) {
      if (!marker.isAdded && this.isMarkerInBounds_(marker, bounds)) {
        this.addToClosestCluster_(marker);
      }
    }

    this._onClustersMade.next(this.clusters);
  };
}

/**
 * A cluster that contains markers.
 *
 * @param {MarkerClusterer} markerClusterer The markerclusterer that this
 *     cluster is associated with.
 * @constructor
 * @ignore
 */

export class Cluster {

  private markerClusterer_: MarkerCluster;
  map: google.maps.Map;
  gridSize_: number;
  minClusterSize_: number;
  averageCenter_: boolean;
  center_: google.maps.LatLng;
  markers: google.maps.Marker[];
  bounds_: google.maps.LatLngBounds;

  private _clusterIcon: ClusterIcon;

  get markerCluster(): MarkerCluster {
    return this.markerClusterer_;
  }

  get clusterIcon(): ClusterIcon {
    return this._clusterIcon;
  }

  constructor(markerClusterer: MarkerCluster) {
    this.markerClusterer_ = markerClusterer;
    this.map = markerClusterer.getMap();
    this.gridSize_ = markerClusterer.getGridSize();
    this.minClusterSize_ = markerClusterer.getMinClusterSize();
    this.averageCenter_ = markerClusterer.isAverageCenter();
    this.center_ = null;
    this.markers = [];
    this.bounds_ = null;
    this._clusterIcon = new ClusterIcon(this, markerClusterer.getStyles(),
      markerClusterer.getGridSize());
  }

  /**
   * Determins if a marker is already added to the cluster.
   *
   * @param {google.maps.Marker} marker The marker to check.
   * @return {boolean} True if the marker is already added.
   */
  isMarkerAlreadyAdded(marker) {
    if (this.markers.indexOf) {
      return this.markers.indexOf(marker) != -1;
    } else {
      for (var i = 0, m; m = this.markers[i]; i++) {
        if (m == marker) {
          return true;
        }
      }
    }
    return false;
  };


  /**
   * Add a marker the cluster.
   *
   * @param {google.maps.Marker} marker The marker to add.
   * @return {boolean} True if the marker was added.
   */
  addMarker(marker) {

    if (this.isMarkerAlreadyAdded(marker)) {
      return false;
    }

    if (!this.center_) {
      this.center_ = marker.getPosition();
      this.calculateBounds_();
    } else {
      if (this.averageCenter_) {
        const l = this.markers.length + 1;
        const lat = (this.center_.lat() * (l - 1) + marker.getPosition().lat()) / l;
        const lng = (this.center_.lng() * (l - 1) + marker.getPosition().lng()) / l;
        this.center_ = new google.maps.LatLng(lat, lng);
        this.calculateBounds_();
      }
    }

    marker.isAdded = true;
    this.markers.push(marker);

    const len = this.markers.length;
    if (len < this.minClusterSize_ && marker.getMap() != this.map) {
      // Min cluster size not reached so show the marker.
      marker.setMap(this.map);
    }

    if (len == this.minClusterSize_) {
      // Hide the markers that were showing.
      for (let i = 0; i < len; i++) {
        this.markers[i].setMap(null);
      }
    }

    if (len >= this.minClusterSize_) {
      marker.setMap(null);
    }

    this.updateIcon();
    return true;
  };


  /**
   * Returns the marker clusterer that the cluster is associated with.
   *
   * @return {MarkerClusterer} The associated marker clusterer.
   */
  getMarkerClusterer() {
    return this.markerClusterer_;
  };


  /**
   * Returns the bounds of the cluster.
   *
   * @return {google.maps.LatLngBounds} the cluster bounds.
   */
  getBounds() {
    const bounds = new google.maps.LatLngBounds(this.center_, this.center_);
    const markers = this.getMarkers();
    for (let i = 0, marker; marker = markers[i]; i++) {
      bounds.extend(marker.getPosition());
    }
    return bounds;
  };


  /**
   * Removes the cluster
   */
  remove() {
    this._clusterIcon.remove();
    this.markers.length = 0;
    delete this.markers;
  };


  /**
   * Returns the center of the cluster.
   *
   * @return {number} The cluster center.
   */
  getSize() {
    return this.markers.length;
  };


  /**
   * Returns the center of the cluster.
   *
   * @return {Array.<google.maps.Marker>} The cluster center.
   */
  getMarkers() {
    return this.markers;
  };


  /**
   * Returns the center of the cluster.
   *
   * @return {google.maps.LatLng} The cluster center.
   */
  getCenter() {
    return this.center_;
  };


  /**
   * Calculated the extended bounds of the cluster with the grid.
   *
   * @private
   */
  calculateBounds_() {
    const bounds = new google.maps.LatLngBounds(this.center_, this.center_);
    this.bounds_ = this.markerClusterer_.getExtendedBounds(bounds);
  };


  /**
   * Determines if a marker lies in the clusters bounds.
   *
   * @param {google.maps.Marker} marker The marker to check.
   * @return {boolean} True if the marker lies in the bounds.
   */
  isMarkerInClusterBounds(marker: google.maps.Marker) {
    return this.bounds_.contains(marker.getPosition());
  };


  /**
   * Returns the map that the cluster is associated with.
   *
   * @return {google.maps.Map} The map.
   */
  getMap() {
    return this.map;
  };


  /**
   * Updates the cluster icon
   */
  updateIcon() {
    var zoom = this.map.getZoom();
    var mz = this.markerClusterer_.getMaxZoom();

    if (mz && zoom > mz) {
      // The zoom is greater than our max zoom so show all the markers in cluster.
      for (var i = 0, marker; marker = this.markers[i]; i++) {
        marker.setMap(this.map);
      }
      return;
    }

    if (this.markers.length < this.minClusterSize_) {
      // Min cluster size not yet reached.
      this._clusterIcon.hide();
      return;
    }

    var numStyles = this.markerClusterer_.getStyles().length;
    var sums = this.markerClusterer_.getCalculator()(this.markers, numStyles);
    this._clusterIcon.setCenter(this.center_);
    this._clusterIcon.setSums(sums);
    this._clusterIcon.show();
    // this._clusterIcon.hideShadow();
  };

  fitBounds() {
    this.map.fitBounds(this.getBounds());
  }
}

/**
 * A cluster icon
 *
 * @param {Cluster} cluster The cluster to be associated with.
 * @param {Object} styles An object that has style properties:
 *     'url': (string) The image url.
 *     'height': (number) The image height.
 *     'width': (number) The image width.
 *     'anchor': (Array) The anchor position of the label text.
 *     'textColor': (string) The text color.
 *     'textSize': (number) The text size.
 *     'backgroundPosition: (string) The background postition x, y.
 * @param {number=} opt_padding Optional padding to apply to the cluster icon.
 * @constructor
 * @extends google.maps.OverlayView
 * @ignore
 */
export class ClusterIcon {

  cluster_: Cluster;
  center_: google.maps.LatLng;
  map: google.maps.Map;

  private div_: HTMLElement;

  sums_: any;
  visible_: boolean = false;

  width_: number;
  height_: number;
  text_: string;
  index_: number;
  anchor_: any;
  textColor_: string;
  textSize_: number;

  // todo
  setMap: any;
  getPanes: any;
  getProjection: any;

  get el(): HTMLElement {
    return this.div_;
  }

  constructor(public cluster: Cluster, public styles: any, public padding: number = 0) {

    this.cluster.getMarkerClusterer().extend(ClusterIcon, google.maps.OverlayView);

    this.cluster_ = cluster;
    this.center_ = null;
    this.map = cluster.getMap();

    this.setMap(this.map);
  }


  /**
   * Triggers the clusterclick event and zoom's if the option is set.
   */
  triggerClusterClick() {
    const markerClusterer = this.cluster_.getMarkerClusterer();

    // Trigger the clusterclick event.
    google.maps.event.trigger(markerClusterer, 'clusterclick', this.cluster_);

    if (markerClusterer.isZoomOnClick()) {
      // Zoom into the cluster.
      this.cluster_.fitBounds();
    }
  };


  /**
   * Triggers the clustermouseover event.
   */
  triggerClusterMouseOver() {
    const markerClusterer = this.cluster_.getMarkerClusterer();
    google.maps.event.trigger(markerClusterer, 'clustermouseover', this.cluster_);
  };


  /**
   * Triggers the clustermouseout event.
   */
  triggerClusterMouseOut() {
    const markerClusterer = this.cluster_.getMarkerClusterer();
    google.maps.event.trigger(markerClusterer, 'clustermouseout', this.cluster_);
  };


  /**
   * Adding the cluster icon to the dom.
   * @ignore
   */
  onAdd() {

    this.div_ = document.createElement('div');

    for (const className of this.cluster.getMarkerClusterer().classNames) {
      this.div_.classList.add(className);
    }

    if (this.visible_) {
      const pos = this.getPosFromLatLng_(this.center_);
      this.div_.style.cssText = this.createCss(pos);
      this.div_.innerHTML = this.sums_.text;
    }

    const panes = this.getPanes();
    panes.overlayMouseTarget.appendChild(this.div_);

    google.maps.event.addDomListener(this.div_, 'click', () => this.triggerClusterClick());
    google.maps.event.addDomListener(this.div_, 'mouseover', () => this.triggerClusterMouseOver());
    google.maps.event.addDomListener(this.div_, 'mouseout', () => this.triggerClusterMouseOut());

    this.cluster.getMarkerClusterer().emitClusterDraw(this.cluster);
  };

  /**
   * Returns the position to place the div dending on the latlng.
   *
   * @param {google.maps.LatLng} latlng The position in latlng.
   * @return {google.maps.Point} The position in pixels.
   * @private
   */
  getPosFromLatLng_(latlng) {
    const pos = this.getProjection().fromLatLngToDivPixel(latlng);
    pos.x -= Math.floor(this.width_ / 2);
    pos.y -= Math.floor(this.height_ / 2);
    return pos;
  };

  /**
   * Draw the icon.
   * @ignore
   */
  draw() {
    if (this.visible_) {
      const pos = this.getPosFromLatLng_(this.center_);
      this.div_.style.top = pos.y + 'px';
      this.div_.style.left = pos.x + 'px';
    }
  };

  /**
   * Hide the icon.
   */
  hide() {
    if (this.div_) {
      this.div_.style.display = 'none';
    }
    this.visible_ = false;
  };

  /**
   * Position and show the icon.
   */
  show() {
    if (this.div_) {
      var pos = this.getPosFromLatLng_(this.center_);
      this.div_.style.cssText = this.createCss(pos);
      this.div_.style.display = '';
    }
    this.visible_ = true;
  };

  /**
   * Remove the icon from the map
   */
  remove() {
    this.setMap(null);
  };

  /**
   * Implementation of the onRemove interface.
   * @ignore
   */
  onRemove() {
    if (this.div_ && this.div_.parentNode) {
      this.hide();
      this.div_.parentNode.removeChild(this.div_);
      this.div_ = null;
    }
  };

  setText(value: string): void {
    this.el.textContent = value;
  }

  addClass(className: string): void {
    this.el.classList.add(className);
  }

  removeClass(className: string): void {
    this.el.classList.remove(className);
  }

  /**
   * Set the sums of the icon.
   *
   * @param {Object} sums The sums containing:
   *   'text': (string) The text to display in the icon.
   *   'index': (number) The style index of the icon.
   */
  setSums(sums) {
    this.sums_ = sums;
    this.text_ = sums.text;
    this.index_ = sums.index;
    if (this.div_) {
      this.div_.innerHTML = sums.text;
    }

    this.useStyle();
  };

  /**
   * Sets the icon to the the styles.
   */
  useStyle() {
    let index = Math.max(0, this.sums_.index - 1);
    index = Math.min(this.styles.length - 1, index);
    const style = this.styles[index];
    // this.url_ = style['url'];
    this.height_ = style['height'];
    this.width_ = style['width'];
    this.textColor_ = style['textColor'];
    this.anchor_ = style['anchor'];
    this.textSize_ = style['textSize'];
    // this.backgroundPosition_ = style['backgroundPosition'];
  };

  /**
   * Sets the center of the icon.
   *
   * @param {google.maps.LatLng} center The latlng to set as the center.
   */
  setCenter(center) {
    this.center_ = center;
  };

  /**
   * Create the css text based on the position of the icon.
   *
   * @param {google.maps.Point} pos The position.
   * @return {string} The css style text.
   */
  createCss(pos) {

    const style = [];

    if (typeof this.anchor_ === 'object') {
      if (typeof this.anchor_[0] === 'number' && this.anchor_[0] > 0 &&
        this.anchor_[0] < this.height_) {
        style.push('height:' + (this.height_ - this.anchor_[0]) +
          'px; padding-top:' + this.anchor_[0] + 'px;');
      } else {
        style.push('height:' + this.height_ + 'px; line-height:' + this.height_ +
          'px;');
      }
      if (typeof this.anchor_[1] === 'number' && this.anchor_[1] > 0 &&
        this.anchor_[1] < this.width_) {
        style.push('width:' + (this.width_ - this.anchor_[1]) +
          'px; padding-left:' + this.anchor_[1] + 'px;');
      } else {
        style.push('width:' + this.width_ + 'px; text-align:center;');
      }
    } else {
      style.push('height:' + this.height_ + 'px; line-height:' +
        this.height_ + 'px; width:' + this.width_ + 'px; text-align:center;');
    }

    // const txtColor = this.textColor_ ? this.textColor_ : 'black';
    const txtSize = this.textSize_ ? this.textSize_ : 11;

    style.push(`cursor:pointer; top:${pos.y}px; left: ${pos.x}px; position:absolute; font-size:${txtSize}px;`);
    return style.join('');
  };
}
