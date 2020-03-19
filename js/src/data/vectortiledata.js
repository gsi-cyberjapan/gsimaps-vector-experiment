/**********************************************
  GSIBV.VectorTileData
    root(Directory)
      - Directory itemList
        - Item layerList
          - Layer drawList
            - Draw
    グループ管理
***********************************************/
GSIBV.VectorTileData = class extends MA.Class.Base {
  constructor(json, options) {
    super();
    this._root = new GSIBV.VectorTileData.Directory(this);

    if ( json.maxNativeZoom ) this._maxNativeZoom = json.maxNativeZoom;
    if ( options && options.maxNativeZoom ) this._maxNativeZoom = options.maxNativeZoom;


    this._tiles = [
      //"https://cyberjapandata.gsi.go.jp/xyz/experimental_bvmap/{z}/{x}/{y}.pbf"
      "https://cyberjapandata.gsi.go.jp/xyz/experimental_bvmap_tmp/{z}/{x}/{y}.pbf"
    ];

    if ( json ) {
      this._origJSON = JSON.parse( JSON.stringify(json) );
    }
    this.fromJSON(json);
    this._source = GSIBV.VectorTileSource.Manager.manager.getSource(
      this._tiles, undefined, this._maxNativeZoom );

  }

  get root() { return this._root; }
  get source() { return this._source; }
  get groupList() { return this._groupList; }
  get maxNativeZoom() { return this._maxNativeZoom; }

  get title() { return this._title;}
  set title(title) { this._title = title;}
  get fileName() { return this._fileName;}
  set fileName(fileName) { this._fileName = fileName;}

  reset() {
    if ( !this._origJSON ) return;
    this._root = new GSIBV.VectorTileData.Directory(this);
    this.fromJSON(this._origJSON);
  }

  fromJSON(json) {
    if (!json) {
      return;
    }
    this._groupList = new GSIBV.VectorTileData.LayerGroupList();
    this._groupList.fromJSON(json.group);
    this._title = json.title;
    this._root.fromJSON(json);
    this._root._title = "";

    this._groupList.sort();
  }

  toData() {

    var result = this._root.toData();
    result["title"] = this._title;
    result["group"] = this._groupList.toData();
    
    if (this._maxNativeZoom) {
      result["maxNativeZoom"] = this._maxNativeZoom;
    }

    return result;
  }

  save(indent) {
    var data = this.toData();
    indent = 2;
    MA.saveFile(this._fileName, "application\/json", 
      JSON.stringify(data, null, indent ) );

  }

  findByLayerId(id) {
    return this._findByLayerId( this._root, id );
  }

  _findByLayerId(item,id) {
    if ( item instanceof GSIBV.VectorTileData.Directory ) {
      for( var i=0; i<item._itemList.length; i++ ) {
        var hit = this._findByLayerId(item._itemList[i],id);
        if ( hit ) return hit;
      }
    } else if ( item instanceof GSIBV.VectorTileData.Item ) {
      for( var i=0; i<item._layerList.length; i++ ) {
        var hit = this._findByLayerId(item._layerList[i],id);
        if ( hit ) return hit;
      }
    } else if ( item instanceof GSIBV.VectorTileData.Layer ) {
      if ( item.id == id ) return item;
      
    }

    return null;
  }

  getDrawList() {
    var result = [];
    this._getDrawList( this._root, result );
    return result;
  }

  _getDrawList(item,result) {
    if ( item instanceof GSIBV.VectorTileData.Directory ) {
      for( var i=0; i<item._itemList.length; i++ ) {
        this._getDrawList(item._itemList[i],result);
      }
    } else if ( item instanceof GSIBV.VectorTileData.Item ) {
      for( var i=0; i<item._layerList.length; i++ ) {
        this._getDrawList(item._layerList[i],result );
      }
    } else if ( item instanceof GSIBV.VectorTileData.Layer ) {
      
      for( var i=0; i<item._drawList.length; i++ ) {
        result.push( item._drawList[i]);
      }
    }
  }

  
  getLayerList() {
    var result = [];
    this._getLayerList( this._root, result );
    return result;
  }

  _getLayerList(item,result) {
    if ( item instanceof GSIBV.VectorTileData.Directory ) {
      for( var i=0; i<item._itemList.length; i++ ) {
        this._getLayerList(item._itemList[i],result);
      }
    } else if ( item instanceof GSIBV.VectorTileData.Item ) {
      for( var i=0; i<item._layerList.length; i++ ) {
        this._getLayerList(item._layerList[i],result );
      }
    } else if ( item instanceof GSIBV.VectorTileData.Layer ) {
      
      result.push( item);
    }
  }

};


