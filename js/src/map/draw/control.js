GSIBV.Map.Draw.Control = {};

/*****************************************************************
 * GSIBV.Map.Draw.Control.MarkerBase
 * ライン編集用のマーカー
******************************************************************/
GSIBV.Map.Draw.Control.MarkerBase = class extends MA.Class.Base {
  constructor(map, position, visible,noEdit ) {
    super();
    this._size = 12;
    this._map = map;
    this._position = position;
    this._visible = visible;
    this._zIndex = 0;
    this._noEdit = noEdit ? true : false;

    this._backgroundColor = "rgba(255,255,255,0.8)";
    this._border = "1px solid rgba(0,0,0,0.9)";

    this.refresh();
  }

  set zIndex(value ) {
    this._zIndex = value;
    if ( this._container) {
      this._container.style.zIndex = this._zIndex;
    }
  }
  set backgroundColor(value) {
    this._backgroundColor = value;
    if ( this._container ) {
      this._container.style.backgroundColor = this._backgroundColor;
    }
  }


  set border(value) {
    this._border = value;
    if ( this._container ) {
      this._container.style.border = this._border;
    }
  }

  set size(size) {
    this._size = size;
    this.destroy();
    this.refresh();
  }

  set visible(visible) {
    this._visible = visible;
    this.refresh();
  }

  get position () {
    return this._position ;
  }

  set position(position) {
    var alt = this._position.alt;
    if ( !position.alt ) position.alt = alt;
    this._position = new GSIBV.Map.Draw.LatLng( position );
    
    this.refresh();
  }

  _initEvents(){


    if ( !this._clickHandler ) {
      this._clickHandler = MA.bind(this._onClick,this);
      MA.DOM.on( this._container, "click", this._clickHandler );
    }
  }

  _onClick() {
    this.fire("click");
  }

  destroy() {

    if ( this._clickHandler ) {
      MA.DOM.off( this._container, "click", this._clickHandler );
      this._clickHandler = undefined;
    }
    if ( !this._container ) return;
    this._container.parentNode.removeChild(this._container);
  }

  refresh() {
    if ( this._visible ) {
      this._create();
      this._initEvents();
      var pos = this._map.map.project(this._position);
      
      this._container.style.left = Math.round(pos.x) + 'px';
      this._container.style.top = Math.round(pos.y) + 'px';
    } else {
      this.destroy();
    }
  }

  _create() {
    if ( this._container ) return;
    var canvasContainer = this._map.map.getCanvasContainer();
    this._container = MA.DOM.create("div");
    this._container.style.position = "absolute";
    this._container.style.zIndex = this._zIndex;
    this._container.style.background = this._backgroundColor;
    this._container.style.left = "0px";
    this._container.style.top = "0px";
    this._container.style.cursor = "pointer";
    this._container.style.marginLeft = "-" + Math.floor(this._size / 2 ) +"px";
    this._container.style.marginTop = "-" + Math.floor(this._size / 2 ) +"px";
    this._container.style.width = this._size + "px";
    this._container.style.height = this._size + "px";
    this._container.style.border = this._border;
    MA.DOM.addClass(this._container,"marker");
    canvasContainer.appendChild(this._container);
  }

};


