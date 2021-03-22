/*****************************************************************
 * GSIBV.Map.Draw.LineDrawer
 * ライン作成クラス
******************************************************************/

GSIBV.Map.Draw.PolygonDrawer = class extends GSIBV.Map.Draw.LineDrawer {

  constructor(map, layer) {
    super(map, layer);
  }
  get type() {
    return GSIBV.Map.Draw.Polygon.Type;
  }
  
  _getDistance(latlng) {
    if ( !this._latlngs || this._latlngs.length <= 1 || ( this._latlngs.length == 2 && !latlng ) )  return undefined;
    // ここで面積計算

    return {"distance":0, "type":"area" };
  }

  
  _addLatLng(latlng) {
    if ( this._latlngs.length >= 3 ) {
      
      if ( this._checkCrossing(latlng) ) {
        return;
      }

    }
    super._addLatLng(latlng);
  }

  _onMouseMove(evt) {
    super._onMouseMove(evt);
    if ( this._feature.coordinates.length > 3 ) {
      if ( this._checkCrossing(this._feature.coordinates.get(this._feature.coordinates.length-1)) ) {
        this._toolTip.errorMessage = "ポリゴンが交差しています";
        return;
      }
    }

    this._toolTip.errorMessage = "";


  }

  _checkCrossing(newLatLng) {
    
    if ( this._latlngs.length < 3 ) return false;

    var lines = [];
    
    lines.push([this._latlngs[0], newLatLng]);
    lines.push([this._latlngs[this._latlngs.length-1], newLatLng]);

    for( var i=0; i<lines.length; i++ ) {
      var line = lines[i];

      for( var j=0; j<this._latlngs.length-1; j++ ) {
        var line2 = [];
        line2.push( this._latlngs[j], this._latlngs[j+1]);
        if ( MA.lineIntersects( 
            line[0].lng, line[0].lat, line[1].lng, line[1].lat, 
            line2[0].lng, line2[0].lat,line2[1].lng, line2[1].lat )) {
          return true;
        }
      }
    }
    return false;
  }


  /*
  _popLatLng() {

    if ( this._latlngs.length == 2 ) {
      var latlngs = this._latlngs;
      this._latlngs = [];
      this._destroyFeature();
      this._createFeature();
      this._latlngs = latlngs;
    }
    super._popLatLng();

    
  }
  */
  _makerFeature() {
    return new GSIBV.Map.Draw.Polygon();
  }


  _createEdit( feature) {
    return new GSIBV.Map.Draw.PolygonEditor( this._map, feature);
  }

};