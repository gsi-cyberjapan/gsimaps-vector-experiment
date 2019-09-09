/***************************************
    GSIBV.UI.EditLayerView
    編集レイヤツリー。一覧
    todo:この中でフィルタ処理
***************************************/
GSIBV.UI.EditLayerView = class extends GSIBV.UI.Base {

  constructor(owner,contextMenu, map, scrollContainer, layer, container) {
    super();
    this._owner = owner;
    this._contextMenu = contextMenu;
    this._class = GSIBV.UI.EditLayerView;
    this._map = map;
    this._scrollContainer = scrollContainer;
    this._layer = layer;
    this._container = container;
    this._defaultViewMode = 'tree';
    this._viewMode = '';
    this._filter = new GSIBV.UI.EditLayerView.Filter();
    this._filter.lang= GSIBV.application.lang;
    this.initialize();

    this._langChangeHandler = MA.bind( this._onLangChange, this );
    GSIBV.application.on("langchange", this._langChangeHandler );
    this._onLangChange();
  }

  
  _onLangChange(e) {
    this._filter.lang= GSIBV.application.lang;



    try {
      var hintLang = GSIBV.CONFIG.LANG[GSIBV.application.lang.toUpperCase()].UI.HINT;
      
      for( var key in hintLang ) {
        var elem = MA.DOM.find( this._container, key )
        for( var i=0; i<elem.length;i++ ) {
          elem[i].setAttribute("title", hintLang[key]);
        }
      }

    } catch(e) {console.log(e);}    



    if ( !this._viewTree.list )return;

    function _initLang( list ) {
      for( var i=0; i<list.length ; i++ ) {
        var item = list[i];
        var dt = item.dt;
        var span = MA.DOM.find( dt, "span.title")[0];
        var path = MA.DOM.find( dt, "div.path");
        if ( path.length > 0 )
          path[0].innerHTML = this._getLangPath( item.item );
        span.innerHTML = this._getLangTitle(item.item);
        if ( item.list) {
          MA.bind( _initLang, this )(item.list);
        }
      }
    }

    MA.bind( _initLang, this )(this._viewTree.list);

    var lang = GSIBV.application.lang;
    
    
    try {
      var layerEditListLang = GSIBV.CONFIG.LANG[lang.toUpperCase()].UI.LAYEREDITLIST;
      
      this._filterInput.setAttribute("placeholder", layerEditListLang["filter-query-placeholder"]);

    } catch(e) {console.log(e);}    



  }

  get viewMode() {
    return this._viewMode;
  }

  set viewMode(viewMode) {
    if (this._viewMode == viewMode) return;
    this._viewMode = viewMode;
    this._listFrame.innerHTML = "";
    this._viewTree = { list: [] };
    if (this._viewMode == "tree") {
      this._listFrame.appendChild(this._createTree(this._viewTree.list, this._layer.data.root.sortedItemList));
    }
    else {
      this._listFrame.appendChild(this._createList(this._viewTree.list, this._layer.data.root.sortedItemList));
    }
    this.refresh(true);

  }

  initialize() {
    this._filterInput = MA.DOM.find(this._container, "input[name=filter-query]")[0];
    this._menuButton = MA.DOM.find(this._container, "button.menu-button")[0];
    this._saveButton = MA.DOM.find(this._container, "button.save-button")[0];
    this._listFrame = MA.DOM.find(this._container, ".contents")[0];
    this.viewMode = this._defaultViewMode;

    MA.DOM.on(this._container, "transitionend", MA.bind(function (e) {
      if (e.target == this._container) {

        if (!MA.DOM.hasClass(this._container, "-ma-expand")) {
          this._container.style.display = 'none';
        }
        else {


        }
      }
      this.fire("refresh");

    }, this));

    MA.DOM.on(this._saveButton, "click", MA.bind(this._onSaveButtonClick, this));
    MA.DOM.on(this._menuButton, "click", MA.bind(this._onMenuButtonClick, this));

    MA.DOM.on(this._filterInput, "focus", MA.bind(this._onFilterInputFocus, this));
    MA.DOM.on(this._filterInput, "blur", MA.bind(this._onFilterInputBlur, this));

    this._ownerShowHandler = MA.bind( this._onOwnerShow, this);
    this._ownerHideandler = MA.bind( this._onOwnerHide, this);
    this._owner.on( "show", this._ownerShowHandler);
    this._owner.on( "hide", this._ownerHideandler );

    this._contextMenuShowHandler = MA.bind( this._onContextMenuShow, this);
    this._contextMenuRefreshHandler = MA.bind( this._onContextMenuRefresh, this);
    this._contextMenuHideHandler = MA.bind( this._onContextMenuHide, this);
    this._contextMenu.on( "show", this._contextMenuShowHandler);
    this._contextMenu.on( "hide", this._contextMenuHideHandler );
    this._contextMenu.on( "refresh", this._contextMenuRefreshHandler );

    var lang = GSIBV.application.lang;
    
    
    try {
      var layerEditListLang = GSIBV.CONFIG.LANG[lang.toUpperCase()].UI.LAYEREDITLIST;
      
      this._filterInput.setAttribute("placeholder", layerEditListLang["filter-query-placeholder"]);

    } catch(e) {console.log(e);}    
    
  }

  destroy() {
    
    if ( this._langChangeHandler ) {
      GSIBV.application.off("langchange", this._langChangeHandler );
      this._langChangeHandler = null;
    }

    if (this._mapMoveEndHandler) {
      this._map.map.off("moveend", this._mapMoveEndHandler);
      this._mapMoveEndHandler = null;
    }
    this._owner.off( "show", this._ownerShowHandler);
    this._owner.off( "hide", this._ownerHideandler );
    this._contextMenu.off( "show", this._contextMenuShowHandler);
    this._contextMenu.off( "hide", this._contextMenuHideHandler );
    this._contextMenu.off( "refresh", this._contextMenuRefreshHandler );
    
    if ( this._saveDataDialog ) {
      this._saveDataDialog.destroy();
      this._saveDataDialog = null;
    }

    if ( this._styleEditor ) {
      this._styleEditor.destroy();
      this._styleEditor = null;
    }

  }

  _onOwnerShow() {
    if ( this._styleEditor) {
      this._styleEditor.setPosition({"left":300});
    }
  }

  _onOwnerHide() {
    if ( this._styleEditor) {
      this._styleEditor.setPosition({"left":0});
    }
  }

  _onContextMenuShow(e) {
    if ( this._styleEditor) {
      this._styleEditor.setPosition({"bottom":e.params.height});
    }
  }
  _onContextMenuRefresh(e) {
    if ( this._styleEditor) {
      this._styleEditor.setPosition({"bottom":e.params.height,"noEffect":true});
    }
  }
  _onContextMenuHide(e) {
    
    if ( this._styleEditor) {
      this._styleEditor.setPosition({"bottom":0});
    }
  }

  show() {

    if (MA.DOM.hasClass(this._container, "-ma-expand")) return;

    this.refresh();
    this._container.style.display = '';
    setTimeout(MA.bind(function () {
      MA.DOM.addClass(this._container, "-ma-expand");
    }, this), 1);
    this.fire("expand");
    if (!this._mapMoveEndHandler) {
      this._mapMoveEndHandler = MA.bind(this._onMapMoveEnd, this);
      this._map.map.on("moveend", this._mapMoveEndHandler);
    }

  }

  hide() {
    if (!MA.DOM.hasClass(this._container, "-ma-expand")) return;

    MA.DOM.removeClass(this._container, "-ma-expand");
    //MA.DOM.removeClass(li, "-ma-edit-expand");
    this.fire("collapse");

    if (this._mapMoveEndHandler) {
      this._map.map.off("moveend", this._mapMoveEndHandler);
      this._mapMoveEndHandler = null;
    }
  }
  toggle() {
    if (MA.DOM.hasClass(this._container, "-ma-expand")) {
      this.hide();
    } else {
      this.show();
    }
  }

  _onMapMoveEnd() {
    this.refresh();
  }

  _filterCheck() {
    if (this._filterInput._lastValue != this._filterInput.value) {
      this.refresh();
      this._lastFilterValue = this._filterInput.value;
    }
  }

  _onSaveButtonClick() {
    if ( this._layer.data.title == undefined)
      this._layer.data.title = this._layer.title;

    if ( this._saveDataDialog ) {
      this._saveDataDialog.destroy();
      this._saveDataDialog = null;
    }
    this._saveDataDialog = new GSIBV.UI.Dialog.SaveDataDialog();
    this._saveDataDialog.on("buttonclick", MA.bind(function(e){
      this._layer.data.title = e.params.title;
      this._layer.data.fileName = e.params.fileName;
      this._layer.data.save(e.params.indent);
    },this));
    this._saveDataDialog.data = this._layer.data;
    this._saveDataDialog.show();

  }

  static hidePopupMenu() {
    var class$ = GSIBV.UI.EditLayerView;
    if( class$._popupMenu ) {
      class$._popupMenu.destroy();
      class$._popupMenu = null;
    }
  }

  _onMenuButtonClick() {

    // 20190909
    GSIBV.UI.EditLayerView.hidePopupMenu();

    if (!this._class._popupMenu ) {
      this._class._popupMenu = new GSIBV.UI.Popup.Menu ();
      this._class._popupMenu.on("select",MA.bind(function(e){
        switch(e.params.item.id){
          case "viewmode":
            this.viewMode = (e.params.checked ? "list" : "tree");
            break;
          
          case "reset":
            if( this._styleEditor )this._styleEditor.hide();
            this._layer.reload();
            if ( !this._layerLoadFinishHandler) {
              this._layerLoadFinishHandler = MA.bind( function() {
                this._layer.off("finish", this._layerLoadFinishHandler);
                this._layerLoadFinishHandler = undefined;
                var viewmode = this._viewMode;
                this._viewMode = "";
                this.viewMode = viewmode;
                //this.refresh(true);
  
              }, this);
              this._layer.on("finish", this._layerLoadFinishHandler);
            }
            
            break;
        }
      },this));
    }
    var lang = GSIBV.application.lang;
      
    var listModeTitle = "all";
    var resetTitle = "hennsyu";
    try {
      if ( GSIBV.CONFIG.LANG[lang.toUpperCase()].UI.EDIT.MENU) {
        listModeTitle = GSIBV.CONFIG.LANG[lang.toUpperCase()].UI.EDIT.MENU["listmode"];
        resetTitle = GSIBV.CONFIG.LANG[lang.toUpperCase()].UI.EDIT.MENU["reset"];
        
      }
    } catch( e ) {}


    this._class._popupMenu.items = [
      {
        "id":"viewmode","type":"check", "title": listModeTitle, "checked":this.viewMode =="list"
      },
      {
        "id":"reset", "title":resetTitle
      }
    ];

    this._class._popupMenu.show(this._menuButton);

  }

  _onFilterInputFocus() {

    setTimeout(MA.bind(function () {
      this._filterInput.select();
    }, this));


    this._lastFilterValue = this._filterInput.value;
    this._filterTimerId = setInterval(MA.bind(this._filterCheck, this), 500);

  }
  _onFilterInputBlur() {


    this._filterCheck();
    if (this._filterTimerId) {
      clearInterval(this._filterTimerId)
      this._filterTimerId = null;
    }
  }

  refresh(force) {

    var filter = {
      query: this._filterInput.value,
      zoom: Math.floor(this._map.zoom)
    };

    var filter = new GSIBV.UI.EditLayerView.Filter(
      this._filterInput.value,
      Math.floor(this._map.zoom)
    );
    if (!force && this._filter.equals(filter)) return;
    this._filter = filter;
    this._filter.lang = GSIBV.application.lang;
    var hitCount = this._filter.execute(this._viewTree);

    if (hitCount > 0) {
      this._listFrame.style.display = '';
    } else {
      this._listFrame.style.display = 'none';
    }
    //this._layer.data.filter= filter;

    this._refreshVisibleStateList(this._layer.data.root);

    this.fire("refresh");


  }
  _treeToList(destList, list) {
    for (var i = 0; i < list.length; i++) {
      var item = list[i];

      if (item instanceof GSIBV.VectorTileData.Directory) {
        this._treeToList(destList, item.itemList);

      } else {
        destList.push(item);
      }
    }

  }
  _createList(destList, list) {
    var itemList = [];
    this._treeToList(itemList, list)
    var dl = MA.DOM.create("dl");
    for (var i = 0; i < itemList.length; i++) {
      var item = itemList[i];

      var dt = MA.DOM.create("dt");
      var a = MA.DOM.create("a");
      var path = MA.DOM.create("div");
      
      item.__dt = dt;
      MA.DOM.addClass(path, "path");

      path.innerHTML = this._getLangPath( item );
      //a.setAttribute("title",item.fullTitle);
      //a.setAttribute("href", "javascript:void(0);");
      a.appendChild(path );
      
      var span = MA.DOM.create("span");
      MA.DOM.addClass( span, "title" );
      span.innerHTML = this._getLangTitle(item);
      a.appendChild( span );

      dt.appendChild(a);
      dl.appendChild(dt);
      destList.push({ item: item, dt: dt });
      this._createItem(item, dl, dt, a);
    }

    return dl;
  }

  _getLangPath(item) {
    var lang = GSIBV.application.lang;
    var path = item.path;
    if ( lang == "ja" ) {
      return path;
    } else {
      var parts = path.split( "-");
      var result = "";
      for(var i=0; i<parts.length; i++ ) {
        var langTitle = GSIBV.CONFIG.LANG[lang.toUpperCase()].VECTORTILE[parts[i]];
    
        result += ( result != "" ? "-" : "" )
          + ( langTitle != undefined ? langTitle : parts[i]);
      }

      return result;
    }
  }
  _getLangTitle(item) {
    var lang = GSIBV.application.lang;
    var title = item.title;
    if ( lang == "ja" ) {
      return title;
    } else {
      var langTitle = GSIBV.CONFIG.LANG[lang.toUpperCase()].VECTORTILE[title];

      if ( langTitle != undefined) return langTitle;
      else title;
    }
  }

  _createTree(destList, list) {
    var dl = MA.DOM.create("dl");
    for (var i = 0; i < list.length; i++) {
      var dt = MA.DOM.create("dt");
      var a = MA.DOM.create("a");
      //a.setAttribute("href", "javascript:void(0);");
      var span = MA.DOM.create("span");
      MA.DOM.addClass( span, "title" );
      span.innerHTML = this._getLangTitle(list[i]);
      a.appendChild( span );
      dt.appendChild(a);
      dl.appendChild(dt);
      var item = list[i];
      item.__dt = dt;

      if (item instanceof GSIBV.VectorTileData.Directory) {
        var viewItem = { item: item, dt: dt, list: [] };
        this._createDirectory(viewItem.list, item, dl, dt, a);
        destList.push(viewItem);
        
      } else {
        destList.push({ item: item, dt: dt });
        this._createItem(item, dl, dt, a);
      }
    }

    return dl;

  }

  _createDirectory(destList, item, dl, dt, a) {
    
    this._createEditButton(item, dl, dt, a);
    this._createVisibleButton(item, dl, dt, a);
    MA.DOM.addClass(a, "directory");
    var span = MA.DOM.create("span");
    MA.DOM.addClass( span, "num" );
    span.innerHTML = item.itemList.length;
    a.appendChild(span);
    var dd = MA.DOM.create("dd");
    dt._childDD = dd;
    dd.appendChild(this._createTree(destList, item.itemList));
    dl.appendChild(dd);

    MA.DOM.on(a, "click", MA.bind(function (a, dd,e) {
      e.preventDefault();

      if (MA.DOM.hasClass(dd, "-ma-expand")) {
        MA.DOM.removeClass(a, "-ma-expand");
        setTimeout(MA.bind(function (dd) {
          MA.DOM.removeClass(dd, "-ma-expand");

        }, this, dd), 0);
      } else {
        dd.style.display = '';
        MA.DOM.addClass(a, "-ma-expand");
        setTimeout(MA.bind(function (dd) {
          MA.DOM.addClass(dd, "-ma-expand");
        }, this, dd), 0);
      }
    }, this, a, dd));

  }
  
  _createEditButton( item, dl, dt, a ) {
    
    if ( GSIBV.CONFIG.ReadOnly )return;

    var z = Math.floor( this._map.zoom );
    var editButton = MA.DOM.create("button");
    //visibleButton.setAttribute("href", "javascript:void(0);")
    MA.DOM.addClass(editButton, "edit-all-button");
    //MA.DOM.addClass(visibleButton, "button");
    dt.appendChild(editButton);
    
    MA.DOM.on(editButton, "click", MA.bind(function (item,e) {
      
      e.preventDefault();
      
      var z = Math.floor( this._map.zoom );

      this.showStyleEditor( item );

    }, this, item));

  }


  _createVisibleButton(item, dl, dt, a) {
    var z = Math.floor( this._map.zoom );
    var visibleButton = MA.DOM.create("button");
    //visibleButton.setAttribute("href", "javascript:void(0);")
    MA.DOM.addClass(visibleButton, "visible-button");
    //MA.DOM.addClass(visibleButton, "button");
    dt.appendChild(visibleButton);
    if (!item.getVisible(z)) {
      MA.DOM.addClass(dt, "hidden");
    }

    MA.DOM.on(visibleButton, "click", MA.bind(function (item,e) {
      
      var z = Math.floor( this._map.zoom );

      item.setVisible( !item.getVisible(z),z );
      //item.visible = !item.visible;

      this._refreshVisibleState(item);

    }, this, item));

  }

  _refreshVisibleState(item ) {

    var z = Math.floor( this._map.zoom );
    while( item ){
      if (!item.getVisible(z)) {
        MA.DOM.addClass(item.__dt, "hidden");
      } else {
        MA.DOM.removeClass(item.__dt, "hidden");
      }
      item = item.parent;
      if ( this._defaultViewMode != "tree") break;
      if ( !item.__dt ) break;
    }
    this._refreshVisibleStateList( item);

  }

  
  _refreshVisibleStateList(item ) {
    
    if ( !( item instanceof GSIBV.VectorTileData.Directory) ) return;

    var z = Math.floor( this._map.zoom );

    for( var i=0; i<item.itemList.length; i++ ) {
      if (!item.itemList[i].getVisible(z)) {
        MA.DOM.addClass(item.itemList[i].__dt, "hidden");
      } else {
        MA.DOM.removeClass(item.itemList[i].__dt, "hidden");
      }
      this._refreshVisibleStateList(item.itemList[i]);
    }

  }

  showStyleEditor( item) {
    if (!this._styleEditor) {
      this._styleEditor = new GSIBV.UI.StyleEditor(this._map,{
        "left" : this._owner.visible ? 300 : 0,
        "bottom":this._contextMenu.height});
    }
    this._styleEditor.show(item, Math.floor(this._map.zoom));

  }
  _createItem(item, dl, dt, a) {
    
    this._createVisibleButton(item, dl, dt, a);

    if ( GSIBV.CONFIG.ReadOnly ) {
      MA.DOM.addClass( a, "readonly" );
      return;
    }
    MA.DOM.on(a, "click", MA.bind(function (item,e) {
      e.preventDefault();
      
      this.showStyleEditor( item );
    }, this, item));


  }


};


