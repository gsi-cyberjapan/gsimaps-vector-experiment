GSIBV.VectorTileStyle = class extends MA.Class.Base {
  constructor(json) {
    super();

    this._tileSize = null;
    this._tiles = [
      "https://maps.gsi.go.jp/xyz/mapboxtestdata1005/{z}/{x}/{y}.pbf"
    ];

    this._layers = new GSIBV.VectorTileStyle.List();
    if (json) {
      this.fromJSON(json);
    }
  }

  static getUniqID() {
    if (!GSIBV.VectorTileStyle._uniqIDInc) GSIBV.VectorTileStyle._uniqIDInc = 0;
    GSIBV.VectorTileStyle._uniqIDInc++;

    if (GSIBV.VectorTileStyle._uniqIDInc > 9999999) GSIBV.VectorTileStyle._uniqIDInc = 1;

    return GSIBV.VectorTileStyle._uniqIDInc;
  }

  get fileName() { return this._fileName; }
  get layers() { return this._layers; }
  get viewPoints() { return this._viewPoints; }

  find(type, minzoom) {
    var result = new GSIBV.VectorTileStyle.List();

    for (var i = 0; i < this._layers.length; i++) {
      var item = this._layers.get(i);
      if ((type == "" || item.type == type) &&
        (minzoom == "" || parseInt(item.zoom.minzoom) == parseInt(minzoom))) result.add(item);

    }


    return result;
  }

  removeLayer(layer) {
    this._layers.remove(layer);
  }

  fromJSON(json) {
    if (json.viewPoints) {
      this._viewPoints = JSON.parse(JSON.stringify(json.viewPoints));
    }
    if (json.tileSize) this._tileSize = json.tileSize;
    if (json.tiles && json.tiles.length > 0) {
      this._tiles = JSON.parse(JSON.stringify(json.tiles));
    }
    this._list = [];
    if (json && json.list) {
      for (var i = 0; i < json.list.length; i++) {
        var item = new GSIBV.VectorTileStyle.Layer();
        item.fromJSON(json.list[i]);
        this._layers.add(item);
      }
    }
  }

  toJSON() {
    var result = { list: [] };

    for (var i = 0; i < this._layers.length; i++)
      result.list.push(this._layers.get(i).toJSON());
    return result;
  }

  get source() {
    var result = {
      "type": "vector",
      "tiles": this._tiles,
      "minzoom": 5,
      "maxzoom": 18
    };

    if (this._tileSize) result.tileSize = this._tileSize;

    return result;
  }

  get glyphs() {
    return "https://hfu.github.io/noto-jp/{fontstack}/{range}.pbf";

  }
  get sprite() {
    return "http://gsi.pre.mediaart.co.jp/bvtile/beta/dev/sprite/sprite";
  }

  get styleLayers() {
    var layers = [];

    for (var i = 0; i < this._layers.length; i++) {
      var item = this._layers.get(i);
      //if ( item.type!="fill") continue;
      var layer = item.toMapboxLayer();

      for (var j = 0; j < layer.length; j++)
        layers.push(layer[j]);
    }

    /*
    for( var i=0; i<this._layers.length; i++ ) {
        var item = this._layers.get(i);
        if ( item.type!="line") continue;
        var layer = item.toMapboxLayer();

        for( var j = 0; j<layer.length; j++)
            layers.push( layer[j] );
    }
    */
    return layers;
  }


}

GSIBV.VectorTileStyle.List = class {

  constructor(name) {
    this._list = [];
  }

  get length() { return this._list.length; }

  get(idx) { return this._list[idx]; }
  add(item) {
    this._list.push(item);
  }
  clear() {
    this._list = [];
  }
  remove(item) {
    for (var i = 0; i < this._list.length; i++) {
      if (this._list[i] == item) {
        this._list.splice(i, 1);
        break;
      }
    }
  }
}




