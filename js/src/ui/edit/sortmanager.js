/***************************************
    GSIBV.UI.EditLayerView.SortManager
    R1ソート機能用
***************************************/
GSIBV.UI.EditLayerView.SortManager = class extends MA.Class.Base {

  constructor(layer, sortType) {
    super();
    this._layer = layer;
  }

  get roadRoot() {
    return this._roadRoot;
  }

  set roadRoot(value ) {
    this._roadRoot = undefined;
  }

  
  get railwayRoot() {
    return this._railwayRoot;
  }
  
  set railwayRoot(value ) {
    this._railwayRoot = undefined;
  }

  initializeRoad(sortType) {
    var hasChargeType = false;
    for( var i=0;i<this._layer.data.root.itemList.length; i++ ) {
      var item = this._layer.data.root.itemList[i];
      if ( item.title =="道路") {
        var result = this._initializeRoad( item );
        hasChargeType = result.hasChargeType;
        break;
      }
    }

    var typeList = [
      GSIBV.UI.EditLayerView.SortManager.SortType.RoadType,
      GSIBV.UI.EditLayerView.SortManager.SortType.WidthType,
      GSIBV.UI.EditLayerView.SortManager.SortType.RoadState];

    if ( hasChargeType ) typeList.push( GSIBV.UI.EditLayerView.SortManager.SortType.ChargeType);
    this._roadRoot = new GSIBV.UI.EditLayerView.SortManager.RoadItem(this._roadList,
      typeList, undefined, undefined, undefined, sortType);
    
    return this._roadRoot ;
  }

  initializeRailway(sortType) {
    for( var i=0;i<this._layer.data.root.itemList.length; i++ ) {
      var item = this._layer.data.root.itemList[i];
      if ( item.title =="鉄道") {
        var result = this._initializeRailway( item );
        break;
      }
    }

    var typeList = [
      GSIBV.UI.EditLayerView.SortManager.SortType.RailwayType,
      GSIBV.UI.EditLayerView.SortManager.SortType.RailwayState,
      GSIBV.UI.EditLayerView.SortManager.SortType.RailwayNum];

    this._railwayRoot = new GSIBV.UI.EditLayerView.SortManager.RailwayItem(this._roadList,
      typeList, undefined, undefined, undefined, sortType);
    
    return this._railwayRoot ;
  }

  _initializeRoad(item) {
    var list = [];
    var result = this._getRoadItemList( list, item.itemList);
    
    this._roadList = list;
    return result;
  }

  _initializeRailway(item) {
    var list = [];
    var result = this._getRailwayItemList( list, item.itemList);

    this._roadList = list;
    return result;
  }


  _getRoadItemList( destList, list ) {
    var hasChargeType = false;

    for( var i=0; i<list.length; i++ ) {
      var item = list[i];
      if ( item instanceof GSIBV.VectorTileData.Item ) {
        var layerList = [];

        for( var j=0; j<item.layerList.length; j++ ) {
          var layer = item.layerList[j];
          /*
          if ( layer.minzoom >= 11 && layer.maxzoom <= 16){
            layerList.push( layer );
          }
          */
          if ( layer.minzoom <= 16 && layer.maxzoom >= 11){
            layerList.push( layer );
          }
        }
        if ( layerList.length > 0 ) {
          
          var itemInfo = this._initializeRoadItem( item );
          destList.push(itemInfo );
          
          if ( itemInfo.category.chargeType ) {
            hasChargeType = true;
          }
        }
      } else {
        var reulst = this._getRoadItemList(destList, item.itemList);
        if ( reulst.hasChargeType ) {
          hasChargeType = reulst.hasChargeType;
        }
      }
    }

    return {
      hasChargeType : hasChargeType
    };
  }

  
  _initializeRoadItem(item) {
    var target = item;
    var category = {
      roadState : undefined,
      widthType : undefined,
      roadType : undefined,
      chargeType : undefined
    };
    while(target) {
      var idx = GSIBV.UI.EditLayerView.SortManager.RoadState.indexOf( target.title);
      if ( idx >= 0 ) {
        category.roadState = target.title;
      }
      
      idx = GSIBV.UI.EditLayerView.SortManager.WidthType.indexOf( target.title);
      if ( idx >= 0 ) {
        category.widthType = target.title;
      }
      
      idx = GSIBV.UI.EditLayerView.SortManager.RoadType.indexOf( target.title);
      if ( idx >= 0 ) {
        category.roadType = target.title;
      }
      
      idx = GSIBV.UI.EditLayerView.SortManager.ChargeType.indexOf( target.title);
      if ( idx >= 0 ) {
        category.chargeType = target.title;
      }

      target = target.parent;
    }



    return {
      category : category,
      item : item
    };
    //console.log(item.title ,state);
    
  }

  
  _getRailwayItemList( destList, list ) {

    for( var i=0; i<list.length; i++ ) {
      var item = list[i];
      if ( item instanceof GSIBV.VectorTileData.Item ) {
        var layerList = [];

        for( var j=0; j<item.layerList.length; j++ ) {
          var layer = item.layerList[j];
          if ( layer.minzoom >= 11 && layer.maxzoom <= 16){
            layerList.push( layer );
          }
        }
        if ( layerList.length > 0 ) {
          
          var itemInfo = this._initializeRailwayItem( item );
          destList.push(itemInfo );
          
          if ( itemInfo.category.chargeType ) {
            hasChargeType = true;
          }
        }
      } else {
        var reulst = this._getRailwayItemList(destList, item.itemList);
      }
    }

    return {
    };
  }

  
  _initializeRailwayItem(item) {
    var target = item;
    var category = {
      railwayType : undefined,
      railwayState : undefined,
      railwayNum : undefined
    };
    while(target) {
      var idx = GSIBV.UI.EditLayerView.SortManager.RailwayType.indexOf( target.title);
      if ( idx >= 0 ) {
        category.railwayType = target.title;
      }
      
      idx = GSIBV.UI.EditLayerView.SortManager.RailwayState.indexOf( target.title);
      if ( idx >= 0 ) {
        category.railwayState = target.title;
      }
      
      idx = GSIBV.UI.EditLayerView.SortManager.RailwayNum.indexOf( target.title);
      if ( idx >= 0 ) {
        category.railwayNum = target.title;
      }
      

      target = target.parent;
    }



    return {
      category : category,
      item : item
    };
    //console.log(item.title ,state);
    
  }

};

