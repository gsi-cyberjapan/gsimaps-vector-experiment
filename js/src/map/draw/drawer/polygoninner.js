/*****************************************************************
 * GSIBV.Map.Draw.LineDrawer
 * ライン作成クラス
******************************************************************/
GSIBV.Map.Draw.PolygonInnerDrawer = class extends GSIBV.Map.Draw.PolygonDrawer {

  constructor(map, layer) {
    super(map, layer);
  }
  set parentFeature(feature) {
    this._parentFeature = feature;
  }
  _addLatLng(latlng) {
    this._feature.coordinates.set( this._latlngs );
    this._feature.coordinates.add( this._currentPosition);
    if ( this._checkInnerChild(this, this._parentFeature,this._feature)) {
      return;
    }
    if ( this._latlngs.length >= 3 ) {
      if ( this._checkCrossing(latlng)) {
        return;
      }
    }
    this._latlngs.push(latlng);
    this._feature.coordinates.set( this._latlngs );
    this._editor.recreate();
    this._layer.update();

    this._updateTooltip();
  }

  _onMouseMove(evt) {
    var pos = this._pagePosToCanvasPos(evt);
    this._currentPosition = this._map.map.unproject(pos);

    this._feature.coordinates.set( this._latlngs );
    this._feature.coordinates.add( this._currentPosition);
    this._layer.update();

    this.fire("move");
    this._currentMousePos = {
      pageX : evt.pageX,
      pageY : evt.pageY
    }
    this._toolTip.errorMessage = "";

    if ( this._feature.coordinates.length >= 3 ) {
      if ( this._checkCrossing(this._feature.coordinates.get(this._feature.coordinates.length-1)) ) {
        this._toolTip.errorMessage = "ポリゴンが交差しています";
        return;
      }
    }
    if ( this._checkInnerChild(this, this._parentFeature,this._feature) ) {
      return;
    }
  }
  _checkInnerChild( drawer, feature, childFeature) {
    var coordinates = childFeature.coordinates;

    //// 外との交差
    var inner0 = [];

    for( var i=0; i<coordinates.length; i++ ) {
      inner0.push([coordinates.get(i).lng, coordinates.get(i).lat]);
    }
    inner0.push([coordinates.get(0).lng, coordinates.get(0).lat]);

    var outer = [];
    for( var i=0; i<feature.coordinates.length; i++ ) {
      outer.push([feature.coordinates.get(i).lng, feature.coordinates.get(i).lat]);
    }
    outer.push([feature.coordinates.get(0).lng, feature.coordinates.get(0).lat]);

    if ( !MA.isPolygonInPolygon( inner0, outer) ) {
      drawer._toolTip.errorMessage = "対象のポリゴン内を指定して下さい";
      return true;
    }

    // 内同士の判定
    var innerList = feature.innerList;
    for( var i=0; i<innerList.length; i++ ) {
      var innerCoordinates = innerList[i];

      var inner = [];

      for( var j=0; j<innerCoordinates.length; j++ ) {
        inner.push([innerCoordinates.get(j).lng, innerCoordinates.get(j).lat]);
      }
      inner.push([innerCoordinates.get(0).lng, innerCoordinates.get(0).lat]);
      if ( MA.isPolygonInPolygon( inner0, inner) ) {
        drawer._toolTip.errorMessage = "中抜きポリゴン同士が交差しています";
        return true;
      }
      if ( MA.polygonIntersects( inner0,inner ) ) {
        drawer._toolTip.errorMessage = "中抜きポリゴン同士が交差しています";
        return true;
      }
    }

    drawer._toolTip.errorMessage = "";
    return false;
  }

  _startEdit() {}
  _makerFeature() {
    var polygon = new GSIBV.Map.Draw.Polygon();
    polygon.style.fillOpacity = 0;
    return polygon;
  }
};

GSIBV.Map.Draw.PolygonInnerDrawer.Type = "PolygonInnerDrawer";