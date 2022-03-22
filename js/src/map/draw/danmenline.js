/*****************************************************************
 * GSIBV.Map.Draw.DanmenLine
 * LineStringクラス
******************************************************************/
GSIBV.Map.Draw.DanmenLine = class extends GSIBV.Map.Draw.Feature{
  constructor() {
    super();
    this._coordinatesMinLength = 2;
    this._style = new GSIBV.Map.Draw.DanmenLine.Style();
  }

  get geometryType () {
    return "LineString";
  }

  get innerList() {
    return this._innerList;
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

  toMapboxGeoJSON() {
    if ( this._coordinates.length < 2 ) {
      return super.toMapboxGeoJSON();
    }

    if(this._style._geodesic == 1){
      var lineCoordinates = this._createGeodesicLine(this._coordinates._coordinates )
      var properties = this._properties.hash;
      this._addMapboxStyleToHash(properties);

      var coordinates = [];
      for( var i=0; i<lineCoordinates.length; i++ ) {
        coordinates.push( lineCoordinates[i].toGeoJSON() );
      }
      var geojson = {
        "type": "Feature",
        "geometry": {
          "type": GSIBV.Map.Draw.Line.Type,
          "coordinates": coordinates
        },
        "properties": properties
      };
      return geojson;
    } else {
      return super.toMapboxGeoJSON();
    }
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
    GSIBV.Map.Draw.DanmenLine.addMapboxStyleToHash( this, hash );
  }

  //
  _coordinatesEqual(x, y) {
    return x._lat === y._lat && x._lng === y._lng;
  }

  _coordinatePairs(array) {
    return array.slice(0, -1)
      .map((value, index) => [value, array[index + 1]])
      .filter(pair => !this._coordinatesEqual(pair[0], pair[1]));
  }
    
  _createGeodesicLine(coordinates, steps = 32) {
    const segments = this._coordinatePairs(coordinates);
  
    const geodesicSegments = segments.map(segment => {
      const greatCircle = new arc.GreatCircle(
        { x: segment[0]._lng, y: segment[0]._lat },
        { x: segment[1]._lng, y: segment[1]._lat }
      );
      return greatCircle.Arc(steps, { offset: 90 }).json();
    });
  
    // arc.js returns the line crossing antimeridian split into two MultiLineString segments
    // (the first going towards to antimeridian, the second going away from antimeridian, both in range -180..180 longitude)
    // fix Mapbox rendering by merging them together, adding 360 to longitudes on the right side
    let worldOffset = 0;
    const geodesicCoordinates = geodesicSegments.map(geodesicSegment => {
      if (geodesicSegment.geometry.type === "MULTI_LINE_STRING") {
        const prevWorldOffset = worldOffset;
        const nextWorldOffset = worldOffset + (geodesicSegment.geometry.coordinates[0][0][0] > geodesicSegment.geometry.coordinates[1][0][0] ? 1 : -1);
        const geodesicCoordinates = [
          ...geodesicSegment.geometry.coordinates[0].map(x => [x[0] + prevWorldOffset * 360, x[1]]),
          ...geodesicSegment.geometry.coordinates[1].map(x => [x[0] + nextWorldOffset * 360, x[1]])
        ];
        worldOffset = nextWorldOffset;
        return geodesicCoordinates;
      } else {
        const geodesicCoordinates = geodesicSegment.geometry.coordinates.map(x => [x[0] + worldOffset * 360, x[1]]);
        return geodesicCoordinates;
      }
    }).flat();
  
    return geodesicCoordinates.map((values, index) => new GSIBV.Map.Draw.LatLng(values))
            .filter((coord, index) => index === geodesicCoordinates.length - 1 || !this._coordinatesEqual(coord, geodesicCoordinates[index + 1]));
  };
};

GSIBV.Map.Draw.DanmenLine.Type = "DanmenLine";

GSIBV.Map.Draw.FeatureFilters.push( function(json){
  if( json.geometry && json.geometry.type == GSIBV.Map.Draw.DanmenLine.Type) {
    var line = new GSIBV.Map.Draw.DanmenLine();
    line.setJSON(json);
    return line;
  }

  return null;
});


/*****************************************************************
 * GSIBV.Map.Draw.DanmenLine.Style
 * LineStringスタイルクラス
******************************************************************/
GSIBV.Map.Draw.DanmenLine.Style = class extends GSIBV.Map.Draw.Feature.Style{

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
    this._geodesic = from._geodesic;
  }
  clear() {
    super.clear();
    this._opacity = 1;
    this._stroke = true; 
    this._color = "#0000ff";
    this._weight = 3; 
    this._dashArray = undefined;
    this._lineCap = undefined; 
    this._lineJoin = undefined; 
    this._geodesic = 1;
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

    if ( this._geodesic != undefined) {
      hash["_geodesic"] = parseInt( this._geodesic );
    }

    return hash;
  }
  

  get stroke() {
    return this._stroke == undefined ? true : this._stroke;
  }

  get color() {
    return this._color == undefined ? "#0000ff" : this._color;
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

  get geodesic() {
    return this._geodesic == undefined ? 1 : this._geodesic;
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
  set geodesic(value) {
    this._geodesic = ( value != undefined ? parseInt(value) : undefined );
  }
}
