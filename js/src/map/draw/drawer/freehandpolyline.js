/*****************************************************************
 * GSIBV.Map.Draw.FreehandPolylineDrawer
 * ライン作成クラス
******************************************************************/

GSIBV.Map.Draw.FreehandPolylineDrawer = class extends GSIBV.Map.Draw.FeatureDrawer {

  constructor(map, layer) {
    super(map, layer, true);
  }

  get type() {
    return GSIBV.Map.Draw.FreehandPolyline.Type;
  }
  
  start() {
    super.start();
    this._initEvents();
    this._latlngs = [];
    this._createFeature();
    this._map.map.getCanvasContainer().style.cursor = "default";
    this._toolTip.message = "マウスダウンで線の描画開始";
  }

  stop() {
    super.stop();
    this._map.map.getCanvasContainer().style.cursor = "";
    this._destroyEvents();
    if ( this._feature ) {
      this._feature.coordinates.set( this._latlngs );
      if ( this._editor) {
        this._editor.destroy();
        this._editor = undefined;
      }
      this._layer.update();
    }
  }

  _initEvents() {

    if ( !this._mapMoveHandler ) {
      this._mapMoveHandler = MA.bind( this._onMapMove, this );
      this._map.map.on("move", this._mapMoveHandler);
    }

    if ( !this._mouseDownHandler ) {
      this._mouseDownHandler = MA.bind( this._onMouseDown, this );
      MA.DOM.on( document.body, "mousedown", this._mouseDownHandler );
    }

    if ( !this._mouseUpHandler ) {
      this._mouseUpHandler = MA.bind( this._onMouseUp, this );
      MA.DOM.on( document.body, "mouseup", this._mouseUpHandler );
    }


    if ( !this._mouseMoveHandler ) {
      this._mouseMoveHandler = MA.bind( this._onMouseMove, this );
      MA.DOM.on( document.body, "mousemove", this._mouseMoveHandler );
    }

  }

  destroy() {
    this._map.map.getCanvasContainer().style.cursor = "";
    if ( this._featureEditor ) {
      this._featureEditor.destroy();
      this._featureEditor = undefined;
    }
    this._destroyFeature();

    this._destroyEvents();

    if ( this._mapMoveHandler ) {
      this._map.map.off("move", this._mapMoveHandler);
      this._mapMoveHandler = undefined
    }

    super.destroy();
  }

  _destroyEvents() {
    if ( this._clickHandler ) {
      MA.DOM.off( document.body, "click", this._clickHandler );
      this._clickHandler = undefined
    }
    if ( this._mouseDownHandler ) {
      MA.DOM.off( document.body, "mousedown", this._mouseDownHandler );
      this._mouseDownHandler = undefined
    }
    if ( this._mouseMoveHandler ) {
      MA.DOM.off( document.body, "mousemove", this._mouseMoveHandler );
      this._mouseMoveHandler = undefined
    }
  }

  _destroyFeature() {
    if ( this._feature ) {
      this._featureCollection.remove( this._feature );
    }
    if ( this._editor ) this._editor.destroy();
  }

  
  _makerFeature() {
    return new GSIBV.Map.Draw.FreehandPolyline();
  }
  
  _createEdit( feature) {
    return new GSIBV.Map.Draw.LineEditor( this._map, feature);
  }

  _createFeature() {
    var oldFeature = this._feature;
    this._feature = this._makerFeature();
    if ( oldFeature ) this._feature.style = oldFeature.style;
    this._editor = new GSIBV.Map.Draw.Control.LineEditor(  this._map, this._feature.coordinates, 2, true);
    this._editor.on("update",MA.bind(function(){
      this._feature.update();
    },this));

    this._featureCollection.add( this._feature );
    //this._layer = new GSIBV.Map.Draw.Layer( MA.getId("-gsi-draw-"), this._featureCollection );
    //this._layerList.add(this._layer);

  }

  _onMapMove() {
    if ( this._editor ) this._editor.refresh();
  }

  _getDistance(latlng) {
    if ( !this._latlngs || this._latlngs.length == 0 || ( this._latlngs.length == 1 && !latlng ) )  return undefined;

    var totalDistance = 0;
    for( var i=1; i<this._latlngs.length; i++ ) {
      totalDistance += GSI.Utils.DistanceCalculator.calc(
        this._latlngs[i-1], this._latlngs[i]
      );
    }

    if ( latlng ) {
      totalDistance += GSI.Utils.DistanceCalculator.calc(
        this._latlngs[this._latlngs.length-1], latlng
      );
    }
    return {"distance":totalDistance, "type":"distance" };
  }

  _addLatLng(latlng) {
    
    this._latlngs.push(latlng);
    this._feature.coordinates.set( this._latlngs );
    // this._editor.recreate();
    this._layer.update();


  }

  _onMouseMove(evt) {
    var pos = this._pagePosToCanvasPos(evt);
    
    if(this._isDrawing) {
      this._toolTip.message = "マウスボタンを離して終了";
      this._addLatLng( this._map.map.unproject(pos) );
    }
  }

  _onMouseDown(evt) {
    this._map.map.getCanvasContainer().style.cursor = "pointer";
    if(this._featureEditor) {
      return;
    }
    var canvasContainer = this._map.map.getCanvasContainer();
    var target = evt.target ;
    var hit = false;
    while( target ) {
      if ( target == canvasContainer ) {
        hit = true;
        break;
      }
      target = target.parentNode;
    }
    if ( !hit) {
      return;
    };
    evt.stopPropagation();
    evt.preventDefault();

    this._isDrawing = true;
    this._map._map.dragPan.disable();
    var pos = this._pagePosToCanvasPos(evt);
    this._startLatLng = this._map.map.unproject(pos);
    this._addLatLng( this._map.map.unproject(pos) );
  }
  _onMouseUp(evt) {
    this._map.map.getCanvasContainer().style.cursor = "default";
    evt.preventDefault();
    this._map._map.dragPan.enable();

    if(this._featureEditor) {
      return;
    }
    if(evt.target.tagName==="BUTTON") {
      return;
    }
    var canvasContainer = this._map.map.getCanvasContainer();
    var target = evt.target ;
    var hit = false;
    while( target ) {
      if ( target == canvasContainer ) {
        hit = true;
        break;
      }
      target = target.parentNode;
    }
    if ( !hit) return;
    
    if(this._isDrawing) {
      this._isDrawing = false;
      this._toolTip.message = "";

      var pos = this._pagePosToCanvasPos(evt);
      var ll = this._map.map.unproject(pos);
      
      this.stop();
      this.fire("create", {layer:this._layer, feature:this._feature});
      this._startEdit();
    }
  }


  _startEdit() {
    this._featureEditor = this._createEdit( this._feature);
    //console.log("作成後編集開始");
    this._featureEditor.layer = this._layer;
    this._featureEditor.start();
  }

};
