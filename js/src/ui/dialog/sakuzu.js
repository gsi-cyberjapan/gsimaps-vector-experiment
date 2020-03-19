/*****************************************************************
 * GSIBV.UI.Dialog.SakuzuDialog
 * 作図ダイアログ
******************************************************************/
GSIBV.UI.Dialog.SakuzuDialog = class extends GSIBV.UI.Dialog.Modeless {

  constructor(drawManager,options) {
    super(options);
    this._align = "right";
    this._size.width = 260;
    this._size.height = 200;

    this._frameSize;
    
    var dialogManager = GSIBV.UI.Dialog.Modeless.Manager.get();
    var frameSize = MA.DOM.size( dialogManager.frame );

    this._position = {left:frameSize.width-this._size.width-4,top:39};
    
    this._resizable = true;
    this._frameClass = ["-gsibv-sakuzu-dialog"];

    this._drawManager = drawManager;
    this._initializeDrawManagerEvents();

  }

  
  _createHeader(headerContainer) {
    this._titleContainer = MA.DOM.create("div");
    this._titleContainer.innerHTML = "作図";
    headerContainer.appendChild(this._titleContainer);
    super._createHeader(headerContainer);

  }

  // ダイアログの中身生成
  _create() {
    super._create();

    this._createControls();

    try {
      for( var key in GSIBV.CONFIG.LANG.JA.UI.SAKUZU.TOOLBUTTON ) {
        var elements = MA.DOM.find( this._contents, key );
        for ( var i=0; i<elements.length; i++)
          elements[i].setAttribute("title", GSIBV.CONFIG.LANG.JA.UI.SAKUZU.TOOLBUTTON[key]);
      }
    }catch(ex) {

    }

    if ( !this._listFrame ) {
      this._listFrame = MA.DOM.create("div");
      MA.DOM.addClass( this._listFrame, "list-frame");
      this._listContainer = MA.DOM.create("ul");
      this._listFrame.appendChild( this._listContainer );
      this._contents.appendChild( this._listFrame );

      this._list = new GSIBV.UI.Dialog.SakuzuDialog.List( this._listContainer, this._drawManager );
      this._list.on( "request", MA.bind( this._onListRequest, this ));
      this._list.on( "itemchange", MA.bind( this._onListItemChange, this ));
      
      try {
        this._listScrollBar = new PerfectScrollbar(this._listFrame);
      } catch(ex) {}
    }
  }

  show() {
    super.show();
    this._refreshButtonState();
    this._resize();
  }

  hide() {
    var proc = MA.bind(function() {
      
      if ( this._editInfoDialog) {
        this._editInfoDialog.destroy();
        this._editInfoDialog = undefined;
      }
      this.hide();
    },this);
    if ( this._editInfoDialog && this._editInfoDialog.isVisible) {
      this._showConfirm(proc);
      return;
    }


    

    this._drawManager.stopDraw();
    this._drawManager.stopEdit();

    super.hide();
  }

  _resize() {
    var controlsSize = MA.DOM.size( this._controlsContainer);
    this._listFrame.style.top = controlsSize.height + "px";
    if ( this._listScrollBar ) this._listScrollBar.update();
  }

  // 上部ボタン類生成 
  _createControls() {
    if ( this._controlsContainer ) return;

    this._controlsContainer = MA.DOM.create("div");
    MA.DOM.addClass( this._controlsContainer, "controls");

    var createButton = function(container, className, clickHandler) {
      var button = MA.DOM.create("button");
      MA.DOM.addClass( button, className );
      MA.DOM.on( button, "click", clickHandler );
      container.appendChild( button );
      return button;
    };
  
    var buttons = [
      {"id":"open", "className" : "open"},
      {"id":"save", "className" : "save"},
      {"id":"-"},
      {"id":GSIBV.Map.Draw.Marker.MarkerType, "className" : "marker"},
      {"id":GSIBV.Map.Draw.Line.Type, "className" : "line"},
      {"id":GSIBV.Map.Draw.Polygon.Type, "className" : "polygon"}
    ];

    this._controlButtons = [];

    for( var i=0; i<buttons.length; i++ ) {
      var buttonInfo = buttons[i];
      if ( buttonInfo.id == "-") {
        var separator = MA.DOM.create("div");
        MA.DOM.addClass( separator, "separator");
        this._controlsContainer.appendChild(separator);
        continue;
      }
      buttonInfo.button = createButton( this._controlsContainer, buttonInfo.className, MA.bind(this._onControlButtonClick,this, buttonInfo.id) );
      this._controlButtons.push( buttonInfo );
    }

    this._contents.appendChild( this._controlsContainer );
  }

  // コントロールのボタンの状態更新
  _refreshButtonState() {
    var drawer = this._drawManager.drawer;
    for( var i=0; i<this._controlButtons.length; i++ ) {
      var buttonInfo = this._controlButtons[i];
      if( drawer && drawer.type == buttonInfo.id )
        MA.DOM.addClass( buttonInfo.button, "active" );
      else
        MA.DOM.removeClass( buttonInfo.button, "active" );

      if ( buttonInfo.id == "save") {
        if ( this._drawManager.geoJSON  ) {
          MA.DOM.removeClass( buttonInfo.button, "disable" );
        } else {
          MA.DOM.addClass( buttonInfo.button, "disable" );
        }
      }
    }

  }

  // コントロールのボタンクリック
  _onControlButtonClick(id) {
    switch( id ) {
      case "open":
          this._openFile();
        break;
      case "save":
        this._saveToFile();
        break;
      case GSIBV.Map.Draw.Marker.MarkerType:
      case GSIBV.Map.Draw.Line.Type:
      case GSIBV.Map.Draw.Polygon.Type:
        this._draw(id);
        break;
    }
  }

  // 一覧からのリクエスト、編集、削除等
  _onListRequest(evt) {
    switch( evt.params.type ) {
      case "edit":
        this._editItem( evt.params.target );
        break;
      case "remove":
        this._removeItem( evt.params.target );
        break;
    }
  }

  _openFile() {
    if ( !this._openFileDialog) {
      this._openFileDialog = new  GSIBV.UI.Dialog.OpenFileDialog("GeoJSON形式のファイルを開く");
      this._openFileDialog.multi = true;
      this._openFileDialog.on("select", MA.bind(function(evt){
        this._drawManager.load( evt.params.list );
      },this));
    }
    this._openFileDialog.show();
  }

  // 保存
  _saveToFile() {
    var geoJSON = this._drawManager.geoJSON;
    if ( !geoJSON ) return;

    var proc = MA.bind(function(){

      var geoJSON = this._drawManager.geoJSON;
      if ( !geoJSON ) return;
      var text = JSON.stringify( geoJSON, null, "  " );
      if ( !this._saveFileDialog) {
        this._saveFileDialog = new GSIBV.UI.Dialog.SaveFileDialog(
          "作図した情報をGeoJSON形式で保存", GSIBV.UI.Dialog.SaveFileDialog.FILE_JSON);
      }
      this._saveFileDialog.show(MA.getTimestampText("gsi") + ".geojson",text);
    },this);
    
    if ( this._editInfoDialog && this._editInfoDialog.isVisible) {
      this._showConfirm(proc);
      return;
    }

    proc();
  }

  // 新規作成開始
  _draw(type) {
    
    var proc = MA.bind(function(type){
      if ( this._drawManager.drawer && this._drawManager.drawer.type == type ) {
        this._drawManager.stopDraw();
      } else {
        this._drawManager.draw(type);
      }
    },this,type);
    
    if ( this._editInfoDialog && this._editInfoDialog.isVisible) {
      this._showConfirm(proc);
      return;
    }

    proc();
  }

  // mapmanagerのイベント登録
  _initializeDrawManagerEvents() {
    this._drawManager.userDrawFileList.on("change", MA.bind(this._onUserDrawFileListChange, this));

    // Feature編集関連のイベント
    this._drawManager.userDrawFileList.on("editstart", MA.bind(this._onEditStart, this));
    this._drawManager.userDrawFileList.on("editfinish", MA.bind(this._onEditFinish, this));
    this._drawManager.userDrawFileList.on("editfeaturestart", MA.bind(this._onEditFeatureStart, this));
    this._drawManager.userDrawFileList.on("requesteditfeature", MA.bind(this._onRequestEditFeature, this));

    // 新規Feature関連のイベント
    this._drawManager.on("drawstart", MA.bind(this._onDrawStart, this));
    this._drawManager.on("drawready", MA.bind(this._onDrawReady, this));
    this._drawManager.on("drawfinish", MA.bind(this._onDrawFinish, this));

  }

  // 地物の編集が開始される直前
  _onRequestEditFeature() {
    if ( this._editInfoDialog && this._editInfoDialog.isVisible) {
      this._editInfoDialog.ok();
    }
  }

  // 作図ファイル数が変更された
  _onUserDrawFileListChange(evt) {
    var list = evt.params.list;
    switch ( evt.params.type ) {
      case "add":
        for( var i=0; i<list.length; i++ ) this._list.add( list[i]);
        break;
      case "remove":
        for( var i=0; i<list.length; i++ ) this._list.remove( list[i]);
        break;
      default:
        this._list.refresh();
        break;
    }
    if ( this._listScrollBar ) this._listScrollBar.update();
    this._refreshButtonState();
  }

  // 作図ファイル削除開始
  _removeItem(item) {
    var proc = MA.bind(function() {
      item.remove();
    }, this, item );

    if ( this._editInfoDialog && this._editInfoDialog.isVisible) {
      this._showConfirm(proc);
    } else {
      proc();
    }
  }

  // 作図ファイル編集対象選択開始
  _editItem(item) {
    var proc = MA.bind(function() {
      item.editing = !item.editing;
    }, this, item );

    if ( this._editInfoDialog && this._editInfoDialog.isVisible) {
      this._showConfirm(proc);
    } else {
      proc();
    }
  }


  showConfirm(proc) {

    if ( this._editInfoDialog && this._editInfoDialog.isVisible) {
      this._showConfirm(MA.bind(function(proc){
        proc();
        this._drawManager.stopDraw();
        this._drawManager.stopEdit();
      },this, proc));
    } else {

      this._drawManager.stopDraw();
      this._drawManager.stopEdit();
      proc();
    }
  }

  // 確定していない情報の確認
  _showConfirm(proc) {

    var confirm = new GSIBV.UI.Dialog.Alert();
    confirm.autoDestroy = true;
    confirm.on("buttonclick",MA.bind(function(proc,evt){
      if ( evt.params.id == "ok-resume") {
        this._editInfoDialog.ok();
        proc();
      } else if ( evt.params.id == "cancel-resume") {
        this._editInfoDialog.cancel();
        proc();
      }
    },this,proc));

    confirm.show("未確定情報の確認","確定されていない作図情報があります。",[
      {
        id : "ok-resume",
        title : "確定して続行"  
      },
      {
        id : "cancel-resume",
        title : "破棄して続行"  
      },
      {
        id : "cancel",
        title : "キャンセル"  
      }
    ])

  }

  // 編集モード（編集対象選択）開始
  _onEditStart(evt) {

  }

  // 編集モード（編集対象選択）終了
  _onEditFinish(evt ) {
  }

  // 地物編集開始
  _onEditFeatureStart(evt) {
    //console.log( evt);

    if ( this._editInfoDialog ) this._editInfoDialog.destroy();

    this._editInfoDialog = new GSIBV.UI.Dialog.SakuzuEditInfoDialog(evt.params.feature) ;
    this._editInfoDialog.on("buttonclick",MA.bind(function(item,evt){
      //console.log( item );
      item.stopEditFeature();

    },this,evt.params.item));
    
    this._editInfoDialog.show();

  }

  // 地物作成開始
  _onDrawStart(evt) {
    this._refreshButtonState();
  }

  // 地物作成終了
  _onDrawFinish() {
    this._refreshButtonState();
  }

  // マップ上地物が置かれた
  _onDrawReady(evt) {
    
    if ( this._editInfoDialog ) this._editInfoDialog.destroy();

    this._editInfoDialog = new GSIBV.UI.Dialog.SakuzuEditInfoDialog(evt.params.feature) ;
    this._editInfoDialog.on("buttonclick",MA.bind(function(evt){
      this._drawManager.nextDraw(evt.params.id!="ok");
    },this));
    
    this._editInfoDialog.show();

  }

  // GSIBV.UI.Dialog.SakuzuDialog.Itemの変更
  // Item数が変更されている可能性があるためボタンの状態を更新
  _onListItemChange() {
    this._refreshButtonState();
  }
}



