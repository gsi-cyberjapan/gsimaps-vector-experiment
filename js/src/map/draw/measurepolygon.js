/*****************************************************************
 * GSIBV.Map.Draw.MeasurePolygon
 * MeasurePolygonクラス
******************************************************************/
GSIBV.Map.Draw.MeasurePolygon = class extends GSIBV.Map.Draw.Line{
  constructor() {
    super();
    this._coordinatesMinLength = 3;
    this._style = new GSIBV.Map.Draw.MeasurePolygon.Style();

    this._innerList = [];
  }

  get geometryType () {
    // return GSIBV.Map.Draw.MeasurePolygon.Type;
    return "Polygon";
  }

  get innerList() {
    return this._innerList;
  }
  
  _getCoordinatesArray() {
    var arr = [];
    if ( this._coordinates.length <= 2 ) {
      arr = this._coordinates.toGeoJSON();
    } else{
      arr = [ this._coordinates.toGeoJSON({close:true}) ];
    }

    if ( this._innerList ) {
      for( var i=0; i<this._innerList.length; i++) {
        var innerArr = this._innerList[i].toGeoJSON({close:true});
        arr.push(innerArr);
      }
    }

    return arr;
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
  toMapboxGeoJSON() {
    var type = this._coordinates.length > 2 ? this.geometryType : GSIBV.Map.Draw.Line.Type;

    var properties = this._properties.hash;
    this._addMapboxStyleToHash(properties);
    if ( this._visible ) properties["-sakuzu-visible"] = this._visible;
    if ( type != this.geometryType ) delete properties["_fillColor"];
    
    var arr = this._getCoordinatesArray();
    if ( this._style._geodesic == 1 ) {
      if ( type == this.geometryType ) {
        var newArr = [];
        for( var idx=0; idx < arr.length; idx++ ) {
          var lineCoordinate = this.arrayToCoordinate(arr[idx]);
          var lineCoordinates = this._createGeodesicLine(lineCoordinate._coordinates);
          var tempArr=[];
          for( var i=0; i<lineCoordinates.length; i++ ) {
            tempArr.push( lineCoordinates[i].toGeoJSON() );
          }
          newArr.push(tempArr);
        }
        arr = newArr
      } else {
        var lineCoordinate = this.arrayToCoordinate(arr);
        var lineCoordinates = this._createGeodesicLine(lineCoordinate._coordinates);
        arr = [];
        for( var i=0; i<lineCoordinates.length; i++ ) {
          arr.push( lineCoordinates[i].toGeoJSON() );
        }
      }
    }
    var geojson = {
      "type": "Feature",
      "geometry": {
        "type": type,
        "coordinates": arr
      },
      "properties": properties
    };
    return geojson;
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
    var fillColor = convertColor( feature._style.fillColor, feature._style.fillOpacity);
    hash["_fillColor"] = fillColor;
    
  }

  _addMapboxStyleToHash(hash) {
    super._addMapboxStyleToHash(hash);
    GSIBV.Map.Draw.Polygon.addMapboxStyleToHash( this, hash );
  }

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

GSIBV.Map.Draw.MeasurePolygon.Type = "MeasurePolygon";


GSIBV.Map.Draw.FeatureFilters.push( function(json){console.log(json);
  if( json.geometry && json.geometry.type == GSIBV.Map.Draw.MeasurePolygon.Type) {
    var feature = new GSIBV.Map.Draw.MeasurePolygon();
    feature.setJSON(json);
    return feature;
  }

  return null;
});


/*****************************************************************
 * GSIBV.Map.Draw.MeasurePolygon.Style
 * Polygonスタイルクラス
******************************************************************/
GSIBV.Map.Draw.MeasurePolygon.Style = class extends GSIBV.Map.Draw.MeasureLine.Style{

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
    this._fillOpacity = from._fillOpacity; 
    this._fill = from._fill;
    this._fillColor = from._fillColor; 
    this._geodesic = from._geodesic;  
  }

  clear() {
    super.clear();
    this._opacity = 0.5;
    this._stroke = true; 
    this._color = "#ff0000";
    this._weight = 3; 
    this._dashArray = [1, 3*2];
    this._lineCap = undefined; 
    this._lineJoin = undefined; 
    this._fillOpacity = 0.5; 
    this._fill = true; 
    this._fillColor = "#FF0000";
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

    if ( this._fill != undefined) {
      hash["_fill"] = this._fill ? true : false;
    }

    if ( this._color != undefined) {
      hash["_fillColor"] = this._fillColor;
    }

    if ( this._fillOpacity != undefined) {
      hash["_fillOpacity"] = parseFloat( this._fillOpacity );
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
    return this._color == undefined ? "#ff0000" : this._color;
  }

  get weight() {
    return this._weight == undefined ? 3 : this._weight;
  }

  get dashArray() {
    return this._dashArray == undefined ? [1, 3*2] : [1, this._weight*2];
  }

  get lineCap() {
    return this._lineCap;
  }

  get lineJoin() {
    return this._lineJoin;
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
  
  set fill(value) {
    this._fill = value ? true : false;
  }

  set fillColor(value) {
    this._fillColor = value;
  }

  set fillOpacity(value) {
    this._fillOpacity = ( value != undefined ? parseFloat(value) : undefined );
  }

  set geodesic(value) {
    this._geodesic = ( value != undefined ? parseInt(value) : undefined );
  }
}
