/*****************************************************************
 * GSIBV.Map.Draw.MarkerBase
 * Marker基底クラス
******************************************************************/
GSIBV.Map.Draw.MarkerBase = class extends GSIBV.Map.Draw.Feature{

  constructor() {
    super();
    this._coordinatesMinLength = 1;
    this._style = new GSIBV.Map.Draw.Marker.Style();
  }

  
  get geometryType () {
    return GSIBV.Map.Draw.Marker.Type;
  }

  setJSON(json) {
    super.setJSON(json);
    var coordinates = ( json.geometry && json.geometry.coordinates ? json.geometry.coordinates : undefined );
    
    this._coordinates = new GSIBV.Map.Draw.Feature.Coordinates();
    this._coordinates.position = new GSIBV.Map.Draw.LatLng( coordinates );
  }

  get markerType() {
    return "Marker";
  }

  _addMapboxStyleToHash(hash) {
    super._addMapboxStyleToHash(hash);
    
    hash["-sakuzu-marker-type"] = this.markerType;
  }
};


GSIBV.Map.Draw.FeatureFilters.push( function(json){
  if( json.geometry && json.geometry.type == GSIBV.Map.Draw.Marker.Type) {
    var marker = null;

    if ( json.properties ) {
      if ( json.properties["_markerType"] == "CircleMarker") {
        marker = new GSIBV.Map.Draw.CircleMarker();
      } else if ( json.properties["_markerType"] == "Circle") {
        marker = new GSIBV.Map.Draw.Circle();
      } else if ( json.properties["_markerType"] == "DivIcon") {
        marker = new GSIBV.Map.Draw.DivMarker();
      } else if ( json.properties["_markerType"] == "Icon") {
        marker = new GSIBV.Map.Draw.Marker();
      } else {
        marker = new GSIBV.Map.Draw.Marker();
      }
    }
    //console.log( marker );
    if ( marker ) marker.setJSON(json);
    return marker;
  }

  return null;
});


/*****************************************************************
 * GSIBV.Map.Draw.Marker
 * Markerクラス
******************************************************************/
GSIBV.Map.Draw.Marker = class extends GSIBV.Map.Draw.MarkerBase{

  constructor() {
    super();
    this._style = new GSIBV.Map.Draw.Marker.Style();
  }

  setJSON(json) {
    super.setJSON(json);
  }

  get markerType() {
    return GSIBV.Map.Draw.Marker.MarkerType;
  }

  getFrameBounds( map, padding) {
    if ( !padding) padding = 0;

    var latlng = this._coordinates.position;
    var centerPos = map.project(latlng);
    
    var iconWidth = 20;
    var iconHeight = 20;
    padding += 20;

    if ( this.style.iconSize ) {
      iconWidth = this.style.iconSize[0];
      iconHeight = this.style.iconSize[1];
    }
    var minX = centerPos.x - Math.ceil( iconWidth / 2 );
    var minY = centerPos.y - Math.ceil( iconHeight / 2 );
    var maxX = centerPos.x + Math.ceil( iconWidth / 2 );
    var maxY = centerPos.y + Math.ceil( iconHeight / 2 );


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
    if ( this._style.iconUrl )
      hash["_iconUrl"] = this._style.iconUrl;
    if ( this._style.iconSize )
      hash["_iconSize"] = this._style.iconSize;
    if ( this._style.iconAnchor )
      hash["_iconAnchor"] = this._style.iconAnchor;
    
  }
  
};

GSIBV.Map.Draw.Marker.Type = "Point";
GSIBV.Map.Draw.Marker.MarkerType = "Icon";



/*****************************************************************
 * GSIBV.Map.Draw.Marker.Style
 * Markerスタイルクラス
******************************************************************/
GSIBV.Map.Draw.Marker.Style = class extends GSIBV.Map.Draw.Feature.Style{

  constructor() {
    super();


  }


  copyFrom(from) {
    super.copyFrom(from);
    if ( !from ) return;
    this._iconUrl = from._iconUrl;
    this._iconSize = from._iconSize; 
    this.iconAnchor = from.iconAnchor;
  }
  clear() {
    super.clear();
    this._iconUrl = GSIBV.CONFIG.SAKUZU.SYMBOL.URL + GSIBV.CONFIG.SAKUZU.SYMBOL.DEFAULTICON; 
    this._iconSize = JSON.parse( JSON.stringify( GSIBV.CONFIG.SAKUZU.SYMBOL.ICONSIZE ) ); 
    this.iconAnchor = JSON.parse( JSON.stringify( GSIBV.CONFIG.SAKUZU.SYMBOL.ICONANCHOR ) ); 
  }

  setJSON(properties) {
    if ( properties["_iconUrl"] != undefined ) {
      this.iconUrl = properties["_iconUrl"];
    } 
    if ( properties["_iconSize"] != undefined ) {
      this.iconSize = properties["_iconSize"];
    } 
    if ( properties["_iconAnchor"] != undefined ) {
      this.iconAnchor = properties["_iconAnchor"];
    } 
    
    
    super.setJSON(properties);

  }
  

  _getHash() {
    var hash = super._getHash();

    hash["_markerType"] = GSIBV.Map.Draw.Marker.MarkerType;

    if ( this._iconUrl != undefined) {
      hash["_iconUrl"] = this._iconUrl;
    }
    
    if ( this._iconSize != undefined) {
      hash["_iconSize"] = this._iconSize;
    }
    
    if ( this._iconAnchor != undefined) {
      hash["_iconAnchor"] = this._iconAnchor;
    }

    return hash;
  }
  

  get iconUrl() {
    return this._iconUrl;
  }
  get iconSize() {
    return this._iconSize;
  }
  get iconAnchor() {
    return this._iconAnchor;
  }

  set iconUrl(value) {
    this._iconUrl = value;
  }
  set iconSize(value) {
    if ( value == undefined )
      this._iconSize = value;
    else if ( MA.isArray(value) && value.length == 2 ) {
      this._iconSize = [parseInt(value[0]), parseInt(value[1])];
    }
  }
  set iconAnchor(value) {
    if ( value == undefined )
      this._iconAnchor = value;
    else if ( MA.isArray(value) && value.length == 2 ) {
      this._iconAnchor = [parseInt(value[0]), parseInt(value[1])];
    }
  }
};
