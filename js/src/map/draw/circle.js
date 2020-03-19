/*****************************************************************
 * GSIBV.Map.Draw.Circle
 * Circleクラス
******************************************************************/
GSIBV.Map.Draw.Circle = class extends GSIBV.Map.Draw.MarkerBase{

  constructor() {
    super();
    this._style = new GSIBV.Map.Draw.Circle.Style();
  }

  setJSON(json) {
    super.setJSON(json);
  }

  get markerType() {
    return GSIBV.Map.Draw.Circle.MarkerType;
  }
  
  _addMapboxStyleToHash(hash) {
    
    super._addMapboxStyleToHash(hash);
    GSIBV.Map.Draw.Line.addMapboxStyleToHash( this, hash );
    GSIBV.Map.Draw.Polygon.addMapboxStyleToHash( this, hash );

    hash["-sakuzu-type"] = GSIBV.Map.Draw.Polygon.Type;
    hash["_radius"] = this._style.radius;
    
  }

  toMapboxGeoJSON() {
    // ポリゴンとして表示
    var properties = this._properties.hash;
    this._addMapboxStyleToHash(properties);
    var geojson = {
      "type": "Feature",
      "geometry": {
        "type": GSIBV.Map.Draw.Polygon.Type, 
        "coordinates": this._makerPolygonCoordinates(100)
      },
      "properties": properties
    };
    return geojson;
  }

  get bounds() {
    var minLat = undefined;
    var maxLat = undefined;
    var minLng = undefined;
    var maxLng = undefined;
    var coordinates = this._makerPolygonCoordinates(10)[0];

    for( var i=0; i<coordinates.length; i++ ) {
      var latlng = {lat:coordinates[i][1], lng:coordinates[i][0]};
      if ( minLat == undefined || minLat > latlng.lat) minLat = latlng.lat;
      if ( minLng == undefined || minLng > latlng.lng) minLng = latlng.lng;
      if ( maxLat == undefined || maxLat < latlng.lat) maxLat = latlng.lat;
      if ( maxLng == undefined || maxLng < latlng.lng) maxLng = latlng.lng;
    }

    return new GSIBV.Map.Draw.Bounds( 
      new GSIBV.Map.Draw.LatLng( {lat:minLat, lng:minLng}),
      new GSIBV.Map.Draw.LatLng( {lat:maxLat, lng:maxLng})
    );

  }

  getFrameBounds( map, padding) {
    if ( !padding) padding = 0;

    var coordinates = this._makerPolygonCoordinates(10)[0];

    padding += 20;

    var minX = undefined;
    var minY = undefined;
    var maxX = undefined;
    var maxY = undefined;

    for( var i=0; i<coordinates.length; i++ ) {
      var pos = map.project({lat:coordinates[i][1], lng:coordinates[i][0]});
      if ( minX == undefined || minX > pos.x) minX = pos.x;
      if ( minY == undefined || minY > pos.y) minY = pos.y;
      if ( maxX == undefined || maxX < pos.x) maxX = pos.x;
      if ( maxY == undefined || maxY < pos.y) maxY = pos.y;
      
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

  _makerPolygonCoordinates(numSides) {
    // 円→ポリゴン
    var radius = this._style.radius;
    var coordinates = [];
    var center = this._coordinates.position;
    var center_lat_rad = center.lat * Math.PI / 180;
    var center_lng_rad = center.lng * Math.PI / 180;
    var dmax_lat = radius / 6378137;
    var xys = [];
    xys.push([dmax_lat, 0]);
    for (var i = 1; i < numSides; i++) {
      var y = dmax_lat - 2 * dmax_lat / numSides * i;
      var x = 2 * Math.asin(Math.sqrt((Math.pow(Math.sin(dmax_lat / 2), 2) - Math.pow(Math.sin((y) / 2), 2)) / (Math.cos(center_lat_rad + y) * Math.cos(center_lat_rad))));
      if (x !== x) {
        return;
      } else {
        xys.push([y, x]);
      }
    }
    xys.push([-dmax_lat, 0]);
    for (var i = 1; i < numSides; i++) {
      xys.push([xys[numSides - i][0], -xys[numSides - i][1]]);
    }
    xys.push([dmax_lat, 0]);
    for (var i = 0; i < xys.length; i++) {
      coordinates.push(
        [
          (center_lng_rad + xys[i][1]) / (Math.PI / 180),
          (center_lat_rad + xys[i][0]) / (Math.PI / 180)
        ]);
    }


    return [coordinates];
  }
};


GSIBV.Map.Draw.Circle.MarkerType = "Circle";


/*****************************************************************
 * GSIBV.Map.Draw.Circle.Style
 * Circleスタイルクラス
******************************************************************/
GSIBV.Map.Draw.Circle.Style = class extends GSIBV.Map.Draw.Polygon.Style{

  constructor() {
    super();


  }

  clear() {
    super.clear();
    this._radius = 0;
  }

  setJSON(properties) {
    if ( properties["_radius"] != undefined ) {
      this.radius = properties["_radius"];
    } 
    
    super.setJSON(properties);

  }
  

  _getHash() {
    var hash = super._getHash();
    
    hash["_markerType"] = "Circle";
    
    if ( this._radius != undefined) {
      hash["_radius"] = this._radius ? this._radius : 0;
    }

    return hash;
  }
  

  get radius () {
    return this._radius == undefined ? 0 : this._radius;
  }

  set radius(value) {
    this._radius = ( value != undefined ? parseInt(value) : undefined );
  }
}

