var L = {};
var GSI = { GLOBALS: {} };
L.LatLng = class {

  constructor() {
    this.lat = arguments[0];
    this.lng = arguments[1];
  }

}
L.latLng = function (arg1, arg2) {

  return new L.LatLng(arg1, arg2);
};

L.Feature = class {

  constructor() {

  }
  bindPopup(content) {
    this._popupContent = content;
    return this;
  }

  on() { }
  off() { }
}

L.FeatureGroup = class extends L.Feature {

  constructor(features) {
    super();

    this._features = [];

    if (features) {
      for (var i = 0; i < features.length; i++)
        this._features.push(features[i]);
    }

  }



}


L.featureGroup = function (options) {
  return new L.FeatureGroup(options);
};

L.Icon = class {

  constructor(options) {
    this._options = options;
  }

}
L.icon = function (options) {
  return new L.Icon(options);
};


L.DivIcon = class extends L.Icon {

  constructor(options) {
    super(options);
    this._options = options;
  }

}
L.divIcon = function (options) {
  return new L.DivIcon(options);
};

L.Marker = class extends L.Feature {

  constructor(latlng, options) {
    super(options);
    this._latlng = latlng;
    this._options = options;
  }

}

L.marker = function (latlng, options) {
  return new L.Marker(latlng, options);
};

GSIBV.Map.Layer.TYPES["tilegeojson"] = "タイルGeoJSON";
GSIBV.Map.Layer.FILTERS.push(function (l) {

  if (l._type && l._type == "tilegeojson") {
    return new GSIBV.Map.Layer.TileGeoJSON({
      "id": l.id,
      "title": l.title,
      "url": l.url,
      "html": l.html,
      "legendUrl": l.legendUrl,
      "minzoom": l.minZoom,
      "maxzoom": l.maxZoom,
      "minNativeZoom": l.minNativeZoom,
      "maxNativeZoom": l.maxNativeZoom

    });
  }

  var url = l.url.split("?")[0];
  if (url.match(/\{z\}/i) && url.match(/\.(geojson|txt)$/i)) {
    return new GSIBV.Map.Layer.TileGeoJSON({
      "id": l.id,
      "title": l.title,
      "url": l.url,
      "html": l.html,
      "legendUrl": l.legendUrl,
      "minzoom": l.minZoom,
      "maxzoom": l.maxZoom,
      "minNativeZoom": l.minNativeZoom,
      "maxNativeZoom": l.maxNativeZoom

    });
  }


  return null;

});

