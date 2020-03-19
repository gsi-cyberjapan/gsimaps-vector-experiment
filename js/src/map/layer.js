// レイヤベース

GSIBV.Map.LayerList = class extends MA.Class.Base {

  constructor(map) {
    super();
    this._map = map;
    this._list = [];
    this._hash = {};
    this._layerChangeHandler = MA.bind(this._onLayerChange, this);
  }

  get length() { return this._list.length; }

  get(idx) {
    return this._list[idx];
  }

  contains(layer) {
    return (this._hash[layer.id] ? true : false);
  }

  find(layer) {
    if (typeof layer == "string")
      return this._hash[layer];
    else
      return this._hash[layer.id];

  }

  _onLayerChange(e) {
    var layer = e.from;
    this.fire("change", { "type": "change", "layer": layer });
  }

  _initLayerEvents(layer) {
    layer.on("change", this._layerChangeHandler);
  }
  _clearLayerEvents(layer) {
    layer.off("change", this._layerChangeHandler);
  }

  add(layer) {

    if (!(layer instanceof GSIBV.Map.Layer.Unknown)) {
      // 確認ダイアログ表示
      for( var key in GSIBV.CONFIG.CONFIRM_LAYERS ){
        var item = GSIBV.CONFIG.CONFIRM_LAYERS[key];
        var idx = item.layers.indexOf(layer.id);
        if ( idx >= 0 ) {
  
          if ( !GSIBV.application.showLayerConfirm(layer, item) ) {
            return;
          }
        }
      }
      
    }

    if (this._hash[layer.id]) {
      if (this._hash[layer.id] instanceof GSIBV.Map.Layer.Unknown) {

        for (var i = 0; i < this._list.length; i++) {
          if (this._list[i].id == layer.id) {

            var oldLayer = this._list[i];
            this._clearLayerEvents(oldLayer);
            this._list[i]._remove(this._map);

            this._initLayerEvents(layer);
            layer.visible = oldLayer.visible;
            layer.opacity = oldLayer.opacity;
            layer._add(this._map);

            this._hash[layer.id] = layer;
            this._list[i] = layer;
            this.refreshLayerOrder();
            this.fire("remove", { "layer": oldLayer });
            this.fire("change", { "type": "remove", "layer": oldLayer });
            this.fire("add", { "layer": layer, "reason":"replace" });
            this.fire("change", { "type": "add", "layer": layer });
            break;
          }
        }
      }

      return null;
    }

    if (!layer._add(this._map)) return null;
    this._initLayerEvents(layer);
    this._hash[layer.id] = layer;
    this._addToList( layer );
    this.refreshLayerOrder();
    //console.log( this._map.map.getStyle());
    this.fire("add", { "layer": layer });
    this.fire("change", { "type": "add", "layer": layer });
    return layer;

  }

  _addToList( layer ) {
    this._list.push(layer);
  }

  remove(layer) {
    layer = this.find(layer);

    if (!layer) return layer;
    this._clearLayerEvents(layer);
    layer._remove(this._map);

    delete this._hash[layer.id];

    for (var i = 0; i < this._list.length; i++) {
      if (this._list[i].id == layer.id) {
        this._list.splice(i, 1);
        break;
      }
    }

    this.fire("remove", { "layer": layer });
    this.fire("change", { "type": "remove", "layer": layer });
    this.refreshLayerOrder();
    return layer;

  }

  clear() {
    for (var i = 0; i < this._list.length; i++) {
      this._clearLayerEvents(this._list[i]);
      this._list[i]._remove(this._map);
    }

    this._list = [];
    this._hash = {};
    this.fire("change", { "type": "clear" });
  }

  getLayerIndex(layer) {
    for (var i = 0; i < this._list.length; i++) {
      if (layer.id == this._list[i].id) {
        return i;
      }
    }
    return -1;
  }
  up(layer, inc) {
    var idx = this.getLayerIndex(layer);
    if (idx < 0) return;
    var to = idx - inc;
    var tmp = this._list[idx];

    for (var i = idx; i > to; i--) {
      this._list[i] = this._list[i - 1];
    }
    this._list[to] = tmp;
    this.refreshLayerOrder();

  }
  down(layer, inc) {
    var idx = this.getLayerIndex(layer);
    if (idx < 0) return;
    var to = idx + inc;
    var tmp = this._list[idx];

    for (var i = idx; i < to; i++) {
      this._list[i] = this._list[i + 1];
    }

    this._list[to] = tmp;

    this.refreshLayerOrder();

  }

  refreshLayerOrder() {
    for (var i = 0; i < this._list.length; i++) {
      this._list[i].moveToFront();
    }

    this.fire("order", { "type": "move" });
  }
}