/**********************************************
  GSIBV.VectorTileData.LayerGroupList
  GSIBV.VectorTileData.LayerGroup
    グループ管理
***********************************************/
GSIBV.VectorTileData.LayerGroupList = class extends MA.Class.Base {
  constructor() {
    super();
    this._list = [];
    this._hash = {};
    this._unknownGroup = new GSIBV.VectorTileData.LayerGroup();
  }
  get list() { return this._list; }
  get length() { return this._list.length; }

  toData() {
    /*
    var result = [];

    for( var i=0; i<this._list.length;i++ ) {
      result.push( this._list[i].toData() );
    }
    return result;
    */
   return this._json;
  }
  getById(id) {
    var result = this._hash[id];
    if (!result) result = [this._unknownGroup];
    return result;
  }
  fromJSON(json) {
    if (!json) return;
    this._json = JSON.parse( JSON.stringify(json));

    for (var i = 0; i < json.length; i++) {
      var filter = json[i].filter;

      if ( json[i].hasOutline ) {
        var item = JSON.parse( JSON.stringify(json[i]));
        if ( !item["filter"] ) item["filter"] = [];
        item["filter"].push( [
          "==",
          "line-role",
          "outline"
        ]);
        this.add(new GSIBV.VectorTileData.LayerGroup(
          item.id, 
          item.title,
          item.zoom,
          false,
          item.hasOutline,
          item["additional-filter"],
          item["filter"]));
        
        if ( !filter) filter =[];
        filter.push( [
          "!=",
          "line-role",
          "outline"
        ])
      }
      this.add(new GSIBV.VectorTileData.LayerGroup(
        json[i].id, 
        json[i].title,
        json[i].zoom,
        json[i].editZIndex,
        json[i].hasOutline,
        json[i]["additional-filter"],
        filter));
    }

  }
  add(group) {
    if ( !this._hash[group.id] ) this._hash[group.id] = [];

    this._hash[group.id].push(group);
    this._list.push(group);
  }

  sort() {
    for( var i=0; i<this._list.length; i++ ) {
      var group = this._list[i];
      group.sort();
    }
  }
};

GSIBV.VectorTileData.LayerGroup = class extends MA.Class.Base {

  constructor(id, title,zoom,editZIndex,hasOutline,additionalFilter,filter) {
    super();
    this._id = (id != undefined ? id : "");
    this._title = (title != undefined ? title : this._id);
    this._zoom = zoom;
    this._additionalFilter = additionalFilter;
    this._editZIndex = editZIndex;
    this._hasOutline = hasOutline;
    this._filter = filter;
    this._items = [];
  }

  get id() { return this._id; }
  get title() { return this._title; }
  get items() { return this._items; }
  get zoom() { return this._zoom; }
  get additionalFilter() { return this._additionalFilter; }
  get filter() { return this._filter; }
  get editZIndex() { return this._editZIndex; }
  get hasOutline() { return this._hasOutline; }
  add(item) {
    this._items.push(item);
  }

  sort() {
    this._items.sort(function(a,b){
      var zIndexA = a.zIndex != undefined ? a.zIndex : -1;
      var zIndexB = b.zIndex != undefined ? b.zIndex : -1;


      if( zIndexA < zIndexB ) return -1;
      if( zIndexA > zIndexB ) return 1;
      return 0;
    });
  }

  filter(mapboxLayer) {
    if ( !this.hasZoom (mapboxLayer) ) {
      return false;
    }

    if ( this._filter == undefined) return true;

    var result = true;
    for( var i=0; i< this._filter.length; i++ ) {
      var filter = this._filter[i];
      switch( filter[0]) {
        case "!=":
          if ( mapboxLayer["metadata"][filter[1]] == filter[2] ) 
            result = false;
          break;

        case "==":
          if ( mapboxLayer["metadata"][filter[1]] != filter[2] ) 
            result = false;
          break;
      }
      
      if (!result ) break;
    }
    return result;

  }  
  

  hasZoom(mapboxLayer) {
    if (!this._zoom || this._zoom.length <= 0) return true;
    for( var i=0; i<this._zoom.length;i++ ) {
      var z = this._zoom[i];
      // mapboxLayer
      if ( z >= mapboxLayer.minzoom && z <= mapboxLayer.maxzoom -1) {
        return true;
      }
    }

    return false;
  }
  toData() {
    var result = {
      "id" : this._id,
      "title" : this._title,
      "zoom" : this._zoom,
      "editZIndex" : this._editZIndex,
      "hasOutline" : this._hasOutline,
      "additional-filter" : this._additionalFilter,
      "filter" : this._filter
    }

    return result;
  }
};


