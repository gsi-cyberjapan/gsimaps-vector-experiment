GSIBV.Map.Draw.Manager = class extends MA.Class.Base {

  constructor(map) {
    super();
    this._map = map;
    this._layerList = new GSIBV.Map.Draw.Manager.LayerList(map);
    this._list = new GSIBV.Map.Draw.UserDrawList(this._layerList);

    this._userDrawingItem = new GSIBV.Map.Draw.UserDrawList.Item( this._map, 
      "作図中情報", 
      new GSIBV.Map.Draw.FeatureCollection() ) ;
    this._userDrawingItem.hidden = true;
    this._userDrawingItem.layer.order = 2; // 一番上に　大きいほど上に表示
    this._layerList.add( this._userDrawingItem.layer );
    

    this._userDrawItem = new GSIBV.Map.Draw.UserDrawList.Item( this._map, 
      "新規作図情報", 
      new GSIBV.Map.Draw.FeatureCollection() ) ;
    this._userDrawItem.layer.order = 1; // 上から二番目に　大きいほど上に表示
    this._userDrawItem.isUserDraw = true;

    this._list.add( this._userDrawItem );

    this._list.on("change", MA.bind( this._onListChange, this ));
    this._userDrawItem.on( "editstart", MA.bind(this._onDrawItemEditStart, this ));
    this._list.on( "editstart", MA.bind(this._onDrawItemEditStart, this ));

    this._list.on("requesteditfeature", MA.bind( this._onRequestEditFeature, this ));
    this._list.on("requestremovefeature", MA.bind( this._onRequestRemoveFeature, this ));
  }

  get map() {　return this._map;　}
  get userDrawItem() {　return this._userDrawItem;　}
  get userDrawFileList() {　return this._list;　}
  get layerList() { return this._layerList; }
  get drawer() { return this._drawer; }
  get drawing() {
    return (this._drawer || this._list.editing ? true : false);
  }
  get geoJSON() {

    var json = {
      "type": "FeatureCollection",
      "features": []
    };

    for( var i=0; i< this._list.length; i++ ) {
      var features = this._list.get(i).featureCollection.toGeoJSON(true);
      for( var j=0; j<features.length; j++ ) {
        json.features.push( features[j]);
      }
    }

    return ( json.features.length > 0 ? json : undefined);
  }

  _onListChange() {
    this.fire("listchange");
  }

  _onDrawItemEditStart(evt) {
    this.stopDraw();

    var item = evt.params.item;
    if ( this._userDrawItem != item ) {
      this._userDrawItem.editing = false;
    }

    for( var i=0; i< this._list.length; i++ ) {
      if ( this._list.get(i) != item ) {
        this._list.get(i).editing = false;
      }
    }

  }

  _onFileDrop(evt) {
    this._loadFiles( evt.params.list );
    
  }

  _loadFiles(fileList) {
    var list = [];
    var totalBounds = null;
    for( var i=0; i<fileList.length; i++ ) {
      var dropFile = fileList[i];
      // GeoJSON読み込んでみる
      var arr = Encoding.convert(new Uint8Array(dropFile.reader.result), "UNICODE", "AUTO");
      if ( arr[0] == 65279 ) arr.splice(0,1);

      var featureCollection = null;
    
      try {
        featureCollection = GSIBV.Map.Draw.FeatureCollection.generate (JSON.parse(Encoding.codeToString(arr)));
        
        var bounds = featureCollection.bounds;
        if ( !totalBounds) totalBounds =bounds;
        else totalBounds.add(bounds);
        
      }catch( ex) {console.log( ex);}

      if (featureCollection )  {
        list.push( 
          new GSIBV.Map.Draw.UserDrawList.Item( this._map, dropFile.fileName, featureCollection) );
      }
      
    }

    if ( totalBounds ) {
      var lnglatBounds = new mapboxgl.LngLatBounds(
        new mapboxgl.LngLat(totalBounds.northWest.lng, totalBounds.northWest.lat),
        new mapboxgl.LngLat(totalBounds.southEast.lng, totalBounds.southEast.lat)
      );
      var size = MA.getScreenSize();

      var maxZoom = 11;
      if ( this._map.map.getZoom() >= 11 ) maxZoom = this._map.map.getZoom();
      
      this._map.map.fitBounds(lnglatBounds,{
        speed: 2,
        curve: 1.5,
        maxZoom: maxZoom,
        padding:size.width > 300 && size.height > 300 ? 100 : 0});

    }


    this._list.add(list);
  }

  load(list) {
    this._loadFiles( list );
  }

  enable() {
    if ( !this._fileDropHandler ) {
      this._fileDropHandler = MA.bind( this._onFileDrop, this );
      GSIBV.application.on("filedrop",this._fileDropHandler);
    }
  }

  disable() {

    if ( this._fileDropHandler ) {
      GSIBV.application.off("filedrop",this._fileDropHandler);
      this._fileDropHandler = undefined;
    }
  }

  // 新規作図開始
  draw( type) {
    if ( this._drawer ) this.cancelDraw();
    this.stopEdit();

    var drawer = null;
    switch(type) {
      case GSIBV.Map.Draw.Marker.MarkerType:
        drawer = new GSIBV.Map.Draw.MarkerDrawer(this._map,this._userDrawingItem.layer);
        break;

      case GSIBV.Map.Draw.Line.Type:
        drawer = new GSIBV.Map.Draw.LineDrawer(this._map,this._userDrawingItem.layer);
        break;
      
      case GSIBV.Map.Draw.Polygon.Type:
        drawer = new GSIBV.Map.Draw.PolygonDrawer(this._map,this._userDrawingItem.layer);
        break;
    }

    if ( drawer ) {
      drawer.start();
      drawer.on("create", MA.bind(this._onDrawerCreate, this ) );
    }
    this._drawer = drawer;
    
    if ( this._drawer)
      this.fire("drawstart");
  }

  //
  cancelDraw() {
    if ( this._drawer) {
      this._userDrawingItem.featureCollection.remove(this._drawer.feature);
      this._drawer.destroy();
    }
  }

  
  //
  stopDraw() {
    this._userDrawingItem.featureCollection.clear();

    if ( this._drawer ) {
      this._drawer.destroy();
      this._drawer = undefined;
      this.fire("drawfinish");
    }
  }

  stopEdit() {
    for( var i=0; i<this._list.length; i++ ) {
      this._list.get(i).editing = false;
    }
  }
  
  // 新規作図完了後情報編集画面
  _onDrawerCreate(evt) {
    this.fire("drawready", {
      item : this._userDrawItem,
      feature : evt.params.feature,
      layer : evt.params.layer
    });
    /*
    this._userDrawItem.addFeature( feature );
    if ( this._userDrawItem.featureCollection.length == 1 )
      this._layerList.add( this._userDrawItem.layer );
    */
  }

  nextDraw(cancel) {
    var feature = this._drawer.feature;
    this.cancelDraw();

    if ( !cancel ) {
      feature.clearEvents();
      this._userDrawItem.addFeature( feature);
      this.fire("change");
    }
    this._drawer.start();

  }


  _onRequestEditFeature(evt) {
    this.fire("requesteditfeature");
  }
  
  _onRequestRemoveFeature(evt) {
    this.fire("requestremovefeature");
    
  }
};



