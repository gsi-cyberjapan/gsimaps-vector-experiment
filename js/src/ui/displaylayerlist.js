/***************************************
    GSIBV.UI.DisplayLayerListView
    表示中のリスト表示
***************************************/
GSIBV.UI.DisplayLayerListView = class extends GSIBV.UI.Base {
  constructor(options) {
    super(options);
    this._options = options;
    this._owner = options.owner;
    this._contextMenu = options.contextMenu;
    if ( this._owner ) {
      this._owner.on("show", MA.bind( this._onOwnerShow, this ));
      this._owner.on("hide", MA.bind( this._onOwnerHide, this ));
    }
    this.initialize();
    
    GSIBV.application.on("langchange", MA.bind( this._onLangChange, this ) );
  }

  _initializeHint() {

    try {
      var hintLang = GSIBV.CONFIG.LANG[GSIBV.application.lang.toUpperCase()].UI.HINT;
      
      for( var key in hintLang ) {
        var elem = MA.DOM.find( this._container, key )
        for( var i=0; i<elem.length;i++ ) {
          elem[i].setAttribute("title", hintLang[key]);
        }
      }

    } catch(e) {console.log(e);}    
  }
  _onLangChange(e) {
    
    this._initializeHint();
    
    var liList = MA.DOM.find( this._ulElement, "li" );
    for( var i=0; i<liList.length; i++ ) {
      var li = liList[i];
      
      var langLayerList = GSIBV.CONFIG.LANG[GSIBV.application.lang.toUpperCase()].UI.LAYERLIST;
      for( var key in langLayerList ) {
        var elems = MA.DOM.find(li, key);
        if ( elems.length <= 0 ) continue;
        elems[0].innerHTML = langLayerList[key];
      }

      this._setPankuzuToElement(MA.DOM.find(li, ".pankuzu")[0],li._layer);
      this._setTitleToElement(MA.DOM.find(li, ".title")[0],li._layer);
    }

    

  }

  set map(map) {
    this._map = map;
    this._layerList = this._map.layerList;
    this.refreshList();

    this._layerList.on("add", MA.bind(this._onLayerAdd, this));
    this._layerList.on("remove", MA.bind(this._onLayerRemove, this));
    this._layerList.on("change", MA.bind(this._onLayerListChange, this));

    this._map.on("requestlayeredit", MA.bind(this._onRequestLayerEdit, this) );
  }

  set contextMenu(contextMenu) {
    this._contextMenu = contextMenu;
  }


  initialize() {

    if (typeof this._options.container == "string") {
      this._container = MA.DOM.select(this._options.container)[0];
    }
    else {
      this._container = this._options.container;
    }

    if ( !GSIBV.CONFIG.MOBILE ) {
      try {
        this._listScrollBar = new PerfectScrollbar(MA.DOM.find(this._container, ".list")[0]);
      } catch (e) { }
    }

    MA.DOM.on(MA.DOM.find(this._container, ".list")[0], "ps-scroll-y",
      MA.bind(this._onScroll, this));
    this._ulElement = MA.DOM.find(this._container, ".list ul")[0];
    this._liTemplate = MA.DOM.find(this._ulElement, 'li')[0].cloneNode(true);


    //this.hide();
    /*
    if ( this._editFilterMapMoveEndHandler ) {
        this._map.map.off( "moveend", this._editFilterMapMoveEndHandler);
        this._editFilterMapMoveEndHandler = null;
    }
    */

    this.refreshList();
  }

  _onOwnerShow() {
  }

  
  _onOwnerHide() {
    
  }


  show() {
    this._container.style.display = '';
  }

  hide() {
    this._container.style.display = 'none';
  }

  _onScroll() {
    GSIBV.UI.EditLayerView.hidePopupMenu();
  }

  _onLayerAdd(e) {
    if ( e.params.reason != "replace" && e.params.layer instanceof GSIBV.Map.Layer.FreeRelief) {
      // 表示時以外、ユーザーの追加操作の場合のみ
      this._onReliefEditButtonClick();
    }

    var li = this._createRow(e.params.layer);

    var idx = -1;
    for (var i = 0; i < this._layerList.length; i++) {
      if (this._layerList.get(i) == e.params.layer) {
        idx = this._layerList.length - i - 1;
        break;
      }
    }

    var liList = MA.DOM.find(this._ulElement, "li");

    for( var i=0; i< li.length; i++ ) {
      this._ulElement.insertBefore(li[i], liList[idx]);
    }

    if (this._listScrollBar) this._listScrollBar.update();
    
    this._initializeHint();
    //this.refreshList();
  }

  _onLayerRemove(e) {
    var liList = MA.DOM.find(this._ulElement, "li");
    
    if ( e.params.layer instanceof GSIBV.Map.Layer.FreeRelief) {
      if ( this._freeReliefDialog ) this._freeReliefDialog.hide();
    }
    for (var i = 0; i < liList.length; i++) {
      if (!liList[i]._layer) continue;
      if (liList[i]._layer.id == e.params.layer.id) {
        this._ulElement.removeChild(liList[i]);
        break;
      }
    }
    if (this._listScrollBar) this._listScrollBar.update();
  }

  _onLayerListChange() {
  }

  refreshList() {
    this._ulElement.innerHTML = '';

    if (!this._map) return;

    for (var i = this._layerList.length - 1; i >= 0; i--) {
      var layer = this._layerList.get(i);

      var li = this._createRow(layer);
      for( var j=0; j<li.length; j++ ) {
        this._ulElement.appendChild(li[j]);
      }
    }

    if (this._listScrollBar) this._listScrollBar.update();

  }

  get layerList() { return this._layerList; }

  _onRequestLayerEdit(e) {
    for( var i=0; i<this._layerList.length; i++ ) {
      var layer = this._layerList.get(i);
      if (layer.type != "binaryvector") continue;

      var hitItem = layer.data.findByLayerId( e.params["layer-id"]);
      if ( !hitItem ) {
        return;
      }

      var liList = MA.DOM.find( this._ulElement, "li" );
      for( var j=0; j<liList.length; j++ ) {
        var li = liList[j];
        if ( li._layer == layer) {
          this.showEditView(li, layer, true);

          li._editLayerView.showStyleEditor( hitItem.parent );
          break;
        }
      }

    }
  }

  hideStyleEditor() {
    var liList = MA.DOM.find( this._ulElement, "li" );
    for( var i=0; i<liList.length; i++ ) {
      var li = liList[i];
      if ( li._editLayerView ) li._editLayerView.hideStyleEditor();
    }

  }
  _createRow(layer) {
    var li = [this._createRowOne(layer)];
    
    return li;

  }

  _createRowOne(layer) {
    var li = this._liTemplate.cloneNode(true);
    li._layer = layer;
    MA.DOM.find(li, '.opacity-slider-frame')[0].style.display = 'none';
    //MA.DOM.setHTML(MA.DOM.find(li, ".title"), title);
    
    
    var langLayerList = GSIBV.CONFIG.LANG[GSIBV.application.lang.toUpperCase()].UI.LAYERLIST;
    for( var key in langLayerList ) {
      var elems = MA.DOM.find(li, key);
      if ( elems.length <= 0 ) continue;
      elems[0].innerHTML = langLayerList[key];
    }

    
    this._setPankuzuToElement(MA.DOM.find(li, ".pankuzu")[0],layer);

    this._setTitleToElement(MA.DOM.find(li, ".title")[0],layer);

    if ( layer.isUserFileLayer) {
      //MA.DOM.addClass( MA.DOM.find(li, ".type")[0], "user-file-layer" );
      //MA.DOM.setHTML(MA.DOM.find(li, ".type"), "ユーザースタイル");
      MA.DOM.addClass(MA.DOM.find(li, ".title"), "editable" );
      MA.DOM.on( MA.DOM.find(li, ".title")[0], "mousedown", MA.bind( this._onTitleClick, this, li,layer ) );

    } else {
      //MA.DOM.setHTML(MA.DOM.find(li, ".type"), GSIBV.Map.Layer.TYPES[layer.type]);
    }
    MA.DOM.on(MA.DOM.find(li, ".remove-button")[0], "click",
      MA.bind(this._onLayerRemoveButtonClick, this, li, layer));

    MA.DOM.on(MA.DOM.find(li, ".visible-button")[0], "click",
      MA.bind(this._onLayerVisibleButtonClick, this, li, layer));

    MA.DOM.on(MA.DOM.find(li, ".up-button")[0], "click",
      MA.bind(this._onLayerUpButtonClick, this, li, layer));

    MA.DOM.on(MA.DOM.find(li, ".down-button")[0], "click",
      MA.bind(this._onLayerDownButtonClick, this, li, layer));

    MA.DOM.on(MA.DOM.find(li, ".opacity-button")[0], "click",
      MA.bind(this._onOpacityButtonClick, this, li, layer));

    MA.DOM.on(MA.DOM.find(li, ".info-button")[0], "click",
      MA.bind(this._onInfoButtonClick, this, li, layer));

    if (layer.type == "binaryvector") {
      MA.DOM.on(MA.DOM.find(li, ".edit-button")[0], "click",
        MA.bind(this._onEditButtonClick, this, li, layer));
      
      MA.DOM.on(MA.DOM.find(li, ".save-button")[0], "click",
        MA.bind(this._onSaveButtonClick, this, li, layer));

      MA.DOM.find(li, ".layer-edit-list-frame")[0].style.display = 'none';
      this.showEditView( li, layer );
    
    }else if (layer.type == "relief_free") {
      MA.DOM.find(li, ".save-button")[0].style.display = 'none';
      MA.DOM.on(MA.DOM.find(li, ".edit-button")[0], "click",
        MA.bind(this._onReliefEditButtonClick, this, li, layer));
      MA.DOM.find(li, ".layer-edit-list-frame")[0].style.display = 'none';
      this.showEditView( li, layer );

    } else {
      MA.DOM.find(li, ".edit-button")[0].style.display = 'none';
      MA.DOM.find(li, ".save-button")[0].style.display = 'none';
      MA.DOM.find(li, ".layer-edit-list-frame")[0].style.display = 'none';
    }

    this._refreshRow(li, layer);
    return li;

  }


  _refreshRow(li, layer) {
    if (layer.visible) {
      MA.DOM.removeClass(li, "hidden");
    } else {
      MA.DOM.addClass(li, "hidden");
    }
  }

  _setPankuzuToElement( elem, layer ) {

    elem.innerHTML = "";
    if ( !layer._path ) return;

    var span = null
    for ( var i=0; i< layer._path.length; i++) {

      if ( i > 0 ) {
        
        span = MA.DOM.create("span");
        span.innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;";
        MA.DOM.addClass(span,"sp");
        elem.appendChild(span );
      }

      var title = layer._path[i].getTitle();
      span = MA.DOM.create("span");
      span.innerHTML = title;
      elem.appendChild(span );

    }

  }


  _setTitleToElement( elem, layer ) {
    var title = layer.getTitle();
    
    if ( title == undefined ) title = "";
    title = title.trim();
    
    //title = title.replace(/<("[^"]*"|'[^']*'|[^'">])*>/g, '');

    if ( title == "" ) {
      elem.innerHTML = "名称未設定";
      MA.DOM.addClass( elem,"no-title" );
    } else {
      elem.innerHTML = title;
      MA.DOM.removeClass( elem,"no-title" );
    }
  }
  _setLayerTitle(li,layer,title) {
    if ( title == undefined ) title = "";
    title = title.trim();
    title = title.replace(/<("[^"]*"|'[^']*'|[^'">])*>/g, '');

    layer.title = title;
    this._setTitleToElement(MA.DOM.find(li, ".title")[0], layer);
  }
  _onTitleClick( li, layer, e) {
    e.preventDefault();
    if ( !li._titleEditTextarea) {
      li._titleEditTextarea = MA.DOM.create("textarea");
      MA.DOM.addClass( li._titleEditTextarea, "title-edit");
      li.appendChild( li._titleEditTextarea );
    
      MA.DOM.on(li._titleEditTextarea, "keydown", MA.bind(function(li,layer,e){
        if (e.which == 13) {
          li._titleEditTextarea.style.display='none';
          //this._setLayerTitle( li, layer, li._titleEditTextarea.value );
          return false;
        }    

      },this,li,layer) );
      MA.DOM.on(li._titleEditTextarea, "focus", MA.bind(function(li){
        setTimeout(MA.bind( function(){ this.select();}, li._titleEditTextarea), 0 );

      },this,li) );

      MA.DOM.on(li._titleEditTextarea, "blur", MA.bind(function(li,layer){
        li._titleEditTextarea.style.display='none';
        this._setLayerTitle( li,layer, li._titleEditTextarea.value );
      },this,li,layer) );
    }

    var titleElem = MA.DOM.find(li, ".title")[0];
    var pos = MA.DOM.offset( titleElem, li );
    var size = MA.DOM.size( titleElem );
    li._titleEditTextarea.style.left = pos.left + "px";
    li._titleEditTextarea.style.top = pos.top + "px";
    li._titleEditTextarea.style.width = size.width + "px";
    li._titleEditTextarea.style.height = size.height + "px";
    li._titleEditTextarea.value = layer.title;
    li._titleEditTextarea.style.display='';
    li._titleEditTextarea.focus();
  }
  _showRemoveConfirm(li, layer ) {
    var dialog = new GSIBV.UI.Dialog.Alert();
    dialog.on("buttonclick",MA.bind(function(li, layer,e){
        if ( e.params.id == "ok" ) {
          this._removeLayer(li,layer);
        }
    },this, li, layer));
    dialog.show("確認画面","編集中の情報は失われます。<br>「いいえ」をクリックして保存して下さい。<br>閉じてもよろしいですか？", [
        {"id":"ok", "title":"はい"},
        {"id":"no", "title":"いいえ"}
    ]);
  }

  _onLayerRemoveButtonClick(li, layer) {
    if ( layer.isUserFileLayer ) {
      this._showRemoveConfirm(li,layer);
    } else {
      this._removeLayer(li,layer);
    }

  }

  _removeLayer(li,layer) {
    li.style.transition = "opacity 200ms";
    li.style.overflow = "hidden";

    if (li._editLayerView) li._editLayerView.destroy();

    var handler = function (li, layer) {
      li.removeEventListener('transitionend', handler);
      this.fire("layerremove", { "layer": layer });
    };
    li.addEventListener('transitionend', MA.bind(handler, this, li, layer));
    li.style.opacity = 0;
  }

  _onLayerVisibleButtonClick(li, layer) {
    layer.visible = !layer.visible;
    this._refreshRow(li, layer);
  }

  _onLayerUpButtonClick(li, layer) {
    this._map.moveLayer(layer, 1);

    li.style.transition = "opacity 200ms";
    var handler = MA.bind(function (li, layer) {
      li.removeEventListener('transitionend', handler);
      //this.refreshList();

      var prev = li.previousSibling;
      this._ulElement.removeChild(li);
      this._ulElement.insertBefore(li, prev);
      li.style.opacity = 1;

    }, this, li, layer);
    li.addEventListener('transitionend', handler);
    li.style.opacity = 0.5;



  }

  _onLayerDownButtonClick(li, layer) {

    this._map.moveLayer(layer, -1);
    li.style.transition = "opacity 200ms";
    var handler = MA.bind(function (li, layer) {
      li.removeEventListener('transitionend', handler);
      //this.refreshList();
      var next = li.nextSibling;
      this._ulElement.removeChild(next);
      this._ulElement.insertBefore(next, li);
      li.style.opacity = 1;

    }, this, li, layer);
    li.addEventListener('transitionend', handler);
    li.style.opacity = 0.5;
    /*
    
    */
  }

  _onOpacityButtonClick(li, layer) {
    var opacityFrame = MA.DOM.find(li, '.opacity-slider-frame')[0];

    opacityFrame.style.visivility = 'hidden';
    opacityFrame.style.display = '';
    if (!opacityFrame._slider) {
      var slider = new MA.UI.Slider(MA.DOM.find(opacityFrame, ".opacity-slider")[0]);
      slider.create();
      opacityFrame._slider = slider;
      slider.on("change", MA.bind(function (layer, e) {
        var opacity = e.params.value;

        layer.opacity = opacity;
        MA.DOM.find(opacityFrame, ".value")[0].innerHTML = Math.floor(opacity * 100);

      }, this, layer));
    }

    opacityFrame._slider.value = layer.opacity;

    opacityFrame.style.display = 'none';
    opacityFrame.style.visivility = 'visible';



    if (!opacityFrame._mouseDownHandler) {
      opacityFrame._mouseDownHandler = MA.bind(function (opacityFrame, e) {

        var target = e.target;
        var hit = false;
        while (target) {
          if (target == opacityFrame) {
            hit = true;
            break;
          }
          target = target.parentNode;
        }

        if (!hit) {
          MA.DOM.fadeOut(opacityFrame, 200);
          MA.DOM.off(document.body, "mousedown", opacityFrame._mouseDownHandler);
          opacityFrame._mouseDownHandler = null;
        }
      }, this, opacityFrame);
      MA.DOM.on(document.body, "mousedown", opacityFrame._mouseDownHandler);
    }
    MA.DOM.find(opacityFrame, ".value")[0].innerHTML = Math.floor(layer.opacity * 100);
    MA.DOM.fadeIn(opacityFrame, 200);

  }

  _onInfoButtonClick(li, layer) {
    if ( !this._infoWindow ) {
      this._infoWindow = new GSIBV.UI.Dialog.LayerInfoWindow();
    }
    var pos = MA.DOM.offset(li);
    var size = MA.DOM.size(li);
    pos.left += size.width;
    this._infoWindow.show( layer, pos );

    
  }


  _onEditButtonClick(li, layer) {
    this.showEditView(li, layer);
  }

  _onSaveButtonClick( li, layer) {
    if ( layer.data.title == undefined)
      layer.data.title = layer.title;

    if ( this._saveDataDialog ) {
      this._saveDataDialog.destroy();
      this._saveDataDialog = null;
    }
    this._saveDataDialog = new GSIBV.UI.Dialog.SaveDataDialog();
    this._saveDataDialog.on("buttonclick", MA.bind(function(layer,e){
      layer.data.title = e.params.title;
      layer.data.fileName = e.params.fileName;
      layer.data.save(e.params.indent);
    },this,layer));
    this._saveDataDialog.data = layer.data;
    this._saveDataDialog.show();
  
  }

  _onReliefEditButtonClick(li,layer ) {
    if ( !this._freeReliefDialog ) {
      this._freeReliefDialog = new GSIBV.UI.Dialog.FreeRelief(this._map);
    }
    if ( this._freeReliefDialog.isVisible ) {
      this._freeReliefDialog.hide();
    } else {
      this._freeReliefDialog.show();
    }
    

  }
  


  showEditView(li, layer, show) {
    if ( layer.type != "binaryvector") return;
    
    if ( !layer.data ) return;
    /*
    if (layer.loading) {
      if ( li._layerLoadHandler ) return;
      li._layerLoadHandler = MA.bind( function(li, layer, show){
        layer.off("finish", li._layerLoadHandler );
        li._layerLoadHandler = null;
        this.showEditView( li, layer, show );
      },this, li, layer, show);
      layer.on("finish", li._layerLoadHandler );
      return;
    }
    */
    if (!li._editLayerView) {
      li._editLayerView = new GSIBV.UI.EditLayerView(
        this._owner,
        this._contextMenu,
        this._map,
        MA.DOM.find(this._container, ".list")[0],
        layer,
        MA.DOM.find(li, ".layer-edit-list-frame")[0]
      );

      li._editLayerView.on("refresh", MA.bind(function (li) {
        if (this._listScrollBar) this._listScrollBar.update();
      }, this, li));


      li._editLayerView.on("expand", MA.bind(function (li) {
        MA.DOM.addClass(li, "-ma-edit-expand");
      }, this, li));


      li._editLayerView.on("collapse", MA.bind(function (li) {
        MA.DOM.removeClass(li, "-ma-edit-expand");
      }, this, li));



    }
    if ( show ) {
      li._editLayerView.show();
    } else {
      li._editLayerView.toggle();
    }
  }


}