/**********************************************
  GSIBV.VectorTileData.ItemBase 
    子要素のベース
***********************************************/
GSIBV.VectorTileData.ItemBase = class extends MA.Class.Base {

  constructor(owner, parent) {
    super();
    this._owner = owner;
    this._parent = parent;
  }

  get owner() { return this._owner; }
  get parent() { return this._parent; }
  get source() { 
    return this._owner._source; 
  }
  set title( title ) {
    this._title = title;
  }
  get title() {
    return (this._title != undefined ? this._title : 
      ( this._parent != undefined ? this._parent.title : undefined ) );
  }

  get titles() {
    var titles = ( this._parent != undefined ? this._parent.titles : undefined );
    if (this._title != undefined) {
      if (!titles) titles = [];
      titles.push(this._title);
    }
    return titles;
  }

  get fullTitle() {
    var title = ( this._parent != undefined ? this._parent.fullTitle : "" );
    title += (this._title != undefined && this._title !=  "" ? 
      ( title != "" ? "-" : "" ) + this._title : "");
    return title;
  }

  get path () {
    return  (this._parent ? this._parent.fullTitle : "");
  }

  get minzoom() {
    return (this._minzoom != undefined ? this._minzoom : 
      ( this._parent != undefined ? this._parent.minzoom : undefined ) );
  }

  get maxzoom() {
    return (this._maxzoom != undefined ? this._maxzoom : 
      ( this._parent != undefined ? this._parent.maxzoom : undefined ) );
  }

  get filter() {
    return (this._filter != undefined ? this._filter : 
      ( this._parent != undefined ? this._parent.filter : undefined ) );
  }

  get type() {
    return (this._type != undefined && this._type != "" ? this._type : 
      ( this._parent != undefined ? tthis._parent.type : undefined ) );
  }
  get zIndex() {
    return (this._zIndex != undefined ? this._zIndex : -1 );
  }
  set zIndex(zIndex) {
    this._zIndex = zIndex;
  }

  /*
  get source() {
    return (this._source != undefined ? this._source : 
      ( this._parent != undefined ? this._parent.source : undefined ) );
  }
  */
  
  get sourceLayer() {
    return (this._sourceLayer != undefined && this._sourceLayer != "" ? this._sourceLayer : 
      ( this._parent != undefined ? this._parent.sourceLayer : undefined ) );
  }

  get group() {
    return (this._group != undefined ? this._group : 
      ( this._parent != undefined ? this._parent.group : undefined ) );
  }

  toData() {
    var result = {};
    if ( this._title != undefined) result["title"] = this._title;
    if ( this._minzoom != undefined) result["minzoom"] = this._minzoom;
    if ( this._maxzoom != undefined) result["maxzoom"] = this._maxzoom;
    if ( this._filter != undefined) result["filter"] = this._filter;
    if ( this._type != undefined) result["type"] = this._type;
    if ( this._sourceLayer != undefined) result["source-layer"] = this._sourceLayer;
    if ( this._group != undefined) result["group"] = this._group;
    if ( this._zIndex != undefined) result["zIndex"] = this._zIndex;
    
    return result;
  }
  copyTo(result) {

    result._title = this._title;
    result._minzoom = this._minzoom;
    result._maxzoom = this._maxzoom;
    result._filter = ( this._filter ? JSON.parse( JSON.stringify(this._filter)) :  undefined );
    result._type = this._type;
    result._zIndex = this._zIndex;
    //this._source = json.source;
    result._sourceLayer = this._sourceLayer;
    result._group = ( this._group ? JSON.parse( JSON.stringify(this._group)) :  undefined );

    return result;
  }
  fromJSON( json ) {
    if ( !json) return;
    this._title = ( json.title == "" ? undefined : json.title ); 
    this._minzoom = json.minzoom;
    this._maxzoom = json.maxzoom;
    this._filter = json.filter;
    this._zIndex = json.zIndex;
    //this._source = json.source;
    this._type = json.type;
    this._sourceLayer = json["source-layer"];
    this._group = json.group;
  }

  _findItem(list, item) {
    return list.indexOf( item );
  }
  removeItem(item) {
    if ( !this.getList ) return;
    var list = this.getList();
    var idx = this._findItem( list, item );
    if ( idx < 0 ) return false;
    list.splice( idx, 1);
    return true;
  }
  insertItemAfter( item, after ) {
    if ( !this.getList ) return;
    var list = this.getList();
    var idx = this._findItem( list, after );

    item._owner = this._owner;
    item._parent = this;

    if ( idx < list.length-1)
      list.splice( idx+1, 0, item);
    else
      list.push(item);
    return true;
  }
  addItem( item ) {
    if ( !this.getList ) return;
    var list = this.getList();

    item._owner = this._owner;
    item._parent = this;
    list.push(item);
    return true;
  }

  insertItemBefore( item, before ) {
    if ( !this.getList ) return;
    var list = this.getList();
    var idx = this._findItem( list, before );

    item._owner = this._owner;
    item._parent = this;
    list.splice( idx, 0, item);

    return true;
  }
  moveToBefore(item) {
    if ( !this.getList ) return;
    var list = this.getList();
    var idx = this._findItem( list, item );

    if ( idx <= 0 ) return false;
    list.splice( idx, 1);
    list.splice( idx-1, 0, item );

    return true;
  }

  moveToAfter(item) {
    if ( !this.getList ) return;
    var list = this.getList();
    var idx = this._findItem( list, item );

    if ( idx >= list.length - 1 ) return false;
    list.splice( idx, 1);
    list.splice( idx+1, 0, item );

    return true;
  }

  moveToFront(item) {
    if ( !this.getList ) return;
    var list = this.getList();
    var idx = this._findItem( list, item );

    if ( idx <= 1 ) return false;
    list.splice( idx, 1);
    list.unshift( item );

    return true;
  }

  moveToBack(item) {
    if ( !this.getList ) return;
    var list = this.getList();
    var idx = this._findItem( list, item );

    if ( idx >= list.length - 2 ) return false;
    list.splice( idx, 1);
    list.push( item );

    return true;
  }
} ;



