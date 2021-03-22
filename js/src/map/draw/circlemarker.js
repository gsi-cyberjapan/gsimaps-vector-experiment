/*****************************************************************
 * GSIBV.Map.Draw.Circle
 * Circleクラス
******************************************************************/
GSIBV.Map.Draw.CircleMarker = class extends GSIBV.Map.Draw.MarkerBase{

  constructor() {
    super();
    this._style = new GSIBV.Map.Draw.CircleMarker.Style();
  }

  setJSON(json) {
    super.setJSON(json);
  }

  get markerType() {
    return GSIBV.Map.Draw.CircleMarker.MarkerType;
  }

  _addMapboxStyleToHash(hash) {
    
    super._addMapboxStyleToHash(hash);
    GSIBV.Map.Draw.Line.addMapboxStyleToHash( this, hash );
    GSIBV.Map.Draw.Polygon.addMapboxStyleToHash( this, hash );

    hash["_radius"] = this._style.radius;

    if ( this._style.stroke ) {
      hash["_lineColor"] = this._style.color;
      hash["_lineOpacity"] = this._style.opacity;
    }

    
    if ( this._style.fill ) {
      hash["_backgroundColor"] = this._style.fillColor;
      hash["_backgroundOpacity"] = this._style.fillOpacity;
    }

    if ( this._style.dashArray ) {
      hash["_lineDashArray"] = this._style.dashArray;
    }

    hash["_radius"] = this._style.radius;
    
  }

  getFrameBounds( map, padding) {
    if ( !padding) padding = 0;

    var latlng = this._coordinates.position;
    var centerPos = map.project(latlng);
    
    var radius = this.style.radius;
    padding += 20;

    var minX = centerPos.x - Math.ceil( radius );
    var minY = centerPos.y - Math.ceil( radius );
    var maxX = centerPos.x + Math.ceil( radius );
    var maxY = centerPos.y + Math.ceil( radius );


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
};


GSIBV.Map.Draw.CircleMarker.MarkerType = "CircleMarker";


/*****************************************************************
 * GSIBV.Map.Draw.CircleMarker.Style
 * CircleMarkerスタイルクラス
******************************************************************/
GSIBV.Map.Draw.CircleMarker.Style = class extends GSIBV.Map.Draw.Circle.Style{
  
  constructor() {
    super();


  }

  
  _getHash() {
    var hash = super._getHash();
    
    hash["_markerType"] = "CircleMarker";
  
    return hash;
  }
  

};