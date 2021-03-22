GSIBV.Map.Layer.TYPES["multi"] = "複数レイヤ";
GSIBV.Map.Layer.FILTERS.push(function (l) {
  if ((l._type && ( l._type == "multi" || l._type == "layerset") ) || l.isMulti) {

    var layer = new GSIBV.Map.Layer.Multi({
      "id": l.id,
      "title": l.title,
      "type": (l._type && ( l._type == "multi" || l._type == "layerset") ) ? l._type : "multi",
      "html": l.html,
      "legendUrl": l.legendUrl,
      "minzoom": l.minZoom,
      "maxzoom": l.maxZoom,
      "minNativeZoom": l.minNativeZoom,
      "maxNativeZoom": l.maxNativeZoom

    });

    var list = (l.children ? l.children : l.entries);
    if ( !list ) list = l.layers;
    if (list) {
      for (var i = 0; i < list.length; i++) {
        for (var j = 0; j < GSIBV.Map.Layer.FILTERS.length; j++) {
          var childLayer = GSIBV.Map.Layer.FILTERS[j](list[i]);
          if (childLayer) {
            layer.addChild(childLayer);
            break;
          }
        }
      }
    }
    return layer;
  }

});


GSIBV.Map.Layer.Multi = class extends GSIBV.Map.Layer {

  constructor(options) {
    super(options);
    this._type = "multi";
    this._url = "";
    this._children = [];
    if (options) {
      this._type = (options.type ? options.type : "multi");
      this._minzoom = (options.minZoom ? options.minZoom : (options.minzoom ? options.minzoom : null));
      this._maxzoom = (options.maxZoom ? options.maxZoom : (options.maxzoom ? options.maxzoom : null));
      this._maxNativeZoom = (options.maxNativeZoom ? options.maxNativeZoom : null);
      this._minNativeZoom = (options.minNativeZoom ? options.minNativeZoom : null);
    }

  }

  get children() { 
    return this._children;
  }

  
  get entries() { 
    return this._children;
  }

  addChild(child) {
    this._children.push(child);

  }
  getVisible() {
    var map = this._map.map;
  }

  setVisible(visible) {
    var map = this._map.map;

    for (var i = 0; i < this._children.length; i++) {
      this._children[i].setVisible(visible);
    }

  }
  getOpacity() {
    var map = this._map.map;
    return this._opacity;
  }

  setOpacity(opacity) {
    opacity = opacity != undefined ? opacity : 1;
    for( var i=0; i<this._children.length; i++ ) {

      var layer = this._children[i];
      var op=opacity;
      if ( layer._defaultOpacity != undefined ) {
        op *= layer._defaultOpacity;
      }
      layer.setOpacity( op);
    }
    this._opacity = opacity;
  }

  _add(map) {
    super._add(map);

    for (var i = 0; i < this._children.length; i++) {
      this._children[i]._add(map);
    }



    return true;
  }

  _remove(map) {
    super._remove(map);


    for (var i = 0; i < this._children.length; i++) {
      this._children[i]._remove(map);
    }

  }

  _moveToFront() {


    for (var i = 0; i < this._children.length; i++) {
      this._children[i]._moveToFront();
    }

  }
}