/*

*/
GSIBV.Map.Draw.Manager.LayerList = class extends GSIBV.Map.LayerList {

  constructor(map) {
    super(map);
  }
  
  
  _addToList( layer ) {
    var topList = [];
    for( var i=0;i<this._list.length; i++ ) {
      if ( this._list[i].order != undefined ) {
        topList.push(this._list[i]);
      }
    }

    for( var i=0; i<topList.length; i++ ) {
      var idx = this._list.indexOf( topList[i]);
      if ( idx >= 0 ) this._list.splice(idx,1);
    }
    
    if ( layer.order != undefined ) {
      topList.push( layer );
    } else {
      this._list.push(layer);
    }

    
    topList.sort(function(a,b){
      if( a.order < b.order ) return -1;
      if( a.order > b.order ) return 1;
      return 0;
    });

    for( var i=0; i<topList.length; i++ ) {
      this._list.push( topList[i]);
    }
    


  }
};


/*

*/
GSIBV.Map.Draw.UserDrawList = class extends MA.Class.Base {
  constructor(layerList) {
    super();
    this._layerList = layerList;
    this._list = [];
  }

  get length () {　return this._list.length;　}
  get(idx) {　return this._list[idx];　}

  get editing() {
    for ( var i=0; i<this._list.length; i++ ) {
      if ( this._list[i].editing ) return true;
    }
    return false;
  }

  _addItem(item) {

    this._list.push( item);
    this._layerList.add( item.layer );
    item.on("remove", MA.bind(function(evt){
      //console.log( "remove", evt.from );
      this.remove(evt.from);
    },this));


    item.on("editstart", MA.bind(function(evt){
      this.fire("editstart", evt.params);


    },this));

    item.on("editfinish", MA.bind(function(evt){
      this.fire("editfinish", evt.params);
    },this));

    item.on("editfeature", MA.bind(function(evt){
      this.fire("editfeaturestart", evt.params);
    },this));

    
    item.on("requesteditfeature", MA.bind(function(evt){
      this.fire("requesteditfeature", evt.params);
    },this));

    
    item.on("requestremovefeature", MA.bind(function(evt){
      this.fire("requestremovefeature", evt.params);
    },this));
  }

  add(item) {
    var added = [];
    if ( MA.isArray(item)) {
      for( var i=0; i<item.length; i++) {
        this._addItem(item[i]);
        added.push( item[i]);
      }
    } else {
      this._addItem(item);
      added.push( item);
    }
    this.fire("change",{
      list : added,
      "type" : "add"
    });
  }

  remove(item) {
    var removed = [];

    var idx = null;
    
    if ( item instanceof GSIBV.Map.Draw.UserDrawList.Item ) {
      idx = this._list.indexOf( item );
    } else {
      idx = item;
    }

    if ( idx < 0 || idx >= this._list.length) {
      //console.log( "no-data");
      this.fire("change");
      return;
    }

    item = this._list[idx];

    if (item.isUserDraw ) {
      //console.log( "item.isUserDraw");
      item.clear();
      return;
    }

    this._layerList.remove( item.layer );
    item.destroy();
    this._list.splice(idx, 1);

    removed.push( item);

    this.fire("change",{
      list : removed,
      "type" : "remove"
    });
  }

};