/*****************************************************************
 * GSIBV.Map.Draw.Control.Marker
 * ライン編集用のマーカー
******************************************************************/
GSIBV.Map.Draw.Control.Marker = class extends GSIBV.Map.Draw.Control.MarkerBase{
  constructor(map, position, visible, noEdit ) {
    super(map,position,visible, noEdit );
    this._originalPosition = new GSIBV.Map.Draw.LatLng(position);



  }

  set innerIndex(value) {
    this._innerIndex = value;
  }

  get innerIndex() {
    return this._innerIndex;
  }

  set index(value) {
    this._index = value;
  }

  get index() {
    return this._index;
  }

  rollback() {
    this.position = this._originalPosition;
  }

  commit() {
    this._originalPosition = new GSIBV.Map.Draw.LatLng(this.position); 

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

  destroy() {

    this._stopAutoPan();
    
    if ( this._mouseDownHandler ) {
      MA.DOM.off( this._container, "mousedown", this._mouseDownHandler );
      this._mouseDownHandler = undefined
    }


    if ( this._mouseMoveHandler ) {
      MA.DOM.off( document.body, "mousemove", this._mouseMoveHandler );
      this._mouseMoveHandler = undefined
    }


    if ( this._mouseUpHandler ) {
      MA.DOM.off( document.body, "mouseup", this._mouseUpHandler );
      this._mouseUpHandler = undefined
    }


    super.destroy();


  }


  refresh() {
    if ( this._visible ) {
      this._create();
      this._initEvents();
      var pos = this._map.map.project(this._position);
      
      this._container.style.left = Math.round(pos.x) + 'px';
      this._container.style.top = Math.round(pos.y) + 'px';
    } else {
      this.destroy();
    }
  }

  _onMouseDown(evt) {
    this._currentMousePos = undefined;
    evt.stopPropagation();
    evt.preventDefault();
    if (event.button == 2) {
      this.fire("rightdown", {originalEvent:evt});
      return;
    }
    if ( this._dragStartInfo  ) {
      this._onMouseUp( evt);
      return;
    }
    this._dragStartInfo = {
      offsetX : evt.offsetX,
      offsetY : evt.offsetY
    };


    var canvasContainer = this._map.map.getCanvasContainer();
    if ( !this._mouseMoveHandler ) {
      this._mouseMoveHandler = MA.bind( this._onMouseMove, this );
      MA.DOM.on( document.body, "mousemove", this._mouseMoveHandler );
    }

    if ( !this._mouseUpHandler ) {
      this._mouseUpHandler = MA.bind( this._onMouseUp, this );
      MA.DOM.on( document.body, "mouseup", this._mouseUpHandler );
    }
    
    this._startAutoPan();


  }

  _onMouseMove(evt) {

    if ( !this._dragStartInfo ) return; 
    var pos = {
      x : evt.pageX,
      y : evt.pageY
    };
    var canvasContainer = this._map.map.getCanvasContainer();
    var offset = MA.DOM.offset(canvasContainer);
    pos.x -= offset.left;
    pos.y -= offset.top;

    this.position = this._map.map.unproject(pos);

    this._currentMousePos = {
      pageX : evt.pageX,
      pageY : evt.pageY
    };
    this.fire("move");
  }

  _onMouseUp(evt) {
    this._currentMousePos = undefined;
    this._stopAutoPan();
    this._onMouseMove(evt);
    if ( this._dragStartInfo ) {
      this.fire("moveend");
    }
    this._dragStartInfo  = undefined;
    if ( this._mouseMoveHandler ) {
      MA.DOM.off( document.body, "mousemove", this._mouseMoveHandler );
      this._mouseMoveHandler = undefined
    }


    if ( this._mouseUpHandler ) {
      MA.DOM.off( document.body, "mouseup", this._mouseUpHandler );
      this._mouseUpHandler = undefined
    }

    

  }

  _initEvents() {
    super._initEvents();
    if ( this._noEdit)return;
    if ( !this._mouseDownHandler ) {
      this._mouseDownHandler = MA.bind( this._onMouseDown, this );
      MA.DOM.on( this._container, "mousedown", this._mouseDownHandler );
    }

  }




};




/*****************************************************************
 * GSIBV.Map.Draw.Control.LineEditor
 * ライン編集用
******************************************************************/
GSIBV.Map.Draw.Control.LineEditor = class extends MA.Class.Base {

  constructor(map,coordinates, minCoordinatesLength, noEdit) {
    super();
    this._noEdit = noEdit ? true : false;
    this._map = map;
    this._markerBackgroundColor = "rgba(255,255,255,0.8)";
    this._markerBorder = "1px solid rgba(0,0,0,0.9)";

    this._coordinates = coordinates;
    this._minCoordinatesLength = minCoordinatesLength;
    this.create();
  }

  refresh() {
    if ( !this._markers ) return;
    for( var i=0; i<this._markers.length; i++)
      this._markers[i].refresh();
    for( var i=0; i<this._centerMarkers.length; i++)
      this._centerMarkers[i].refresh();
  }

  recreate() {
    this.destroy();
    this.create();
  }

  destroy() {

    for( var i=0; i<this._markers.length; i++)
      this._markers[i].destroy();
    for( var i=0; i<this._centerMarkers.length; i++)
      this._centerMarkers[i].destroy();
    this._markers = [];
    this._centerMarkers = [];
  }

  create() {
    
    var firstMarker = null;
    var prevLatLng = null;
    var prevMarker = null;
    this._markers = [];
    this._centerMarkers = [];


    for( var i=0; i<this._coordinates.length; i++ ) {
      var latlng = this._coordinates.get(i);
      var marker = new GSIBV.Map.Draw.Control.Marker ( this._map, latlng, true, this._noEdit );
      this._initMarker( marker, i );
      this._markers.push(marker);

      if ( this._noEdit ) continue;

      if ( !firstMarker ) firstMarker = marker;
      // 間のマーカー
      if ( prevLatLng ) {
        var centerMarker = this._createCenterMarker( prevMarker, marker);
        this._centerMarkers.push(centerMarker);

        prevMarker.next = marker;
        marker.center = centerMarker;
        marker.prev = prevMarker;
      }

      prevLatLng = latlng
      prevMarker = marker;

    }

    if ( this._noEdit ) return;

    if ( this._minCoordinatesLength >= 3 ) {

      // 間のマーカー
      if ( prevLatLng ) {
        var centerMarker = this._createCenterMarker( prevMarker, firstMarker);
        centerMarker.next = null;
        centerMarker.first = firstMarker;
        this._centerMarkers.push(centerMarker);
      }
    }
  }

  _createCenterMarker(prevMarker, nextMarker) {
    var centerlatLng = GSIBV.Map.Draw.LatLng.getCenter(prevMarker.position, nextMarker.position);
    var centerMarker = new GSIBV.Map.Draw.Control.Marker ( this._map, centerlatLng, true );
    centerMarker.backgroundColor = "rgba(255,255,255,0.2)";
    centerMarker.border= "1px solid rgba(0,0,0,0.3)";
    centerMarker.on("move", MA.bind(this._onCenterMarkerMove, this ));
    centerMarker._iscenter = true;

    centerMarker.next = nextMarker;
    centerMarker.prev = prevMarker;
    return centerMarker;
  }

  _initMarker(marker, idx) {
    marker.index = idx;
    marker.backgroundColor = this._markerBackgroundColor;
    marker.originalPosition = marker.position;
    marker.border= this._markerBorder;
    marker.on("click", MA.bind(this._onMarkerClick, this ));

    if ( this._noEdit) return;

    marker.on("move", MA.bind(this._onMarkerMove, this ));
    marker.on("moveend", MA.bind(this._onMarkerMoveEnd, this ));
    marker.on("rightdown", MA.bind(this._onMarkerRightDown, this ));
  }

  _onMarkerClick(evt) {
    this.fire("markerclick",{target:evt.from});
  }

  _onMarkerMoveEnd(evt) {
    var params = {
      target:evt.from
    };
    this.fire("markermoveend", params);

    var marker = evt.from;
    if ( params.cancel ) {
      marker.rollback();
      if ( marker._iscenter ) {
        this._coordinates.remove(marker.index );
        this.recreate();
      } else {
        this._onMarkerMove({from:marker});
        this._coordinates.update(marker.index, marker.position);
      }
    } else {
      marker._iscenter = false;
      marker.commit();

    }
    
    this.fire("update");

  }

  _onMarkerMove(evt) {
    var marker = evt.from;

    if ( marker.prev && marker.center) {
      marker.center.position = GSIBV.Map.Draw.LatLng.getCenter(marker.prev.position, marker.position);
    }


    if ( marker.next && marker.next.center) {
      marker.next.center.position = GSIBV.Map.Draw.LatLng.getCenter(marker.next.position, marker.position);
    }


    if ( !marker.prev ) {
      for( var i=0; i<this._centerMarkers.length; i++ ) {
        var centerMarker = this._centerMarkers[i];
        if ( centerMarker.first == marker ) {
          centerMarker.position = GSIBV.Map.Draw.LatLng.getCenter(centerMarker.prev.position, marker.position);
          break;
        }
      }
    }


    if ( !marker.next ) {
      for( var i=0; i<this._centerMarkers.length; i++ ) {
        var centerMarker = this._centerMarkers[i];
        if ( centerMarker.prev == marker ) {
          centerMarker.position = GSIBV.Map.Draw.LatLng.getCenter(centerMarker.prev.position, centerMarker.first.position);
          break;
        }
      }
    }


    
    this._coordinates.update(marker.index, marker.position);
    this.fire("update");
    this.fire("markermove",{
      target:evt.from, 
      prev: ( evt.prev ? evt.prev : this._markers[0]), 
      next:evt.next
    });
  }

  _onMarkerRightDown(evt) {
    if ( this._coordinates.length <=this._minCoordinatesLength ) return;
    
    var marker = evt.from;
    var params = {target:marker, originalEvent:evt.params.originalEvent};

    this.fire("markerremove", params);
    if ( params.cancel)return;

    var index = marker.index;
    this._coordinates.remove(index );
    this.destroy();
    this.create();

    this.fire("update");
  }

  _onCenterMarkerMove(evt) {
    var marker = evt.from;

    var idx = this._centerMarkers.indexOf( marker );
    this._centerMarkers.splice( idx,1);

    marker.clearEvents();

    var hasNext = marker.next ? true : false;
    if ( hasNext ) {
      this._markers.splice( marker.next.index, 0,  marker );
      this._initMarker( marker,marker.next.index);

      this._coordinates.insert(marker.next.index, marker.position);
      var target = marker.next;
      while( target ) {
        target.index++;
        target = target.next;
      }
      marker.next.center = null;
      marker.next.prev = marker;
    } else {
      this._markers.push( marker );
      this._initMarker( marker,marker.prev.index+1);
      this._coordinates.insert(marker.prev.index+1, marker.position);

    }

    marker.prev.next = marker;

    var centerMarker = this._createCenterMarker( marker.prev, marker);
    marker.center = centerMarker;
    this._centerMarkers.push(centerMarker);


    if ( hasNext ) {
      centerMarker = this._createCenterMarker( marker, marker.next);
      marker.next.center = centerMarker;
      this._centerMarkers.push(centerMarker);
    } else {
      centerMarker = this._createCenterMarker( marker, marker.first);
      centerMarker.next = null;
      centerMarker.first = marker.first;
      marker.first = null;
      this._centerMarkers.push(centerMarker);

    }
    
    this.fire("update")

  }

};






/*****************************************************************
 * GSIBV.Map.Draw.Control.FeatureSelector
 * 地物選択
******************************************************************/
GSIBV.Map.Draw.Control.FeatureSelector = class extends MA.Class.Base {

  constructor( map, featureCollection, noEdit) {
    super();
    this._map = map;
    this._noEdit = noEdit ? true : false;
    this._featureCollection = featureCollection;
  }

  show(feature) {
    
    this.create();
    
    for( var i=0; i<this._selectorList .length; i++) {
      if ( this._selectorList[i].feature == feature)
        this._selectorList[i].hide();
      else 
        this._selectorList[i].show();

    }
  }


  hide() {

    if ( !this._selectorList ) return;
    for( var i=0; i<this._selectorList .length; i++) {
      this._selectorList[i].hide();
    }
  }

  remove(item) {

    var idx = this._selectorList.indexOf(item);
    if ( item instanceof GSIBV.Map.Draw.Feature) {
      for( var i=0; i<this._selectorList.length; i++ ) {
        if ( this._selectorList[i].feature == item ){
          idx = i;
          item = this._selectorList[i];
          break;
        }
      }
    }
    if ( idx >= 0 ) {
      item.destroy();
      this._selectorList.splice(idx,1);
    }
  }

  create() {
    if ( !this._selectorList ) {
      this._selectorList = [];

      for( var i=0;i<this._featureCollection.length; i++) {
        var feature = this._featureCollection.get(i);
        this._selectorList.push( 
          new GSIBV.Map.Draw.Control.FeatureSelector.Item(this._map, feature)
        );
      }

      for( var i=0; i<this._selectorList .length; i++) {
        this._selectorList[i].on( "edit", MA.bind(function(evt){
          this.fire("edit", {"item":evt.from, "feature":evt.from.feature});
        },this));
        this._selectorList[i].on( "remove", MA.bind(function(evt){
          this.fire("remove", {"item":evt.from, "feature":evt.from.feature});
        },this));
      }

    }

  }
  destroy() {
    if ( !this._selectorList ) return;
    for( var i=0; i<this._selectorList .length; i++) {
      this._selectorList[i].destroy();
    }
    this._selectorList = undefined;
  }
};







GSIBV.Map.Draw.Control.FeatureSelector.Item = class extends MA.Class.Base {

  constructor( map, feature) {
    super();
    this._map = map;
    this._feature = feature;
    this._backgroundColor = "transparent";
    this._border = "2px solid #5a5a5a";
    this._borderRadius = "3px";
  }

  get feature() {
    return this._feature;
  }

  _onEditClick() {
    this.fire("edit");
  }

  _onRemoveClick() {
    this.fire("remove");
  }

  show() {
    this.create();
    this.refresh();

    MA.DOM.fadeIn( this._container, 300 );
    MA.DOM.fadeIn( this._buttonContainer, 300 );

    if ( !this._mapMoveHandler ) {
      this._mapMoveHandler = MA.bind(this.refresh, this );
      this._map.on(  "move", this._mapMoveHandler );
    }
  }

  hide() {

    if ( this._mapMoveHandler ) {
      this._map.off(  "move", this._mapMoveHandler );
      this._mapMoveHandler = undefined
    }


    MA.DOM.fadeOut( this._container, 300 );
    MA.DOM.fadeOut( this._buttonContainer, 300 );
  }
  
  refresh() {
    if ( !this._container) return;
    var pixBounds = this._feature.getFrameBounds(this._map.map,10);
    this._container.style.left = pixBounds.left + "px";
    this._container.style.width = pixBounds.width + "px";
    this._container.style.top = pixBounds.top + "px";
    this._container.style.height = pixBounds.height + "px";

    this._buttonContainer.style.left = pixBounds.right + "px";
    this._buttonContainer.style.top = pixBounds.top + "px";
  }
  
  
  create() {
    this._createBox();
    this._createButtons();
  }

  _createBox() {
    if ( this._container) return;
    var canvasContainer = this._map.map.getCanvasContainer();
    this._container = MA.DOM.create("div");
    this._container.style.position = "absolute";
    this._container.style.display = "none";
    this._container.style.zIndex = 0;
    this._container.style.background = this._backgroundColor;
    this._container.style.borderRadius = this._borderRadius;
    this._container.style.border = this._border;
    canvasContainer.appendChild(this._container);
  }


  _createButtons() {
    if ( this._buttonContainer) return;
    var canvasContainer = this._map.map.getCanvasContainer();

    this._buttonContainer = MA.DOM.create("div");
    this._buttonContainer.style.position = "absolute";
    this._buttonContainer.style.display = "none";
    this._buttonContainer.style.width = "52px";
    this._buttonContainer.style.height = "24px";
    this._buttonContainer.style.zIndex = 1;

    var createButton = function(right) {
      var button = MA.DOM.create("button");
      button.style.position = "absolute";
      button.style.width = "24px";
      button.style.height = "24px";
      button.style.right = right + "px";
      button.style.top = "0px";
      button.style.backgroundRepeat = "no-repeat";
      button.style.backgroundPosition = "center center";
      return button;

    };

    var removeButton = createButton(0);
    removeButton.style.backgroundImage ="url(./image/sakuzu/icon_remove.png)";
    var editButton = createButton(26);
    editButton.style.backgroundImage ="url(./image/sakuzu/icon_edit.png)";
    
    MA.DOM.on( removeButton, "click", MA.bind( this._onRemoveClick, this ) );
    MA.DOM.on( editButton, "click", MA.bind( this._onEditClick, this ) );


    this._buttonContainer.style.marginTop = "4px";
    this._buttonContainer.style.marginLeft = "-56px";

    this._buttonContainer.appendChild( removeButton );
    this._buttonContainer.appendChild( editButton );

    canvasContainer.appendChild(this._buttonContainer);
  }

  destroy() {
    if ( this._container) {
      this._container.parentNode.removeChild( this._container );
      this._container = undefined;
    }

    if ( this._buttonContainer) {
      this._buttonContainer.parentNode.removeChild( this._buttonContainer );
      this._buttonContainer = undefined;
    }


    if ( this._mapMoveHandler ) {
      this._map.off(  "move", this._mapMoveHandler );
      this._mapMoveHandler = undefined
    }



  }

};





/*****************************************************************
 * GSIBV.Map.Draw.Control.CircleEditor
 * サークル編集用
******************************************************************/
GSIBV.Map.Draw.Control.CircleEditor = class extends MA.Class.Base {
  constructor(map,coordinates) {
    super();
    this._map = map;
    this._markerBackgroundColor = "rgba(255,255,255,0.8)";
    this._markerBorder = "1px solid rgba(0,0,0,0.9)";
    this._coordinates = coordinates;
    this.create();
  }


  destroy() {
    if ( this._centerMarker)  this._centerMarker.destroy();
    if ( this._radiusMarker)  this._radiusMarker.destroy();

    this._centerMarker = undefined;
    this._radiusMarker = undefined;
  }

  create() {
    this._centerMarker = new GSIBV.Map.Draw.Control.Marker(this._map, this._coordinates.position, true);
    this._centerMarker .zIndex = 10;
    this._centerMarker.on("move", MA.bind( this._onCenterMarkerMove, this ));
  }

  refresh() {
    if ( this._centerMarker) this._centerMarker.refresh();
  }
  _onCenterMarkerMove( evt ) {
    this._coordinates.position = evt.from.position;
    this.fire("update");
  }
};



/*****************************************************************
 * GSIBV.Map.Draw.Control.CircleMarkerEditor
 * サークル編集用
******************************************************************/
GSIBV.Map.Draw.Control.CircleMarkerEditor = class extends GSIBV.Map.Draw.Control.CircleEditor {
  constructor(map,coordinates) {
    super(map,coordinates);
  }

};