/**********************************************
  GSIBV.VectorTileData.Directory 
    ディレクトリ要素
      itemList で子要素(Directory|Item)の配列を持つ
***********************************************/
GSIBV.VectorTileData.Directory = class extends GSIBV.VectorTileData.ItemBase {

  constructor(owner, parent) {
    super( owner, parent );
    this._itemList = [];
    this._group = undefined;
  }

  get itemList() { return this._itemList; }
  get sortedItemList() {

    var result = [];

    for ( var i=0; i<this._itemList.length; i++ ) {
      var item = this._itemList[i];
      item._order= GSIBV.CONFIG.TOPORDER.indexOf(item.title);

      result.push( item);
    }

    result.sort(function(a,b){
      if ( a == undefined ) return -1;
      if ( b == undefined ) return 1;
      if( a._order < b._order ) return -1;
      if( a._order > b._order ) return 1;
      return 0;
    });
    
    return result;

  }

  getVisible(z) { 
    
    for( var i=0; i<this._itemList.length; i++) {
      var item = this._itemList[i];
      if ( item.getVisible(z)) {
        return true;
      }
    }
    
    return false;
  }

  get visible() {
    return this.getVisible();
  }
  
  getTargetZoomItemList(z) {
    var result = [];
    this._getTargetZoomItemList(result,this._itemList,z);

    return result;
  }
  
  _getTargetZoomItemList(result,list,z) {
    
    for( var i=0; i<list.length; i++) {
      var item = list[i];
      if ( item instanceof GSIBV.VectorTileData.Directory) {
        var hitItem = this._getTargetZoomItemList( result,item._itemList,z );
        if ( hitItem != undefined ) result.push( hitItem);
      } else {
        var hit = false;
        for (var j = 0; j < item.layerList.length; j++) {
          var l = item.layerList[j];
          if (z >= l.minzoom && z <= l.maxzoom) {
            hit = true;
            break;
          }
        }
        if ( hit ) result.push( item);
      }
    }

    
  }



  setVisible(visible, z) { 
    
    for( var i=0; i<this._itemList.length; i++) {
      var item = this._itemList[i];
      if ( item.setVisible(visible,z)) {
        return true;
      }
    }
    
    return false;
  }
  getList() {
    return this._itemList;
  }
  toData() {
    var result = super.toData();
    result.list = [];

    for ( var i=0; i<this._itemList.length; i++ ) {
      result.list.push( this._itemList[i].toData() );
    }

    return result;
  }
  fromJSON( json ) {
    this._itemList = [];
    super.fromJSON( json );

    if ( !json ) return;

    if ( !json.list) return;

    for( var i=0;i<json.list.length; i++) {
      var jsonItem = json.list[i];  
      

      var item = null;
      if( jsonItem.type == "directory" || jsonItem.type == "group" ) {
        item = new GSIBV.VectorTileData.Directory( this._owner, this );
      } else {
        item = new GSIBV.VectorTileData.Item( this._owner, this );
      }
      item.fromJSON( jsonItem );
      this._itemList.push( item );
    }
  }
};


