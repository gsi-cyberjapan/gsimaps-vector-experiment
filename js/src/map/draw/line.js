/*****************************************************************
 * GSIBV.Map.Draw.Line
 * LineStringクラス
******************************************************************/
GSIBV.Map.Draw.Line = class extends GSIBV.Map.Draw.Feature{
  constructor() {
    super();
    this._coordinatesMinLength = 2;
    this._style = new GSIBV.Map.Draw.Line.Style();
  }

  get geometryType () {
    return GSIBV.Map.Draw.Line.Type;
  }

  _getCoordinatesArray() {
    return this._coordinates.toGeoJSON();
  }

  arrayToCoordinate(coordinates) {
    var result = new GSIBV.Map.Draw.Feature.Coordinates();
    if ( coordinates && MA.isArray( coordinates ) ) {
      for( var i=0; i<coordinates.length; i++ ) {
        var arr = coordinates[i];
        if ( !MA.isArray( arr ) || arr.legth <2 ) continue;
        var latlng = new GSIBV.Map.Draw.LatLng(arr);
        if ( latlng ) result.add(  latlng);
      }
    }

    return result;
  }

  setJSON(json) {
    super.setJSON(json);
    var coordinates = ( json.geometry && json.geometry.coordinates ? json.geometry.coordinates : undefined );
    
    this._coordinates = this.arrayToCoordinate( coordinates);

  }

  static addMapboxStyleToHash( feature, hash ) {
    if ( !feature._style) return;
    

    if( !feature._style.stroke) {
      return;
    } 


    function convertColor(color, opacity) {
      var c = MA.Color.parse(color);
      if (c) {
        return "rgba(" + c.r + "," + c.g + "," + c.b + "," + opacity + ")";
      } else return color;
    }

    var color = convertColor( feature._style.color, feature._style.opacity);
    hash["_color"] = color;
    hash["_weight"] = feature._style.weight;
    
    var dashArray = feature._style.dashArray;
    
    hash["_dashArray"] = 0;
    if ( dashArray ) {
      hash["_dashArray"] = 1;
      if ( dashArray.length == 2 && dashArray[0] == 1 && dashArray[0] *2 == (dashArray[1]/feature._style.weight) )  {
        hash["_dashArray"] = 2;
      }
    }

  }
  _addMapboxStyleToHash(hash) {
    super._addMapboxStyleToHash(hash);
    GSIBV.Map.Draw.Line.addMapboxStyleToHash( this, hash );
  }


};

GSIBV.Map.Draw.Line.Type = "LineString";

GSIBV.Map.Draw.FeatureFilters.push( function(json){
  if( json.geometry && json.geometry.type == GSIBV.Map.Draw.Line.Type) {
    var line = new GSIBV.Map.Draw.Line();
    line.setJSON(json);
    return line;
  }

  return null;
});


/*****************************************************************
 * GSIBV.Map.Draw.Line.Style
 * LineStringスタイルクラス
******************************************************************/
GSIBV.Map.Draw.Line.Style = class extends GSIBV.Map.Draw.Feature.Style{

  constructor() {
    super();


  }

  copyFrom(from) {
    super.copyFrom(from);
    if ( !from ) return;
    this._opacity = from._opacity;
    this._stroke = from._stroke; 
    this._color = from._color;
    this._weight = from._weight; 
    this._dashArray = from._dashArray;
    this._lineCap = from._lineCap; 
    this._lineJoin = from._lineJoin; 
  }
  clear() {
    super.clear();
    this._opacity = 0.5;
    this._stroke = true; 
    this._color = "#000000";
    this._weight = 3; 
    this._dashArray = undefined;
    this._lineCap = undefined; 
    this._lineJoin = undefined; 
  }

  setJSON(properties) {
    if ( properties["_stroke"] != undefined ) {
      this.stroke = properties["_stroke"];
    } 
    if ( properties["_color"] != undefined ) {
      this.color = properties["_color"];
    } 
    if ( properties["_weight"] != undefined ) {
      this.weight = properties["_weight"];
    } 
    if ( properties["_dashArray"] != undefined ) {
      this.dashArray = properties["_dashArray"];
    } 
    if ( properties["_lineCap"] != undefined ) {
      this.lineCap = properties["_lineCap"];
    } 
    if ( properties["_lineJoin"] != undefined ) {
      this.lineJoin = properties["_lineJoin"];
    } 
    
    super.setJSON(properties);

  }
  

  _getHash() {
    var hash = super._getHash();

    if ( this._stroke != undefined) {
      hash["_stroke"] = this._stroke ? true : false;
    }

    if ( this._color != undefined) {
      hash["_color"] = this._color;
    }

    if ( this._weight != undefined) {
      hash["_weight"] = parseInt( this._weight );
    }

    if ( this._dashArray != undefined) {
      hash["_dashArray"] = this._dashArray;
    }

    if ( this._lineCap != undefined) {
      hash["_lineCap"] = this._lineCap;
    }

    if ( this._lineJoin != undefined) {
      hash["_lineJoin"] = this._lineJoin;
    }

    return hash;
  }
  

  get stroke() {
    return this._stroke == undefined ? true : this._stroke;
  }

  get color() {
    return this._color == undefined ? "#000000" : this._color;
  }

  get weight() {
    return this._weight == undefined ? 3 : this._weight;
  }

  get dashArray() {
    return this._dashArray;
  }

  get lineCap() {
    return this._lineCap;
  }

  get lineJoin() {
    return this._lineJoin;
  }



  set stroke(value) {
    this._stroke = value ? true : false;
  }

  set color(value) {
    this._color = value;
  }

  set weight(value) {
    this._weight = ( value != undefined ? parseInt(value) : undefined );
  }

  set dashArray(value) {

    try {
      if ( value == undefined || MA.isArray(value)) {
        this._dashArray = value;
      } else if ( MA.isString(value)) {
        var parts = value.split(",");
        this._dashArray = [];
        for( var i=0; i<parts.length; i++ ) {
          this._dashArray.push( parseInt(parts[i]));
        }
      } else {
        this._dashArray = undefined;
      }

      if ( this._dashArray == undefined) return;
      if ( this._dashArray.length <= 0 ) {
        this._dashArray = undefined;
      } else {
        
        
        for( var i=0; i<this._dashArray.length; i++ ) {
          this._dashArray[i] = parseInt(this._dashArray[i]);

        }
      }
    } catch(e) {
      this._dashArray = undefined;
    }
  }

  set lineCap(value) {
    if ( value == undefined) {
      this._lineCap = value;
    } else {
      if ( ["butt", "round", "square" ,"inherit"].indexOf(value) < 0)
        value = "round";
      this._lineCap = value;
    }
  }

  set lineJoin(value) {

    if ( value == undefined) {
      this._lineJoin = value;
    } else {
      if ( ["miter", "round", "bevel" ,"inherit"].indexOf(value) < 0)
        value = "round";
      this._lineJoin = value;
    }

  }
}