GSIBV.VectorTileStyle.Layer = class {
  constructor(data) {
    if (data) {
      this._title = (data.title ? data.title : "");
      this._type = (data.type ? data.type : "");
      this._zoom = (data.zoom ? data.zoom : []);
      this._sourceLayer = (data["sourceLayer"] ? data["sourceLayer"] : null);
      this._properties = (data["properties"] ? JSON.parse(JSON.stringify(data["properties"])) : {});
      this._filterMode = (data["filterMode"] ? data["filterMode"] : "");
      this._filter = (data["filter"] ? JSON.parse(JSON.stringify(data["filter"])) : []);
      this._paint = (data.paint ? data.paint : null);
      this._layout = (data.layout ? data.layout : null);
      this._metadata = (data.metadata ? data.metadata : null);

    }
  }

  get title() { return this._title; }
  get type() { return this._type; }
  get zoom() { return this._zoom; }
  get sourceLayer() { return this._sourceLayer; }
  get properties() { return this._properties; }
  get filterMode() { return this._filterMode; }
  get filter() {
    if (!this._filter) return [];
    return this._filter;
  }
  get paint() { return this._paint }
  get layout() { return this._layout; }
  get metadata() { return this._metadata; }
  get minzoom() { return this._zoom.minzoom; }
  get maxzoom() { return this._zoom.maxzoom; }


  set title(title) { this._title = title; }
  set type(type) { this._type = type; }
  set zoom(zoom) { this._zoom = zoom; }
  set sourceLayer(sourceLayer) { this._sourceLayer = sourceLayer; }

  set minzoom(zoom) { if (!this._zoom) this._zoom = {}; this._zoom.minzoom = parseInt(zoom); }
  set maxzoom(zoom) { if (!this._zoom) this._zoom = {}; this._zoom.maxzoom = parseInt(zoom); }

  set paint(paint) {
    this._paint = paint;
  }


  set layout(layout) {
    this._layout = layout;
  }


  fromJSON(json) {
    this._title = json.title;
    this._type = json.type;
    this._zoom = json.zoom;
    this._sourceLayer = json.sourceLayer;
    this._paint = json.paint;
    this._layout = json.layout;
    this._properties = json.properties;
    this._filterMode = json.filterMode;
    this._filter = json.filter;
    this._metadata = json.metadata;

  }

  toJSON() {
    return {
      "title": this._title,
      "type": this._type,
      "zoom": this._zoom,
      "sourceLayer": this._sourceLayer,
      "paint": this._paint,
      "layout": this._layout,
      "properties": this._properties,
      "filterMode": this._filterMode,
      "filter": this._filter,
      "metadata": this._metadata
    };
  }


  toMapboxLayer() {
    var result = [];

    switch (this.type) {
      case "line":
        result = GSIBV.VectorTileStyle.MapboxLayerCreater.createLine(this);
        break;

      case "fill":
        result = GSIBV.VectorTileStyle.MapboxLayerCreater.createFill(this);
        break;

      case "label":
        result = GSIBV.VectorTileStyle.MapboxLayerCreater.createLabel(this);
        break;

      case "symbol":
        result = GSIBV.VectorTileStyle.MapboxLayerCreater.createSymbol(this);
        break;

    }


    return result;

  }


}