/**********************************************
  GSIBV.VectorTileData.Item 
    アイテム要素
      layerList で子要素(Layer)の配列を持つ
***********************************************/
GSIBV.VectorTileData.Item = class extends GSIBV.VectorTileData.ItemBase {

  constructor(owner, parent, group) {
    super( owner, parent );
    this._layerList = [];
    this._id = MA.getId( "item-" );
  }

  get id() { return this._id; }
  get layerList() { return this._layerList; }
  get visible () {
    return this.getVisible();
  }
  getVisible(z) { 
    
    for( var i=0; i<this._layerList.length; i++) {
      var layer = this._layerList[i];
      if ( z != undefined && (z < layer.minzoom || z > layer.maxzoom ) ) continue;
      if ( layer.visible == undefined || layer.visible == true ) {
        return true;
      }
    }
    
    return false;
  }
  setVisible(visible, z) {
    for( var i=0; i<this._layerList.length; i++) {
      var layer = this._layerList[i];
      if ( z != undefined && (z < layer.minzoom || z > layer.maxzoom ) ) continue;
      layer.visible = visible;
    }
    this.fire("change");
  }

  fromJSON( json ) {
    this._layerList = [];
    super.fromJSON( json );
    if ( !json ) return;

    if ( !json.list) return;

    for( var i=0;i<json.list.length; i++) {
      var jsonItem = json.list[i];
      var layer = new GSIBV.VectorTileData.Layer(this._owner, this);
      layer.fromJSON( jsonItem, json.visible );
      this._layerList.push( layer );
      continue;
      if ( this.owner.maxNativeZoom ) {
        if ( layer.minzoom <= this.owner.maxNativeZoom-1) {
          if ( layer.maxzoom >= this.owner.maxNativeZoom-1) {
            //layer._maxzoom = 17// this.owner.maxNativeZoom;
          }
          this._layerList.push( layer );
        }
      } else {
        this._layerList.push( layer );
      }
    }

    var group = this.group;
    if (group) {
      for (var i = 0; i < group.length; i++) {
        var targetGroupList = this._owner._groupList.getById(group[i]);
        if ( !targetGroupList ) continue;
        for( var j=0; j<targetGroupList.length; j++ )
          targetGroupList[j].add(this);

      }
    }

  }

  toData() {
    var result = super.toData();
    result.type = "item";
    result.list = [];

    var prevFilter = undefined;
    var isFilterSame = true;
    for ( var i=0; i<this._layerList.length; i++ ) {
      var data = this._layerList[i].toData();
      result.list.push( data );
      if ( !isFilterSame ) continue;
      if ( !data.filter ) {
        isFilterSame = false;
      } else {
        var filter = JSON.stringify( data.filter );
        if ( prevFilter == undefined ) {
          prevFilter = filter;
        } else {
          if ( prevFilter != filter ) isFilterSame = false;
        }
      }
    }


    if ( isFilterSame && prevFilter != undefined ) {
      for( var i=0;i<result.list.length; i++ )
        delete result.list[i]["filter"];

      result.filter = JSON.parse( prevFilter) ;

    } else {
      delete result["filter"];
    }

    return result;
  }
  get mapBoxLayers() {
    
    if (this._mapboxLayers) return JSON.parse(JSON.stringify(this._mapboxLayers));
    return this.refreshMapboxLayers();
  }

  refreshMapboxLayers() {
    var result = [];
    for (var i = 0; i < this._layerList.length; i++) {
      var layer = this._layerList[i];

      var mapboxLayers = layer.mapBoxLayers;
      for (var j = 0; j < mapboxLayers.length; j++) {
        result.push(mapboxLayers[j]);
      }
    }

    this._mapboxLayers = result;

    return this._mapboxLayers;
  }

};


