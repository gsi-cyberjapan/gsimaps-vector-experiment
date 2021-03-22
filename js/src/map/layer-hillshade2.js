GSIBV.Map.Layer.TYPES["hillshade"] = "陰影起伏図";
GSIBV.Map.Layer.FILTERS.unshift(function (l) {

  if ( l.type == "hillshade") {
    return new GSIBV.Map.Layer.Hillshade({
      "id": l.id,
      "title": l.title,
      "url": l.url,
      "html": l.html,
      "legendUrl": l.legendUrl,
      "minzoom": l.minZoom,
      "maxzoom": l.maxZoom,
      "minNativeZoom": l.minNativeZoom,
      "maxNativeZoom": l.maxNativeZoom,
      "layerType": l.layerType

    });
  }
  return null;

} );



GSIBV.Map.Layer.Hillshade = class extends GSIBV.Map.Layer {

  constructor(options) {
    super(options);
    this._type = "hillshade";
    this._url = "https://cyberjapandata.gsi.go.jp/xyz/dem_png/{z}/{x}/{y}.png";
    this._opacity = GSIBV.CONFIG.Hillshade["hillshade-exaggeration"];
    if (options) {
      this._url = (options.url ? options.url : "https://cyberjapandata.gsi.go.jp/xyz/dem_png/{z}/{x}/{y}.png");
    }
  }

  get url() { return this._url; }


  getVisible() {
    var map = this._map.map;
    return (map.getLayoutProperty(this.mapid, "visibility") == "visible");
  }

  setVisible(visible) {
    var map = this._map.map;
    map.setLayoutProperty(this.mapid, "visibility", visible ? "visible" : "none");
    if (!this._layers) return;
    for (var i = 0; i < this._layers.length; i++) {
      map.setLayoutProperty(this._layers[i].id, "visibility", visible ? "visible" : "none");
    }

  }

  
  getOpacity() {
    var map = this._map.map;
    return this._opacity;
  }


  setOpacity(opacity) {
    opacity = opacity != undefined ? opacity : 1;
    
    var map = this._map.map;
    map.setPaintProperty(this.mapid, "hillshade-exaggeration", opacity);
    this._opacity = opacity;
  }

  _add(map) {
    super._add(map);

    map.map.addSource(this.mapid, {
      "tileSize":256,
      "type": "raster-dem",
      "tiles": [
        "https://cyberjapandata.gsi.go.jp/xyz/dem_png/{z}/{x}/{y}.png"
      ],
      "minzoom" : 2,
      "maxzoom" : 14,
      "encoding":"gsi",
      "attributtion" : "<a href=\"https://maps.gsi.go.jp/development/ichiran.html#dem\">地理院タイル</a>"

    });

    
    const layer = {
      "id" : this.mapid,
      "source" : this.mapid,
      "type" : "hillshade",
      "minzoom": 2,
      "maxzoom": 17,
      "layout" : {
        "visibility" : "visible"
      },
      "paint" : {
        "hillshade-shadow-color": GSIBV.CONFIG.Hillshade["hillshade-shadow-color"],
        "hillshade-highlight-color": GSIBV.CONFIG.Hillshade["hillshade-highlight-color"],
        "hillshade-accent-color" : GSIBV.CONFIG.Hillshade["hillshade-accent-color"],
        "hillshade-exaggeration": this._opacity
      }
    };
    map.map.addLayer(layer );

    return true;
  }

  _remove(map) {

    this._map.map.removeLayer(this.mapid);
    this._map.map.removeSource(this.mapid);
    super._remove(map);
  }


  _moveToFront() {
    var map = this._map.map;
    map.repaint = false;
    map.moveLayer(this.mapid);


    map.repaint = true;
    //this._map.map.moveLayer( this.mapid);
  }
 

};