GSIBV.Map.Layer = class extends MA.Class.Base {

  constructor(options) {
    super();
    this._map = null;
    this._title = "";
    this._id = "";
    this._mapid = "";
    this._type = "unknown";
    this._visible = true;
    this._opacity = 1.0;
    this._html = "";
    this._legendUrl = "";
    this._minzoom = 2;
    this._maxzoom = 18;

    if (options) {
      if (options.visible != undefined) this._visible = options.visible;
      if (options.opacity != undefined) this._opacity = options.opacity;
      if (options.opacity != undefined) this._defaultOpacity = options.opacity;
      if (options.id) this._id = options.id;
      if (options.title) this._title = options.title;
      if (options.html) this._html = options.html;
      if (options.legendUrl) this._legendUrl = options.legendUrl;
      if (options.minzoom != undefined) this._minzoom = options.minzoom;
      if (options.maxzoom != undefined) this._maxzoom = options.maxzoom;
      if (options.maxNativeZoom != undefined) this._maxNativeZoom = options.maxNativeZoom;
    }
  }

  static getUnqNumber() {
    if (!GSIBV.Map.Layer._uniqNumber)
      GSIBV.Map.Layer._uniqNumber = 1;

    var result = GSIBV.Map.Layer._uniqNumber;
    GSIBV.Map.Layer._uniqNumber++;

    return result;
  }


  get type() { return this._type; };
  get map() { return this._map; };
  get added() { return (this._map ? true : false); }
  get id() { return this._id; }
  get title() { return this._title; }
  set title(title) { this._title = title; }
  get html() { return this._html; }
  get legendUrl() { return this._legendUrl; }
  get minzoom() { return this._minzoom; }
  get maxzoom() { return this._maxzoom; }
  get maxNativeZoom() { return this._maxNativeZoom; }
  get mapid() {
    if (this._mapid == "") {
      this._mapid = "__gsibv_layer__" + GSIBV.Map.Layer.getUnqNumber();
    }
    return this._mapid;
  }

  
  getTitle() {
    if ( !GSIBV.CONFIG.LANG ) return this._title;

    var lang = ( GSIBV.application ? GSIBV.application.lang : "ja" );
    
    var title = this._title;
    if ( lang != "ja") {
      var titleLang = GSIBV.CONFIG.LANG[lang.toUpperCase()].LAYER[title];
      if ( titleLang != undefined) title = titleLang;
    }
    return title; 
  }

  
  get visible() {
    return this._visible; //this.getVisible();
  }

  set visible(visible) {

    if (this._map) {
      this.setVisible(visible);
    }
    this._visible = visible;
    this.fire("change");
  }

  get opacity() {
    return this._opacity; //this.getVisible();
  }

  set opacity(opacity) {
    if (this._map && this.setOpacity) {
      this.setOpacity(opacity);
    }
    this._opacity = opacity;
    this.fire("change");
  }

  add(map) {
    map.addLayer(this);
  }

  remove() {
    if (this._map) this._map.removeLayer(this);
  }

  _add(map) {
    this._map = map;
  }


  _remove(map) {
    this._map = null;
  }

  moveToFront() {
    this._moveToFront();
  }
}

GSIBV.Map.Layer.TYPES = {
  "unknown": "不明"
};

GSIBV.Map.Layer.FILTERS = [];


GSIBV.Map.Layer.generate = function (l) {

  var result = null;

  for (var i = 0; i < GSIBV.Map.Layer.FILTERS.length; i++) {

    result = GSIBV.Map.Layer.FILTERS[i](l);

    
    if (result) break;
  }

  if (!result) {
    result = new GSIBV.Map.Layer.Unknown(l);
  } else {
    result._path = [];

    var target = l.parent;
    while(target) {
      if ( target.title == undefined || target.title == "") {
        target = target.parent;
        continue;
      }
      result._path.unshift( target );
      target = target.parent;
    }
  }

  return result;
};




GSIBV.Map.Layer.Unknown = class extends GSIBV.Map.Layer {

  constructor(options) {
    super(options);
    this._type = "unknown";

    this._url = "";

    if (options) {
      this._url = (options.url ? options.url : "");
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

  }


  _add(map) {
    super._add(map);

    if (!map.map.getLayer(this.mapid)) {

      map.map.addLayer({
        "id": this.mapid,
        "type": "background",
        "paint": {
          "background-color": "rgba(255,255,255,0)"
        }


      });
    }

    return true;
  }

  _remove(map) {
    if (!map) return;

    this._map.map.removeLayer(this.mapid);
    super._remove(map);
  }


  _moveToFront() {
    var map = this._map.map;
    map.moveLayer(this.mapid);
  }

}


/*
GSIBV.Map.Layer.Item = class extends MA.Class.Base {
    
    constructor() {
        super();

        this._items = [];
        
        this._minZoom = 0;
        this._maxZoom = 18;
        this._title = "";
        this._id = "";
        this._url = "";
    }

    get minZoom() {return this._minZoom}
    get maxZoom() {return this._maxZoom}
    get title() {return this._title}
    get id() {return this._id}
    get url() {return this._url }
}
*/