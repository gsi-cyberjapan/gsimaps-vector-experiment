/*****************************************************************
 * GSIBV.Map.Draw.MarkerEditor
 * 地物マーカー編集
******************************************************************/


GSIBV.Map.Draw.MarkerEditor = class extends GSIBV.Map.Draw.FeatureEditor {
  constructor(map, targetFeature) {
    super( map, targetFeature);
  }

  _startAutoPan() {
    if ( !this._autoPan ) {
      this._autoPan = new GSIBV.Map.AutoPan(this._map.map);
      this._autoPan.on("move", MA.bind(function(evt){
        if (! this._currentMousePos) return;
        this._onMouseMove(this._currentMousePos);
      },this));
    }
    this._autoPan.start();

  }
  _stopAutoPan() {
    if ( this._autoPan ) this._autoPan.destroy();
    this._autoPan = undefined;
  }

  start() {
    super.start();
    this._targetFeature.visible = false;
    this._targetFeature.update();
    this._createMarker();
    this._refreshMarker();
    this._initEvents();
    
  }

  _initEvents() {
    if ( !this._marker ) return;

    
    if ( !this._featureUpdateHandler ) {
      this._featureUpdateHandler = MA.bind( this._onFeatureUpdate, this );
      this._targetFeature.on( "update", this._featureUpdateHandler );
    }

  }


  _destroyEvents() {
    
    if ( this._featureUpdateHandler ) {
      this._targetFeature.off( "update", this._featureUpdateHandler );
      this._featureUpdateHandler = undefined;
    }

    if ( this._marker && this._mouseDownHandler ) {
      MA.DOM.off( this._marker, "mousedown", this._mouseDownHandler );
      this._mouseDownHandler = undefined;
    }

    if ( this._mouseUpHandler ) {
      MA.DOM.off( document.body, "mouseup", this._mouseUpHandler );
      this._mouseUpHandler = undefined
    }
    if ( this._mouseMoveHandler ) {
      MA.DOM.off( document.body, "mousemove", this._mouseMoveHandler );
      this._mouseMoveHandler = undefined
    }
  }

  stop() {
    this._targetFeature.visible = true;
    this._targetFeature.update();
    this._destroyEvents();
    this._destroyMarker();
    super.stop();
  }

  destroy() {
    this._targetFeature.visible = true;
    this._targetFeature.update();
    this._stopAutoPan();
    if ( this._featureEditor ) {
      this._featureEditor.destroy();
      this._featureEditor = undefined;
    }
    
    this._destroyEvents();
    this._destroyMarker();
    super.destroy();

  }

  _onMarkerMouseDown( evt ) {
    this._currentMousePos = undefined;
    if (event.button == 2) {
      return;
    }

    
    this._markerClientPos = {
      x : evt.offsetX,
      y : evt.offsetY
    }
    if ( this._margin ) {
      this._markerClientPos.x -= this._margin.left;
      this._markerClientPos.y -= this._margin.top;
    }

    evt.stopPropagation();
    evt.preventDefault();

    this._startAutoPan();
    if ( !this._mouseUpHandler ) {
      this._mouseUpHandler = MA.bind( this._onMouseUp, this );
      MA.DOM.on( document.body, "mouseup", this._mouseUpHandler );
    }
    if ( !this._mouseMoveHandler ) {
      this._mouseMoveHandler = MA.bind( this._onMouseMove, this );
      MA.DOM.on( document.body, "mousemove", this._mouseMoveHandler );
    }
  }

  _onMouseUp(evt) {
    this._currentMousePos = undefined;
    this._stopAutoPan();

    this._onMouseMove(evt);
    this._targetFeature.update();

    
    if ( this._mouseUpHandler ) {
      MA.DOM.off( document.body, "mouseup", this._mouseUpHandler );
      this._mouseUpHandler = undefined
    }
    if ( this._mouseMoveHandler ) {
      MA.DOM.off( document.body, "mousemove", this._mouseMoveHandler );
      this._mouseMoveHandler = undefined
    }

  }

  _onMouseMove(evt) {
    var pos = this._pagePosToCanvasPos(evt);
    
    pos.x -=this._markerClientPos.x; 
    pos.y -=this._markerClientPos.y; 


    var latlng = this._map.map.unproject(pos);
    this._targetFeature.coordinates.position = latlng;

    this._marker.style.left = pos.x + "px";
    this._marker.style.top = pos.y + "px";
    this._currentMousePos = {
      pageX : evt.pageX,
      pageY : evt.pageY
    };
  }

  
  _onMapMove() {
    this._refreshMarker();
    super._onMapMove();
  }

  _refreshMarker() {
    if ( !this._marker) return;
    var latlng = this._targetFeature.coordinates.position;
    var pos = this._map.map.project(latlng);
    
    this._marker.style.left = pos.x + "px";
    this._marker.style.top = pos.y + "px";


  }
  
  _onFeatureUpdate() {

    this._destroyMarker();
    this._createMarker();
    this._refreshMarker();

  }

  _pagePosToCanvasPos(evt) {

    var pos = {
      x : evt.pageX,
      y : evt.pageY
    };
    var canvasContainer = this._map.map.getCanvasContainer();
    var offset = MA.DOM.offset(canvasContainer);
    pos.x -= offset.left;
    pos.y -= offset.top;

    return pos;
  }

  _initMarker() {
    
    if ( !this._mouseDownHandler ) {
      this._mouseDownHandler = MA.bind( this._onMarkerMouseDown, this );
      MA.DOM.on( this._marker, "mousedown", this._mouseDownHandler );
    }
  }

  _createMarker() {
    if ( this._marker ) return;
    var canvasContainer = this._map.map.getCanvasContainer();

    this._marker = MA.DOM.create("img");
    this._marker.style.position = "absolute";
    this._marker.style.zIndex = 1;
    this._marker.style.cursor = "pointer";
    this._marker.style.left = "0px";
    this._marker.style.top = "0px";
    this._marker.style.border = "none";
    this._marker.src = this._targetFeature.style.iconUrl;

    
    var width = 20;
    var height = 20;
    if ( this._targetFeature.style.iconSize ) {
      width = this._targetFeature.style.iconSize[0];
      height = this._targetFeature.style.iconSize[1];
    }

    this._margin = {
      left : Math.floor(width / 2 ),
      top : Math.floor(height / 2 ),
    };

    this._marker.style.marginLeft = "-" + Math.floor(width / 2 ) +"px";
    this._marker.style.marginTop = "-" + Math.floor(height / 2 ) +"px";
    this._marker.style.width = width + "px";
    this._marker.style.height = height + "px";
    
    this._initMarker();

    canvasContainer.appendChild( this._marker );
  }

  _destroyMarker() {
    if ( !this._marker ) return;
    
    if (  this._mouseDownHandler ) {
      MA.DOM.off( this._marker, "mousedown", this._mouseDownHandler );
      this._mouseDownHandler = undefined;
    }

    if ( this._marker.parentNode ) this._marker.parentNode.removeChild( this._marker);
    this._marker = undefined;
  }

};
  