GSIBV.Map.Draw.UserDrawList.Item = class extends MA.Class.Base {

  constructor(map, fileName, featureCollection) {
    super();
    this._map = map;
    this._fileName = fileName;
    this._featureCollection = featureCollection;
    this._layer = new GSIBV.Map.Draw.Layer( MA.getId("-gsi-draw-"), this._featureCollection );
    this._featureCollection.on ( "change", MA.bind(this._onFeatureCollectionUpdate, this ));
    
  }

  get layer() { return this._layer; }
  get fileName() { return this._fileName; }
  get featureCollection() { return this._featureCollection; }

  get visible() {
    return this._layer.visible;
  }

  set visible( value ) {
    this._layer.visible = value;
    this.fire("change");
  }

  destroy() {
    this.finishEdit();
    this._featureCollection.destroy();

  }

  addFeature( feature ) {
    this._featureCollection.add( feature );
    //this._layer .update();
  }

  remove() {
    this.fire( "remove");
    this.destroy();
  }

  clear() {
    this._featureCollection.clear();
    this._layer .update();
  }

  _onFeatureCollectionUpdate() {
    this._layer.update();
    this.fire("change");
  }

  edit() {
    if ( this.editing) return;
    this._showFeatureSelector();

    this.fire("editstart", {"item":this});

    
    try {
      var bounds = this.featureCollection.bounds;
      var lnglatBounds = new mapboxgl.LngLatBounds(
        new mapboxgl.LngLat(bounds.northWest.lng, bounds.northWest.lat),
        new mapboxgl.LngLat(bounds.southEast.lng, bounds.southEast.lat)
      );
      var size = MA.getScreenSize();
      var maxZoom = 11;
      if ( this._map.map.getZoom() >= 11 ) maxZoom = this._map.map.getZoom();
      
      this._map.map.fitBounds(lnglatBounds,{
        speed: 2,
        curve: 1.5,
        maxZoom: maxZoom,
        padding:size.width > 300 && size.height > 300 ? 100 : 0});
    }catch(e){}


    
  }

  finishEdit() {

    if ( this._featureSelector ) {
      this._featureSelector.destroy();
      this._featureSelector = undefined;
    }

    if  (this._editor) {
      this._editor.destroy();
    }

    this.fire("editfinish", {"item":this});
  }

  get editing() {
    return ( this._featureSelector ? true : false );

  }

  set editing( value ) {
    if ( value ) {
      this.edit();
    } else {
      this.finishEdit();
    }
  }

  stopEditFeature() {

    if ( this._editor) {
      this._editor.destroy();
      this._editor = undefined;
    }
    
    this._showFeatureSelector();

  }

  editFeature( feature ) {

    if ( this._editor) {
      this._editor.destroy();
      this._editor = undefined;
    }
    switch(feature.geometryType){
      case GSIBV.Map.Draw.Line.Type:
      // ライン
        this._editor = new GSIBV.Map.Draw.LineEditor( this._map, feature);
        break;
      case GSIBV.Map.Draw.Polygon.Type:
      // ポリゴン
        this._editor = new GSIBV.Map.Draw.PolygonEditor( this._map, feature);
        break;
      case GSIBV.Map.Draw.MultiPolygon.Type:
      // マルチポリゴン
        this._editor = new GSIBV.Map.Draw.MultiPolygonEditor( this._map, feature);
        break;
      case GSIBV.Map.Draw.Marker.Type:
        if ( feature.markerType == GSIBV.Map.Draw.Marker.MarkerType ) {
        // マーカー
          this._editor = new GSIBV.Map.Draw.MarkerEditor( this._map, feature);
        } else if ( feature.markerType == GSIBV.Map.Draw.CircleMarker.MarkerType ) {
        // サークルマーカー
          this._editor = new GSIBV.Map.Draw.CircleMarkerEditor( this._map, feature);
        } else if ( feature.markerType == GSIBV.Map.Draw.Circle.MarkerType ) {
        // サークル
          this._editor = new GSIBV.Map.Draw.CircleEditor( this._map, feature);
        } else if ( feature.markerType == GSIBV.Map.Draw.DivMarker.MarkerType ) {
        // DIVマーカー
          this._editor = new GSIBV.Map.Draw.DivMarkerEditor( this._map, feature);
        }
        break;
    }

    if ( this._editor ) {
      this.fire("editfeature", {"item":this, "feature":feature});

      var center = feature.bounds.center;
      if ( center )
        this._map.map.flyTo( {center:center} ); 

      this._editor.start();
      this._featureSelector.hide();
      this._showFeatureSelector( feature);

    }
  }

  removeFeature( feature) {

    this._featureCollection.remove( feature);
    this._featureSelector.remove( feature);
    this._layer.update();
    this.fire( "removefeature");
    if ( this._featureCollection.length <= 0 ) {
      this.remove();
    }
  }

  _onSelectorEdit(evt) {
    var feature = evt.params.feature;
    this.fire("requesteditfeature", {"item":this, "feature":feature});
    this.editFeature(feature);
  }

  _onSelectorRemove(evt) {
    var feature = evt.params.feature;
    this.fire("requestremovefeature", {"item":this, "feature":feature});
    this.removeFeature(feature);
    
  }

  _showFeatureSelector(feature) {
    if ( !this._featureSelector) {
      this._featureSelector = new GSIBV.Map.Draw.Control.FeatureSelector( this._map, this._featureCollection);
      this._featureSelector.on( "remove", MA.bind( this._onSelectorRemove, this ));
      this._featureSelector.on( "edit", MA.bind( this._onSelectorEdit, this ));
    }
    this._featureSelector.show(feature);
  }

};



