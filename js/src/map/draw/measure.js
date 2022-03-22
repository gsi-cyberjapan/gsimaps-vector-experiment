GSIBV.Map.Draw.Measure = {};


/*****************************************************************
 * GSIBV.Map.Draw.Measure.FeatureSelector
 * 地物選択
******************************************************************/
GSIBV.Map.Draw.Measure.FeatureSelector = class extends MA.Class.Base {

  constructor( map, featureCollection, multiEnable) {
    super();
    this._map = map;
    this._multiEnable = multiEnable !== undefined ? multiEnable : false;
    this._featureCollection = featureCollection;
  }

  get itemList(){
    return this._itemList;
  }

  show() {
    this._create();
    for( var i=0; i<this._itemList.length; i++) {
      this._itemList[i].show();
    }
  }

  _create() {
    if ( !this._itemList ) {
      this._itemList = [];
      if(!this._itemClickedHdler) this._itemClickedHdler = MA.bind(this._itemClicked, this);

      for( var i=0; i<this._featureCollection.length; i++) {
        var feature = this._featureCollection.get(i);
        if(this._multiEnable && feature.geometryType==="LineString") {
          continue;
        }
        var item = new GSIBV.Map.Draw.Measure.FeatureSelector.Item(this._map, feature);
        item.on("clicked", this._itemClickedHdler);
        this._itemList.push( item );
      }
    }
  }

  _itemClicked(e){
    this.fire("clicked", e.params);
  }

  hide() {
    if ( !this._itemList ) return;
    for( var i=0; i<this._itemList.length; i++) {
      this._itemList[i].hide();
    }
  }

  destroy() {
    if ( !this._itemList ) return;
    for( var i=0; i<this._itemList.length; i++) {
      let item = this._itemList[i];
      if(this._itemClickedHdler) item.off("clicked", this._itemClickedHdler);
      item.destroy();
    }
    this._itemClickedHdler = undefined;
    this._itemList = undefined;
  }

  remove(item) {
    var idx = this._itemList.indexOf(item);
    if ( item instanceof GSIBV.Map.Draw.Feature) {
      for( var i=0; i<this._itemList.length; i++ ) {
        if ( this._itemList[i].feature == item ){
          idx = i;
          item = this._itemList[i];
          break;
        }
      }
    }
    if ( idx >= 0 ) {
      item.destroy();
      this._itemList.splice(idx,1);
    }
  }
};




GSIBV.Map.Draw.Measure.FeatureSelector.Item = class extends MA.Class.Base {

  constructor( map, feature) {
    super();
    this._map = map;
    this._feature = feature;
    this._backgroundColor = "transparent";
    this._border = "2px dashed #5a5a5a";
    this._borderRadius = "3px";
    this._selected = false;
  }

  get id(){
    return this._feature._id;
  }

  get feature() {
    return this._feature;
  }

  get selected() {
    return this._selected;
  }

  create() {
    this._createBox();
  }

  show() {
    this.create();
    this._refresh();
    if(this._container) {
      MA.DOM.fadeIn( this._container, 300 );
    }

    if ( !this._mapMoveHandler ) {
      this._mapMoveHandler = MA.bind(this._refresh, this );
      this._map.on( "move", this._mapMoveHandler );
    }
  }

  hide() {
    if ( this._mapMoveHandler ) {
      this._map.off(  "move", this._mapMoveHandler );
      this._mapMoveHandler = undefined
    }

    if(this._container) {
      MA.DOM.fadeOut( this._container, 300 );
    }
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
    this._container.style.cursor = "pointer";
    this._container.classList.add("measure-box");
    MA.DOM.on( this._container, "click", MA.bind( this._onBoxClick, this ) );
    canvasContainer.appendChild(this._container);
  }
  
  _refresh() {
    if ( !this._container) return;
    var pixBounds = this._feature.getFrameBounds(this._map.map,2);
    this._container.style.left = pixBounds.left + "px";
    this._container.style.width = pixBounds.width + "px";
    this._container.style.top = pixBounds.top + "px";
    this._container.style.height = pixBounds.height + "px";
  }
  
  _onBoxClick() {
    this.fire("clicked", {id: this.id});
  }

  getValue() {
    var latlngs = [];
    var len = this.feature.coordinates.length;
    for(var i = 0;i < len;i++) {
      var c = this.feature.coordinates.get(i);
      latlngs.push({lat: c._lat, lng: c._lng});
    }
    var value = 0;
    if(this.feature.geometryType==="Polygon") {
      value = GSI.Utils.AreaCalculator.calc(latlngs);
    }
    if(this.feature.geometryType==="LineString") {
      for( var i=1; i<len; i++ ) {
        value += GSI.Utils.DistanceCalculator.calc(
          latlngs[i-1], latlngs[i]
        );
      }
    }
    return value;
  }

  updateStatus(selected){
    this._selected = selected;
    if(this._selected){
      this._container.classList.add("selected");
    } else {
      this._container.classList.remove("selected");
    }
  }

  destroy() {
    if ( this._container) {
      this._container.parentNode.removeChild( this._container );
      this._container = undefined;
    }

    if ( this._mapMoveHandler ) {
      this._map.off( "move", this._mapMoveHandler );
      this._mapMoveHandler = undefined
    }
  }
};