// paint
GSIBV.VectorTileStyle.PaintType = {
  "line": {
    "line-opacity": {},
    "line-color": {},
    "line-translate": {},
    "line-translate-anchor": {},
    "line-width": {},
    "line-gap-width": {},
    "line-offset": {},
    "line-blur": {},
    "line-dasharray": {},
    "line-pattern": {},
    "line-gradient": {}
  },
  "fill": {
    "fill-antialias": {},
    "fill-opacity": {},
    "fill-color": {},
    "fill-outline-color": {},
    "fill-translate": {},
    "fill-translate-anchor": {},
    "fill-pattern": {}
  },
  "label": {
    "text-opacity": {},
    "text-color": {},
    "text-halo-color": {},
    "text-halo-width": {},
    "text-halo-blur": {},
    "text-translate": {},
    "text-translate-anchor": {}
  },
  "symbol": {
    "text-opacity": {},
    "text-color": {},
    "text-halo-color": {},
    "text-halo-width": {},
    "text-halo-blur": {},
    "text-translate": {},
    "text-translate-anchor": {}
  }
};
// layout
GSIBV.VectorTileStyle.LayoutType = {
  "line": {
    "line-cap": {},
    "line-join": {},
    "line-miter-limit": {},
    "line-round-limit": {},
    "visibility": {}
  },
  "fill": {
    "visibility": {}
  },
  "label": {
    "text-pitch-alignment": {},
    "text-rotation-alignment": {},
    "text-field": {},
    "text-font": {},
    "text-size": {},
    "text-max-width": {},
    "text-line-height": {},
    "text-letter-spacing": {},
    "text-justify": {},
    "text-anchor": {},
    "text-max-angle": {},
    "text-rotate": {},
    "text-padding": {},
    "text-keep-upright": {},
    "text-transform": {},
    "text-offset": {},
    "text-allow-overlap": {},
    "text-ignore-placement": {},
    "text-optional": {},
    "symbol-placement": {},
    "visibility": {}
  },
  "symbol": {
    "icon-size": {},
    "icon-text-fit": {},
    "icon-text-fit-padding": {},
    "icon-image": {},

    "text-pitch-alignment": {},
    "text-rotation-alignment": {},
    "text-field": {},
    "text-font": {},
    "text-size": {},
    "text-max-width": {},
    "text-line-height": {},
    "text-letter-spacing": {},
    "text-justify": {},
    "text-anchor": {},
    "text-max-angle": {},
    "text-rotate": {},
    "text-padding": {},
    "text-keep-upright": {},
    "text-transform": {},
    "text-offset": {},
    "text-allow-overlap": {},
    "text-ignore-placement": {},
    "text-optional": {},
    "symbol-placement": {},
    "visibility": {}

  }
};


// 必須
GSIBV.VectorTileStyle.LayoutRequired = {
  "symbol": {
    "text-font": [
      "NotoSansCJKjp-Regular"
    ],
    "icon-pitch-alignment": "map",
    "symbol-placement": "point",
    "text-pitch-alignment": "map",
    "text-rotation-alignment": "map",
    "text-keep-upright": true,
    "text-allow-overlap": true,
    "text-max-width": 100,
    /*
    "text-max-width": [ "case",
        ["==",["get", "字列"], 2], 1,
        10
    ],
    */
    "text-rotate": ["case",
      ["==", ["get", "字列"], 2],
      ["*", ["+", ["get", "配置角度"], 90], -1],
      ["*", ["get", "配置角度"], -1]
    ],
    "text-anchor": ["case",
      ["==", ["get", "字列"], 2],
      ["case",
        ["==", ["get", "表示位置"], "LC"], "top",
        "center"
      ],
      ["case",
        ["==", ["get", "表示位置"], "LT"], "top-left",
        ["==", ["get", "表示位置"], "CT"], "top",
        ["==", ["get", "表示位置"], "RT"], "top-right",
        ["==", ["get", "表示位置"], "LC"], "left",
        ["==", ["get", "表示位置"], "CC"], "center",
        ["==", ["get", "表示位置"], "RC"], "right",
        ["==", ["get", "表示位置"], "LB"], "bottom-left",
        ["==", ["get", "表示位置"], "CB"], "bottom",
        ["==", ["get", "表示位置"], "RB"], "bottom-right",
        "center"
      ]
    ]
  }
};

