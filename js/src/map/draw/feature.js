
if ( !GSIBV.Map.Draw) GSIBV.Map.Draw = {};

/*****************************************************************
 * GSIBV.Map.Draw.FeatureCollection
 * 地物リスト
******************************************************************/
GSIBV.Map.Draw.FeatureCollection = class extends MA.Class.Base {
  constructor() {
    super();
    this._features = [];
    this._featureUpdateHandler = MA.bind( this._onFeatureUpdate, this );
  }

  get length() {
    return this._features.length;
  }

  get( idx ) {
    return this._features[idx];
  }


  add(feature) {
    this._features.push(feature);
    feature.on("update",this._featureUpdateHandler);
    this.fire( "change");
  }

  clear() {
    this._features = [];
    this.fire( "change");
  }

  remove(feature) {
    var idx = this._features.indexOf(feature);
    if ( idx >= 0 ) {
      this._features.splice(idx,1);
      this.fire( "change");

    }
  }

  destroy() {
    delete this._features;
    this._features = [];
  }

  toGeoJSON(onlyFeatures) {

    
    var json = {
      "type": "FeatureCollection",
      "features": []
    };

    for( var i=0; i<this._features.length; i++ ) {
      var feature = this._features[i];
      json.features.push( feature.toGeoJSON() );
    }

    return (onlyFeatures ? json.features : json );
  }

  get bounds() {
    var result = new GSIBV.Map.Draw.Bounds();
    for( var i=0; i<this._features.length; i++ ) {
      var feature = this._features[i];
      var bounds = feature.bounds;

      result.add( bounds);
    }

    return result;
  }

  toMapboxGeoJSON() {
    var json = {
      "type": "FeatureCollection",
      "features": []
    };

    for( var i=0; i<this._features.length; i++ ) {
      var feature = this._features[i];
      var geojson = feature.toMapboxGeoJSON();
      if ( !MA.isArray(geojson)) geojson = [geojson];
      for( var j=0; j<geojson.length; j++)
        json.features.push( geojson[j]);
    }

    return json;
  }


  setJSON(json) {
    this._features = [];
    if ( !json.features || !MA.isArray(json.features ) || json.features.length <= 0 ) return false;
    var features = json.features;
    for( var i=0; i<features.length; i++) {
      var feature = null;;
      
      for( var j=0; j<GSIBV.Map.Draw.FeatureFilters.length; j++ ) {
        var filter = GSIBV.Map.Draw.FeatureFilters[j];
        feature = filter( features[i]);
        if ( feature ) break;
      }
      if ( feature && feature.isValid) {
        this._features.push(feature);
        feature.on("update",this._featureUpdateHandler)
      }
    }

    return ( this._features.length > 0 );

  }

  _onFeatureUpdate() {
    this.fire( "change");
  }
};

GSIBV.Map.Draw.FeatureCollection.generate = function(json) {
  var result = new GSIBV.Map.Draw.FeatureCollection();
  if ( result.setJSON(json))return result;
  else return undefined;
};

/*****************************************************************
 * GSIBV.Map.Draw.Feature
 * 地物基底クラス
******************************************************************/

GSIBV.Map.Draw.FeatureFilters = [];

