GSIBV.Map.Layer.TYPES["raster"] = "画像タイル";

GSIBV.Map.Layer.FILTERS.unshift(function (l) {
  // 使用しない
  
  if (l._type && l._type == "raster") {
    return new GSIBV.Map.Layer.TileImage({
      "id": l.id,
      "title": l.title,
      "url": l.url,
      "html": l.html,
      "legendUrl": l.legendUrl,
      "minzoom": l.minZoom,
      "maxzoom": l.maxZoom,
      "minNativeZoom": l.minNativeZoom,
      "maxNativeZoom": l.maxNativeZoom,
      "opacity": l.opacity
    });
  }

  var url = l.url.split("?")[0];
  if (url.match(/\{z\}/i) && url.match(/\.(jpg|jpeg|bmp|png)$/i)) {
    return new GSIBV.Map.Layer.TileImage({
      "id": l.id,
      "title": l.title,
      "url": l.url,
      "html": l.html,
      "legendUrl": l.legendUrl,
      "minzoom": l.minZoom,
      "maxzoom": l.maxZoom,
      "minNativeZoom": l.minNativeZoom,
      "maxNativeZoom": l.maxNativeZoom,
      "opacity": l.opacity

    });
  }


  return null;

});


GSIBV.Map.Layer.TileImage = class extends GSIBV.Map.Layer {

  constructor(options) {
    super(options);
    this._type = "raster";
    this._url = "";
    this._fadeDuration = 500;

    if (options) {
      this._url = (options.url ? options.url : "");
      this._tileSize = 256;
      this._maxNativeZoom =options.maxNativeZoom ? options.maxNativeZoom : undefined;
      this._fadeDuration =options.fadeDuration || options.fadeDuration == 0 ? options.fadeDuration : 500;
    }
    //this._tileSize = 512;
  }

  get url() { return this._url; }
  get tileSize() { return this._tileSize; }
  getVisible() {
    var map = this._map.map;
    return (map.getLayoutProperty(this.mapid, "visibility") == "visible");
  }

  setVisible(visible) {
    if (this._map) {
      var map = this._map.map;
      
      map.setLayoutProperty(this.mapid, "visibility", visible ? "visible" : "none");

    }
    
    if ( this._tiles) {
      for( var key in this._tiles) {
        var tile = this._tiles[key];
        tile.visible = visible;
      }
    }
    this._visible = visible;
  }

  getOpacity() {
    var map = this._map.map;
    return this._opacity;
  }

  setOpacity(opacity) {
    this._opacity = opacity;
    if ( this._tiles) {
      for( var key in this._tiles) {
        var tile = this._tiles[key];
        tile.opacity = opacity;
      }
    }
  }

  _add(map) {
    super._add(map);
    this._map = map;

    var map = this._map.map;
    if (!map.getLayer(this.mapid)) {

      map.addLayer({
        "id": this.mapid,
        "type": "background",
        "paint": {
          "background-color": "rgba(255,255,255,0)"
        },
        "layout": {
          "visibility": (this._visible ? "visible" : "none")
        }
      });
    }

    this._refresh();
    
    
    if ( !this._mapMoveHandler) {
      this._mapMoveHandler = MA.bind( this._onMapMove, this );
      map.on("move", this._mapMoveHandler);
    }


    return true;
  }

  _onMapMove() {
    this._refresh();
  }

  
  _createTile(x,y,z) {
    return new GSIBV.Map.Layer.TileImage.Tile(this,x,y,z,{
      opacity : this._opacity,
      visible : this._visible
    });
  }
  
  

  _getZoom() {
    
    return GSIBV.Map.Layer.TileImage.getZoom(this._map.map,  this._maxNativeZoom);
  }

  _refresh() {
    
    //this._drawer.setElevationData(this._initializeElevationData(this._dataManager.data));
    if ( !this._map ) return;

    var map = this._map.map;
    var zoom = this._getZoom();
    /*
    var mapBounds = map.getBounds();

    var northWest = mapBounds.getNorthWest();
    var southEast = mapBounds.getSouthEast();

    var lt = GSIBV.Map.Layer.TileImage.latlngToCoords(northWest.lat, northWest.lng, zoom);
    var rb = GSIBV.Map.Layer.TileImage.latlngToCoords(southEast.lat, southEast.lng, zoom);


    var min = {
      x: Math.min(lt.x, rb.x),
      y: Math.min(lt.y, rb.y)
    };
    var max = {
      x: Math.max(lt.x, rb.x),
      y: Math.max(lt.y, rb.y)
    };
 */

    // 必要なタイル一覧取得
    var coordsList = GSIBV.Map.Layer.TileImage.getCoordsList(map,zoom);
    var tiles = {};
    if ( !this._tiles) this._tiles = {};

    
    for( var i=0; i<coordsList.length; i++) {
      var coords = coordsList[i];
      
      var tile = this._createTile(coords.x, coords.y, coords.z);
      if ( this._tiles[tile.key]) {
      // 現在表示中タイルがあればそれを利用
        tiles[tile.key] = this._tiles[tile.key];
        delete this._tiles[tile.key];
      } else {
        tiles[tile.key] = tile;
      } 
    }

    // 不要なタイル破棄
    for( var key in this._tiles) {
      this._tiles[key].destroy();
    }

    // タイル更新
    this._tiles = tiles;


    // 中心から近い順の配列を生成
    var centerLatLng = map.getCenter();
    var center = GSIBV.Map.Layer.TileImage.latlngToCoords(centerLatLng.lat, centerLatLng.lng, zoom);

    var loadTiles = [];

    for (var key in this._tiles) {
      var tile = this._tiles[key];
      tile.distance = 
        Math.sqrt(Math.pow(center.x - tile.x, 2) + Math.pow(center.y - tile.y, 2));
      loadTiles.push(tile);
    }

    loadTiles.sort(function (a, b) {
      if (a.distance < b.distance) return -1;
      if (a.distance > b.distance) return 1;
      return 0;
    });

    // タイル読み込み
    for( var i=0; i<loadTiles.length; i++ ) {
      loadTiles[i].load();
    }

  }

  _remove(map) {
    if (!map) return;

    if ( this._mapMoveHandler) {
      map.off("move", this._mapMoveHandler);
      this._mapMoveHandler = null;
    }

    
    
    this._destroyTiles();

    map.map.removeLayer(this.mapid);

    super._remove(map);
  }

  _destroyTiles() {
    if ( !this._tiles ) return;

    for( var key in this._tiles) {
      this._tiles[key].destroy();
    }

    this._tiles = undefined;
  }

  _moveToFront() {

    this._map.map.moveLayer(this.mapid);
    
    if ( this._tiles) {
      for( var key in this._tiles) {
        var tile = this._tiles[key];
        tile.moveToFront();
      }
    }

  }


  

};


