GSIBV.Map.Layer.TYPES["geojson"] = "GeoJSON";
GSIBV.Map.Layer.FILTERS.push(function (l) {
  if (l._type && l._type == "geojson") {
    return new GSIBV.Map.Layer.GeoJSON({
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
  if (!url.match(/\{z\}/i) && url.match(/\.geojson$/i)) {
    return new GSIBV.Map.Layer.GeoJSON({
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
GSIBV.Map.Layer.GeoJSON = class extends GSIBV.Map.Layer {

  constructor(options) {
    super(options);
    this._type = "geojson";

    this._url = "";

    if (options) {
      this._url = (options.url ? options.url : "");
    }
  }

  get url() { return this._url; }
  get tileSize() { return this._tileSize; }


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


  _add(map) {
    super._add(map);
    this._request = new MA.HTTPRequest({
      "type": "json",
      "url": this._url
    });
    this._request.on("load", MA.bind(this._onGeoJSONLoad, this));
    this._request.on("finish", MA.bind(this._onGeoJSONLoadFinish, this));
    this._request.load();

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

    return true;
  }

  _remove(map) {
    if (!map) return;

    var imageManager = GSIBV.Map.ImageManager.instance;
    imageManager.off("load", this._iconLoadHandler);

    if (this._layers) {
      for (var i = 0; i < this._layers.length; i++)
        this._map.map.removeLayer(this._layers[i].id);
    }
    this._map.map.removeLayer(this.mapid);
    this._map.map.removeSource(this.mapid);
    super._remove(map);
  }

  _moveToFront() {
    var map = this._map.map;
    map.repaint = false;
    map.moveLayer(this.mapid);


    if (!this._layers) return;

    for (var i = 0; i < this._layers.length; i++) {
      map.moveLayer(this._layers[i].id);
    }

    map.repaint = true;
    //this._map.map.moveLayer( this.mapid);
  }

  _onGeoJSONLoad(e) {
    this._geojson = e.params.response;
    var geojson = this._geojson;
    var loadIcons = [];

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
          if (!feature.properties) continue;

          var properties = feature.properties;

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
            if (!imageManager.has(icon)) {
              loadIcons.push(icon);
            }
          }
        }

        if (loadIcons.length > 0) {

          this._addToMap(false);

          this._iconLoadHandler = MA.bind(this._onIconLoad, this, loadIcons);
          imageManager.on("load", this._iconLoadHandler);

          for (var i = 0; i < loadIcons.length; i++) {
            imageManager.load(loadIcons[i]);
          }
        } else {
          this._addToMap(true);
        }
      }


    } catch (e) {
      console.log(e);
    }
  }

  _parseDivIconHTML(feature) {
    var div = MA.DOM.create("div");
    div.innerHTML = feature.properties["_html"];

    var elem = div.children[0];
    feature.properties["_text"] = div.innerText;

    if (elem.style.color && elem.style.color != "") {
      feature.properties["_text-color"] = elem.style.color;
    }

    if (elem.style.fontSize && elem.style.fontSize != "") {
      if (elem.style.fontSize.indexOf("pt") >= 0) {
        var ptSize = parseFloat(elem.style.fontSize);
        feature.properties["_text-size"] = ptSize * 1.33;
      } else if (elem.style.fontSize.indexOf("px") >= 0) {
        feature.properties["_text-size"] = parseFloat(elem.style.fontSize);
      }
    }

  }

  _circleToPolygon(feature) {
    // 円→ポリゴン
    var radius = feature.properties["_radius"];
    var coordinates = [];
    var numSides = 100;//CONFIG.CIRCLETOPOLYGONNUMSIDES;
    var center = feature.geometry.coordinates;
    var center_lat_rad = center[1] * Math.PI / 180;
    var center_lng_rad = center[0] * Math.PI / 180;
    var dmax_lat = radius / 6378137;
    var xys = [];
    xys.push([dmax_lat, 0]);
    for (var i = 1; i < numSides; i++) {
      var y = dmax_lat - 2 * dmax_lat / numSides * i;
      var x = 2 * Math.asin(Math.sqrt((Math.pow(Math.sin(dmax_lat / 2), 2) - Math.pow(Math.sin((y) / 2), 2)) / (Math.cos(center_lat_rad + y) * Math.cos(center_lat_rad))));
      if (x !== x) {
        return;
      } else {
        xys.push([y, x]);
      }
    }
    xys.push([-dmax_lat, 0]);
    for (var i = 1; i < numSides; i++) {
      xys.push([xys[numSides - i][0], -xys[numSides - i][1]]);
    }
    xys.push([dmax_lat, 0]);
    for (var i = 0; i < xys.length; i++) {
      coordinates.push(
        [
          (center_lng_rad + xys[i][1]) / (Math.PI / 180),
          (center_lat_rad + xys[i][0]) / (Math.PI / 180)
        ]);
    }
    feature.geometry.coordinates = [coordinates];
    feature.geometry["type"] = "Polygon";
    delete feature.properties["_markerType"];
    delete feature.properties["_radius"];
  }
  _onIconLoad(loadIcons, e) {
    var url = e.params.url;
    for (var i = 0; i < loadIcons.length; i++) {
      if (loadIcons[i] == url) {
        loadIcons.splice(i, 1);
        break;
      }
    }
    if (loadIcons.length <= 0) {

      var imageManager = GSIBV.Map.ImageManager.instance;
      imageManager.off("load", this._iconLoadHandler);
      this._setSymbolImage();
    }
  }

  _addToMap(withSymbol) {
    var map = this._map.map;
    map.addSource(this.mapid, {
      "type": "geojson",
      "data": this._geojson
    });

    this._layers = [];
    this._layers.push({
      "id": this.mapid + "-fill",
      "source": this.mapid,
      "type": "fill",
      "paint": {
        "fill-color": ["case", ["has", "_fillColor"], ["get", "_fillColor"], "rgba(0,0,0,0)"]
      }
    });


    this._layers.push({
      "id": this.mapid + "-line",
      "source": this.mapid,
      "type": "line",
      "paint": {
        "line-width": ["case", ["has", "_weight"], ["get", "_weight"], 0],
        "line-color": ["case", ["has", "_color"], ["get", "_color"], "rgba(0,0,0,0)"]
      }
    });


    this._layers.push({
      "id": this.mapid + "-circle",
      "source": this.mapid,
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

    this._layers.push({
      "id": this.mapid + "-symbol",
      "source": this.mapid,
      "filter": ["all", ["has", "_iconUrl"]],
      "type": "symbol",
      "layout": {
        "icon-size": ["case", ["has", "iconScale"], ["get", "iconScale"], 1],
        "icon-pitch-alignment": "map",
        "symbol-placement": "point",
        "icon-keep-upright": true,
        "icon-allow-overlap": true
      }
    });

    this._layers.push({
      "id": this.mapid + "-label",
      "source": this.mapid,
      "filter": ["all", ["==", ["get", "_markerType"], "DivIcon"]],
      "type": "symbol",
      "paint": {
        "text-color": ["case", ["has", "_text-color"], ["get", "_text-color"], "rgba(0,0,0,1)"],
        "text-halo-color": "rgba(255,255,255,1)",
        "text-halo-width": 1
      },
      "layout": {
        "text-field": "{_text}",
        "text-size": ["case", ["has", "_text-size"], ["get", "_text-size"], 10.5],
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

    for (var i = 0; i < this._layers.length; i++) {
      var layer = this._layers[i];
      if (!layer.layout) layer.layout = {};
      layer.layout["visibility"] = (this._visible ? "visible" : "none");

      map.addLayer(layer);
      map.moveLayer(layer.id, this.mapid);
    }
    if (this._layers.length > 0)
      map.moveLayer(this.mapid, this._layers[0].id);

    if (withSymbol) {
      this._setSymbolImage();
    }

  }

  _setSymbolImage() {

    var map = this._map.map;

    map.setLayoutProperty(this.mapid + "-symbol", "icon-image", ["concat", "-gsibv-image-", ["get", "icon"]])

  }

  _onGeoJSONLoadFinish() {

  }
}