/*****************************************************************
 * GSIBV.Map.Draw.CircleEditor
 * 地物サークル編集
******************************************************************/
GSIBV.Map.Draw.CircleEditor = class extends GSIBV.Map.Draw.FeatureEditor {
  constructor(map, targetFeature) {
    super( map, targetFeature);
  }
  
  _createControls() {
    var editor = this._createEditor();
    editor.on("update",MA.bind(function(){
      this.targetFeature.update();
      if ( this._layer ) this._layer.update();
    },this));
    this._controls.push(editor);
  }

  _createEditor() {
    return new GSIBV.Map.Draw.Control.CircleEditor(  this._map, this.targetFeature.coordinates);
  }

};


/*****************************************************************
 * GSIBV.Map.Draw.CircleMarkerEditor
 * 地物サークル編集
******************************************************************/
GSIBV.Map.Draw.CircleMarkerEditor = class extends GSIBV.Map.Draw.CircleEditor {
  constructor(map, targetFeature) {
    super( map, targetFeature);
  }
  
  
  start() {
    super.start();
    this._targetFeature.visible = false;
    this._targetFeature.update();
    this._createMarker();
    this._refreshMarker();
    this._initEvents();
    
  }

  stop() {
    this._targetFeature.visible = true;
    this._targetFeature.update();
    super.stop();
  }

  destroy() {
    this._targetFeature.visible = true;
    this._targetFeature.update();
    this._destroyEvents();
    this._destroyMarker();
    super.destroy();
  }
  
  _createEditor() {
    return new GSIBV.Map.Draw.Control.CircleMarkerEditor(  this._map, this.targetFeature.coordinates);
  }

  _onFeatureUpdate() {

    this._destroyMarker();
    this._createMarker();
    this._refreshMarker();

  }
  _onMapMove() {
    this._refreshMarker();
    super._onMapMove();
  }

  _destroyEvents() {
    
    if ( this._featureUpdateHandler ) {
      this._targetFeature.off( "update", this._featureUpdateHandler );
      this._featureUpdateHandler = undefined;
    }
  }

  _initEvents() {
    if ( !this._marker ) return;

    
    if ( !this._featureUpdateHandler ) {
      this._featureUpdateHandler = MA.bind( this._onFeatureUpdate, this );
      this._targetFeature.on( "update", this._featureUpdateHandler );
    }

  }


  _destroyMarker() {
    if ( !this._marker ) return;

    if ( this._marker.parentNode ) this._marker.parentNode.removeChild( this._marker);
    this._marker = undefined;
  }

  
  _refreshMarker() {
    if ( !this._marker) return;
    var latlng = this._targetFeature.coordinates.position;
    var pos = this._map.map.project(latlng);
    this._marker.style.left = pos.x + "px";
    this._marker.style.top = pos.y + "px";
  }
  

  _createTextCanvas() {
    var circleToCanvas = new GSIBV.Map.Draw.Layer.CircleToCanvas();
    circleToCanvas.text = this._targetFeature.style.text;
    
    if ( this._targetFeature.style.radius)circleToCanvas.radius = this._targetFeature.style.radius;
    if ( this._targetFeature.style.stroke ) {
      if ( this._targetFeature.style.weight)circleToCanvas.weight = this._targetFeature.style.weight;
      if ( this._targetFeature.style.color)circleToCanvas.lineColor = this._targetFeature.style.color;
      if ( this._targetFeature.style.opacity)circleToCanvas.lineOpacity = this._targetFeature.style.opacity;
      if ( this._targetFeature.style.dashArray)circleToCanvas._lineDashArray = this._targetFeature.style.dashArray;
    }
    if ( this._targetFeature.style.fill ) {
      if ( this._targetFeature.style.fillColor)circleToCanvas.backgroundColor = this._targetFeature.style.fillColor;
      if ( this._targetFeature.style.fillOpacity)circleToCanvas.backgroundOpacity = this._targetFeature.style.fillOpacity;
    }

    var canvas = circleToCanvas.execute();
    canvas.style.position = "absolute";
    canvas.style.zIndex = 1;
    canvas.style.cursor = "pointer";
    canvas.style.marginLeft = -Math.round(canvas.width/2) + "px";
    canvas.style.marginTop = -Math.round(canvas.height/2) + "px";
    return canvas;
  }

  _createMarker() {
    if ( this._marker ) return;
    var canvasContainer = this._map.map.getCanvasContainer();

    
    this._marker = this._createTextCanvas();

    canvasContainer.appendChild( this._marker );
  }


};