GSIBV.Map.Layer.TileImage.latlngToCoords = function(lat, lng, z) {
  var lng_rad = lng * Math.PI / 180;
  var R = 128 / Math.PI;
  var worldCoordX = R * (lng_rad + Math.PI);
  var pixelCoordX = worldCoordX * Math.pow(2, z);
  var tileCoordX = Math.floor(pixelCoordX / 256);

  var lat_rad = lat * Math.PI / 180;
  var worldCoordY = - R / 2 * Math.log((1 + Math.sin(lat_rad)) / (1 - Math.sin(lat_rad))) + 128;
  var pixelCoordY = worldCoordY * Math.pow(2, z);
  var tileCoordY = Math.floor(pixelCoordY / 256);

  return { 
    x: tileCoordX, 
    y: tileCoordY, 
    z:z,
    px: Math.floor(pixelCoordX - tileCoordX * 256 ),
    py :Math.floor(pixelCoordY - tileCoordY * 256)

  };

};

GSIBV.Map.Layer.TileImage.getCoordsList = function(map, zoom) {
  var mapBounds = map.getBounds();

  var northWest = mapBounds.getNorthWest();
  var southEast = mapBounds.getSouthEast();

  var lt = GSIBV.Map.Layer.TileImage.latlngToCoords(northWest.lat, northWest.lng, zoom);
  var rb = GSIBV.Map.Layer.TileImage.latlngToCoords(southEast.lat, southEast.lng, zoom);



  var min = {
    x: Math.min(lt.x, rb.x),
    y: Math.min(lt.y, rb.y)
  };
  var max = {
    x: Math.max(lt.x, rb.x),
    y: Math.max(lt.y, rb.y)
  };

  var coordsList = [];

  for (var x = min.x; x <= max.x; x++) {
    for (var y = min.y; y <= max.y; y++) {
      coordsList.push({
        x: x,
        y: y,
        z: zoom
      });
    }
  }

  return coordsList;
};