GSIBV.Map.Draw.Feature = class extends MA.Class.Base {
  constructor() {
    super();
    this._id = MA.getId("draw");
    this._properties = new GSIBV.Map.Draw.Feature.Properties();
    this._coordinates = new GSIBV.Map.Draw.Feature.Coordinates();
    this._coordinatesMinLength = 0;
    this._visible  = true;
  }

  get title() {return this._properties.get("name");}
  set title(value) {
    this._properties.set("name", value );
  }
  get typeCaption() {return "unknown";}

  get properties() {return this._properties;}
  get style() {return this._style;}
  get coordinatesMinLength() {return this._coordinatesMinLength;}

  set visible(value) {
    this._visible = value;
  }

  get coordinates() {return this._coordinates;}

  get bounds() {
    var minLat = undefined;
    var maxLat = undefined;
    var minLng = undefined;
    var maxLng = undefined;

    for( var i=0; i<this._coordinates.length; i++ ) {
      var latlng = this._coordinates.get(i);
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

  set style( value ) {
    this._style.copyFrom( value );
  }

  getFrameBounds( map, padding) {
    if ( !padding) padding = 0;

    var minX = undefined;
    var minY = undefined;
    var maxX = undefined;
    var maxY = undefined;

    for( var i=0; i<this._coordinates.length; i++ ) {
      var pos = map.project(this._coordinates.get(i));

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


  set position(latlng) {
    if( this._coordinates.length > 0 ) { 
      if ( !this._coordinates.get(0).equals( latlng )) {
        this._coordinates[0] = latlng;
        this.fire("change");
      }
    } else {
      this._coordinates.push( latlng );
      this.fire("change");
    }
  }

  get isValid() {
    var valid = true;
    if ( this._coordinates.length < this._coordinatesMinLength ) {
      valid = false;
    }
    return valid;
  }

  update() {
    this.fire("update");
  }

  equals(feature) {
    if ( !feature || !feature.toGeoJSON) return false;
    
    // geojsonを生成し文字列に変換後　比較
    return (
      JSON.stringify(this.toGeoJSON()) == JSON.stringify(feature.toGeoJSON()) 
    );

  }

  setJSON( json ) {
    this._coordinates.clear();
    this._properties.clear();
    if ( this._style ) this._style.clear();

    if ( json.properties ) {
      var properties = JSON.parse( JSON.stringify(json.properties) );
      if( this._style ) this._style.setJSON( properties );
      for( var key in properties ) {
        if ( key != "" && key.charAt(0) == "_") delete properties[key];
      }
      this._properties.setJSON( properties );
    }
  }


  /*---------------------------------------------
   * 以下geojson生成
  ----------------------------------------------*/
  
  toGeoJSON() {
    var properties = this._properties.hash;
    this._addStyleToHash(properties);

    var geojson = {
      "type": "Feature",
      "geometry": {
        "type": this.geometryType, 
        "coordinates": this._getCoordinatesArray()
      },
      "properties": properties
    };
    return geojson;
  }

  toMapboxGeoJSON() {

    var properties = this._properties.hash;
    this._addMapboxStyleToHash(properties);

    if ( this._visible ) properties["-sakuzu-visible"] = this._visible;
    var geojson = {
      "type": "Feature",
      "geometry": {
        "type": this.geometryType, 
        "coordinates": this._getCoordinatesArray()
      },
      "properties": properties
    };
    return geojson;
  }

  get geometryType () {
    return "";
  }

  _getCoordinatesArray() {
    if ( !this.isValid) return null;
    if ( this._coordinatesMinLength == 1 ) {
      //　ポイント
      return this._coordinates.get(0).toGeoJSON();
    }

    // その他はそれぞれの継承クラスで実装
    return [];
  }

  

  // 
  _addStyleToHash(hash) {
    if ( !this._style) return;
    
    var styleHash = this._style.hash;

    for( var key in styleHash ) {
      hash[key] = styleHash[key];
    }
  }
  
  _addMapboxStyleToHash( hash ) {
    hash["-sakuzu-id"] = this._id;
    hash["-sakuzu-title"] = "[作図] ";
    hash["-sakuzu-type"] = this.geometryType;
    if ( this.title) {
      hash["-sakuzu-title"] += this.title;
    } else {
      hash["-sakuzu-title"] += "名称未設定";
    }

    var html ="";

    if ( hash["name"]) {
      html = "<h3>" + hash["name"] + "</h3>"
    }

    if ( hash["description"]) {
      
      html += hash["description"];
    } else {
      var properties = this._properties.hash;

      var table ="<table>";
      var rowCount = 0;
      for( var key in properties) {
        if ( key == "name") continue;
        var value = properties[key] ;
        table+="<tr>";
        table += "<th>" + key + "</th>";
        table += "<td>" + value+ "</td>";
        table+="</tr>";
        rowCount++;
      }
      table+="</table>";
      if ( rowCount > 0 ) html += table;
    }

    if ( html != "" ) {
      hash["-gsibv-popupContent"] =html;
    }
  }

};



/******************************************************************
 * GSIBV.Map.Draw.LatLng
 * 緯度経度クラス
******************************************************************/

GSIBV.Map.Draw.LatLng = class {
  constructor(latlng) {
    if ( MA.isArray(latlng)) {
      if ( latlng.length >=2 ) {
        this._lat = latlng[1];
        this._lng = latlng[0];
        this._alt = ( latlng.length >=3 ? latlng[2] : 0 );
      } else {
        
        this._lat = undefined;
        this._lng = undefined;
        this._alt = 0;
      }
    } else {
      this._lat = ( latlng && ( latlng.lat != undefined ) ? latlng.lat : undefined);
      this._lng = ( latlng && ( latlng.lng != undefined ) ? latlng.lng : undefined);
      this._alt = ( latlng && ( latlng.alt != undefined ) ? latlng.alt : 0);
    }
  }

  get lat () { return this._lat;}
  get lng () { return this._lng;}
  get alt () { return this._alt;}

  set lat( lat) { this._lat = lat;}
  set lng( lng) { this._lng = lng;}
  set alt( alt) { this._alt = alt;}

  get isValid() { return ( this._lat  != undefined && this._lng != undefined ) }


  clone() {
    var result = new GSIBV.Map.Draw.LatLng();
    result._lat = this._lat;
    result._lng = this._lng;
    result._alt = this._alt;
    
    return result;
  }

  equals( latlng ) {
    return ( latlng.lat == this._lat && latlng.lng == this._lng && latlng.alt == this._alt );
  }

  toGeoJSON() {

    return [this._lng, this._lat, this._alt];
  }
};

GSIBV.Map.Draw.LatLng.getCenter = function(latlng1, latlng2) {

  var lat = latlng1.lat - ( (latlng1.lat - latlng2.lat ) / 2 );
  var lng = latlng1.lng - ( (latlng1.lng - latlng2.lng ) / 2 );

  return new GSIBV.Map.Draw.LatLng( { lat:lat,lng:lng,alt:latlng1.alt});
};



/******************************************************************
 * GSIBV.Map.Draw.Bounds
 * 緯度経度クラス
******************************************************************/

GSIBV.Map.Draw.Bounds = class {

  constructor( latlng, latlng2) {
    if ( latlng && latlng2) {
      this._nw = new GSIBV.Map.Draw.LatLng({
        lat : Math.max( latlng.lat, latlng2.lat),
        lng : Math.min( latlng.lng, latlng2.lng)
      });
    
      this._se = new GSIBV.Map.Draw.LatLng({
        lat : Math.min( latlng.lat, latlng2.lat),
        lng : Math.max( latlng.lng, latlng2.lng)
      });
    }
  }


  get northWest() { return this._nw;}
  get southEast() { return this._se;}

  get center() {
    if ( this._se && !this._nw) {
      return new GSIBV.Map.Draw.LatLng(this._se );
    } else if ( this._nw && !this._se) {
      return new GSIBV.Map.Draw.LatLng(this._nw );
    } else if ( this._se && this._nw ) {
      return new GSIBV.Map.Draw.LatLng({
        lat : this._se.lat +( ( this._nw.lat -this._se.lat) / 2 ),
        lng : this._nw.lng +( ( this._se.lng -this._nw.lng) / 2 )
      });
    }
  }

  add(latlng) {

    if ( latlng instanceof GSIBV.Map.Draw.LatLng ) {
      this._addLatLng( latlng);
    } else {
      this._addLatLng( latlng.northWest);
      this._addLatLng( latlng.southEast);
    }
  }

  _addLatLng( latlng ) {
    if ( !this._nw) {
      this._nw = new GSIBV.Map.Draw.LatLng(latlng);
      this._se = new GSIBV.Map.Draw.LatLng(latlng);
    } else {
      this._nw.lat = Math.max( this._nw.lat, latlng.lat);
      this._nw.lng = Math.min( this._nw.lng, latlng.lng);
      this._se.lat = Math.min( this._se.lat, latlng.lat);
      this._se.lng = Math.max( this._se.lng, latlng.lng);
    }
  }
};



/******************************************************************
 * GSIBV.Map.Draw.Feature.Coordinates
 * 緯度経度リストクラス
******************************************************************/
GSIBV.Map.Draw.Feature.Coordinates = class extends MA.Class.Base {

  constructor(coordinates) {
    super();
    this._coordinates = [];
  }

  get length () {
    return this._coordinates.length;
  }

  open() {
    if (this.closed) {
      this._coordinates.splice(this.length-1,1);
    }
  }

  set position(value) {
    if ( this._coordinates.length <= 0 )
      this._coordinates.push( new GSIBV.Map.Draw.LatLng(value) );
    else
      this._coordinates[0] = new GSIBV.Map.Draw.LatLng(value);

  }

  clone() {
    var result = new GSIBV.Map.Draw.Feature.Coordinates();
    result._coordinates = [];
    for( var i=0; i<this._coordinates.length; i++ ) {
      result.add( this._coordinates[i] );
    }
    return result;
  }

  
  get position() {
    if ( this._coordinates.length >= 1 ) {
      return this._coordinates[0];
    } else {
      return undefined;
    }
  }



  get closed() {
    if ( this._coordinates.length <= 2 ) return false;
    return this._coordinates[0].equals(this._coordinates[this.length-1]);
  }

  clear() {
    if ( this._coordinates.length > 0) {
      this._coordinates = [];
      this.fire("change");
    }
  }

  remove(idx) {
    if ( this._coordinates.length > idx) {
      this._coordinates.splice(idx,1);
      this.fire("change");
    }
  }

  update(idx,latlng) {
    this._coordinates[idx] = new GSIBV.Map.Draw.LatLng(latlng);
  }

  set(latlngs) {
    if ( !latlngs) return;
    if ( latlngs instanceof GSIBV.Map.Draw.Feature.Coordinates ) {
      this._coordinates = JSON.parse(JSON.stringify(latlngs._coordinates));
    } else {
      this._coordinates = [];
      for( var i=0; i<latlngs.length; i++) {
        this._coordinates.push( new GSIBV.Map.Draw.LatLng(latlngs[i]));
      }
    }
    this.fire("change");
  }

  insert( idx, latlng) {
    this._coordinates.splice( idx, 0,  latlng );
  }

  get( idx ) {
    return this._coordinates[idx];
  }

  add( latlng) {
    if ( !latlng ) return;

    if ( latlng.lat != undefined ) {
      this._coordinates.push( new GSIBV.Map.Draw.LatLng(latlng));
      this.fire("change");
    } else if ( latlng.length > 0 ) {
      for( var i=0; i<latlng.length; i++) {
        this._coordinates.push( new GSIBV.Map.Draw.LatLng(latlng[i]));
      }
      this.fire("change");
    }
  }


  toGeoJSON(option) {
    var list = [];
    var close = (option && option.close);

    if ( close && this.closed ) {
      close = false;
    }
    for( var i=0; i<this._coordinates.length; i++) {
      list.push(this._coordinates[i].toGeoJSON() );
    }
    if ( close ) {
      if ( this._coordinates.length > 0 )
        list.push(this._coordinates[0].toGeoJSON()  );
    }


    return list;
  }

};


/******************************************************************
 * GSIBV.Map.Draw.Feature.Properties
 * propertiesクラス
******************************************************************/

GSIBV.Map.Draw.Feature.Properties = class extends MA.Class.Base {
  constructor(properties) {
    super();
    this._properties = {};
    this.setProperties(properties);
  }

  get hash() {
    return JSON.parse( JSON.stringify(this._properties) );
  }
  clear() {
    this._properties = {};
  }
  
  set(key, value) {
    if ( value == undefined) {
      delete this._properties[key];
    } else {
      this._properties[key] = value;
    }
    this.fire("change");
  }

  get( key ) {
    return this._properties[key];
  }

  remove( key ) {
    delete this._properties[key];
    this.fire("change");
  }

  setJSON ( json ) {
    this._properties = {};
    this.setProperties(json);
  }

  setProperties( properties) {
    if ( !properties) return;
    var changed = false;
    for( var key in properties ) {
      if ( this._properties[key] != properties[key]) {
        changed = true;
        this._properties[key] = properties[key];
      }
    }
    if ( changed ) this.fire("change");
  }


};


GSIBV.Map.Draw.Feature.Style = class extends MA.Class.Base{

  constructor() {
    super();
    this.clear();
  }

  get hash() {
    return this._getHash();
  }

  copyFrom(from) {
    if ( !from ) return;
    this._clickable = from._clickable;
    this._className = from._className;
    this._opacity = from._opacity;
  }

  clear() {

    this._clickable = undefined;
    this._className = undefined; 
    this._opacity = undefined;
  }

  setJSON(properties) {
    if ( properties["_clickable"] != undefined ) {
      this.clickable = properties["_clickable"];
    } 
    if ( properties["_className"] != undefined ) {
      this.className = properties["_className"];
    } 
    if ( properties["_opacity"] != undefined ) {
      this.opacity = properties["_opacity"];
    } 

  }

  _getHash() {

    var hash = {};
    if ( this._clickable != undefined) {
      hash["_clickable"] = this._clickable ? true : false;
    }
    if ( this._className != undefined) {
      hash["_className"] = this._className;
    }
    if ( this._opacity != undefined) {
      hash["_opacity"] = parseFloat( this._opacity );
    }
    return hash;
  }

  get clickable() {
    return this._clickable == undefined ? false : this._clickable;
  }

  get className() {
    return this._className == undefined ? "" : this._className;
  }

  get opacity() {
    return this._opacity == undefined ? 1 : this._opacity;
  }


  set clickable(value) {
    this._clickable = value;
  }

  set className(value) {
    this._className = value;
  }

  set opacity(value) {
    this._opacity = ( value != undefined ? parseFloat(value) : undefined );
  }

}