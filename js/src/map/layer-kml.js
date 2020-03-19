GSIBV.Map.Layer.TYPES["kml"] = "KML";

GSIBV.Map.Layer.FILTERS.push(function (l) {

  if (l._type && l._type == "kml") {
    return new GSIBV.Map.Layer.KML({
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
  if (url.match(/\.kml$/i)) {
    return new GSIBV.Map.Layer.KML({
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


GSIBV.Map.Layer.KML = class extends GSIBV.Map.Layer {

  constructor(options) {
    super(options);
    this._type = "kml";

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

  get viewPoints() {
    return (this._data ? this._data.viewPoints : []);
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
        for (var i = 0; i < this._layers.length; i++) {
          var layer = this._layers[i];
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
        map.repaint = true;
      } catch (e) {
        console.log(e);
      }
    }
    this._opacity = opacity;
  }

  _add(map) {
    super._add(map);
    this._request = new MA.HTTPRequest({
      "type": "text",
      "url": this._url
    });
    this._request.on("load", MA.bind(this._onKMLLoad, this));
    this._request.on("finish", MA.bind(this._onKMLLoadFinish, this));
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

  _onKMLLoad(e) {
    var kmlText = e.params.response;
    function convertColor(color, opacity) {
      var c = MA.Color.parse(color);
      if (c) {
        return "rgba(" + c.r + "," + c.g + "," + c.b + "," + opacity + ")";
      } else return color;
    }
    try {
      var parser = new DOMParser();
      var dom = parser.parseFromString(kmlText, 'text/xml');//e.params.response, 'text/xml');
      var geojson = toGeoJSON.kml(dom);
      var loadIcons = [];
      var loadIconsHash = [];
      this._geojson = geojson;

      if (geojson && geojson.features) {
        var imageManager = GSIBV.Map.ImageManager.instance;
        for (var i = 0; i < geojson.features.length; i++) {
          var feature = geojson.features[i];
          if (!feature.properties) continue;

          feature.properties["-gsibv-popupContent"] =
            (feature.properties["name"] ? "<h2>" + feature.properties["name"] + "</h2>" : "") +
            (feature.properties["description"] ? feature.properties["description"] : "");


          var properties = feature.properties;

          if (properties["fill"] && properties["fill-opacity"] != undefined) {
            properties["fill"] = convertColor(properties["fill"], properties["fill-opacity"]);
          }
          if (properties["stroke"] && properties["stroke-opacity"] != undefined) {
            properties["stroke"] = convertColor(properties["stroke"], properties["stroke-opacity"]);
          }

          properties["-gsibv-type"] = feature.geometry["type"];


          if (properties["icon"]) {
            var icon = properties["icon"];
            if (!imageManager.has(icon)) {
              if (!loadIconsHash[icon]) {
                loadIcons.push(icon);
                loadIconsHash[icon] = true;
              }
            }
          }
        }

        if (loadIcons.length > 0) {

          this._iconLoadHandler = MA.bind(this._onIconLoad, this, loadIcons);
          imageManager.on("load", this._iconLoadHandler);

          for (var i = 0; i < loadIcons.length; i++) {
            imageManager.load(loadIcons[i]);
          }

          this._addToMap(false);
        } else {
          this._addToMap(true);
        }
      }


    } catch (e) {
      console.log(e);
    }
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
        "fill-color": ["case", ["has", "fill"], ["get", "fill"], "rgba(0,0,0,0)"]
      }
    });


    this._layers.push({
      "id": this.mapid + "-line",
      "source": this.mapid,
      "type": "line",
      "paint": {
        "line-width": ["case", ["has", "stroke-width"], ["get", "stroke-width"], 0],
        "line-color": ["case", ["has", "stroke"], ["get", "stroke"], "rgba(0,0,0,0)"]
      }
    });



    this._layers.push({
      "id": this.mapid + "-symbol",
      "source": this.mapid,
      "filter": ["all", ["has", "icon"]],
      "type": "symbol",
      "layout": {
        //"icon-image": ["concat","-gsibv-image-", ["get","icon"] ],
        "icon-size": ["case", ["has", "iconScale"], ["get", "iconScale"], 1],
        "icon-pitch-alignment": "map",
        "symbol-placement": "point",
        "icon-keep-upright": true,
        "icon-allow-overlap": true
      }
    });


    var opacity = (this._opacity != undefined ? this._opacity : 1);

    for (var i = 0; i < this._layers.length; i++) {
      var layer = this._layers[i];
      //layer.minzoom -=1;

      if (!layer.layout) layer.layout = {};
      layer.layout["visibility"] = (this._visible ? "visible" : "none");

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
    if (this._layers.length > 0)
      map.moveLayer(this.mapid, this._layers[0].id);

    if (withSymbol) this._setSymbolImage();

  }
  _setSymbolImage() {

    var map = this._map.map;

    map.setLayoutProperty(this.mapid + "-symbol", "icon-image", ["concat", "-gsibv-image-", ["get", "icon"]])

  }
  _onKMLLoadFinish() {

  }
}