/*****************************************************************
 * GSIBV.UI.Dialog.SakuzuDialog.List
 * リスト表示
******************************************************************/
GSIBV.UI.Dialog.SakuzuDialog.List = class extends MA.Class.Base {

  constructor(container, drawManager) {
    super();
    this._container = container;
    this._drawManager = drawManager;
    this._drawList = drawManager.userDrawFileList;
    this.refresh();
  }

  clear() {
    if ( this._list ) {
      for( var i=0; i<this._list.length; i++ ) this._list[i].destroy();
    }
    this._list = [];
    this._container.innerHTML = "";
  }

  refresh() {
    this.clear();
    for( var i=0; i<this._drawList.length; i++ ) {
      this.add(this._drawList.get(i));
    }
  }


  add(drawListItem) {

    var item = new GSIBV.UI.Dialog.SakuzuDialog.Item(drawListItem);
    item.on("request", MA.bind( this._onItemRequest, this ));
    item.on("change", MA.bind( this._onItemChange, this ));
    this._container.appendChild( item.create() );
    this._list.push( item );

     
    try {
      for( var key in GSIBV.CONFIG.LANG.JA.UI.SAKUZU.TOOLBUTTON ) {
        var elements = MA.DOM.find( this._container, key );
        for ( var i=0; i<elements.length; i++)
          elements[i].setAttribute("title", GSIBV.CONFIG.LANG.JA.UI.SAKUZU.TOOLBUTTON[key]);
      }
    }catch(ex) {

    }

  }

  remove(drawListItem) {
    for( var i=0; i<this._list.length; i++ ) {
      var item = this._list[i];
      if ( item.item == drawListItem ) {
        item.destroy();
        this._list.splice(i,1);
        break;
      }
    }
  }

  _onItemRequest(evt) {
    this.fire("request",evt.params);
  }
  _onItemChange(evt) {
    this.fire("itemchange");
  }

};



