GSIBV.Map.Layer.TYPES["raster"] = "画像タイル";

GSIBV.Map.Layer.FILTERS.push(function (l) {

  if (l._type && l._type == "raster") {
    return new GSIBV.Map.Layer.Raster({
      "id": l.id,
      "title": l.title,
      "url": l.url,
      "html": l.html,
      "legendUrl": l.legendUrl,
      "minzoom": l.minZoom,
      "maxzoom": l.maxZoom,
      "minZoom": l.minZoom,
      "maxZoom": l.maxZoom,
      "minNativeZoom": l.minNativeZoom,
      "maxNativeZoom": l.maxNativeZoom

    });
  }

  var url = l.url.split("?")[0];
  if (url.match(/\{z\}/i) && url.match(/\.(jpg|jpeg|bmp|png)$/i)) {
    return new GSIBV.Map.Layer.Raster({
      "id": l.id,
      "title": l.title,
      "url": l.url,
      "html": l.html,
      "legendUrl": l.legendUrl,
      "minzoom": l.minZoom,
      "maxzoom": l.maxZoom,
      "minZoom": l.minZoom,
      "maxZoom": l.maxZoom,
      "minNativeZoom": l.minNativeZoom,
      "maxNativeZoom": l.maxNativeZoom

    });
  }


  return null;

});

GSIBV.Map.Layer.Raster = class extends GSIBV.Map.Layer {

  constructor(options) {
    super(options);
    this._type = "raster";

    this._url = "";

    if (options) {
      this._url = (options.url ? options.url : "");
      this._tileSize = (options.tileSize ? options.tileSize : 256);
      this._isOutside = (options.isOutside ? true : false);
      this._tms = (options.tms ? true : false);
    }
    //this._tileSize = 512;
  }

  get url() { return this._url; }
  get tileSize() { return this._tileSize; }
  get tms() { return this._tms; }


  getVisible() {
    var map = this._map.map;
    return (map.getLayoutProperty(this.mapid, "visibility") == "visible");
  }

  setVisible(visible) {
    if (this._map) {
      var map = this._map.map;
      map.setLayoutProperty(this.mapid, "visibility", visible ? "visible" : "none");

    }
    this._visible = visible;
  }

  getOpacity() {
    var map = this._map.map;
    return map.getPaintProperty(this.mapid, "raster-opacity");
  }

  setOpacity(opacity) {
    if (this._map) {
      var map = this._map.map;
      map.setPaintProperty(this.mapid, "raster-opacity", opacity);
    }
    this._opacity = opacity;
  }


  _add(map) {
    super._add(map);

    this._addSourceLayer(map);

    return true;
  }

  _addSourceLayer(map) {

    if ( map.map.getLayer(this.mapid))
      map.map.removeLayer(this.mapid);

    if ( map.map.getSource(this.mapid))
      map.map.removeSource(this.mapid);

    map.map.addSource(this.mapid, {
      'type': "raster",
      'tiles': [
        this.url
      ],
      'roundZoom': false,
      'tileSize': this.tileSize,
      "scheme": this._tms ? "tms":"xyz"
    });
    map.map.style.sourceCaches[this.mapid]._source.roundZoom = false;
    //map.map.style.sourceCaches[this.mapid]._source.reparseOverscaled=true;
    //map.map.style.sourceCaches[this.mapid]._source.tileSize=512;

    // 20211215
    //var maxZoom = (this.maxzoom ? this.maxzoom + 1 : 19);
    var maxZoom = (this.maxzoom ? this.maxzoom : 19);

    map.map.addLayer({
      "id": this.mapid,
      "type": "raster",
      "source": this.mapid,
      "minzoom": this.minzoom ? this.minzoom : 2,
      "maxzoom": maxZoom,
      "minZoom": this.minzoom ? this.minzoom : 2,
      "maxZoom": maxZoom,
      "layout": {
        "visibility": (this._visible ? "visible" : "none")
      },
      "paint": {
        "raster-opacity": (this._opacity != undefined ? this._opacity : 1),
        "raster-resampling": "nearest"
      }
    });
  }

  _remove(map) {
    if (!map) return;

    map.map.removeLayer(this.mapid);
    map.map.removeSource(this.mapid);

    super._remove(map);
  }

  _moveToFront() {

    this._map.map.moveLayer(this.mapid);
  }
}