GSIBV.Map.Layer.TYPES["geotiff"] = "GEOTIFF";


GSIBV.Map.Layer.GeoTiff = class extends GSIBV.Map.Layer {
  constructor(id, featureCollection, options) {
    super(options);
    this._type = "geotiff";
    this._image = null;
    this._id = id;
    this._featureCollection = featureCollection;
    this._layers = [];
  }

  get image() { return this._image; }

  getVisible() {
    return (this._map.map.getLayoutProperty(this.mapid, "visibility") == "visible");
  }

  setVisible(visible) {
    this._map.map.setLayoutProperty(this.mapid, "visibility", visible ? "visible" : "none");
    if (this._layers) {
      for (var i = 0; i < this._layers.length; i++) {
        this._map.map.setLayoutProperty(this._layers[i].id, "visibility", visible ? "visible" : "none");
      }
    }
    this._visible = visible;
  }

  getOpacity() {
    return this._map.map.getPaintProperty(this.mapid, "raster-opacity");
  }

  setOpacity(opacity) {
    this._opacity = opacity != undefined ? opacity : 1;
    this._map.map.setPaintProperty(this.mapid, "raster-opacity", this._opacity);
  }

  _doAddLayer(){
    var map = this._map.map;

    if (map.getLayer(this.mapid)) map.removeLayer(this.mapid);
    try {
      if ( !map.getLayer(this.mapid)) {
        map.addLayer({
          "id": this.mapid,
          "type": "raster",
          "source": this.mapid,
          "minzoom": 4,
          "maxzoom": 19,
          "minZoom": 4,
          "maxZoom": 19,
          "paint":{
            "raster-opacity": this._opacity || 1
          },
          "layout" :{
            "visibility" : this._visible ? "visible" : "none"
          }
        });
        map.moveLayer( this.id, this._layer.mapid);
        map.moveLayer( this._layer.mapid, this.id );
      }
    }catch(e){
    }
  }

  _doAddSource(feature){
    var map = this._map.map;
    if (map.getSource(this.mapid)) map.removeSource(this.mapid);

    var imageCoords = [];
    var imageUrl = feature.properties["_imageUrl"] || "";
    var coords = feature.geometry.coordinates;
    for(let i = 0; i < coords.length; i++){
      var curCoord = coords.get(i);
      if(curCoord instanceof GSIBV.Map.Draw.LatLng){
        imageCoords.push([curCoord.lng, curCoord.lat]);
      }
    }

    var imageManager = GSIBV.Map.ImageManager.instance;
    map.addSource(this.mapid, {
      type: 'canvas',
      canvas : imageManager.getImageCanvas(imageUrl),
      animate:true,
      coordinates: imageCoords
    });
  }

  _doAddSourceLayer(feature){
    this._doAddSource(feature);
    this._doAddLayer();
  }

  _addSourceLayer() {
    if ( this._featureCollection.length <= 0 ) return;

    var geoJSON = this._featureCollection.toMapboxGeoJSON();
    if(!Array.isArray(geoJSON.features)) return;

    var features = geoJSON.features.filter(feature => {
      return feature.properties["-sakuzu-type"] == "Point" && feature.properties["-sakuzu-marker-type"] == "Image"
    });
    if(features.length < 1) return;

    var feature = features[0];
    var imageManager = GSIBV.Map.ImageManager.instance;
    if(imageManager.has(feature.properties["_imageUrl"])) {
      this._doAddSourceLayer(feature);
    } else {
      if(this._localLoadedHandler) {
        imageManager.off("loaded", this._localLoadedHandler);
        this._localLoadedHandler = null;
      }
      this._localLoadedHandler = MA.bind(this._doAddSourceLayer, this, feature);
      imageManager.on("loaded", this._localLoadedHandler);
    }
  }

  _add(map) {
    super._add(map);
    this._addSourceLayer();
    return true;
  }

  update() {
    if ( !this._map) return;
    var map = this._map.map;

    var source = map.getSource(this.mapid);
    if ( !source ) {
      this._addSourceLayer();
      source = map.getSource(this.mapid);
    }
    
    if ( this._featureCollection.length <= 0 ) {
      this._destroyLayers();
    }
    map.repaint = true;
  }

  _remove(map) {
    if (!map) return;
    
    var map = this._map.map;
    if( map.getSource(this.mapid) ) {
      map.removeLayer(this.mapid);
      map.removeSource(this.mapid);
    }

    if(this._localLoadedHandler) {
      GSIBV.Map.ImageManager.instance.off("loaded", this._localLoadedHandler);
      this._localLoadedHandler = null;
    }

    super._remove(map);
  }

  _moveToFront() {
    if(this._map.map.getLayer(this.mapid))
    this._map.map.moveLayer(this.mapid);
  }
}
