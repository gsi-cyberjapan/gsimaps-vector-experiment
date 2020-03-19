/***************************************
    GSIBV.UI.StyleEditor
    編集
***************************************/
GSIBV.UI.StyleEditor = class extends GSIBV.UI.Base {
  constructor(map, options) {
    super(options);
    this._map = map;
    this._options = options;
    this._checkInterval = GSIBV.CONFIG.EditRefreshInterval;
    this._position = {left:0,bottom:0};


    if (this._options) {
      if (this._options.checkInterval != undefined) {
        var checkInterval = parseInt(this._options.checkInterval);
        if (checkInterval > 0) this._checkInterval = checkInterval;
      }
      if ( this._options.bottom !=undefined)this._position.bottom = this._options.bottom;
      if ( this._options.left !=undefined)this._position.left = this._options.left;
    }
    this.initialize();
  }

  initialize() {
    
    this._langChangeHandler = MA.bind( this._onLangChange, this );
    GSIBV.application.on("langchange", this._langChangeHandler );
  }

  setPosition(pos) {
    if ( pos.left !=undefined) {
      this._container.style.transition = "left 300ms";
      this._position.left = pos.left;
      if ( this._container) {
        this._container.style.left = this._position.left + 'px';

      }
    }

    if ( pos.bottom !=undefined) {
      this._container.style.transition = "bottom 300ms";
      this._position.bottom = pos.bottom;
      if ( this._container) {
        var bottom = this._position.bottom;
        if ( bottom > 0 ) bottom +=1;
        this._container.style.bottom = bottom + 'px';

      }
    }

    this._refreshView();

  }

  _onLangChange() {
    var lang = GSIBV.application.lang;
    if ( !GSIBV.CONFIG.LANG[lang.toUpperCase()]) return;

    this._initializeTitle();

    var editLang =GSIBV.CONFIG.LANG[lang.toUpperCase()].UI.EDIT;

    for ( var langKey in editLang ) {
      for( var key in editLang[langKey] ) {
        var elem =MA.DOM.find( this._container, key );
        if ( elem.length <= 0 ) continue;
        for( var i=0; i<elem.length; i++ ) {
          elem[i].innerHTML = editLang[langKey][key];
        }
      }
    }
  }

  show(item, targetZoom) {
    this._targetZoom = targetZoom;


    if( item instanceof GSIBV.VectorTileData.Directory ) {
      this._directory = item;
      this._itemList = this._directory.getTargetZoomItemList( this._targetZoom);
      this._item = this._itemList[0];
    } else if ( item instanceof GSIBV.UI.EditLayerView.SortManager.Item ) {
      this._directory = item;
      this._itemList = this._directory.getTargetZoomItemList( this._targetZoom);
      this._item = this._itemList[0];
    } else  {
      this._directory = undefined;
      this._itemList = undefined;
      this._item = item;
    }

    this.clear();
    this._create();

    this._checkTimerId = setInterval(MA.bind(this._check, this), this._checkInterval);

    MA.DOM.removeClass(this._container, "-ma-expand");
    this._container.style.display = '';
    this._container.style.maxWidth = '0px';
    this._container.style.left = this._position.left + 'px';
    this._container.style.bottom = this._position.bottom + 'px';
    this._container.style.transition = "max-width 300ms";

    setTimeout(MA.bind(function () {
      MA.DOM.addClass(this._container, "-ma-expand");
      this._container.style.maxWidth = '9999px';
      this._refreshView();
    }, this), 0);


  }

  _refreshView() {
    if ( this._listScrollBar ) this._listScrollBar.update();
    var size = MA.DOM.size(this._headerFrame);
    this._sizeFrame.style.top = size.height + "px";
  }

  destroy() {
    
    if ( this._langChangeHandler ) {
      GSIBV.application.on("langchange", this._langChangeHandler );
      this._langChangeHandler = null;
    }

    this.clear();
    if ( this._container ) {
      this._container.parentNode.removeChild(this._container);

    }
  }
  clear() {
    this._hideLineAddPopupMenu( true );
    
    this._unlock();
    if (this._checkTimerId) clearInterval(this._checkTimerId);
    this._checkTimerId = null;
    this._clearEditList();
  }

  hide(noEffect) {
    this.clear();

    if ( !noEffect ){
      this._container.style.transition = "max-width 300ms";
      setTimeout(MA.bind(function () {
        MA.DOM.removeClass(this._container, "-ma-expand");
        this._container.style.maxWidth = '0px';
      }, this), 0);
    } else {
      this._container.style.display = 'none';
      MA.DOM.removeClass(this._container, "-ma-expand");
      this._container.style.maxWidth = '0px';
    }
    this.fire("hide");
  }
  _check() {
    if (!this._editList) return;

    var changed = false;
    var drawList = [];
    for (var i = 0; i < this._editList.length; i++) {
      if ( !this._editList[i].edit ) continue;
      if (this._editList[i].edit.changed) {

        var target = this._editList[i].target;
        this._editList[i].edit.flush();
        target.update(this._editList[i].edit.drawStyle)
        //target.update( paint, layout,false );
        drawList.push( target);
        changed = true;
      }
    }

    if (changed) {
    
      if ( !this._itemList) {
        this._item.fire("change");
        return;
      }
      // 他のオブジェクトに反映
      for( var i=0;i<this._itemList.length; i++ ){
        var item = this._itemList[i];
        if ( item == this._item) continue;

        var info = null;
        for( var j=0; j<item._layerList.length; j++ ) {
          var layer = item._layerList[j];
          
          if (this._targetZoom < layer.minzoom || this._targetZoom > layer.maxzoom) continue;
          if ( info == undefined && layer.drawList.length > 0) {
            info = layer.drawList[0].drawStyle._info.clone();
          }

          
          // 20190821 - start 編集前のアイコン画像を退避
          var iconGroup = undefined;
          var iconImage = undefined;

          for( var k =0; k<layer.drawList.length; k++) {
            var draw = layer.drawList[k];
            iconGroup = draw.drawStyle.data["icon-group"];
            iconImage = draw.drawStyle.data["icon-image"];
          }
          // 20190821 - end
          
          layer._drawList = [];

          for( var k=0; k<drawList.length;k++) {
            var json = drawList[k].toData();
            json.info = info.toData();
            
            // 20190821 - start 編集前のアイコン画像を設定
            if ( json.draw ) {
              if ( json.draw["icon-group"] != undefined && iconGroup != undefined ) {
                json.draw["icon-group"] = iconGroup;
              }
              if ( json.draw["icon-image"] != undefined && iconImage != undefined ) {
                json.draw["icon-image"] = iconImage;
              }
            }
            // 20190821 - end

            var draw = new GSIBV.VectorTileData.Draw(layer._owner, layer);
            draw.fromJSON( json );
            layer._drawList.push( draw );
          }

        }
        //item.copyDrawFrom(this,_teim);

      }

      for( var i=0;i<this._itemList.length; i++ ){
        this._itemList[i].fire("change");
      }
    }

  }
  _clearEditList() {
    this._check();
    if (!this._editList) {
      this._editList = [];
      return;
    }

    for (var i = 0; i < this._editList.length; i++) {
      if ( !this._editList[i].edit ) continue;
      this._editList[i].edit.destroy();
    }

    this._editList = [];


  }
  _create() {
    if (this._container) {
      this._sizeFrame.innerHTML = '';
    } else {
      this._container = MA.DOM.create('div');
      MA.DOM.addClass(this._container, "style-editor-frame");
      MA.DOM.on(this._container, "transitionend", MA.bind(function (e) {
        this._refreshView();
        if (e.target == this._container) {
          if (!MA.DOM.hasClass(this._container, "-ma-expand")) {
            this._container.style.display = 'none';
          }
        }
      }, this));


      var h2 = MA.DOM.create("h2");
      this._titleFrame = MA.DOM.create("div");
      h2.appendChild(this._titleFrame);
      this._container.appendChild(h2);
      this._closeButton = MA.DOM.create("button");
      MA.DOM.addClass(this._closeButton, "close-button");
      this._closeButton.setAttribute("href", "javascript:void(0);");
      h2.appendChild(this._closeButton);
      this._headerFrame  = h2;

      MA.DOM.on(this._closeButton, "click", MA.bind(this._onCloseClick, this));

      this._container.appendChild(h2);


      this._sizeFrame = MA.DOM.create("div");
      MA.DOM.addClass(this._sizeFrame, "size-frame");
      this._container.appendChild(this._sizeFrame);
      MA.DOM.select("#main")[0].appendChild(this._container);
      
      try {
        this._listScrollBar = new PerfectScrollbar(this._sizeFrame);
      } catch (e) { }

      MA.DOM.on( this._sizeFrame, "scroll", MA.bind( this._onScroll,this) );
      MA.DOM.on( this._sizeFrame, "ps-scroll-x", MA.bind( this._onScroll,this) );
      MA.DOM.on( this._sizeFrame, "ps-scroll-y", MA.bind( this._onScroll,this) );

    }

    this._sizeFrame.scrollTop = 0;

    this._initializeTitle();
    /*
    var titles = this._item.titles;
    var title = null;
    if (titles) {
      var title = MA.DOM.create("div");
      var t = MA.DOM.create("span");
      MA.DOM.addClass(t, "title");
      t.innerHTML = this._item.title;
      title.appendChild(t);
    } else {
      title = document.createTextNode("unknown");
    }
    this._titleFrame.innerHTML = '';
    this._titleFrame.appendChild(title);
    */


    for (var i = 0; i < this._item.layerList.length; i++) {
      var l = this._item.layerList[i];
      if (this._targetZoom != undefined &&
        (l.minzoom > this._targetZoom || l.maxzoom < this._targetZoom)) continue;

      this._createLayerContainer(l);
    }

    this._onLangChange();


  }
  _initializeTitle() {
    var title = null;
    
    if ( this._directory && this._directory instanceof GSIBV.UI.EditLayerView.SortManager.Item ) {

      var lang = GSIBV.application.lang;
      var titleText = this._directory.title;
      try {
        if ( GSIBV.CONFIG.LANG[lang.toUpperCase()].VECTORTILE) {
          titleText = GSIBV.CONFIG.LANG[lang.toUpperCase()].VECTORTILE[titleText];
          
        }
      } catch( e ) {}

      if ( this._itemList ) {
        if ( lang == "en")
          titleText += '<span class="strong">...' + this._itemList.length +'objects</span>';
        else
          titleText += '<span class="strong">...' + this._itemList.length +'件</span>';
      }

      var title = MA.DOM.create("div");
      var t = MA.DOM.create("span");
      MA.DOM.addClass(t, "title");
      t.innerHTML = titleText
      title.appendChild(t);

    } else {

      var titles = this._item.titles;
      if (titles) {
        
        var lang = GSIBV.application.lang;
        
        var titleText = this._item.title;
        try {
          if ( GSIBV.CONFIG.LANG[lang.toUpperCase()].VECTORTILE) {
            titleText = GSIBV.CONFIG.LANG[lang.toUpperCase()].VECTORTILE[titleText];
            
          }
        } catch( e ) {}
  
        if ( this._itemList ) {
          if ( lang == "en")
            titleText += '<span class="strong">...etc ' + this._itemList.length +'objects</span>';
          else
            titleText += '<span class="strong">...他' + this._itemList.length +'件</span>';
        }
  
        var title = MA.DOM.create("div");
        var t = MA.DOM.create("span");
        MA.DOM.addClass(t, "title");
        t.innerHTML = titleText
        title.appendChild(t);
      } else {
        title = document.createTextNode("unknown");
      }

    }

    this._titleFrame.innerHTML = '';
    this._titleFrame.appendChild(title);

  }

  _onScroll() {
    
    for (var i = 0; i < this._editList.length; i++) {
      if ( this._editList[i].edit.onContainerScroll )
      this._editList[i].edit.onContainerScroll();

    }
  }

  _onCloseClick() {
    this.hide();
  }

  _createLayerContainer(layer) {
    var container = MA.DOM.create("div");
    this._drawContainer = container;

    var header = MA.DOM.create("div");

    MA.DOM.addClass(header, "header");
    MA.DOM.addClass(header, "message-header");
    header.innerHTML= "※一覧の下から順に重ねて描画されます";
    container.appendChild(header);

    for (var i = layer.drawList.length-1; i >= 0 ; i--) {
      this._createEditContainer(container, layer.drawList[i]);
    }

    this._sizeFrame.appendChild(container);

    this._refreshHeaderState();
  }

  _refreshHeaderState() {
    
    for( var i=0; i<this._editList.length; i++ ) {
      var edit= this._editList[i];
      var header = MA.DOM.find( edit.container, ".draw-header")[0];
      var removeButton = MA.DOM.find( header, ".remove-button")[0];
      var upButton = MA.DOM.find( header, ".up-button")[0];
      var downButton = MA.DOM.find( header, ".down-button")[0];
      var frontButton = MA.DOM.find( header, ".front-button")[0];
      var backButton = MA.DOM.find( header, ".back-button")[0];
      
      if ( this._editList.length <= 1 ) {
        MA.DOM.addClass( removeButton, "disable" );
      } else {
        MA.DOM.removeClass( removeButton, "disable" );
      }


      if ( i == 0 ) {
        MA.DOM.addClass( upButton, "disable" );
      } else {
        MA.DOM.removeClass( upButton, "disable" );
      }

      if ( i <= 1 ) {
        MA.DOM.addClass( frontButton, "disable" );
      } else {
        MA.DOM.removeClass( frontButton, "disable" );
      }

      
      if ( i == this._editList.length-1 ) {
        MA.DOM.addClass( downButton, "disable" );
      } else {
        MA.DOM.removeClass( downButton, "disable" );
      }

      
      if ( i >= this._editList.length-2 ) {
        MA.DOM.addClass( backButton, "disable" );
      } else {
        MA.DOM.removeClass( backButton, "disable" );
      }

    }
  }

  _createEditContainer(parent, draw, noAppend) {

    var container = MA.DOM.create("div");
    var containerContent = MA.DOM.create("div");
    MA.DOM.addClass( container, "draw-frame" );
    var header = this._createDrawHeader( container, draw );
    var edit = null;

    switch (draw.type) {
      case "symbol":
        MA.DOM.addClass(header,"symbol");
        edit = this._createSymbolEdit(containerContent, draw);
        break;
      case "fill":
        MA.DOM.addClass(header,"fill");
        edit = this._createFillEdit(containerContent, draw);
        break;
      case "line":
        MA.DOM.addClass(header,"line");
        edit = this._createLineEdit(containerContent, draw);
        break;
    }

    
    container.appendChild( containerContent );

    var edit = {
      "edit": edit,
      "target": draw,
      "container": container
    };

    if ( !noAppend ) {
      this._editList.push(edit);
      parent.appendChild(container);
    }

    return edit;
  }

  _createDrawHeader(container, draw) {
    var frame = MA.DOM.create("div");
    MA.DOM.addClass( frame, "draw-header" );

    function createButton(frame, this$, draw, className, title, clickHandler) {
      var button = MA.DOM.create("button");
     // MA.DOM.addClass( button, "button" );
      MA.DOM.addClass( button, className );
      button.setAttribute("title", title ? title : "" );
      frame.appendChild( button );
      MA.DOM.on(button, "click", MA.bind( clickHandler,this$, draw) );
    }
    
    createButton(frame, this, draw, "add-button","スタイルを追加", 
        this._onDrawAddClick);
    createButton(frame, this, draw, "remove-button","このスタイルを削除", 
        this._onDrawRemoveClick);
    createButton(frame, this, draw, "up-button", "一つ上に移動", 
        this._onDrawUpClick,this);
    createButton(frame, this, draw, "down-button", "一つ下に移動", 
        this._onDrawDownClick,this);
    createButton(frame, this, draw, "front-button", "一番上に移動", 
        this._onDrawFrontClick,this);
    createButton(frame, this, draw, "back-button", "一番下に移動", 
        this._onDrawBackClick,this);


    container.appendChild( frame );

    return frame;
  }

  _findEditIndexByDraw( draw)  {
    
    for( var i=0; i<this._editList.length; i++) {
      if( this._editList[i].target == draw) {
        return i;
      }
    }

    return -1;
  }
  _onDrawAddClick(draw, e) {
    // ライン以外は追加させない
    if ( draw.type != "line") return;
    this._showLineAddPopupMenu(draw, e.target);
  }
  _hideLineAddPopupMenu(cleanUp) {
    if ( this._lineAddPopupMenuMousedownHandler) {
      MA.DOM.off( document.body, "mousedown", this._lineAddPopupMenuMousedownHandler);
      this._lineAddPopupMenuMousedownHandler = null;
    }
    if ( cleanUp ) {
      if ( this._lineAddPopupMenu ) {
        this._lineAddPopupMenu.parentNode.removeChild( this._lineAddPopupMenu );
        this._lineAddPopupMenu  = null;
      }
    } else {
      if ( this._lineAddPopupMenu ) MA.DOM.fadeOut( this._lineAddPopupMenu, 300 );
    }
    
  }
  _showLineAddPopupMenu(draw, button) {
    this._createLineAddPopupMenu(draw);
    
    this._lineAddPopupMenu.style.display = '';
    this._lineAddPopupMenu.style.visibility = 'hidden';

    var popupSize = MA.DOM.size(this._lineAddPopupMenu);
    this._lineAddPopupMenu.style.display = 'none';
    this._lineAddPopupMenu.style.visibility = 'visible';

    var size = MA.DOM.size(button);
    var pos = MA.DOM.offset(button);
    var windowSize = MA.DOM.size(this._lineAddPopupMenu.parentNode);
    var top = undefined;
    var bottom = undefined;

    top = pos.top + size.height +1;
    if ( top + popupSize.height > windowSize.height ) {
      top = undefined;
      bottom = windowSize.header - pos.top;
    }

    this._lineAddPopupMenu.style.left= pos.left + 'px';

    if ( top != undefined ) {
      this._lineAddPopupMenu.style.bottom= 'auto';
      this._lineAddPopupMenu.style.top= top + 'px';
    } else {
      this._lineAddPopupMenu.style.top= 'auto';
      this._lineAddPopupMenu.style.bottom= bottom + 'px';
    }
    MA.DOM.fadeIn( this._lineAddPopupMenu, 300 );

    if ( !this._lineAddPopupMenuMousedownHandler ) {
      this._lineAddPopupMenuMousedownHandler = MA.bind( function(e) {
        var target = e.target;
        while( target ) {
          if ( target == this._lineAddPopupMenu ) return;
          target = target.parentNode;
        }
        this._hideLineAddPopupMenu();
      },this);
      MA.DOM.on( document.body, "mousedown", this._lineAddPopupMenuMousedownHandler);
    }
  }
  _createLineAddPopupMenu(draw) {
    if ( this._lineAddPopupMenu ) {
      this._lineAddPopupMenu.innerHTML = "";
    } else {
      this._lineAddPopupMenu = MA.DOM.create("div");
      MA.DOM.select("#main")[0].appendChild( this._lineAddPopupMenu );
    }

    
    MA.DOM.addClass(this._lineAddPopupMenu, "-gsibv-popup-menu" );
    var ul = MA.DOM.create("ul");

    function createMenuItem(title, handler) {
      var li= MA.DOM.create("li");
      var a = MA.DOM.create("a");
      a.innerHTML = title;
      MA.DOM.on(a,"click", handler );
      li.appendChild(a);
      return li;
    }

    ul.appendChild( createMenuItem("このスタイルの上に追加",MA.bind(this._onDrawAddBeforeClick, this,draw)) );
    ul.appendChild( createMenuItem("このスタイルの下に追加",MA.bind(this._onDrawAddAfterClick, this,draw)) );

    this._lineAddPopupMenu.appendChild( ul );
  }

  _onDrawAddBeforeClick(draw) {
    this._hideLineAddPopupMenu();
    // ライン以外は追加させない
    if ( draw.type != "line") return;
    var newDraw = draw.clone();
    newDraw.drawStyle.clear(true);
    draw.parent.insertItemAfter( newDraw, draw );

    var edit = this._createEditContainer(this._drawContainer , newDraw, true);
    var idx = this._findEditIndexByDraw( draw );
    
    this._drawContainer.insertBefore( edit.container, this._editList[idx].container);
    this._editList.splice(idx,0, edit);
    edit.container.style.display = 'none';

    MA.DOM.fadeIn( edit.container, 1500);
    this._refreshHeaderState();

  }

  _onDrawAddAfterClick(draw) {
    this._hideLineAddPopupMenu();
    // ライン以外は追加させない
    if ( draw.type != "line") return;
    var newDraw = draw.clone();
    newDraw.drawStyle.clear(true);
    draw.parent.insertItemBefore( newDraw, draw );

    var edit = this._createEditContainer(this._drawContainer , newDraw, true);
    var idx = this._findEditIndexByDraw( draw );
    
    if ( idx < this._editList.length-1 ) {
      this._drawContainer.insertBefore( edit.container, this._editList[idx].container.nextSibling);
      this._editList.splice(idx+1,0, edit);
    } else {
      this._drawContainer.appendChild( edit.container );
      this._editList.push(edit);
    }
    edit.container.style.display = 'none';

    MA.DOM.fadeIn( edit.container, 1500);
    this._refreshHeaderState();
  }
  _onDrawRemoveClick(draw) {
    // ライン以外は消させない
    if ( draw.type != "line") return;
    // 要素数が1個なら消させない
    if ( this._editList.length <= 1 ) return;
    
    draw.parent.removeItem( draw );


    var idx = this._findEditIndexByDraw( draw );
    if ( idx < 0 ) return;

    this._lock();
    var edit = this._editList[idx];
    

    var handler = MA.bind( function(edit, idx) {
      MA.DOM.off(edit.container,"transitionend", edit._handler );
      edit.container.style.opacity = 1;
      this._unlock();
      this._editList.splice(idx,1);
      if ( edit.edit) {
        edit.edit.destroy();
      }

      edit.container.parentNode.removeChild( edit.container );
      this._refreshHeaderState();
    
    }, this, edit, idx );

    edit._handler = handler;
    MA.DOM.on(edit.container,"transitionend", handler );

    edit.container.style.transition = 'opacity 300ms';
    edit.container.style.opacity = 0;

  }

  // 画面操作を不可にする
  _lock() {
    if ( !this._lockContainer ) {
      this._lockContainer = MA.DOM.create("div");
      this._lockContainer.style.position = 'absolute';
      this._lockContainer.style.backgroundColor = 'rgba(0,0,0,0)';
      this._lockContainer.style.zIndex = 99999;

      var pos = MA.DOM.offset( this._container );
      var size = MA.DOM.size( this._container );
      this._lockContainer.style.left = '0px';
      this._lockContainer.style.top = '0px';
      this._lockContainer.style.width = size.width + 'px';
      this._lockContainer.style.height = size.height + 'px';


      this._container.appendChild( this._lockContainer );
    }
  }

  _unlock() {
    
    if ( this._lockContainer ) {
      this._lockContainer.parentNode.removeChild( this._lockContainer );
      delete this._lockContainer;
      this._lockContainer = null;
    }
  }

  // 以下moveTo系の処理は逆順で表示しているので注意
  _onDrawUpClick(draw) {
    if ( !draw.parent.moveToAfter( draw ) ) return;
    
    var idx = this._findEditIndexByDraw( draw );
    if ( idx <= 0 ) return;

    
    this._lock();

    var edit = this._editList[idx];
    var handler = MA.bind( function(edit, idx) {
      MA.DOM.off(edit.container,"transitionend", edit._handler );
      edit.container.style.opacity = 1;
      this._unlock();
      this._editList.splice( idx, 1);
      var parentNode = edit.container.parentNode;
      parentNode.removeChild( edit.container );
      parentNode.insertBefore(edit.container, this._editList[idx-1].container);
      this._editList.splice( idx-1, 0,  edit );
      this._refreshHeaderState();

    }, this, edit, idx );

    edit._handler = handler;
    MA.DOM.on(edit.container,"transitionend", handler );

    edit.container.style.transition = 'opacity 300ms';
    edit.container.style.opacity = 0;
  }
  _onDrawDownClick(draw) {
    if ( !draw.parent.moveToBefore( draw ) ) return;

    
    var idx = this._findEditIndexByDraw( draw );
    if ( idx >= this._editList.length - 1 ) return;

    
    this._lock();
    var edit = this._editList[idx];
    
    var handler = MA.bind( function(edit, idx) {
      MA.DOM.off(edit.container,"transitionend", edit._handler );
      edit.container.style.opacity = 1;
      this._unlock();
      this._editList.splice( idx, 1);
      var parentNode = edit.container.parentNode;
      parentNode.removeChild( edit.container );
      parentNode.insertBefore(edit.container, this._editList[idx].container.nextSibling);      
      this._editList.splice( idx+1, 0,  edit );
      this._refreshHeaderState();

    }, this, edit, idx );

    edit._handler = handler;
    MA.DOM.on(edit.container,"transitionend", handler );

    edit.container.style.transition = 'opacity 300ms';
    edit.container.style.opacity = 0;
  }
  _onDrawFrontClick(draw) {
    if ( !draw.parent.moveToBack( draw ) ) return;

    var idx = this._findEditIndexByDraw( draw );
    if ( idx <= 0 ) return;

    this._lock();
    var edit = this._editList[idx];

    var handler = MA.bind( function(edit, idx) {
      MA.DOM.off(edit.container,"transitionend", edit._handler );
      edit.container.style.opacity = 1;
      this._unlock();
      this._editList.splice( idx, 1);
      var parentNode = edit.container.parentNode;
      parentNode.removeChild( edit.container );
      parentNode.insertBefore(edit.container, this._editList[0].container);
      this._editList.unshift( edit );
      this._refreshHeaderState();
    
    }, this, edit, idx );

    edit._handler = handler;
    MA.DOM.on(edit.container,"transitionend", handler );

    edit.container.style.transition = 'opacity 300ms';
    edit.container.style.opacity = 0;
  }
  _onDrawBackClick(draw) {
    if ( !draw.parent.moveToFront( draw ) ) return;

    
    var idx = this._findEditIndexByDraw( draw );
    if ( idx >= this._editList.length - 1 ) return;

    
    this._lock();
    var edit = this._editList[idx];

    var handler = MA.bind( function(edit, idx) {
      MA.DOM.off(edit.container,"transitionend", edit._handler );
      edit.container.style.opacity = 1;
      this._unlock();
      this._editList.splice( idx, 1);
      var parentNode = edit.container.parentNode;
      parentNode.removeChild( edit.container );
      parentNode.appendChild(edit.container);
      this._editList.push( edit );
      this._refreshHeaderState();
    }, this, edit, idx );

    edit._handler = handler;
    MA.DOM.on(edit.container,"transitionend", handler );

    edit.container.style.transition = 'opacity 300ms';
    edit.container.style.opacity = 0;
  }
  

  _createSymbolEdit(container, draw) {

    var edit = new GSIBV.UI.Edit.Symbol(this._map, draw.drawStyle, draw.minzoom, draw.maxzoom);
    edit.initialize(container, MA.DOM.select("#template .edit-frame.edit-symbol")[0]);

    return edit;
  }

  
  _createFillEdit(container, draw) {

    var edit = new GSIBV.UI.Edit.Fill(this._map, draw.drawStyle, draw.minzoom, draw.maxzoom);
    edit.initialize(container, MA.DOM.select("#template .edit-frame.edit-fill")[0], this._sizeFrame);


    return edit;
  }

  _createLineEdit(container, draw) {

    var edit = new GSIBV.UI.Edit.Line(this._map, draw.drawStyle, draw.minzoom, draw.maxzoom);
    edit.initialize(container, MA.DOM.select("#template .edit-frame.edit-line")[0], this._sizeFrame);


    return edit;
  }
};