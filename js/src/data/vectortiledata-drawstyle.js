GSIBV.VectorTileData.DrawInfoBase = class {
  constructor(data) {
    this.fromHash(data);
  }

  
  copyTo( dest ) {
    
    if( this._data )
      dest._data = JSON.parse( JSON.stringify(this._data));
    else dest._data = undefined;

    return dest;
  }
  toData() {
    if ( !this._data ) return {};

    return JSON.parse( JSON.stringify(this._data) );
  }
  fromHash(hash) {
    if (!hash) return;
    this._data = JSON.parse( JSON.stringify(hash));
  }

};

GSIBV.VectorTileData.DrawStyleBase = class {
  constructor(data) {
    this._data = {};
  }

  get data() {
    return this._data;
  }

  toData() {
    var result = {};

    result["info"] = ( this._info ? this._info.toData() : {} );
    result["draw"] = JSON.parse( JSON.stringify(this._data) );

    return result;
  }
  
  _deleteIconStyle (data) {
    for( var key in data ) {
      if ( key.indexOf( "icon-") == 0 ) {
        delete data[key];
      }
    }
  }
  _deleteTextStyle (data) {
    for( var key in data ) {
      if ( key.indexOf( "text-") == 0 ) {
        delete data[key];
      }
    }
  }
  _deleteFillStyle(data) {
    for( var key in data ) {
      if ( key.indexOf( "fill-") == 0 ) {
        delete data[key];
      }
    }
  }
  _deleteLineStyle(data) {
    for( var key in data ) {
      if ( key.indexOf( "line-") == 0 ) {
        delete data[key];
      }
    }
  }

  hasOutline() {
    if ( !this._data) return false;
    for( var key in this._data ) {
      if ( key.indexOf("outline-") == 0 ) return true;
    }
    return false;

  }
  getValue(key) {
    return this._data[key];
  }

  equals(data) {
    return (JSON.stringify(this._data) == JSON.stringify(data.data));

  }
};




// paint
GSIBV.VectorTileData.PaintType = {
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
GSIBV.VectorTileData.LayoutType = {
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
  "symbol": {
    "icon-size": {},
    "icon-text-fit": {},
    "icon-text-fit-padding": {},
    "icon-image": {},
    "icon-anchor": {},
    "icon-pitch-alignment": {},
    "icon-rotation-alignment": {},

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
    "icon-allow-overlap": {},
    "icon-ignore-placement": {},
    "text-optional": {},
    "symbol-placement": {},
    "symbol-z-order": {},
    "visibility": {}

  }
};
