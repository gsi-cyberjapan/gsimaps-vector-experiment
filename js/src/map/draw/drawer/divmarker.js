GSIBV.Map.Draw.DivMarkerDrawer = class extends GSIBV.Map.Draw.FeatureDrawer {

  constructor(map, layer) {
    super(map, layer, true);
  }

  get type() {
    return GSIBV.Map.Draw.DivMarker.MarkerType;
  }
  get markerType() {
    return GSIBV.Map.Draw.DivMarker.MarkerType;
  }

  start() {
    super.start();
    this._initEvents();
    this._map.map.getCanvasContainer().style.cursor = "crosshair";
    this._toolTip.message = "テキストを置くポイントをクリック";
  }

  _initEvents() {
    if ( !this._clickHandler ) {
      this._clickHandler = MA.bind( this._onClick, this );
      MA.DOM.on( document.body, "click", this._clickHandler );
    }
    if ( !this._mouseMoveHandler ) {
      this._mouseMoveHandler = MA.bind( this._onMouseMove, this );
      MA.DOM.on( document.body, "mousemove", this._mouseMoveHandler );
    }
  }

  
  _destroyEvents() {
    
    if ( this._clickHandler ) {
      MA.DOM.off( document.body, "click", this._clickHandler );
      this._clickHandler = undefined
    }
    if ( this._mouseMoveHandler ) {
      MA.DOM.off( document.body, "mousemove", this._mouseMoveHandler );
      this._mouseMoveHandler = undefined
    }
  }

  stop() {
    this._destroyEvents();
    super.stop();
  }

  destroy() {
    this._map.map.getCanvasContainer().style.cursor = "";
    if ( this._featureEditor ) {
      this._featureEditor.destroy();
      this._featureEditor = undefined;
    }
    
    this._destroyEvents();
    super.destroy();

  }

  _onClick(evt) {
    this._onMouseMove(evt);

    
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


    this._feature = new GSIBV.Map.Draw.DivMarker();
    this._feature.coordinates.position = this._map.map.unproject(pos);
    this._layer.update();
    this.stop();
    this.fire("create", {layer:this._layer, feature:this._feature});
    this._startEdit();
    
  }

  
  _startEdit() {
    this._featureEditor = new GSIBV.Map.Draw.DivMarkerEditor( this._map, this._feature);
    this._featureEditor.layer = this._layer;
    this._featureEditor.start();
  }


  _onMouseMove(evt) {}
};