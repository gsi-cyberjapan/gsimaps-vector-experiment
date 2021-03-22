/*****************************************************************
 * GSIBV.Map.Draw.Polygon
 * Polygonクラス
******************************************************************/
GSIBV.Map.Draw.Polygon = class extends GSIBV.Map.Draw.Line{
  constructor() {
    super();
    this._coordinatesMinLength = 3;
    this._style = new GSIBV.Map.Draw.Polygon.Style();

    this._innerList = [];
  }

  get geometryType () {
    return GSIBV.Map.Draw.Polygon.Type;
  }

  get innerList() {
    return this._innerList;
  }
  

  setJSON(json) {
    super.setJSON(json);
    this._innerList =[];

    var coordinates = ( json.geometry && json.geometry.coordinates ? json.geometry.coordinates : undefined );
    if ( coordinates && MA.isArray( coordinates ) ) {
      var arrayType = this._getArrayType( coordinates );
      
      if ( arrayType == "flat") {
        this._coordinates = this.arrayToCoordinate(coordinates);
        this._coordinates.open();
      } else {
        this._coordinates = this.arrayToCoordinate(coordinates[0]);
        this._coordinates.open();
        for ( var i=1; i<coordinates.length; i++ ) {
          var innerCoordinate = this.arrayToCoordinate(coordinates[i]);
          innerCoordinate.open();
          if ( innerCoordinate.length > 0 ) this._innerList.push( innerCoordinate );
        }
      }
      
    }


  }

  _getArrayType( array) {
    if( !array|| array.length == 0) return undefined;
    if ( !MA.isArray( array[0] ) || array[0].length == 0 ) return "flat";
    if ( !MA.isArray( array[0][0] ) ) return "flat";
    
    return "double";
  }


  _getCoordinatesArray() {
    var arr = [ this._coordinates.toGeoJSON({close:true}) ];
    
    if ( this._innerList ) {
      for( var i=0; i<this._innerList.length; i++) {
        var innerArr = this._innerList[i].toGeoJSON({close:true});
        arr.push( innerArr);
      }
    }
    return arr;
  }

  static addMapboxStyleToHash( feature, hash ) {
    
    
    if ( !feature._style) return;

    if( !feature._style.fill) {
      return;
    } 


    function convertColor(color, opacity) {
      var c = MA.Color.parse(color);
      if (c) {
        return "rgba(" + c.r + "," + c.g + "," + c.b + "," + opacity + ")";
      } else return color;
    }

    var fillColor = convertColor( feature._style.fillColor, feature._style.fillOpacity);
    hash["_fillColor"] = fillColor;
    
  }


  _addMapboxStyleToHash(hash) {
    
    super._addMapboxStyleToHash(hash);
    GSIBV.Map.Draw.Polygon.addMapboxStyleToHash( this, hash );

    
  }

  toMapboxGeoJSON() {
    if ( this._coordinates.length > 2 ) {
      return super.toMapboxGeoJSON();
    }

    // 作図中　2点以下はラインで表示
    var properties = this._properties.hash;
    super._addMapboxStyleToHash(properties);
    var geojson = {
      "type": "Feature",
      "geometry": {
        "type": super.geometryType, 
        "coordinates": super._getCoordinatesArray()
      },
      "properties": properties
    };
    return geojson;
  }


};

GSIBV.Map.Draw.Polygon.Type = "Polygon";


GSIBV.Map.Draw.FeatureFilters.push( function(json){
  if( json.geometry && json.geometry.type == GSIBV.Map.Draw.Polygon.Type) {
    var feature = new GSIBV.Map.Draw.Polygon();
    feature.setJSON(json);
    return feature;
  }

  return null;
});


/*****************************************************************
 * GSIBV.Map.Draw.Polygon.Style
 * Polygonスタイルクラス
******************************************************************/
GSIBV.Map.Draw.Polygon.Style = class extends GSIBV.Map.Draw.Line.Style{

  constructor() {
    super();


  }

  copyFrom(from) {
    super.copyFrom(from);
    if ( !from ) return;
    this._opacity = from._opacity;
    this._fillOpacity = from._fillOpacity; 
    this._fill = from._fill;
    this._fillColor = from._fillColor; 
  
  }

  clear() {
    super.clear();
    this._opacity = 0.5;
    this._fillOpacity = 0.5; 
    this._fill = true; 
    this._fillColor = "#FF0000";
  }

  setJSON(properties) {
    if ( properties["_fill"] != undefined ) {
      this.fill = properties["_fill"];
    } 
    if ( properties["_fillColor"] != undefined ) {
      this.fillColor = properties["_fillColor"];
    } 
    if ( properties["_fillOpacity"] != undefined ) {
      this.fillOpacity = properties["_fillOpacity"];
    } 
    
    
    super.setJSON(properties);

  }
  

  _getHash() {
    var hash = super._getHash();

    if ( this._fill != undefined) {
      hash["_fill"] = this._fill ? true : false;
    }

    if ( this._color != undefined) {
      hash["_fillColor"] = this._fillColor;
    }

    if ( this._fillOpacity != undefined) {
      hash["_fillOpacity"] = parseFloat( this._fillOpacity );
    }

    return hash;
  }
  

  get fill() {
    return this._fill == undefined ? true : this._fill;
  }

  get fillColor () {
    return this._fillColor == undefined ? "#FF0000" : this._fillColor;
  }

  get fillOpacity () {
    return this._fillOpacity == undefined ? 0.5 : this._fillOpacity;
  }

  set fill(value) {
    this._fill = value ? true : false;
  }

  set fillColor(value) {
    this._fillColor = value;
  }

  set fillOpacity(value) {
    this._fillOpacity = ( value != undefined ? parseFloat(value) : undefined );
  }
}