/**********************************************
  GSIBV.VectorTileData.Layer 
    レイヤ要素（基本的にはズームレベル毎に存在）
      drawList で子要素(Draw)の配列を持つ
***********************************************/
GSIBV.VectorTileData.Layer = class extends GSIBV.VectorTileData.ItemBase {

  constructor(owner, parent) {
    super( owner, parent );
    this._drawList = [];
    this._id = MA.getId( "layer-" );
  }

  get id() { return this._id; }
  get drawList() { return this._drawList; }
  get visible() { return ( this._visible != undefined ? this._visible : true ); }
  set visible(visible) {
    if (this._visible == visible) return;
    this._visible = visible;
  }

  
  toData() {
    var result = super.toData();
    result.type = "layer";
    result.list = [];

    var prevFilter = undefined;
    var isFilterSame = true;
    
    result.visible = this._visible;


    for ( var i=0; i<this._drawList.length; i++ ) {
      var filter = JSON.stringify( this._drawList[i].filter );
      if ( prevFilter == undefined ) {
        prevFilter = filter;
      } else {
        if ( prevFilter != filter ) isFilterSame = false;
      }
      result.list.push( this._drawList[i].toData() );
    }
    if ( isFilterSame && prevFilter != undefined ) {
      for( var i=0;i<result.list.length; i++ )
        delete result.list[i]["filter"];

      result.filter = JSON.parse( prevFilter) ;

    } else {
      delete result["filter"];
    }
    return result;
  }

  getList() {return this._drawList;}
  removeItem(draw) {
    var result = super.removeItem( draw );
    if ( result ) this._parent.fire("change" );
    return result;
  }

  insertItemAfter( draw, after ) {
    var result = super.insertItemAfter( draw, after );
    if ( result ) this._parent.fire("change" );
    return result;
  }
  insertItemBefore( draw, before ) {
    var result = super.insertItemBefore( draw, before );
    if ( result ) this._parent.fire("change" );
    return result;
  }

  moveToBefore(draw) {
    var result = super.moveToBefore( draw );
    if ( result ) this._parent.fire("change" );
    return result;
  }

  
  moveToAfter(draw) {
    var result = super.moveToAfter( draw );
    if ( result ) this._parent.fire("change" );
    return result;
  }

  
  moveToFront(draw) {
    var result = super.moveToFront( draw );
    if ( result ) this._parent.fire("change" );
    return result;
  }


  moveToBack(draw) {
    var result = super.moveToBack( draw );
    if ( result ) this._parent.fire("change" );
    return result;
  }


  fromJSON( json, visible ) {
    this._drawList = [];
    super.fromJSON( json );
    if ( !json ) return;
    
    if ( visible  != undefined )
      this._visible = visible == false ? false : true;
    if ( json.visible  != undefined )
      this._visible = json.visible == false ? false : true;

    if ( !json.list) {
      // listが直接描画情報がある場合
      if ( GSIBV.VectorTileData.Draw.isDrawObject(json)) {
        var draw = new GSIBV.VectorTileData.Draw(this._owner, this);
        draw.fromJSON( json );
        this._drawList.push( draw );
      }
      return;
    }

    for( var i=0;i<json.list.length; i++) {
      var jsonItem = json.list[i];
      if ( !GSIBV.VectorTileData.Draw.isDrawObject(jsonItem)) continue;

      var draw = new GSIBV.VectorTileData.Draw(this._owner, this);
      draw.fromJSON( jsonItem );

      this._drawList.push( draw );
    }
  }

  get mapBoxLayers() {
    var result = [];
    if (!this._drawList) return result;

    for (var i = 0; i < this._drawList.length; i++) {
      var draw = this._drawList[i];
      var mapBoxLayerList = GSIBV.VectorTileData.MapboxLayerGenerator.generate(draw,this._id);
      
      for (var j = 0; j < mapBoxLayerList.length; j++) {
        var mapboxLayer = mapBoxLayerList[j];
        if ( !this.visible ) {
          if (!mapboxLayer.layout) mapboxLayer.layout = {};
          mapboxLayer.layout["visibility"] = "none";
        }
        result.push(mapboxLayer);
      }


    }

    return result;
  }

};