/*
"layout"?: {|
    "symbol-placement"?: PropertyValueSpecification<"point" | "line" | "line-center">,
    "symbol-spacing"?: PropertyValueSpecification<number>,
    "symbol-avoid-edges"?: PropertyValueSpecification<boolean>,
    "symbol-z-order"?: PropertyValueSpecification<"viewport-y" | "source">,
    "icon-allow-overlap"?: PropertyValueSpecification<boolean>,
    "icon-ignore-placement"?: PropertyValueSpecification<boolean>,
    "icon-optional"?: PropertyValueSpecification<boolean>,
    "icon-rotation-alignment"?: PropertyValueSpecification<"map" | "viewport" | "auto">,
    "icon-size"?: DataDrivenPropertyValueSpecification<number>,
    "icon-text-fit"?: PropertyValueSpecification<"none" | "width" | "height" | "both">,
    "icon-text-fit-padding"?: PropertyValueSpecification<[number, number, number, number]>,
    "icon-image"?: DataDrivenPropertyValueSpecification<string>,
    "icon-rotate"?: DataDrivenPropertyValueSpecification<number>,
    "icon-padding"?: PropertyValueSpecification<number>,
    "icon-keep-upright"?: PropertyValueSpecification<boolean>,
    "icon-offset"?: DataDrivenPropertyValueSpecification<[number, number]>,
    "icon-anchor"?: DataDrivenPropertyValueSpecification<"center" | "left" | "right" | "top" | "bottom" | "top-left" | "top-right" | "bottom-left" | "bottom-right">,
    "icon-pitch-alignment"?: PropertyValueSpecification<"map" | "viewport" | "auto">,
    "text-pitch-alignment"?: PropertyValueSpecification<"map" | "viewport" | "auto">,
    "text-rotation-alignment"?: PropertyValueSpecification<"map" | "viewport" | "auto">,
    "text-field"?: DataDrivenPropertyValueSpecification<FormattedSpecification>,
    "text-font"?: DataDrivenPropertyValueSpecification<Array<string>>,
    "text-size"?: DataDrivenPropertyValueSpecification<number>,
    "text-max-width"?: DataDrivenPropertyValueSpecification<number>,
    "text-line-height"?: PropertyValueSpecification<number>,
    "text-letter-spacing"?: DataDrivenPropertyValueSpecification<number>,
    "text-justify"?: DataDrivenPropertyValueSpecification<"left" | "center" | "right">,
    "text-anchor"?: DataDrivenPropertyValueSpecification<"center" | "left" | "right" | "top" | "bottom" | "top-left" | "top-right" | "bottom-left" | "bottom-right">,
    "text-max-angle"?: PropertyValueSpecification<number>,
    "text-rotate"?: DataDrivenPropertyValueSpecification<number>,
    "text-padding"?: PropertyValueSpecification<number>,
    "text-keep-upright"?: PropertyValueSpecification<boolean>,
    "text-transform"?: DataDrivenPropertyValueSpecification<"none" | "uppercase" | "lowercase">,
    "text-offset"?: DataDrivenPropertyValueSpecification<[number, number]>,
    "text-allow-overlap"?: PropertyValueSpecification<boolean>,
    "text-ignore-placement"?: PropertyValueSpecification<boolean>,
    "text-optional"?: PropertyValueSpecification<boolean>,
    "visibility"?: "visible" | "none"
|},
"paint"?: {|
    "icon-opacity"?: DataDrivenPropertyValueSpecification<number>,
    "icon-color"?: DataDrivenPropertyValueSpecification<ColorSpecification>,
    "icon-halo-color"?: DataDrivenPropertyValueSpecification<ColorSpecification>,
    "icon-halo-width"?: DataDrivenPropertyValueSpecification<number>,
    "icon-halo-blur"?: DataDrivenPropertyValueSpecification<number>,
    "icon-translate"?: PropertyValueSpecification<[number, number]>,
    "icon-translate-anchor"?: PropertyValueSpecification<"map" | "viewport">,
    "text-opacity"?: DataDrivenPropertyValueSpecification<number>,
    "text-color"?: DataDrivenPropertyValueSpecification<ColorSpecification>,
    "text-halo-color"?: DataDrivenPropertyValueSpecification<ColorSpecification>,
    "text-halo-width"?: DataDrivenPropertyValueSpecification<number>,
    "text-halo-blur"?: DataDrivenPropertyValueSpecification<number>,
    "text-translate"?: PropertyValueSpecification<[number, number]>,
    "text-translate-anchor"?: PropertyValueSpecification<"map" | "viewport">
|}
*/

