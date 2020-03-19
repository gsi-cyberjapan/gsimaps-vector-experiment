/*****************************************************************
 * GSIBV.Map.Draw.MultiPolygon
 * MultiPolygonクラス
******************************************************************/
GSIBV.Map.Draw.MultiPolygon = class extends GSIBV.Map.Draw.Feature{
  constructor() {
    super();
    this._coordinatesMinLength = 3;
    this._style = new GSIBV.Map.Draw.Polygon.Style();

    this._polygonList = [];
  }

  
  get bounds() {
    var result = new GSIBV.Map.Draw.Bounds();
    for( var i=0; i<this._polygonList.length; i++ ) {
      var bounds = this._polygonList[i].bounds;
      result.add( bounds) ;
    }
    
    return result;
  }

  get polygons() {
    return this._polygonList;
  }
  get geometryType () {
    return GSIBV.Map.Draw.MultiPolygon.Type;
  }

  get isValid() {
    return ( this._polygonList.length > 0 );
  }

  getFrameBounds( map, padding) {
    if ( !padding) padding = 0;

    var minX = undefined;
    var minY = undefined;
    var maxX = undefined;
    var maxY = undefined;

    for( var i=0; i< this._polygonList.length; i++ ) {
      for( var j=0; j<this._polygonList[i]._coordinates.length; j++ ) {
        var pos = map.project(this._polygonList[i]._coordinates.get(j));

        if ( minX == undefined || minX > pos.x) minX = pos.x;
        if ( minY == undefined || minY > pos.y) minY = pos.y;
        if ( maxX == undefined || maxX < pos.x) maxX = pos.x;
        if ( maxY == undefined || maxY < pos.y) maxY = pos.y;
      }
    }


    var result = {
      left : Math.floor( minX - padding ),
      top : Math.floor( minY - padding ),
      right : Math.ceil( maxX + padding ),
      bottom : Math.ceil( maxY + padding )
    };
    result.width = result.right - result.left;
    result.height = result.bottom - result.top;
    return result;
  }

  setJSON(json) {
    super.setJSON(json);
    this._polygonList = [];
    var coordinates = ( json.geometry && json.geometry.coordinates ? json.geometry.coordinates : undefined );
    
    if ( coordinates ) {
      for( var i=0; i<coordinates.length; i++ ) {
        var polygon = new GSIBV.Map.Draw.Polygon();
        polygon.setJSON({
          "type": "Feature",
          "properties": {},
          "geometry": {
            "type": "Polygon",
            "coordinates" : coordinates[i]
          }
        });
        polygon._style = this._style;
        if ( polygon.isValid)this._polygonList .push(polygon);
      }
    }
  }


  _addMapboxStyleToHash(hash) {
    
    super._addMapboxStyleToHash(hash);
    GSIBV.Map.Draw.Polygon.addMapboxStyleToHash( this, hash );

    
  }

  update() {
    for( var i=0; i<this._polygonList.length; i++ ) {
      this._polygonList[i].update();
    }
    super.update();
  }

    
  toMapboxGeoJSON() {
    var features = [];
    
    for( var i=0; i<this._polygonList.length; i++ ) {
      features.push( this._polygonList[i].toMapboxGeoJSON() );
    }

    return features;
  }


  toGeoJSON() {
    var properties = this._properties.hash;
    this._addStyleToHash(properties);

  
    var coordinates = [];

    
    for( var i=0; i<this._polygonList.length; i++ ) {
      coordinates.push( this._polygonList[i]._getCoordinatesArray() );
    }

    var geojson = {
      "type": "Feature",
      "geometry": {
        "type": this.geometryType, 
        "coordinates": coordinates
      },
      "properties": properties
    };
    return geojson;
  }

};


GSIBV.Map.Draw.MultiPolygon.Type = "MultiPolygon";

GSIBV.Map.Draw.FeatureFilters.push( function(json){
  if( json.geometry && json.geometry.type == GSIBV.Map.Draw.MultiPolygon.Type) {
    //console.log( json);
    var feature = new GSIBV.Map.Draw.MultiPolygon();
    feature.setJSON(json);
    return feature;
  }

  return null;
});