/*****************************************************************
 * GSIBV.UI.Dialog.SakuzuDialog.Item
 * リスト項目
******************************************************************/
GSIBV.UI.Dialog.SakuzuDialog.Item = class extends MA.Class.Base {
  constructor(item) {
    super();
    this._item = item;
    this._itemChangeHandler = MA.bind( this._onItemChange, this );
    this._itemEditStartHandler = MA.bind( this._onItemEditStart, this );
    this._itemEditFinishHandler = MA.bind( this._onItemEditFinish, this );
    this._item.on("change", this._itemChangeHandler );
    this._item.on("editstart", this._itemEditStartHandler );
    this._item.on("editfinish", this._itemEditFinishHandler );
    this.create();
  }

  get item() { return this._item; }

  _onItemChange() {
    this.refresh();
    this.fire("change");
  }

  _onItemEditStart() {
    this.refresh();
  }

  _onItemEditFinish() {
    this.refresh();
  }

  destroy() {
    if ( this._container && this._container.parentNode) {
      this._container.parentNode.removeChild( this._container );
    }
    this._item.off("change",this._itemChangeHandler);
  }

  create() {
    this._container = MA.DOM.create("li");

    // 表示切り替えボタン
    this._viewButton = MA.DOM.create("button");
    MA.DOM.addClass( this._viewButton, "view" );
    this._container.appendChild( this._viewButton);
    MA.DOM.on( this._viewButton, "click", MA.bind(this._onViewClick, this ) );

    // タイトル
    this._titleContainer = MA.DOM.create("div");
    MA.DOM.addClass( this._titleContainer, "title" );
    this._container.appendChild( this._titleContainer);

    // 数
    this._numContainer = MA.DOM.create("div");
    MA.DOM.addClass( this._numContainer, "num" );
    this._container.appendChild( this._numContainer);

    // 編集ボタン
    this._editButton = MA.DOM.create("button");
    MA.DOM.addClass( this._editButton, "edit" );
    this._container.appendChild( this._editButton);
    MA.DOM.on( this._editButton, "click", MA.bind(this._onEditClick, this ) );

    // 削除ボタン
    this._removeButton = MA.DOM.create("button");
    MA.DOM.addClass( this._removeButton, "remove" );
    this._container.appendChild( this._removeButton);
    MA.DOM.on( this._removeButton, "click", MA.bind(this._onRemoveClick, this ) );

    this.refresh();
    return this._container;
  }

  refresh() {
    
    if ( this._item.visible ) {
      MA.DOM.removeClass(this._viewButton,"hidden");
    } else {
      MA.DOM.addClass(this._viewButton,"hidden");
    }


    if ( this._item.editing) {
      MA.DOM.addClass(this._container,"active");
    } else {
      MA.DOM.removeClass(this._container,"active");
    }

    this._titleContainer.innerHTML = this._item.fileName;
    this._numContainer.innerHTML = this._item.featureCollection.length;

    if ( this._item.featureCollection.length <= 0 ) {
      MA.DOM.addClass( this._removeButton,"disable");
      MA.DOM.addClass( this._editButton,"disable");
    } else {
      MA.DOM.removeClass( this._removeButton,"disable");
      MA.DOM.removeClass( this._editButton,"disable");
    }
  }

  // 表示切り替え
  _onViewClick() {
    this._item.visible = !this._item.visible;
  }

  // 編集
  _onEditClick() {
    if ( this._item.featureCollection.length <= 0 ) return;
    this.fire( "request", { "type":"edit", "target":this._item});
  }

  // 削除
  _onRemoveClick() {
    if ( this._item.featureCollection.length <= 0 ) return;
    this.fire( "request", { "type":"remove", "target":this._item});
    
  }
};