GSIBV.VectorTileStyle.MapboxLayerCreater = class {

  static createCommon(data, paint, pintRequired, layoutRequired) {
    if (!paint) paint = data.paint;
    var convertFilter = function (data, filter) {
      if (!filter) return [];
      var result = [];
      switch (filter[0]) {
        case "and":
          result.push("all");
          break;
        case "or":
          result.push("any");
          break;
        case "nor":
          result.push("none");
          break;
      }

      for (var i = 1; i < filter.length; i++) {
        result.push([
          filter[i][1],
          filter[i][0],
          data.properties[filter[i][0]]
        ]);
      }

      return result;
    };
    var result = {
      "id": "layerid-" + GSIBV.VectorTileStyle.getUniqID(),
      "metadata": {
        "title": data.title
      },
      "type": (data.type == "label" ? "symbol" : data.type),
      "source": "gsivectortile",
      "source-layer": data.sourceLayer,
      "minzoom": parseInt(data.minzoom),
      "maxzoom": parseInt(data.maxzoom) + 1,
      "filter": (data.filterMode == "mapbox" ? data.filter : convertFilter(data, data.filter))
    }


    if (paint) {
      var paintType = GSIBV.VectorTileStyle.PaintType[data.type];
      result.paint = {};
      for (var key in paint) {
        if (paintType[key] && paint[key]) {
          result.paint[key] = paint[key];
        }
      }

      //result.paint = JSON.parse(JSON.stringify(data.paint));
    }

    if (data.layout) {

      var layoutType = GSIBV.VectorTileStyle.LayoutType[data.type];
      result.layout = {};
      for (var key in data.layout) {
        if (layoutType[key] && data.layout[key]) {
          result.layout[key] = data.layout[key];
        }
      }

      if (layoutRequired) {
        for (var key in layoutRequired) {
          if (!result.layout[key] && result.layout[key] != 0)
            result.layout[key] = layoutRequired[key];
        }
      }
      //result.layout = JSON.parse(JSON.stringify(data.layout));
    }


    return result;
  }

  static createLine(data) {
    var result = [];

    if (Object.prototype.toString.call(data.paint) === '[object Array]') {

      for (var i = 0; i < data.paint.length; i++) {
        var layer = GSIBV.VectorTileStyle.MapboxLayerCreater.createCommon(data, data.paint[i]);
        result.push(layer);
      }
    }
    else {

      if (data.paint["line-outline-width"]) {

        var layer2 = GSIBV.VectorTileStyle.MapboxLayerCreater.createCommon(data);
        layer2.paint["line-color"] = data.paint["line-outline-color"];
        delete layer2.paint["line-dasharray"];
        layer2.paint["line-width"] = data.paint["line-width"] + data.paint["line-outline-width"];

        result.push(layer2);
      }

      if (data.paint["line-fill-color"]) {

        var layer2 = GSIBV.VectorTileStyle.MapboxLayerCreater.createCommon(data);
        layer2.paint["line-color"] = data.paint["line-fill-color"];
        delete layer2.paint["line-dasharray"];

        result.push(layer2);
      }
      var layer = GSIBV.VectorTileStyle.MapboxLayerCreater.createCommon(data);
      result.push(layer);
    }
    return result;
  }


  static createFill(data) {
    var result = [];
    var layer = GSIBV.VectorTileStyle.MapboxLayerCreater.createCommon(data);
    result.push(layer);

    if (data.paint) {

      if (data.paint["line-color"] && data.paint["line-width"]) {

        var data2 = JSON.parse(JSON.stringify(data));
        data2.type = "line";
        data2.minzoom = data2.zoom.minzoom;
        data2.maxzoom = data2.zoom.maxzoom;
        var layer2 = GSIBV.VectorTileStyle.MapboxLayerCreater.createLine(data2);
        for (var i = 0; i < layer2.length; i++)
          result.push(layer2[i]);
      }


      if (data.paint.lines) {
        var data2 = JSON.parse(JSON.stringify(data));
        data2.type = "line";
        data2.minzoom = data2.zoom.minzoom;
        data2.maxzoom = data2.zoom.maxzoom;
        data2.paint = data.paint.lines;

        var layer2 = GSIBV.VectorTileStyle.MapboxLayerCreater.createLine(data2);
        for (var i = 0; i < layer2.length; i++)
          result.push(layer2[i]);
      }
    }

    return result;
  }


  static createLabel(data) {
    var result = [];
    var layer = GSIBV.VectorTileStyle.MapboxLayerCreater.createCommon(data,
      null,
      null,
      GSIBV.VectorTileStyle.LayoutRequired["symbol"]);

    //layer.layout["text-field"] = ["get","表記"];
    result.push(layer);
    return result;
  }


  static createSymbol(data) {
    var result = [];
    var layer = GSIBV.VectorTileStyle.MapboxLayerCreater.createCommon(data,
      null,
      null,
      GSIBV.VectorTileStyle.LayoutRequired["symbol"]);
    result.push(layer);
    return result;
  }
}