GSIBV.Map.Layer.TileImage.getZoom = function(map, maxNativeZoom) {
  
  var zoom = map.getZoom()+1;
  zoom = Math.floor(zoom);
  if ( maxNativeZoom) {
    if ( zoom > maxNativeZoom ) zoom = maxNativeZoom;
  }

  return zoom;
};

GSIBV.Map.Layer.TileImage.Tile = class extends MA.Class.Base {

  constructor( layer, x,y,z, options) {
    super(options);
    this._layer = layer;
    this._x = x;
    this._y = y;
    this._z = z;
    this._key = GSIBV.Map.Layer.FreeRelief.Tile.makeKey(x,y,z);

    this._nw = this._pointToLatLng(x,y,z);
    this._se = this._pointToLatLng(x+1,y+1,z);
    
    if ( options ) {
      this._visible = options.visible == false ? false : true;
      this._opacity = options.opacity != undefined ? options.opacity : 1;
    }
  }

  _pointToLatLng(x,y,z) {
    var n = Math.PI - 2 * Math.PI * y / Math.pow(2, z); 
    return {
      lat :(180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)))),
      lng : (x / Math.pow(2, z) * 360 - 180)
    }
  }
  get x() {
    return this._x;
  }

  get y() {
    return this._y;
  }

  get z() {
    return this._z;
  }

  get key() {
    return this._key;
  }

  get id() {
    if ( !this._id) {
      this._id  = this._layer.mapid + this.key;
    }
    
    return this._id;
  }

  get visible() {
    return this._visible;
  }

  set visible(visible) {
    
    var map = this._layer.map.map;
    this._visible = visible;
    
    var layer = map.getLayer(this.id);
    if ( layer ) {
      map.setLayoutProperty(this.id, "visibility", visible ? "visible" : "none");
    }
  }

  set opacity(opacity) {
    var map = this._layer.map.map;
    this._opacity = opacity;
    var layer = map.getLayer(this.id);
    if ( layer ) {
      
      map.setPaintProperty(this.id, "raster-opacity", this._opacity);
    }

  }
  
  moveToFront() {
    var map = this._layer.map.map;
    var layer = map.getLayer(this.id);
    if ( layer ) {
      
      map.moveLayer(this.id);
    }
  }

  load() {
    this._addLayer();
  }

 

  destroy() {
    var map = this._layer.map.map;
    try {
      if ( map.getLayer(this._id)) map.removeLayer(this.id);
    } catch(e) {}
    try {
      if ( map.getSource(this._id)) map.removeSource(this.id);
    } catch(e) {}

  }

  _getUrl() {
    var url = this._layer._url;

    return url.replace("{x}", this._x).replace("{y}", this._y).replace("{z}", this.z );

  }

  _addLayer() {
    var url = this._getUrl();
    if ( !url ) return;

    var map = this._layer.map.map;
    try {
      if ( !map.getSource(this._id)) {
        map.addSource(this.id, {
          type: 'image',
          url : url,
          coordinates: [
              [this._nw.lng, this._nw.lat],
              [this._se.lng, this._nw.lat],
              [this._se.lng, this._se.lat],
              [this._nw.lng, this._se.lat]
          ]
        });
      }
    }catch(e){}

    try {
      if ( !map.getLayer(this._id)) {
        map.addLayer({
          "id": this.id,
          "source": this.id,
          "minzoom": this._layer.minzoom ? this._layer.minzoom : 2,
          "maxzoom": this._layer.maxzoom ? this._layer.maxzoom + 1 : 19,
          "type": "raster",
          "paint":{
            "raster-opacity":this._opacity,
            "raster-fade-duration" : this._layer._fadeDuration
          },
          "layout" :{
            "visibility" : this._visible ? "visible" : "none"
          }
        });
        map.moveLayer( this.id, this._layer.mapid);
        map.moveLayer( this._layer.mapid, this.id );
      }
    }catch(e){}

  }

};