GSIBV.UI.EditLayerView.SortManager.Item = class extends MA.Class.Base {
  constructor() {
    super();
  }
};

GSIBV.UI.EditLayerView.SortManager.RoadItem = class extends GSIBV.UI.EditLayerView.SortManager.Item {
  constructor(itemList, sortTypeList, parent, type, title, sortType) {
    super();
    this._itemList = itemList;
    this._sortTypeList = JSON.parse( JSON.stringify(sortTypeList) );
    this._type = type;
    this._parent = parent;
    this._title = title;
    this._sortType = ( sortType ? sortType : 0);
    this._list = [];
    this._initialize();
  }

  get title() { return this._title; }
  get sortType() { return this._sortType; }
  get parent() { return this._parent; }
  get list() {return this._list;}

  getVisible(z) {
    if ( !this._itemList ) return false;
    for( var i=0; i<this._itemList.length; i++ ) {
      var item = this._itemList[i].item;
      if ( item.getVisible(z)) {
        return true;
      }
    }
    return false;
  }
  setVisible(visible,z) {
    //console.log("表示状態を設定");
    if ( !this._itemList ) return;
    for( var i=0; i<this._itemList.length; i++ ) {
      var item = this._itemList[i].item;
      if ( item.setVisible(visible,z)) {
        return true;
      }
    }

    //console.log( this._itemList);
    return true;
  }
  getTargetZoomItemList(z) {
    var result = [];
    this._getTargetZoomItemList(result,this._itemList,z);

    return result;
  }
  
  _getTargetZoomItemList(result,list,z) {
    
    for( var i=0; i<list.length; i++) {
      var item = list[i].item;
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

  getLayerlength() {
    return this._itemList.length;
  }

  getLength( z ) {
    var result = 0;
    for( var i=0; i<this._itemList.length; i++) {
      var item = this._itemList[i];

      for( var j=0; j<item.item.layerList.length; j++ ) {
        var layer = item.item.layerList[j];
        if ( z >= layer.minzoom && z <= layer.maxzoom ) {
          result++;
        }
      }
    }
    
    return result;
  }

  getSortTypeList() {
    var result = [];

    for( var i=0; i<this._sortTypeList.length; i++ ) {
      result.push({
        "title" : GSIBV.UI.EditLayerView.SortManager.RoadSortTypeToTitle(this._sortTypeList[i]),
        "id" : this._sortTypeList[i]
      });
    }

    return result;
  }

  set sortType(value) { 
    this._sortType = value; 
    this._list = [];
    this._initialize();
  }

  _initialize() {

    if ( this._sortTypeList.length <= 0 ) return;

    var sortType = this._sortType;
    var sortTypeList = JSON.parse( JSON.stringify(this._sortTypeList) );
    
    if ( sortType != GSIBV.UI.EditLayerView.SortManager.SortType.RoadType
        && sortType != GSIBV.UI.EditLayerView.SortManager.SortType.WidthType
        && sortType != GSIBV.UI.EditLayerView.SortManager.SortType.RoadState
        && sortType != GSIBV.UI.EditLayerView.SortManager.SortType.ChargeType) {
      sortType = sortTypeList[0];
    }
    sortTypeList.splice( sortTypeList.indexOf(sortType),1 );

    
    switch ( sortType ) {
      case GSIBV.UI.EditLayerView.SortManager.SortType.RoadType:
        this._makeList(sortTypeList,GSIBV.UI.EditLayerView.SortManager.RoadType, sortType);
        break;

      case GSIBV.UI.EditLayerView.SortManager.SortType.WidthType:
        this._makeList(sortTypeList,GSIBV.UI.EditLayerView.SortManager.WidthType, sortType);
        break;
      
      case GSIBV.UI.EditLayerView.SortManager.SortType.RoadState:
        this._makeList(sortTypeList,GSIBV.UI.EditLayerView.SortManager.RoadState, sortType);
        break;

      case GSIBV.UI.EditLayerView.SortManager.SortType.ChargeType:
        this._makeList(sortTypeList,GSIBV.UI.EditLayerView.SortManager.ChargeType, sortType);
        break;

    }
  }

  _getChildItemList( itemList, type, title ) {
    var list = [];
    var otherList = [];
    for( var i=0; i<itemList.length; i++ ) {
      var item = itemList[i];
      var added = false;
      switch( type ) {
        case GSIBV.UI.EditLayerView.SortManager.SortType.RoadType:
          if ( item.category.roadType == title) {
            list.push( item );
            added = true;
          } 
          break;
        case GSIBV.UI.EditLayerView.SortManager.SortType.WidthType:
          if ( item.category.widthType == title) {
            list.push( item );
            added = true;
          }
          break;
        case GSIBV.UI.EditLayerView.SortManager.SortType.RoadState:
          if ( item.category.roadState == title) {
            list.push( item );
            added = true;
          }
          break;
        case GSIBV.UI.EditLayerView.SortManager.SortType.ChargeType:
          if ( item.category.chargeType == title) {
            list.push( item );
            added = true;
          }
          break;
      }

      if ( !added )
        otherList.push(item);
    }

    return {
      itemList:list,
      otherList : otherList
    };
  }

  _makeList(sortTypeList,list, type) {


    this._list = [];
    var origList = this._itemList;
    for( var i=0; i<list.length; i++ ) {
      var result = this._getChildItemList( origList, type, list[i]);
      var itemList = result.itemList;
      origList = result.otherList;
      if ( itemList.length <= 0 ) {
        continue;
      }
      var item = new GSIBV.UI.EditLayerView.SortManager.RoadItem( itemList,sortTypeList, this, type, list[i]);
      this._list.push( item );
    }
    
    if( !this._parent ) return;



    if ( origList.length > 0 ) {
      for( var i=0; i<origList.length; i++ ) {
        var title = origList[i].category.roadType;
        if ( title == "徒歩道") title = origList[i].item.title;
        if (title != this.title) {
          
          //console.log( this,origList[i].item );

          var item = new GSIBV.UI.EditLayerView.SortManager.RoadItem( 
            [origList[i]],[], this, type, title
          );
          this._list.push(item);
        }
      } 
    }
  }

};



GSIBV.UI.EditLayerView.SortManager.RailwayItem = class extends GSIBV.UI.EditLayerView.SortManager.RoadItem {
  constructor(itemList, sortTypeList, parent, type, title, sortType) {
    super(itemList, sortTypeList, parent, type, title, sortType);
  }

  getSortTypeList() {
    var result = [];

    for( var i=0; i<this._sortTypeList.length; i++ ) {
      result.push({
        "title" : GSIBV.UI.EditLayerView.SortManager.RailwaySortTypeToTitle(this._sortTypeList[i]),
        "id" : this._sortTypeList[i]
      });
    }

    return result;
  }

  get sortType() { return this._sortType; }
  set sortType(value) { 
    this._sortType = value; 
    this._list = [];
    this._initialize();
  }

  _initialize() {

    if ( this._sortTypeList.length <= 0 ) return;

    var sortType = this._sortType;
    var sortTypeList = JSON.parse( JSON.stringify(this._sortTypeList) );
    
    if ( sortType != GSIBV.UI.EditLayerView.SortManager.SortType.RailwayType
        && sortType != GSIBV.UI.EditLayerView.SortManager.SortType.RailwayState
        && sortType != GSIBV.UI.EditLayerView.SortManager.SortType.RailwayNum) {
      sortType = sortTypeList[0];
    }
    sortTypeList.splice( sortTypeList.indexOf(sortType),1 );

    
    switch ( sortType ) {
      case GSIBV.UI.EditLayerView.SortManager.SortType.RailwayType:
        this._makeList(sortTypeList,GSIBV.UI.EditLayerView.SortManager.RailwayType, sortType);
        break;

      case GSIBV.UI.EditLayerView.SortManager.SortType.RailwayState:
        this._makeList(sortTypeList,GSIBV.UI.EditLayerView.SortManager.RailwayState, sortType);
        break;
      
      case GSIBV.UI.EditLayerView.SortManager.SortType.RailwayNum:
        this._makeList(sortTypeList,GSIBV.UI.EditLayerView.SortManager.RailwayNum, sortType);
        break;


    }
  }

  _getChildItemList( itemList, type, title ) {
    var list = [];
    var otherList = [];
    for( var i=0; i<itemList.length; i++ ) {
      var item = itemList[i];
      var added = false;
      switch( type ) {
        case GSIBV.UI.EditLayerView.SortManager.SortType.RailwayType:
          if ( item.category.railwayType == title) {
            list.push( item );
            added = true;
          }
          break;
        case GSIBV.UI.EditLayerView.SortManager.SortType.RailwayState:
          if ( item.category.railwayState == title) {
            list.push( item );
            added = true;
          }
          break;
        case GSIBV.UI.EditLayerView.SortManager.SortType.RailwayNum:
          if ( item.category.railwayNum == title) {
            list.push( item );
            added = true;
          }
          break;
      }

      if ( !added )
        otherList.push(item);
    }

    return {
      itemList:list,
      otherList : otherList
    };
  }

  _makeList(sortTypeList,list, type) {


    this._list = [];
    var origList = this._itemList;
    for( var i=0; i<list.length; i++ ) {
      var result = this._getChildItemList( origList, type, list[i]);
      var itemList = result.itemList;
      origList = result.otherList;
      if ( itemList.length <= 0 )continue;
      /*
      var hit = false;
      for( var j=0; j<itemList.length; j++ ) {
        if ( itemList[j].category.railwayNum == undefined ) {
          hit = true;
          break;
        }
      }
      if ( hit ) continue;
      */
      var item = new GSIBV.UI.EditLayerView.SortManager.RailwayItem( itemList,sortTypeList, this, type, list[i]);
      this._list.push( item );
    }
    
    if( !this._parent ) return;

    return;

    if ( origList.length > 0 ) {
      for( var i=0; i<origList.length; i++ ) {
        var title = origList[i].category.railwayType;
        if (title != this.title) {
          //if ( title == undefined) console.log( origList );
          var item = new GSIBV.UI.EditLayerView.SortManager.RailwayItem( 
            [origList[i]],[], this, type, title
          );
          this._list.push(item);
        }
      } 
    }
  }

};

GSIBV.UI.EditLayerView.SortManager.SortType = {
  "RoadType" : 1,
  "WidthType" : 2,
  "RoadState" : 3,
  "ChargeType" : 4,

  "RailwayType" : 1,
  "RailwayState" : 2,
  "RailwayNum" : 3
};

GSIBV.UI.EditLayerView.SortManager.RoadSortTypeToTitle = function(sortType) {
  var result = "";
  switch( sortType ) {
    case GSIBV.UI.EditLayerView.SortManager.SortType.RoadType:
      result ="道路分類";
      break;
    case GSIBV.UI.EditLayerView.SortManager.SortType.WidthType:
      result = "幅員区分";
      break;
    case GSIBV.UI.EditLayerView.SortManager.SortType.RoadState:
      result = "道路状態";
      break;
    case GSIBV.UI.EditLayerView.SortManager.SortType.ChargeType:
      result = "料金区分";
      break;

  }

  return result;
};


GSIBV.UI.EditLayerView.SortManager.RailwaySortTypeToTitle = function(sortType) {
  var result = "";
  switch( sortType ) {
    case GSIBV.UI.EditLayerView.SortManager.SortType.RailwayType:
      result ="鉄道分類";
      break;
    case GSIBV.UI.EditLayerView.SortManager.SortType.RailwayState:
      result = "鉄道状態";
      break;
    case GSIBV.UI.EditLayerView.SortManager.SortType.RailwayNum:
      result = "単線複線";
      break;

  }

  return result;
};


GSIBV.UI.EditLayerView.SortManager.RoadType = [
  "高速道路",
  "国道",
  "都道府県道",
  "市区町村道・その他",
  "石段",
  "庭園路",
  "徒歩道",
  "トンネル内の道路",
  "雪覆い"/*,
  "その他・不明" */
];

GSIBV.UI.EditLayerView.SortManager.WidthType = [
  "3m未満・その他・不明",
  "3m以上5.5m未満",
  "5.5m以上13m未満",
  "13m以上19.5m未満",
  "19.5m以上"
];

GSIBV.UI.EditLayerView.SortManager.ChargeType = [
  "有料",
  "無料"
];

GSIBV.UI.EditLayerView.SortManager.RoadState = [
  "通常部",
  "トンネル",
  "橋・高架"
];





GSIBV.UI.EditLayerView.SortManager.RailwayType = [
  "JR",
  "JR以外",
  "地下鉄",
  "路面",
  "索道",
  "特殊鉄道",
  "側線",
  "駅",
  "地下鉄駅"
];

GSIBV.UI.EditLayerView.SortManager.RailwayState = [
  "通常部",
  "トンネル",
  "橋梁"
];

GSIBV.UI.EditLayerView.SortManager.RailwayNum = [
  "単線",
  "複線"
];
