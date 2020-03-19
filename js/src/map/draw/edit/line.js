/*****************************************************************
 * GSIBV.Map.Draw.LineEditor
 * 地物ライン編集
******************************************************************/


GSIBV.Map.Draw.LineEditor = class extends GSIBV.Map.Draw.FeatureEditor {
  constructor(map, targetFeature) {
    super( map, targetFeature);
    this._minCoordinatesLength = 2;
  }
  
  _createControls() {
    var editor = new GSIBV.Map.Draw.Control.LineEditor(  this._map, this.targetFeature.coordinates, this._minCoordinatesLength);
    editor.on("update",MA.bind(function(){
      this.targetFeature.update();
      if ( this._layer ) this._layer.update();
    },this));

    this._editor = editor;
    this._controls.push(editor);

  }
  /*
  _createControls() {
    
    var prevLatLng = null;
    var prevMarker = null;
    this._markers = [];
    this._centerMarkers = [];

    var coordinates = this.getCoordinates();

    for( var i=0; i<coordinates.length; i++ ) {
      var latlng = coordinates[i];
      var marker = new GSIBV.Map.Draw.Control.Marker ( this._map, latlng, true );
      this._initMarker( marker, i );
      this._controls.push(marker);
      this._markers.push(marker);

      // 間のマーカー
      if ( prevLatLng ) {
        var centerMarker = this._createCenterMarker( prevMarker, marker);
        this._controls.push(centerMarker);
        this._centerMarkers.push(centerMarker);

        prevMarker.next = marker;
        marker.center = centerMarker;
        marker.prev = prevMarker;
      }

      prevLatLng = latlng
      prevMarker = marker;

    }
  }

  _createCenterMarker(prevMarker, nextMarker) {
    var centerlatLng = GSIBV.Map.Draw.LatLng.getCenter(prevMarker.position, nextMarker.position);
    var centerMarker = new GSIBV.Map.Draw.Control.Marker ( this._map, centerlatLng, true );
    centerMarker.backgroundColor = "rgba(255,255,255,0.2)";
    centerMarker.border= "1px solid rgba(0,0,0,0.3)";
    centerMarker.on("move", MA.bind(this._onCenterMarkerMove, this ));


    centerMarker.next = nextMarker;
    centerMarker.prev = prevMarker;
    return centerMarker;
  }

  _initMarker(marker, idx) {
    marker.index = idx;
    marker.backgroundColor = this._markerBackgroundColor;
    marker.border= this._markerBorder;

    marker.on("move", MA.bind(this._onMarkerMove, this ));
    marker.on("rightdown", MA.bind(this._onMarkerRightDown, this ));
  }


  _onMarkerMove(evt) {
    var marker = evt.from;

    if ( marker.prev && marker.center) {
      marker.center.position = GSIBV.Map.Draw.LatLng.getCenter(marker.prev.position, marker.position);
    }

    if ( marker.next && marker.next.center) {
      marker.next.center.position = GSIBV.Map.Draw.LatLng.getCenter(marker.next.position, marker.position);
    }
    
    this.targetFeature.coordinates.update(marker.index, marker.position);
    this.targetFeature.update();
  }

  _onMarkerRightDown(evt) {

    var coordinates = this.getCoordinates();

    if ( coordinates.length <=this._minCoordinatesLength ) return;
    var marker = evt.from;
    this.targetFeature.coordinates.remove(marker.index);
    this.targetFeature.update();

    this.destroyControls();
    this._createControls();

  }

  _onCenterMarkerMove(evt) {
    //console.log( evt );
    var marker = evt.from;

    var idx = this._centerMarkers.indexOf( marker );
    this._centerMarkers.splice( idx,1);

    marker.clearEvents();

    this._markers.splice( marker.next.index, 0,  marker );
    this._initMarker( marker,marker.next.index);

    this.targetFeature.coordinates.insert(marker.next.index, marker.position);
    var target = marker.next;
    while( target ) {
      target.index++;
      target = target.next;
    }
    marker.next.center = null;
    marker.next.prev = marker;
    marker.prev.next = marker;



    var centerMarker = this._createCenterMarker( marker.prev, marker);
    marker.center = centerMarker;
    this._controls.push(centerMarker);


    centerMarker = this._createCenterMarker( marker, marker.next);
    marker.next.center = centerMarker;
    this._controls.push(centerMarker);

    
    this.targetFeature.update();

  }
  */
};