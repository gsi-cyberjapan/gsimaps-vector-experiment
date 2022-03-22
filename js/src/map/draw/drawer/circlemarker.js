GSIBV.Map.Draw.CircleMarkerDrawer = class extends GSIBV.Map.Draw.FeatureDrawer {
    constructor(map, layer) {
      super(map, layer, true);
    }
  
    get type() {
      return GSIBV.Map.Draw.CircleMarker.MarkerType;
    }
    get markerType() {
      return GSIBV.Map.Draw.CircleMarker.MarkerType;
    }
  
    start() {
      super.start();
      this._initEvents();
      this._map.map.getCanvasContainer().style.cursor = "default";
      this._toolTip.message = "中心位置をクリックしドラッグしてください";
    }
  
    _initEvents() {
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
  
    
    _destroyEvents() {
      if ( this._mouseDownHandler ) {
        MA.DOM.off( document.body, "mousedown", this._mouseDownHandler );
        this._mouseDownHandler = undefined;
      }
      if ( this._mouseUpHandler ) {
        MA.DOM.off( document.body, "mouseup", this._mouseUpHandler );
        this._mouseUpHandler = undefined;
      }
      if ( this._mouseMoveHandler ) {
        MA.DOM.off( document.body, "mousemove", this._mouseMoveHandler );
        this._mouseMoveHandler = undefined
      }
    }
    
    stop() {
      super.stop();
      this._map.map.getCanvasContainer().style.cursor = "";
      this._destroyEvents();
      if ( this._feature ) {
        if ( this._featureEditor) {
          this._featureEditor.destroy();
          this._featureEditor = undefined;
        }
        this._layer.update();
      }
    }
  
    destroy() {
      if ( this._featureEditor ) {
        this._featureEditor.destroy();
        this._featureEditor = undefined;
      }
      
      this._destroyEvents();
  
      if ( this._mapMoveHandler ) {
        this._map.map.off("move", this._mapMoveHandler);
        this._mapMoveHandler = undefined
      }
      super.destroy();
  
    }
    _onMouseDown(evt) {
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
      this._startPos = pos;
      this._startLatLng = this._map.map.unproject(pos);
    }
    _onMouseUp(evt) {
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
        if(pos.x === this._startPos.x && pos.y === this._startPos.y) {
          return;
        }
        this.stop();
        this.fire("create", {layer:this._layer, feature:this._feature});
        this._startEdit();
      }
    }
  
    _startEdit() {
      this._featureEditor = new GSIBV.Map.Draw.CircleMarkerEditor( this._map, this._feature);
      this._featureEditor.layer = this._layer;
      this._featureEditor.start();
    }
  
    _getPixelDistance(p1, p2) {
      var a = p1.x - p2.x;
      var b = p1.y - p2.y;
      return Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));
    }
  
    _onMouseMove(evt) {
      if(this._featureEditor) {
        return;
      }
      
      var pos = this._pagePosToCanvasPos(evt);
      
      if(this._isDrawing) {
        var radius = this._getPixelDistance(this._startPos, pos);
        var radiusTxt = "半径：" + radius.toFixed(0) + "px";
        
        this._toolTip.message = "<div>" + radiusTxt + "</div>マウスボタンを離して終了";
        if(!this._feature) {
          this._feature = new GSIBV.Map.Draw.CircleMarker();
          this._feature.coordinates.position = this._startLatLng;
  
          this._feature.style.radius = radius;
          this._featureCollection.add( this._feature );
          this._layer.update();
        } else {
          this._feature.style.radius = radius;
          this._layer.update();
        }
      } else {
        this._feature = undefined;
      }
  
    }
  
  };