/**********************************************
  GSIBV.VectorTileData.Draw 
    描画設定
***********************************************/
GSIBV.VectorTileData.Draw = class extends GSIBV.VectorTileData.ItemBase {

  constructor(owner, parent) {
    super( owner, parent );
  }

  static isDrawObject(json) {
    // info , drawが存在する場合はtrue
    if ( !json ) return false;
    if ( !json.draw || !json.info ) return false;

    return true;
  }

  get hasOutline() {
    if ( this.type != "fill") return false;

    return this._drawStyle.hasOutline;

  }
  get drawStyle() { return this._drawStyle; }
  
  get paint() {
    if (!this._drawStyle) return undefined;
    return this._drawStyle.paint;
  }

  get metadata() {
    if (!this._drawStyle || !this._drawStyle.metadata) return {};
    return this._drawStyle.metadata;
  } 
  

  get layout() {
    if (!this._drawStyle) return undefined;
    return this._drawStyle.layout;
  }

  update(drawStyle) {
    this._drawStyle.copyFrom(drawStyle);
  }

  
  toData() {
    var result = super.toData();
    //result.type = "draw";
    var data = this._drawStyle.toData();
    result["info"] = data["info"];
    result["draw"] = data["draw"];
    
    return result;
  }

  clone() {
    var result = new GSIBV.VectorTileData.Draw( this._owner, this._parent);
    this.copyTo(result);
    result._drawStyle = ( this._drawStyle ? this._drawStyle.clone() : undefined );
    return result;
  }
  fromJSON( json ) {
    super.fromJSON( json );
    if ( !json ) return;
    
    if (!json.info) {
      return;
    }
    switch (this._type) {
      case "symbol":
        this._drawStyle = new GSIBV.VectorTileData.SymbolDrawStyle(json.info, json.draw);
        break;
      case "fill":
        this._drawStyle = new GSIBV.VectorTileData.FillDrawStyle(json.info, json.draw);
        break;
      case "line":
        this._drawStyle = new GSIBV.VectorTileData.LineDrawStyle(json.info, json.draw);
        break;
      default:
        break;
    }

  }

};
