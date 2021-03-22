/*****************************************************************
 * GSIBV.Map.Draw.LineDrawer
 * ライン作成クラス
******************************************************************/

GSIBV.Map.Draw.LineDrawer = class extends GSIBV.Map.Draw.FeatureDrawer {

  constructor(map, featureCollection, layer) {
    super(map, featureCollection, layer);
  }

  get type() {
    return GSIBV.Map.Draw.Line.Type;
  }
  
  start() {
    super.start();
    this._initEvents();
    this._latlngs = [];
    this._createFeature();
    this._map.map.getCanvasContainer().style.cursor = "crosshair";
    this._updateTooltip();
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


    if ( !this._clickHandler ) {
      this._clickHandler = MA.bind( this._onClick, this );
      MA.DOM.on( document.body, "click", this._clickHandler );
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
    return new GSIBV.Map.Draw.Line();
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

  _updateTooltip() {
    this._toolTip.distanceCalculator = MA.bind( this._getDistance, this );
    if ( !this._latlngs || this._latlngs.length <= 0 ) {
      this._toolTip.message = "開始位置をクリック";
    } else {

      if ( this._latlngs.length >= this._feature.coordinatesMinLength ) {
        this._toolTip.message = "次の位置を選択(最終点をもう一度クリックして終了)" + 
          '<div class="mini">※右クリックで直前の点を取り消すことができます。</div>';
      }　else {
        this._toolTip.message = "次の位置を選択" + 
        '<div class="mini">※右クリックで直前の点を取り消すことができます。</div>';
      }
    }
  }
  _addLatLng(latlng) {
    
    this._latlngs.push(latlng);
    this._feature.coordinates.set( this._latlngs );
    this._editor.recreate();
    this._layer.update();

    this._updateTooltip();

  }

  
  _popLatLng() {
    
    if ( this._latlngs.length > 0 ) {
      this._latlngs.pop();
      this._feature.coordinates.set( this._latlngs );
      this._editor.recreate();
      this._layer.update();
    }

    this._updateTooltip();

  }


  _onMouseMove(evt) {
    
    var pos = this._pagePosToCanvasPos(evt);
    this._currentPosition = this._map.map.unproject(pos);

    this._feature.coordinates.set( this._latlngs );

    if ( this._latlngs.length >= 1 ) {
      this._feature.coordinates.add( this._currentPosition);
      this._layer.update();
    }


    this.fire("move");
    this._currentMousePos = {
      pageX : evt.pageX,
      pageY : evt.pageY
    }
  }

  _onMouseDown(evt) {
    this._currentMousePos = undefined;
    if (evt.button == 2) {
      evt.stopPropagation();
      evt.preventDefault();
      this._popLatLng();
      return;
    }
  }
  _onClick(evt) {
    if ( !this._currentPosition ) return;
    
    if (evt.button == 2) {
      return;
    }

    if ( MA.DOM.hasClass(evt.target,"marker") ) {
      if ( this._latlngs.length >= this._feature.coordinatesMinLength ) {
        this.stop();
        this.fire("create", {layer:this._layer, feature:this._feature});
        this._startEdit();
      }
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

    var pos = this._pagePosToCanvasPos(evt);
    this._addLatLng( this._map.map.unproject(pos) );
  }


  _startEdit() {
    this._featureEditor = this._createEdit( this._feature);
    //console.log("作成後編集開始");
    this._featureEditor.layer = this._layer;
    this._featureEditor.start();

  }

};