GSIBV.Map.Layer.TileGeoJSON = class extends GSIBV.Map.Layer {

  constructor(options) {
    super(options);
    this._type = "tilegeojson";

    this._url = "";
    this._tileSize = 256;
    if (options) {
      this._url = (options.url ? options.url : "");
      this._minzoom = (options.minZoom ? options.minZoom : (options.minzoom ? options.minzoom : null));
      this._maxzoom = (options.maxZoom ? options.maxZoom : (options.maxzoom ? options.maxzoom : null));
      this._maxNativeZoom = (options.maxNativeZoom ? options.maxNativeZoom : null);
      this._minNativeZoom = (options.minNativeZoom ? options.minNativeZoom : null);
    }

    this._onMapMoveHandler = MA.bind(this._onMapMove, this);
  }


  getVisible() {
    var map = this._map.map;
    return (map.getLayoutProperty(this.mapid, "visibility") == "visible");
  }

  setVisible(visible) {
    var map = this._map.map;
    map.setLayoutProperty(this.mapid, "visibility", visible ? "visible" : "none");
    if (!this._tiles) return;

    for (var key in this._tiles) {
      var tile = this._tiles[key];

      if (tile.layers) {
        for (var i = 0; i < tile.layers.length; i++) {
          map.setLayoutProperty(tile.layers[i].id, "visibility", visible ? "visible" : "none");
        }
      }

    }

  }

  getOpacity() {
    var map = this._map.map;
    return this._opacity;
  }

  setOpacity(opacity) {
    opacity = opacity != undefined ? opacity : 1;
    if (this._map) {
      var map = this._map.map;
      try {
        map.repaint = false;
        for (var key in this._tiles) {
          var tile = this._tiles[key];
          if (!tile.layers) continue;
          for (var i = 0; i < tile.layers.length; i++) {
            var layer = tile.layers[i];

            switch (layer["type"]) {
              case "line":
                map.setPaintProperty(layer.id, "line-opacity", opacity);
                break;
              case "fill":
                map.setPaintProperty(layer.id, "fill-opacity", opacity);
                break;
              case "symbol":
                map.setPaintProperty(layer.id, "icon-opacity", opacity);
                map.setPaintProperty(layer.id, "text-opacity", opacity);
                break;
            }

          }
        }
        map.repaint = true;
      } catch (e) {
        console.log(e);
      }
    }
    this._opacity = opacity;
  }
  _add(map) {
    super._add(map);

    if (!map.map.getLayer(this.mapid)) {

      map.map.addLayer({
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


    var url = this._url;

    url = url.replace(/\/\{z\}\/\{x\}\/\{y\}.+/i, "/style.js");

    this._request = new MA.HTTPRequest({
      "url": url,
      "type": "text"
    });

    this._request.on("load", MA.bind(this._onStyleLoad, this));
    this._request.on("error", MA.bind(this._onStyleLoadError, this));
    /*
    this._request.on("finish", MA.bind( function(){
        //map.map.on("moveend", this._onMapMoveHandler );
        //this._refresh();
    }, this ));
    */
    this._request.load();

    return true;


  }

  _onStyleLoad(e) {

    try {
      eval("this._style =" + e.params.response + ";");
      if (this._style) {
        if (this._style.options && this._style.options.maxNativeZoom && !this._maxNativeZoom)
          this._maxNativeZoom = this._style.options.minNativeZoom;
        if (this._style.options && this._style.options.minNativeZoom && !this._minNativeZoom)
          this._minNativeZoom = this._style.options.minNativeZoom;
      }
      this._map.map.on("moveend", this._onMapMoveHandler);
      this._refresh();

    } catch (e) {
      console.log(e);
    }
  }
  _onStyleLoadError() {
    console.log("error ");
    this._request.abort();

    var m = this._url.match(/([^:]*:\/\/([^\/]+)\/)/i);
    if (m) {
      var url = m[1] + "js/style.js";
      this._request = new MA.HTTPRequest({
        "url": url,
        "type": "text"
      });

      this._request.on("load", MA.bind(this._onStyleLoad, this));
      this._request.on("finish", MA.bind(function () {
        this._map.map.on("moveend", this._onMapMoveHandler);
        this._refresh();
      }, this));
      this._request.load();
    }
  }

  _remove(map) {
    if (!map) return;

    var imageManager = GSIBV.Map.ImageManager.instance;
    imageManager.off("load", this._iconLoadHandler);
    this._iconLoadHandler = null;
    imageManager.off("error", this._iconLoadErrorHandler);
    this._iconLoadErrorHandler = null;

    map.map.off("moveend", this._onMapMoveHandler);

    if (this._request) this._request.abort();
    this._clearTiles();

    super._remove(map);
  }

  _moveToFront() {
    var map = this._map.map;
    map.repaint = false;
    map.moveLayer(this.mapid);
    for (var key in this._tiles) {
      var tile = this._tiles[key];
      if (!tile.layers) continue;
      for (var i = 0; i < tile.layers.length; i++) {
        map.moveLayer(tile.layers[i].id);
      }

    }

    map.repaint = true;

  }

  _onMapMove() {
    this._refresh();
  }

  _clearTiles() {
    var imageManager = GSIBV.Map.ImageManager.instance;
    imageManager.off("load", this._iconLoadHandler);
    this._iconLoadHandler = null;
    
    imageManager.off("error", this._iconLoadErrorHandler);
    this._iconLoadErrorHandler = null;

    if (!this._tiles) return;

    for (var key in this._tiles) {
      this._destroyTile(this._tiles[key]);
    }
    this._tiles = {};

  }

  _refresh() {

    var map = this._map.map;
    var zoom = Math.floor(map.getZoom());

    if ((this._maxzoom && this._minzoom > zoom) || (this._maxzoom && this._maxzoom < zoom)) {
      this._clearTiles();
      return;
    }

    if (this._tileZoom != zoom) {
      this._clearTiles();
      this._tileZoom = zoom;
    }
    if (this._maxNativeZoom && this._maxNativeZoom < zoom) zoom = this._maxNativeZoom;
    if ( this._minzoom > 14 ) {
      if (this._maxNativeZoom && this._maxNativeZoom > zoom) zoom = this._maxNativeZoom;
    }
    if (this._minNativeZoom && this._minNativeZoom > zoom) zoom = this._minNativeZoom;

    zoom = Math.floor(zoom);

    


    var mapBounds = map.getBounds();

    var northWest = mapBounds.getNorthWest();
    var southEast = mapBounds.getSouthEast();
    var centerLatLng = map.getCenter();

    var lt = this._getTileNo(northWest.lat, northWest.lng, zoom);
    var rb = this._getTileNo(southEast.lat, southEast.lng, zoom);

    var center = this._getTileNo(centerLatLng.lat, centerLatLng.lng, zoom);


    var min = {
      x: Math.min(lt.x, rb.x),
      y: Math.min(lt.y, rb.y)
    };
    var max = {
      x: Math.max(lt.x, rb.x),
      y: Math.max(lt.y, rb.y)
    };

    var tiles = {};

    for (var x = min.x; x <= max.x; x++) {
      for (var y = min.y; y <= max.y; y++) {
        var key = zoom + ":" + x + ":" + y;
        tiles[key] = {
          coords: {
            x: x,
            y: y,
            z: zoom
          },
          id: key
        };
      }
    }

    if (!this._tiles) this._tiles = {};

    // 不要なタイル削除
    var removeTiles = [];
    for (var key in this._tiles) {
      if (!tiles[key]) {
        removeTiles.push(this._tiles[key]);
        delete this._tiles[key];
      }
    }

    for (var i = 0; i < removeTiles.length; i++)
      this._destroyTile(removeTiles[i]);


    // 読み込むタイル抽出
    var loadTiles = [];

    for (var key in tiles) {
      if (!this._tiles[key]) {

        this._tiles[key] = this._initTile(tiles[key], center);
        loadTiles.push(this._tiles[key]);
      }
    }

    // タイル読み込み
    loadTiles.sort(function (a, b) {
      if (a.distance < b.distance) return -1;
      if (a.distance > b.distance) return 1;
      return 0;
    });

    for (var i = 0; i < loadTiles.length; i++) {
      this._loadTile(loadTiles[i]);
    }

  }

  _loadTile(tile) {

    tile.req = new MA.HTTPRequest({
      "url": tile.url,
      "type": "json"
    });

    tile.req.on("load", MA.bind(this._onTileLoad, this, tile));

    tile.req.load();
  }

  _onTileLoad(tile, e) {
    tile._geojson = e.params.response;
    var geojson = tile._geojson;
    var loadIcons = [];
    var loadIconsHash = {};
    function convertColor(color, opacity) {
      var c = MA.Color.parse(color);
      if (c) {
        return "rgba(" + c.r + "," + c.g + "," + c.b + "," + opacity + ")";
      } else return color;
    }
    try {
      if (geojson && geojson.features) {

        var imageManager = GSIBV.Map.ImageManager.instance;
        for (var i = 0; i < geojson.features.length; i++) {
          var feature = geojson.features[i];

          if (feature.geometry.type == "Point") {
            if (this._style && this._style.geojsonOptions && this._style.geojsonOptions.pointToLayer) {

              GSI.GLOBALS.map = {
                zoom: Math.floor(this._map.map.getZoom()),
                getZoom: function () {
                  return GSI.GLOBALS.map.zoom;
                }
              };
              try {
                var leafletLayer = this._style.geojsonOptions.pointToLayer(feature,
                  L.latLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]));
                this._initFeature(feature, leafletLayer);
              } catch (e) {
                console.log(e);
              }

            }


          }

          if (this._style && this._style.geojsonOptions && this._style.geojsonOptions.onEachFeature) {

            GSI.GLOBALS.map = {
              zoom: Math.floor(this._map.map.getZoom()),
              getZoom: function () {
                return GSI.GLOBALS.map.zoom;
              }
            };
            try {
              var leafletLayer = new L.Feature();
              this._style.geojsonOptions.onEachFeature(feature, leafletLayer);
              if (leafletLayer._popupContent) {
                feature.properties["-gsibv-popupContent"] = leafletLayer._popupContent;
              }
            } catch (e) {
              console.log(e);
            }

          }


          var style = null;
          if (this._style && this._style.geojsonOptions && this._style.geojsonOptions.style) {
            style = this._style.geojsonOptions.style(feature);
          }
          if (!feature.properties) continue;

          var properties = feature.properties;

          if (style) {
            for (var key in properties) {
              if (key.indexOf("_") == 0) delete properties[key];
            }

            for (var key in style) {
              properties["_" + key] = style[key];
            }



          }

          if (properties["_dashArray"]) {

            if (typeof properties["_dashArray"] == "string") {
              var dashArray = properties["_dashArray"].split(",");
              for (var j = 0; j < dashArray.length; j++) {
                dashArray[j] = parseFloat(dashArray[j]);
              }
              properties["_dashArray"] = dashArray;

            }
          }

          if (properties["_fillColor"] && properties["_fillOpacity"] != undefined) {
            properties["_fillColor"] = convertColor(properties["_fillColor"], properties["_fillOpacity"]);
          }
          if (properties["_color"] && properties["_opacity"] != undefined) {
            properties["_color"] = convertColor(properties["_color"], properties["_opacity"]);
          }

          properties["-gsibv-type"] = feature.geometry["type"];

          if (properties["_markerType"] == "DivIcon") {
            this._parseDivIconHTML(feature);
          }

          if (properties["_markerType"] == "Circle") {
            this._circleToPolygon(feature);
          }

          if (properties["_iconUrl"]) {
            var icon = properties["_iconUrl"];
            var image = imageManager.getImage(icon);

            if (!image) {
              if (!loadIconsHash[icon]) {
                loadIcons.push(icon);
                loadIconsHash[icon] = true;
              }
            } else {
              if (properties["_iconWidth"])
                properties["_iconScale"] = properties["_iconWidth"] / image.width;
            }

          }
        }

        if (loadIcons.length > 0) {

          if (!this._loadIconTiles) this._loadIconTiles = [];

          this._addToMap(tile, false);
          if (!this._iconLoadHandler) {
            this._iconLoadHandler = MA.bind(this._onIconLoad, this);
            this._iconLoadErrorHandler = MA.bind(this._onIconLoadError, this);
            imageManager.on("load", this._iconLoadHandler);
            imageManager.on("error", this._iconLoadErrorHandler);
          }
          this._loadIconTiles.push({ loadIcons: loadIcons, tile: tile });

          for (var i = 0; i < loadIcons.length; i++) {
            imageManager.load(loadIcons[i]);
          }
        } else {
          this._addToMap(tile, true);
        }
      }



    } catch (e) {
      console.log(e);
    }


  }

  _initFeature(feature, leafletLayer) {
    feature.properties["_text"] = "";
    feature.properties["_rotate"] = 0;
    feature.properties["_color"] = "rgba(0,0,0,1)";
    feature.properties["_fontSize"] = 10;
    feature.properties["_textanchor"] = "top-left";

    if (!leafletLayer) {

      return;
    }

    var features = [];
    if (leafletLayer instanceof L.FeatureGroup) {
      features = leafletLayer._features;
    } else {
      features.push(leafletLayer);
    }

    for (var i = 0; i < features.length; i++) {
      var llayer = features[i];
      if (llayer instanceof L.Marker) {

        if (llayer._popupContent) {
          feature.properties["-gsibv-popupContent"] = llayer._popupContent;

        }
        if (llayer._options.icon instanceof L.DivIcon) {
          var html = llayer._options.icon._options.html;
          //font-size
          //color
          //transform: rotate(0deg);
          //transform-origin:top center;
          //writing-mode: vertical-rl;
          var div = MA.DOM.create("div");
          div.innerHTML = html;

          if ((html.indexOf("vertical-rl") >= 0 ? true : false)) {
            feature.properties["_text"] = "<gsi-vertical>" + div.innerText + "</gsi-vertical>";
          } else {
            feature.properties["_text"] = div.innerText;
          }



          var m = null;

          m = html.match(/font\-size[\s]*\:[\s]*([^;\s]+)/i);
          if (m) {
            if (m[1].indexOf("px") >= 0)
              feature.properties["_fontSize"] = parseFloat(m[1]);
            else
              feature.properties["_fontSize"] = parseFloat(m[1]) * 1.33;

          }

          m = html.match(/color[\s]*\:[\s]*([^;\s]+)/i);
          if (m) {
            feature.properties["_color"] = m[1];
          }


          m = html.match(/transform[\s]*\:[\s]*rotate\(([^;\s)]+)\)/i);
          if (m) {
            feature.properties["_rotate"] = parseFloat(m[1]);
          }



          m = html.match(/transform\-origin[\s]*\:[\s]*([^;\s]+)([\s]+([^;\s]+))*/i);
          if (m) {
            var anchor = {};
            if (m[1]) anchor[m[1]] = true;
            if (m[3]) anchor[m[3]] = true;

            if (anchor["left"]) {
              if (anchor["center"]) {
                feature.properties["_textanchor"] = "left";
              } else if (anchor["bottom"]) {
                feature.properties["_textanchor"] = "bottom-left";
              }
            } else if (anchor["right"]) {

              if (anchor["center"]) {
                feature.properties["_textanchor"] = "right";
              } else if (anchor["bottom"]) {
                feature.properties["_textanchor"] = "bottom-right";
              } else {
                feature.properties["_textanchor"] = "top-right";
              }
            } else if (anchor["center"]) {
              if (anchor["bottom"]) {
                feature.properties["_textanchor"] = "bottom";
              } else if (anchor["top"]) {
                feature.properties["_textanchor"] = "top";
              } else {
                feature.properties["_textanchor"] = "center";
              }
            }
            //feature.properties["_rotate"] = parseFloat(m[1]);
          }



        } else if (llayer._options.icon instanceof L.Icon) {
          for (var key in feature.properties) {
            if (key.indexOf("_") == 0) {
              delete feature.properties[key];
            }
          }
          feature.properties["_iconUrl"] = llayer._options.icon._options.iconUrl;
          feature.properties["_iconScale"] = 1;
          if (llayer._options.icon._options.iconSize) {
            feature.properties["_iconWidth"] = llayer._options.icon._options.iconSize[0];
            feature.properties["_iconHeight"] = llayer._options.icon._options.iconSize[1];

          }
        }

      }
    }


  }

  _onIconLoadError(e) {
    this._onIconLoad(e);
  }

  _onIconLoad(e) {
    if ( !e.params)return;

    var url = e.params.url;
    var imageManager = GSIBV.Map.ImageManager.instance;


    if (!this._loadIconTiles || this._loadIconTiles.length <= 0) {
      imageManager.off("load", this._iconLoadHandler);
      this._iconLoadHandler = null;
      
      imageManager.off("error", this._iconLoadErrorHandler);
      this._iconLoadErrorHandler = null;
      
      return;
    }
    var loadIconTiles = [];
    for (var a = 0; a < this._loadIconTiles.length; a++) {
      var loadIcons = this._loadIconTiles[a].loadIcons;
      var tile = this._loadIconTiles[a].tile;

      for (var i = 0; i < loadIcons.length; i++) {
        if (loadIcons[i] == url) {
          loadIcons.splice(i, 1);
          break;
        }
      }
      if (loadIcons.length <= 0) {



        var resetSource = false;
        for (var i = 0; i < tile._geojson.features.length; i++) {
          var feature = tile._geojson.features[i];

          if (feature.properties["_iconUrl"] && feature.properties["_iconWidth"]) {
            var image = imageManager.getImage(feature.properties["_iconUrl"]);
            if (image) {
              feature.properties["_iconScale"] = feature.properties["_iconWidth"] / image.width;
              resetSource = true;
            }
          }

        }
        if (resetSource) {
          var source = this._map.map.getSource(this.mapid + "-" + tile.id);
          source.setData(tile._geojson);
        }
        this._setSymbolImage(tile);
        //this._addToMap(tile,true);
      }
      else {
        loadIconTiles.push(this._loadIconTiles[a]);
      }

    }

    this._loadIconTiles = loadIconTiles;

  }


  _addToMap(tile, withSymbol) {
    var map = this._map.map;
    var sourceId = this.mapid + "-" + tile.id;
    tile.sourceId = sourceId;
    map.addSource(sourceId, {
      "type": "geojson",
      "data": tile._geojson
    });

    tile.layers = [];
    tile.layers.push({
      "id": this.mapid + "-" + tile.id + "-fill",
      "source": sourceId,
      "filter": ["all", ["has", "_fillColor"]],
      "type": "fill",
      "paint": {
        "fill-color": ["case", ["has", "_fillColor"], ["get", "_fillColor"], "rgba(0,0,0,0)"]
      }
    });


    tile.layers.push({
      "id": this.mapid + "-" + tile.id + "-dashline",
      "source": sourceId,
      "filter": ["all", ["has", "_dashArray"]],
      "type": "line",
      "paint": {
        "line-width": ["case", ["has", "_weight"], ["get", "_weight"], 0],
        "line-color": ["case", ["has", "_color"], ["get", "_color"], "rgba(0,0,0,0)"],
        "line-dasharray": [2, 2]
      }
    });

    tile.layers.push({
      "id": this.mapid + "-" + tile.id + "-line",
      "source": sourceId,
      "filter": ["all", ["!has", "_dashArray"]],
      "type": "line",
      "paint": {
        "line-width": ["case", ["has", "_weight"], ["get", "_weight"], 0],
        "line-color": ["case", ["has", "_color"], ["get", "_color"], "rgba(0,0,0,0)"]
      }
    });

    tile.layers.push({
      "id": this.mapid + "-" + tile.id + "-circle",
      "source": sourceId,
      "filter": ["all", ["has", "_radius"]],
      "type": "circle",
      "paint": {
        "circle-radius": ["case", ["has", "_radius"], ["get", "_radius"], 0],
        "circle-color": ["case", ["has", "_fillColor"], ["get", "_fillColor"], "rgba(0,0,0,0)"],
        "circle-stroke-width": ["case", ["has", "_weight"], ["get", "_weight"], 0],
        "circle-stroke-color": ["case", ["has", "_color"], ["get", "_color"], "rgba(0,0,0,0)"],
        "circle-pitch-alignment": "map"
      }
    });


    var symbolLayer = {
      "id": this.mapid + "-" + tile.id + "-symbol",
      "source": sourceId,
      "filter": ["all", ["has", "_iconUrl"]],
      "type": "symbol",
      "layout": {
        "icon-pitch-alignment": "map",
        "symbol-placement": "point",
        "icon-keep-upright": true,
        "icon-allow-overlap": true
      }
    };

    if (withSymbol) {
      symbolLayer.layout["icon-image"] = ["concat", "-gsibv-image-", ["get", "_iconUrl"]];
      symbolLayer.layout["icon-size"] = ["case", ["has", "_iconScale"], ["get", "_iconScale"], 1];
    }

    tile.layers.push(symbolLayer);


    tile.layers.push({
      "id": this.mapid + "-" + tile.id + "-label",
      "source": sourceId,
      "filter": ["all", ["has", "_text"]],
      "type": "symbol",
      "paint": {
        "text-color": ["case", ["has", "_color"], ["get", "_color"], "rgba(0,0,0,1)"],
        "text-halo-color": "rgba(255,255,255,1)",
        "text-halo-width": 1
      },
      "layout": {
        "text-field": "{_text}",
        "text-anchor": ["case", ["has", "_textanchor"], ["get", "_textanchor"], "top-left"],
        "text-size": ["case", ["has", "_fontSize"], ["get", "_fontSize"], 10.5],
        "text-rotate": ["case", ["has", "_rotate"], ["get", "_rotate"], 0],
        "text-font": [
          "NotoSansCJKjp-Regular"
        ],
        "text-pitch-alignment": "map",
        "text-rotation-alignment": "map",
        "text-keep-upright": true,
        "text-allow-overlap": true,
        "text-max-width": 100
      }
    });



    for (var i = 0; i < tile.layers.length; i++) {
      var layer = tile.layers[i];

      if (!layer.layout) layer.layout = {};
      layer.layout["visibility"] = (this._visible ? "visible" : "none");
      var opacity = this._opacity != undefined ? this._opacity : 1;
      if (opacity < 1) {
        if (!layer.paint) layer.paint = {};

        switch (layer["type"]) {
          case "line":
            layer.paint["line-opacity"] = opacity;
            break;
          case "fill":
            layer.paint["fill-opacity"] = opacity;
            break;
          case "symbol":
            layer.paint["icon-opacity"] = opacity;
            layer.paint["text-opacity"] = opacity;
            break;
        }

      }
      map.addLayer(layer, this.mapid);
      //map.moveLayer( layer.id, this.mapid );
    }
    if (tile.layers.length > 0)
      map.moveLayer(this.mapid, tile.layers[0].id);

    if (withSymbol) {
      //this._setSymbolImage(tile);
    }

  }

  _setSymbolImage(tile) {

    var map = this._map.map;

    map.setLayoutProperty(this.mapid + "-" + tile.id + "-symbol", "icon-image", ["concat", "-gsibv-image-", ["get", "_iconUrl"]]);
    map.setLayoutProperty(this.mapid + "-" + tile.id + "-symbol", "icon-size", ["case", ["has", "_iconScale"], ["get", "_iconScale"], 1]);
  }

  _initTile(tile, center) {

    tile.url = this._url;
    tile.url = tile.url.replace("{x}", tile.coords.x);
    tile.url = tile.url.replace("{y}", tile.coords.y);
    tile.url = tile.url.replace("{z}", tile.coords.z);
    tile.distance = Math.sqrt(Math.pow(center.x - tile.coords.x, 2) + Math.pow(center.y - tile.coords.y, 2));
    return tile;
  }
  _destroyTile(tile) {
    if (!tile) return;

    if (tile.req) tile.req.abort();

    var map = this._map.map;

    if (tile.layers) {
      for (var i = 0; i < tile.layers.length; i++)
        map.removeLayer(tile.layers[i].id);
    }
    if (tile.sourceId) {
      map.removeSource(tile.sourceId);
    }
  }
  _getTileNo(lat, lng, z) {
    var lng_rad = lng * Math.PI / 180;
    var R = 128 / Math.PI;
    var worldCoordX = R * (lng_rad + Math.PI);
    var pixelCoordX = worldCoordX * Math.pow(2, z);
    var tileCoordX = Math.floor(pixelCoordX / 256);

    var lat_rad = lat * Math.PI / 180;
    var worldCoordY = - R / 2 * Math.log((1 + Math.sin(lat_rad)) / (1 - Math.sin(lat_rad))) + 128;
    var pixelCoordY = worldCoordY * Math.pow(2, z);
    var tileCoordY = Math.floor(pixelCoordY / 256);

    return { x: tileCoordX, y: tileCoordY };

  }

}