GSIBV.UI.EditLayerView.Filter = class {
  constructor(query, zoom) {
    this._query = query;
    this._zoom = zoom;
    this._lang = "ja";
  }

  set lang(lang) {
    this._lang = lang;
  }

  get query() { return this._query; }
  get zoom() { return this._zoom; }

  equals(f) {
    if (this._query == undefined) {
      if (f._query != undefined) return false;
    } else {
      if (f._query == undefined) return false;
      if (this._query != f._query) return false;
    }
    if (this._zoom == undefined) {
      if (f._zoom != undefined) return false;
    } else {
      if (f._zoom == undefined) return false;
      if (this._zoom != f._zoom) return false;
    }
    return true;

  }

  execute(target) {

    if ( this._query != undefined ) {
      this._queryList = this._query.split(/[\s|\ ]+/ );
      if ( this._queryList.length == 1 && this._queryList [0] == "") 
        this._queryList =[];
    } else {
      this._queryList =[];
    }

    return this._execute(target);
  }

  _hitCheck(item) {
    if (this._zoom != undefined) {
      if (item.layerList) {
        var hit = false;
        for (var i = 0; i < item.layerList.length; i++) {
          var l = item.layerList[i];
          if (this._zoom >= l.minzoom && this._zoom <= l.maxzoom) {
            hit = true;
            break;
          }
        }
        if ( !hit ) return false;

      }
    }


    if (this._queryList.length <= 0) return true;

    var titles = item.titles;
    
    var langVectorTile = undefined;
    if ( this._lang != "ja") {
      var lang = GSIBV.CONFIG.LANG[this._lang.toUpperCase()];
      if ( lang ) langVectorTile = lang.VECTORTILE;
    }
    
    for( var i=0; i<this._queryList.length; i++ ) {
      var q = this._queryList[i].toLowerCase();
      var hit = false;
      for( var j=0; j<titles.length; j++) {
        var title = titles[j];
        if ( langVectorTile ) {
          title = langVectorTile[title];
          if ( title == undefined ) title = "";
        }
        title = title.toLowerCase();
        if (title.indexOf(q) >= 0) {
          hit = true;
          break;
        }
      }
      if ( !hit) return false;
    }
    return true;
    

  }

  _execute(target) {
    var list = target.list;
    var result = 0;
    for (var i = 0; i < list.length; i++) {
      var item = list[i];
        // チェック
      if (item.list) {
        var hitCount = this._execute(item);
        if (hitCount > 0) {
          result++;
          MA.DOM.removeClass(item.dt, "-ma-filter-nohit");
        } else {
          MA.DOM.addClass(item.dt, "-ma-filter-nohit");
        }
      } else {
        if (this._hitCheck(item.item)) {
          result++;
          MA.DOM.removeClass(item.dt, "-ma-filter-nohit");
        } else {
          MA.DOM.addClass(item.dt, "-ma-filter-nohit");
        }

      }

    }

    if (result <= 0) {
      if (target.dt) {
        MA.DOM.addClass(target.dt, "-ma-filter-nohit");
        if (target.dt._childDD) MA.DOM.addClass(target.dt._childDD, "-ma-filter-nohit");
      }
      //MA.DOM.addClass( item.dt._childDD, "-ma-filter-nohit" );

    } else {
      if (target.dt) {
        MA.DOM.removeClass(target.dt, "-ma-filter-nohit");
        if (target.dt._childDD) MA.DOM.removeClass(target.dt._childDD, "-ma-filter-nohit");
      }
      //MA.DOM.removeClass( item.dt._childDD, "-ma-filter-nohit" );
    }


    return result;
  }

};