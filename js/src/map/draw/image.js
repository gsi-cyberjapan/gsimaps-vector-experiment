/*****************************************************************
 * GSIBV.Map.Draw.Image
 * Imageクラス
******************************************************************/
GSIBV.Map.Draw.Image = class extends GSIBV.Map.Draw.MarkerBase{

  constructor() {
    super();
    this._imageUrl = null;
    this._style = new GSIBV.Map.Draw.Image.Style();
  }

  get markerType() {
    return GSIBV.Map.Draw.Image.MarkerType;
  }

  get imageUrl(){
    return this._imageUrl;
  }

  get coordinates(){
    return this._coordinates;
  }

  get notSave(){
    return this._notSave;
  }

  setJSON(json) {
    super.setJSON(json);

    var coordinates = ( json.geometry && json.geometry.coordinates ? json.geometry.coordinates : undefined );
    this._coordinates = new GSIBV.Map.Draw.Feature.Coordinates();
    this._coordinates.add(coordinates);

    if(json.properties){
      if(json.properties["_width"]) this._style.width = json.properties["_width"];
      if(json.properties["_height"]) this._style.height = json.properties["_height"];
      if(json.properties["_imageUrl"]) this._imageUrl = json.properties["_imageUrl"];
      if(json.properties["notSave"]) this._notSave = json.properties["notSave"];
    }
  }

  getFrameBounds( map, padding) {
    if ( !padding) padding = 0;
    padding += 20;
    
    var latlng = this._coordinates.position;
    var centerPos = map.project(latlng);
    var minX = centerPos.x - Math.ceil( this._style.width / 2 );
    var minY = centerPos.y - Math.ceil( this._style.height / 2 );
    var maxX = centerPos.x + Math.ceil( this._style.width / 2 );
    var maxY = centerPos.y + Math.ceil( this._style.height / 2 );

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
  
  _addMapboxStyleToHash(hash) {
    super._addMapboxStyleToHash(hash);

    if ( this._style.width )
      hash["_width"] = this._style.width;
    
    if ( this._style.height ) {
      hash["_height"] = this._style.height;
    }

    if ( this._imageUrl ){
      hash["_imageUrl"] = this._imageUrl;
    }
  }

  toMapboxGeoJSON(){
    var properties = this._properties.hash;
    this._addMapboxStyleToHash(properties);
    var geojson = {
      "type": "Feature",
      "geometry": {
        "type": GSIBV.Map.Draw.Marker.Type, 
        "coordinates": this._coordinates
      },
      "properties": properties
    };
    return geojson;
  }
};

GSIBV.Map.Draw.Image.MarkerType = "Image";



/*****************************************************************
 * GSIBV.Map.Draw.Image.Style
 * Imageスタイルクラス
******************************************************************/
GSIBV.Map.Draw.Image.Style = class extends GSIBV.Map.Draw.Feature.Style{

  constructor() {
    super();
  }

  copyFrom(from) {
    super.copyFrom(from);
    if ( !from ) return;
    this._width = from._width;
    this._height = from._height;
  }

  clear() {
    super.clear();
    this._width = undefined;
    this._height = undefined;
  }

  setJSON(properties) {
    super.setJSON(properties);
    this._width = properties["_width"] || this._width;
    this._height = properties["_height"] || this._height;
  }
  
  get width() { return this._width;}
  get height() { return this._height;}

  _parseSizeVal( value ) {
    var ret = undefined;

    if ( value == undefined) {
      return ret;
    }

    if ( MA.isString(value )) {
      if ( value.match(/^([1-9]\d*|0)(\.\d+)?/) ) {
        ret = parseFloat(value);
        if ( value.match(/px/) ) {
          ret = Math.round( this._fontSize/ 1.33 );
        }

      }
    } else {
      ret = parseFloat( value);
    }

    return ret;
  }

  set width( value ) {
    this._width = this._parseSizeVal(value);
  }
  set height( value ) {
    this._height = this._parseSizeVal(value);
  }

};
