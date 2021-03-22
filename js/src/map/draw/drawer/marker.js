GSIBV.Map.Draw.MarkerDrawer = class extends GSIBV.Map.Draw.FeatureDrawer {

  constructor(map, featureCollection, layer) {
    super(map, featureCollection, layer);
    this._markerSize = {
      width : 20,
      height : 20
    };
    this._markerUrl = GSIBV.CONFIG.SAKUZU.SYMBOL.URL + GSIBV.CONFIG.SAKUZU.SYMBOL.DEFAULTICON;
  }

  get type() {
    return GSIBV.Map.Draw.Marker.MarkerType;
  }
  get markerType() {
    return "Icon";
  }

  start() {
    super.start();
    this._destroyMarker();
    if ( this._feature ) {
      this._markerUrl = this._feature.style.iconUrl;
      this._markerSize.width = this._feature.style.iconSize[0];
      this._markerSize.height = this._feature.style.iconSize[1];
    }
    this._initEvents();
    this._toolTip.message = "マーカーを置くポイントをクリック";
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
    this._destroyMarker();
    super.stop();
  }

  destroy() {
    
    if ( this._featureEditor ) {
      this._featureEditor.destroy();
      this._featureEditor = undefined;
    }
    
    this._destroyEvents();
    this._destroyMarker();
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


    this._feature = new GSIBV.Map.Draw.Marker();
    this._feature.style.iconUrl = this._markerUrl;
    this._feature.style.iconSize = [
      this._markerSize.width, this._markerSize.height
    ];
    

    this._feature.coordinates.position = this._map.map.unproject(pos)
    this._featureCollection.add( this._feature );
    this._layer.update();
    this.stop();
    this.fire("create", {layer:this._layer, feature:this._feature});
    this._startEdit();
    
  }

  
  _startEdit() {
    this._featureEditor = new GSIBV.Map.Draw.MarkerEditor( this._map, this._feature);
    //console.log("作成後編集開始");
    this._featureEditor.layer = this._layer;
    this._featureEditor.start();
  }


  _onMouseMove(evt) {
    var pos = this._pagePosToCanvasPos(evt);
    this._createMarker();
    this._marker.style.left = pos.x + "px";
    this._marker.style.top = pos.y + "px";
  }
  
  _createMarker() {
    if ( this._marker ) return;
    var canvasContainer = this._map.map.getCanvasContainer();

    
    this._marker = MA.DOM.create("img");
    this._marker.style.position = "absolute";
    this._marker.style.zIndex = 1;
    this._marker.crossOrigin = "anonymous";
    this._marker.src = this._markerUrl;
    this._marker.style.cursor = "pointer";
    this._marker.style.left = "0px";
    this._marker.style.top = "0px";
    this._marker.style.marginLeft = "-" + Math.floor(this._markerSize.width / 2 ) +"px";
    this._marker.style.marginTop = "-" + Math.floor(this._markerSize.height / 2 ) +"px";
    this._marker.style.width = this._markerSize.width + "px";
    this._marker.style.height = this._markerSize.height + "px";

    canvasContainer.appendChild( this._marker );
  }

  _destroyMarker() {
    if ( !this._marker ) return;
    if ( this._marker.parentNode ) this._marker.parentNode.removeChild( this._marker);
    this._marker = undefined;
  }


};