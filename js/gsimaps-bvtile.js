


/************************************************************************
 モバイル判定
************************************************************************/
if (location.pathname.indexOf(GSIBV.CONFIG.MOBILE_FILENAME) < 0) {
  if (
    navigator.userAgent.indexOf('iPhone') > 0 ||
    navigator.userAgent.indexOf('iPad') > 0 ||
    navigator.userAgent.indexOf('iPod') > 0 ||
    navigator.userAgent.indexOf('Android') > 0
  ) {
    var hash = location.hash;
    if (!hash || hash.indexOf("&frommobile") < 0) {
      location.href = GSIBV.CONFIG.MOBILEURL + hash;
    }
  }
}


//縦書きプラグイン有効
mapboxgl.setRTLTextPlugin('./mapbox-rtlplugin/vertical-text.js');

console.log( "mapbox" + mapboxgl.version  );

GSIBV.Config = {

  defaultLayers: [
    {
      "id": "vstd",
      "opacity": 1
    }
  ],
  defaultView: {
    "leftPanel": !GSIBV.CONFIG.MOBILE
  },
  localFont: "'sans-serifi', 'MS Gothic', 'Hiragino Kaku Gothic Pro', sans-serif"
};

//if (location.href.match(/font=local/i)) {
  GSIBV.Config.useLocalFont = false;
//}

// ブラウザ判定
var userAgent = window.navigator.userAgent.toLowerCase();
GSIBV.BROWSER = {};

// Firefox、Safariで印刷させるための設定
GSIBV.BROWSER.USEPRESERVEDRAWINGBUFFER = [
  "SAFARI", "FIREFOX"
];
if(userAgent.indexOf('msie') != -1 ||　userAgent.indexOf('trident') != -1) {
  GSIBV.BROWSER.IE = true;
} else if(userAgent.indexOf('edge') != -1) {
  GSIBV.BROWSER.EDGE = true;
} else if(userAgent.indexOf('chrome') != -1) {
  GSIBV.BROWSER.CHROME = true;
} else if(userAgent.indexOf('safari') != -1) {
  GSIBV.BROWSER.SAFARI = true;
} else if(userAgent.indexOf('firefox') != -1) {
  GSIBV.BROWSER.FIREFOX = true;
} else if(userAgent.indexOf('opera') != -1) {
  GSIBV.BROWSER.OPERA = true;
}

// Firefox、Safariで印刷させるための設定
GSIBV.Config.usePreserveDrawingBuffer = false;
for( var key in GSIBV.BROWSER) {
  if ( GSIBV.BROWSER.USEPRESERVEDRAWINGBUFFER.indexOf(key) >= 0 ) {
    GSIBV.Config.usePreserveDrawingBuffer = true;
    break;
  }
}


/***************************************
    GSIBV.Application
    バイナリベクトルタイルアプリケーション
***************************************/
GSIBV.Application = class extends MA.Class.Base {
  /*
  初期処理順序
  1.constructor
  2.initialize(documentの準備が出来次第)
  3._initializeView(initialize内から)
  4._initializeMap(initialize内から)
  5.start(_initializeMap内で生成された地図が準備出来次第)
  */
  constructor() {
    super();

    this._tooltipManager = new GSIBV.Application.TooltipManager(this);

    // ファイルのドロップ受入
    if ( !this._windowDragOverHandler  ) {
      this._windowDragOverHandler = MA.bind( this._onWindowDragOver, this );
      window.addEventListener("dragover", this._windowDragOverHandler, false);
    }

    if ( !this._windowDragDropHandler  ) {
      this._windowDragDropHandler = MA.bind( this._onWindowDragDrop, this );
      window.addEventListener("drop", this._windowDragDropHandler, false);
    }

    this._lang = "ja";
    
    /*
    var language = (window.navigator.languages && window.navigator.languages[0]) ||
            window.navigator.language ||
            window.navigator.userLanguage ||
            window.navigator.browserLanguage;
    if ( language != "ja" ) this._lang ="en";
    */

    this._hashManager = new GSIBV.HashManager(this, GSIBV.Config.defaultLayers, GSIBV.Config.defaultView);
    
    this._lang = this._hashManager.initialParams["lang"];
    GSIBV.Map.Layer.FreeRelief.DataManager.instance.data = this._hashManager.initialParams["reliefdata"];

    if ( this._hashManager.initialParams["lang"] != undefined &&
        this._hashManager.initialParams["lang"] != "" )
      this._lang = this._hashManager.initialParams["lang"];

    var layersJSONTopUrl = location.protocol + "//" + location.host + location.pathname;
    
    if ( layersJSONTopUrl.match(/\.[^.\/]+$/g)) {
      layersJSONTopUrl = layersJSONTopUrl.replace(/\/[^\/]*\.[^.\/]+$/g, "/");
    }
    this._layersJSON= new GSIBV.LayersJSON (GSIBV.CONFIG.GSIMAPLAYERS,layersJSONTopUrl);
    this._layerTreeDialog = new GSIBV.UI.Dialog.LayerTree();
    this._layerTreeDialog.layersJSON = this._layersJSON;
    this._layerTreeDialog.on("select", MA.bind(this._onGSIMAPLayerSelect,this));
    this._layerTreeDialog.on("area", MA.bind(this._onGSIMAPLayerArea,this));
    this._layerTreeDialog.on("hide",MA.bind(function(){
      if ( !GSIBV.CONFIG.MOBILE ) return;
      this._leftPanel.show();
    },this));

    this._layersJSON.on("layerload", MA.bind(this._onLayerTreeLayerLoad, this));

    this._mainMenu = new GSIBV.UI.MainMenu(this,{
      "button": "#header .menu-button",
      "menu" : GSIBV.CONFIG.MENU
    } );

    this._searchPanel = new GSIBV.UI.SearchPanel({
      "form": "form[name=search]",
      "searchresult": ".search-result-frame"
    });
    this._searchPanel.on("request", MA.bind(this._onSearchRequest, this));

    this._contextMenu = new GSIBV.UI.ContextMenu({
      "container": "#context-menu"
    });

    this._leftPanel = new GSIBV.UI.LeftPanel({
      "container": "#left-panel",
      "recommendContainer": "#recommend",
      "displayListContainer": "#layer-list"
    });

    this._leftPanel.on("newdata", MA.bind(this._onNewData, this));
    this._leftPanel.on("opendata", MA.bind(this._onOpenData, this));
    this._leftPanel.on("showselectlayer", MA.bind(this._onShowSelectLayerPopup, this));
    this._leftPanel.on("recommendchange", MA.bind(this._onRecommendChange, this));
    this._leftPanel.on("requestlayerremove", MA.bind(this._onRequestLayerRemove, this));

    MA.ready(MA.bind(this.initialize, this));



  }

  /*------------------------------------------
      プロパティ
  ------------------------------------------*/
  get leftPanel() { return this._leftPanel; }
  get lang() { 
    if ( this._lang == undefined ) return "ja";
    if ( this._lang != "ja" && this._lang != "en") return "ja";
    return this._lang;

  }
  set lang(lang) { this._lang = lang; this._initializeLang();}

  get started() { return this._started;}
  get tooltipManager() { return this._tooltipManager; }

  /*------------------------------------------
      メソッド
  ------------------------------------------*/
  // 初期化
  initialize() {

    if ( GSIBV.CONFIG.MOBILE ) {
      MA.DOM.addClass(MA.DOM.select("#main")[0],"mobile");
    }

    this._initializeTitle();
    MA.DOM.select("#main")[0].style.display = 'block';

    this._initializeView();
    this._initializeMap();

  }

  // 言語変更時
  _initializeLang() {
    this._initializeTitle ();
    this.fire("langchange",{"lang": this._lang});
  }

  // タイトルロゴ
  _initializeTitle() {
    var lang = this.lang;
    
    if ( GSIBV.CONFIG.LANG[lang.toUpperCase()] ) {

      var titleLang = GSIBV.CONFIG.LANG[lang.toUpperCase()].TITLE;

      MA.DOM.select( "#header .logo-1")[0].innerHTML = titleLang.title;
      MA.DOM.select( "#header .logo-2")[0].innerHTML = titleLang.subtitle;

    }

  }

  // UI表示初期化
  _initializeView() {
    this._mainMenu.initialize();
    this._searchPanel.initialize();

    this._contextMenu.initialize();
    this._leftPanel.contextMenu = this._contextMenu;
    this._leftPanel.initialize({
      recommendData: GSIBV.CONFIG.RECOMMEND
    },
      (this._hashManager.initialParams && this._hashManager.initialParams["d"]
        ? this._hashManager.initialParams["d"]["l"] : false)
    );


  }

  // 地図初期化
  _initializeMap() {

    var mapOptions = {};

    if (GSIBV.Config.useLocalFont) {
      mapOptions.localFont = GSIBV.Config.localFont;
    }

    this._map = new GSIBV.Map(MA.DOM.select(".map")[0], mapOptions);
    this._map.on("load", MA.bind(function () {
      this._searchPanel.map = this._map;
      this.start();
    }, this));

    this._map.on("showleftpanel", MA.bind(function(){
      this._leftPanel.show();
    },this));
    this._map.on("vectortile", MA.bind(this._onVectorTileLoad, this));
    this._hashManager.initialize(this._map, this._leftPanel);
    this._map.initialize(this._hashManager.initialParams);

    this._hashManager.on("change", MA.bind(this._onHashChange, this));
    this._map.on("printmodechange", MA.bind(function(evt){
      try {
        if ( evt.params.mode) {
          GSIBV.UI.Dialog.Modeless.Manager.get().hide();
        } else {
          GSIBV.UI.Dialog.Modeless.Manager.get().show();
        }
      }catch(ex){}
    },this) );

    this._contextMenu.map = this._map;


  }
  _onVectorTileLoad(e) {

    return;
    
    var loadingView = MA.DOM.select("#loading")[0];

    var list = e.params.list;
    if (!list || list.length <= 0) {

      if (this._loadingView)
        document.body.removeChild(this._loadingView);
      this._loadingView = null;

    } else {
      if (!this._loadingView) {
        this._loadingView = MA.DOM.create("div");
        MA.DOM.addClass(this._loadingView, "loading");
        this._loadingViewUL = MA.DOM.create("ul");
        this._loadingView.appendChild(this._loadingViewUL);
        document.body.appendChild(this._loadingView);
      }
      this._loadingViewUL.innerHTML = '';

      for (var i = 0; i < list.length; i++) {
        var item = list[i];
        var li = MA.DOM.create("li");
        var stateCaption = "";
        if (item.state == "loading") {
          stateCaption = "の情報を取得しています";
        } else if (item.state == "load") {
          stateCaption = "のレイヤを地図に追加しています";
        }

        li.innerHTML = "<span>" + item.layer.title + '</span>' + stateCaption;
        this._loadingViewUL.appendChild(li);
      }
      //if ( loadingView.style.display == "none")
      //      MA.DOM.fadeIn( loadingView,200, 0.9);

    }
  }
  // 開始
  start() {
    
    this._leftPanel.recommendSelector.map = this._map;
    this._leftPanel.displayLayerListView.map = this._map;
    this._initializeInitialLayers();
    this._started=true;
    this.fire("start");

  }

  _onHashChange(e) {
    if ( !e.params || !e.params.center) return;
    this._map.flyTo(e.params.center, e.params.zoom);
  }
  
  _initializeInitialLayers() {
    if (!this._hashManager.initialParams || !this._hashManager.initialParams.ls) return;
    this._unknownLayers = {};
    // 確認ダイアログ
    
    
    for (var i = 0; i < this._hashManager.initialParams.ls.length; i++) {
      var info = this._hashManager.initialParams.ls[i];
      var visible = true;

      if (this._hashManager.initialParams.disp) {
        if (this._hashManager.initialParams.disp.length > i) {
          if (!this._hashManager.initialParams.disp[i]) {
            visible = false;
          }
        }
      }

      var layerInfo = this._leftPanel.recommendSelector.findById(info.id);

      if (layerInfo) {
        layerInfo.layer.opacity = info.opacity;
        layerInfo.layer.visible = visible;
        this._map.addLayer(layerInfo.layer);
      } else {
        this._unknownLayers[info.id] = true;
        this._map.addLayer(new GSIBV.Map.Layer.Unknown({ "id": info.id, "title": "読み込み中", "visible": visible, opacity: info.opacity }));
      }
    }
    this._layersJSON.load();

  }

  _checkConfirm(layer) {
    for( var key in GSIBV.CONFIG.CONFIRM_LAYERS ){
      var item = GSIBV.CONFIG.CONFIRM_LAYERS[key];
      var idx = item.layers.indexOf(layer.id);
      if ( idx >= 0 ) {

        return this.showLayerConfirm(layer, item);
      }
    }

    if ( layer.parent.title == "指定緊急避難場所") {
      return this.showEvacConfirm( 
        MA.bind(function(layer){
          var layer = GSIBV.Map.Layer.generate(layer);
          if (layer) this._map.addLayer(layer);
        },this, layer),
        
        MA.bind(function(layer){
          this._map.removeLayer(layer);
        },this, layer)

      );
    }

    return true;
  }
  _onLayerTreeLayerLoad(e) {
    if ( !this._unknownLayers ) {
      e.params.loadNext = false;
      return;
    }
    var layer = e.params.layer;
    if ( this._unknownLayers[layer.id]) {
      delete this._unknownLayers[layer.id];
      if ( this._checkConfirm(layer) ) {
        var layer = GSIBV.Map.Layer.generate(layer);
        if (layer) this._map.addLayer(layer);
      }
    }
    
    if ( Object.keys(this._unknownLayers).length> 0 )
      e.params.loadNext = true;
    else
      e.params.loadNext = false;

  }

  // 印刷画面開始
  print() {
    if ( this._sakuzuDialog) {
      this._sakuzuDialog.showConfirm( MA.bind(function(){ this._print();},this));
      return;
    }

    this._print();
  }

  _print() {
    this._leftPanel.displayLayerListView.hideStyleEditor();
    var html = MA.DOM.select("html")[0];

    html.style.height = 'auto';
    html.style.overflowX = 'auto';
    html.style.overflowY = 'auto';
    
    document.body.style.height = 'auto';
    document.body.style.overflowX = 'visible';
    document.body.style.overflowY = 'visible';

    MA.DOM.addClass(MA.DOM.select("#main")[0],"print");

    this._map.printMode = true;
    this._map.compassControlVisible = false;

    this._printCancelHandler =  MA.bind(function(){
      this.exitPrint();
    },this );
    
    this._printHandler =  MA.bind(function(){
      window.print();
    },this );

    
    this._printSizeChangeHandler =  MA.bind(function(){
      this._resetPrintPaperSize();
    },this );


    
    this._visibleCompassHandler =  MA.bind(function(){
      this._resetPrintCompassVisible();
    },this );

    MA.DOM.on( MA.DOM.select( ".print-header .size")[0], "change", this._printSizeChangeHandler );
    MA.DOM.on( MA.DOM.select( ".print-header .print")[0], "click", this._printHandler );
    MA.DOM.on( MA.DOM.select( ".print-header .back")[0], "click", this._printCancelHandler );
    MA.DOM.on( MA.DOM.select( "#gsi_print_directionsign")[0], "click", this._visibleCompassHandler );
    
    
    this._resetPrintPaperSize();
    this._resetPrintCompassVisible();
  }

  _resetPrintCompassVisible() {
    
    var elem = MA.DOM.select( "#gsi_print_directionsign")[0];
    this._map.compassControlVisible = elem.checked;
  }

  _resetPrintPaperSize() {

    var elem = MA.DOM.select( ".print-header .size")[0];
    
    var size = GSIBV.CONFIG.PAPERSIZE[elem.value];
    if ( !size) return;

    MA.DOM.select("#main.print .content")[0].style.width = size.w + "px";
    MA.DOM.select("#main.print .content")[0].style.height = size.h + "px";
    this._map.invalidate();

  }

  exitPrint() {
    
    MA.DOM.select("#main.print .content")[0].style.width = "auto";
    MA.DOM.select("#main.print .content")[0].style.height = "auto";

    MA.DOM.off( MA.DOM.select( ".print-header .back")[0], "click", this._printCancelHandler  );
    MA.DOM.off( MA.DOM.select( ".print-header .print")[0], "click", this._printHandler  );
    MA.DOM.off( MA.DOM.select( ".print-header .size")[0], "change", this._printSizeChangeHandler );
    MA.DOM.off( MA.DOM.select( "#gsi_print_directionsign")[0], "click", this._visibleCompassHandler );
    
    var html = MA.DOM.select("html")[0];

    html.style.height = '100%';
    html.style.overflow = 'hidden';
    
    document.body.style.height = '100%';
    document.body.style.overflow = 'hidden';

    MA.DOM.removeClass(MA.DOM.select("#main")[0],"print");

    this._map.printMode = false;

  }

  
  /*------------------------------------------
      イベントハンドラ
  ------------------------------------------*/
  _onWindowDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = ( this._started  ? "copy" : "uninitialized" );
    
  }

  _onWindowDragDrop(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    if ( !this._started ) return;


    var loader = new GSIBV.LocalFileLoader(evt.dataTransfer.files);
    loader.on("load", MA.bind(function(evt){
      this.fire("filedrop", evt.params);
    },this));
    loader.load();
  }



  // 検索リクエスト
  _onSearchRequest(e) {
    switch (e.params.type) {
      case "position":
        this._map.setView(e.params.data);
        break;

    }
  }

  alert(msg, title) {
    if ( !this._alert ) {
      this._alert = new GSIBV.UI.Dialog.Alert();
    }
    this._alert.show( title ? title : "　",msg, [
        {"id":"ok", "title":"OK"}
    ]);
  }
  
  // ヘルプ表示
  showHelp() {
    //this.alert("help");
    if ( !this._helpDialog) {
      var windowSize = MA.DOM.size(MA.DOM.select("#main")[0]);

      var size = {
        width:400,
        height:610
      }

      if ( windowSize.width-40 < size.width) size.width = windowSize.width-40;
      if ( windowSize.height + 40 < size.height) size.height = windowSize.height-40;

      var position = {left:windowSize.width - size.width, top:40};
      this._helpDialog = new GSIBV.UI.Dialog.Help({
        "contents": "./help.html",
        "resizable" :true,
        "size" : size,
        "position" : position
      });
      
      
    }
    this._helpDialog.show();

  }

  // 作図
  startSakuzu() {
    /*
    if ( !this._sakuzuPanel ) {
      this._sakuzuPanel = new GSIBV.UI.Sakuzu.Panel( this._map.drawManager,{
        container : "#sakuzu-panel"
      });
    }
    this._sakuzuPanel.toggle();
    */

    if ( !this._sakuzuDialog ) {
      this._sakuzuDialog = new GSIBV.UI.Dialog.SakuzuDialog(this._map.drawManager);
    }
    this._sakuzuDialog.show();
  }

  // 指定緊急避難場所確認
  showEvacConfirm( okProc, cancelProc ) {
    if( this._evacOK) {
      return true;
    }
    var proc = MA.bind( function(okProc,cancelProc){
      
      if( this._evacOK) {
        okProc();
        this._confirmQue.shift();
        return this._showNextConfirm();
      }
      var confirm = new GSIBV.UI.Dialog.Confirm();
      confirm.on("ok", MA.bind(function(proc){
        this._evacOK = true; proc();
        this._confirmQue.shift();
        this._showNextConfirm();
      },this,okProc));
      confirm.on("cancel", MA.bind(function(proc){
        if ( proc ) proc();
        this._confirmQue.shift();
        this._showNextConfirm();
      },this,cancelProc));
      confirm.show("免責事項・ご利用上の注意",MA.DOM.select( "#template .evac")[0].cloneNode(true));

    },this, okProc, cancelProc );
    

    if ( !this._confirmQue)this._confirmQue = [];


    this._confirmQue.push( proc);

    if ( this._confirmQue.length == 1 )
      this._showNextConfirm();


    return false;
  }

  _showNextConfirm() {
    if ( !this._confirmQue || this._confirmQue.length<=0) return;
    var proc = this._confirmQue[0];
    proc();
  }

  showLayerConfirm(layer, confirmInfo) {
    if ( confirmInfo.ok) return true;

    var proc = MA.bind( function(layer,confirmInfo){
      if ( confirmInfo.ok) {
        this._confirmQue.shift();
        return this._showNextConfirm();
      }
      var confirm = new GSIBV.UI.Dialog.Confirm();
      confirm.on("ok", MA.bind(function(layer,confirmInfo){
        confirmInfo.ok = true;
        var layer = GSIBV.Map.Layer.generate(layer);
        if (layer) this._map.addLayer(layer);
        this._confirmQue.shift();
        this._showNextConfirm();
      },this,layer,confirmInfo));

      confirm.on("cancel", MA.bind(function(layer,confirmInfo){
        this._map.removeLayer(layer.id);
        this._confirmQue.shift();
        this._showNextConfirm();
      },this,layer,confirmInfo));
      
      confirm.show(confirmInfo.title, confirmInfo.message);

    },this, layer, confirmInfo );
    

    if ( !this._confirmQue)this._confirmQue = [];


    this._confirmQue.push( proc);

    if ( this._confirmQue.length == 1 )
      this._showNextConfirm();



    return false;
  }

  // 自然災害伝承碑ダイアログ
  showDsloretDialog( data ) {
    var dialog = new GSIBV.UI.Dialog.Dsloret();
    dialog.show( data);
  }

  // PC版URL
  getPCUrl() {
    return GSIBV.CONFIG.URL + this._hashManager.makeHash( false, true) + "&frommobile";;
  }
  // モバイル版URL
  getMobileUrl() {
    return GSIBV.CONFIG.MOBILEURL + this._hashManager.makeHash(true);
  }

  // 地理院地図でのURL
  getGSIMapsUrl() {
    var result = "https://maps.gsi.go.jp/";
    if ( !this._map ) return result;

    var hashPos = this._hashManager.getPosition(true);

    var hashComponent = hashPos.split("/");
    var hashZL = parseInt(hashComponent[0]) + 1;
    var hashLat = hashComponent[1];
    var hashLon = hashComponent[2];
    var hash = hashZL + "/" + hashLat + "/" + hashLon + "/";



    var layers = this._map.layers;

    if (layers.length > 0) {

      hash = hash + "&base=std";

      var layersHash = "";
      var dispHash = "1";
      for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        if ( layer.type == "binaryvector" ) continue;
        layersHash += (layersHash != "" ? "|" : "") + layer.id;
        if (layer.opacity < 1)
          layersHash += "," + (Math.floor(layer.opacity * 100) / 100);
        dispHash += (layer.visible ? "1" : "0");
      }

      if ( layersHash != "" ) {
        hash += "&ls=" + encodeURIComponent(layersHash);
        hash+= "&disp=" + dispHash;
      }
      
      var relief = GSIBV.Map.Layer.FreeRelief.DataManager.instance.text;
      if ( relief) {
        hash += "&reliefdata=" + relief;
      }
    }
    result += "#" + hash;

    return result;

  }

  // 新しいデータ作成
  _onNewData(e){
    if ( this._newDataDialog ) {
      this._newDataDialog.destroy();
      this._openDataDialog = null;
    }
    this._newDataDialog = new GSIBV.UI.Dialog.NewDataDialog();
    this._newDataDialog.on("buttonclick", MA.bind(function(e){
      
      try {
        //var data =new GSIBV.VectorTileData( );
        //data.title = e.params.title;

        var layer = new GSIBV.Map.Layer.BinaryVectorTile({
          "id": MA.getId("gsi-userfile-"),
          "title": e.params.title,
          "user" : true,
          "url" : e.params.template.url
        });

        //layer.data = data;

        this._map.addLayer(layer);

      } catch(e) {
        console.log(e);
        this.alert("ファイルが読み込めません。<br>データの形式、文字コードをご確認下さい。");
      }
    },this));
    this._newDataDialog.show();

  }

  // データをファイルから開く
  _onOpenData(e){
    if ( this._openDataDialog ) {
      this._openDataDialog.destroy();
      this._openDataDialog = null;
    }
    this._openDataDialog = new GSIBV.UI.Dialog.OpenDataDialog();
    this._openDataDialog.on("buttonclick", MA.bind(function(e){
      
      try {
        var json = JSON.parse( e.params.text );
        var data =new GSIBV.VectorTileData(json );
        data.fileName = e.params.fileName;
        
        var layer = new GSIBV.Map.Layer.BinaryVectorTile({
          "id": MA.getId("gsi-userfile-"),
          "title": data.title,
          "user" : true,
          "maxNativeZoom" : data.maxNativeZoom
        });
        layer.data = data;
        this._map.addLayer(layer);

      } catch(e) {
        console.log(e);
        this.alert("ファイルが読み込めません。<br>データの形式、文字コードをご確認下さい。");
      }
    },this));
    this._openDataDialog.show();

  }

  // 地理院地図データ読み込み時
  _onLayersJSONLoaded(e) {
    this._layersJSONTreeData = e.params.root;
    if (this._selectLayerPopup) {
      if (!this._selectLayerPopup.tree)
        this._selectLayerPopup.initialize(this._layersJSONTreeData);
    }
    //this._hashManager.initialParams

  }


  // 地理院地図データ一覧表示
  _onShowSelectLayerPopup() {
    if ( this._layerTreeDialog.isVisible ) {
      this._layerTreeDialog.hide();
      return;
    }
    
    
    if ( GSIBV.CONFIG.MOBILE ) this._leftPanel.hide();//close();

    this._layerTreeDialog.show();
    this._layersJSON.load();
  }

  // おすすめ状態変更
  _onRecommendChange(e) {

    if (e.params.visible)
      this._map.addLayer(e.params.layerInfo.layer);
    else
      this._map.removeLayer(e.params.layerInfo.layer);

  }

  // 地理院地図データ一覧から選択された時
  _onGSIMAPLayerSelect(e) {
    if ( this._map.layerList.find(e.params.layerInfo.layer)) {
      this._map.removeLayer(e.params.layerInfo.layer);
    } else {
      this._map.addLayer(e.params.layerInfo.layer);
    }
  }

  // 範囲を選択された時
  _onGSIMAPLayerArea(e) {
    this._map.flyTo(e.params.area, e.params.area.zoom);
  }
  // レイヤー削除要求
  _onRequestLayerRemove(e) {
    this._map.removeLayer(e.params.layer);

  }

}



GSIBV.HashManager = class extends MA.Class.Base {


  constructor(app,defaultLayers, defaultView) {
    super();
    this._app = app;
    this._currentHash = window.location.hash;
    this._initialParams = this._parse(this._currentHash);
    if (!this._initialParams) {
      if (!defaultLayers) defaultLayers = [];
      if (!defaultView) defaultView = {};
      this._initialParams = {
        "ls": JSON.parse(JSON.stringify(defaultLayers)),
        "d": {}
      };

      if (defaultView["leftPanel"]) {
        this._initialParams["d"]["l"] = true;
      }
    }
  }

  get initialParams() {
    return this._initialParams;
  }

  initialize(map, leftPanel) {

    this._map = map;
    this._leftPanel = leftPanel;

    MA.DOM.on(window, "hashchange", MA.bind(this._onHashChabge, this));
    this._map.on("moveend", MA.bind(function (e) {
      this._refresh();
    }, this));
    this._map.on("layerchange", MA.bind(function (e) {
      this._refresh();
    }, this));

    this._app.on("langchange", MA.bind(function (e) {
      this._refresh();
    }, this));

    this._leftPanel.on("show", MA.bind(function () {
      this._refresh();
    }, this));

    this._leftPanel.on("hide", MA.bind(function () {
      this._refresh();

    }, this));

    GSIBV.Map.Layer.FreeRelief.DataManager.instance.on("change", MA.bind(function () {
      this._refresh();

    }, this));
    
  }

  _onHashChabge() {
    if (window.location.hash != this._currentHash) {

      this._parse(window.location.hash);
      this._currentHash = window.location.hash;
      this.fire("change");
    }
  }

  getPosition(floor) {
    var center = this._map.center;
    var zoom = this._map.zoom;
    if ( floor ) {
      return Math.floor(zoom)
        + "/" +
        (Math.round(center.lat * 1000000) / 1000000)
        + "/" +
        (Math.round(center.lng * 1000000) / 1000000)
        + "/";
    } else {
      return (Math.round((zoom) * 1000) / 1000)
        //Math.floor( zoom + 1 )
        + "/" +
        (Math.round(center.lat * 1000000) / 1000000)
        + "/" +
        (Math.round(center.lng * 1000000) / 1000000)
        + "/";
    }
  }

  makeHash(withoutLeftPanel, forceLeftPanel) {
    var hash = "#" + this.getPosition();

    if ( this._app.lang != "ja") {
      hash += "&lang=" + this._app.lang;

    } 
    var layers = this._map.layers;

    if (layers.length > 0) {

      var layersHash = "";
      var dispHash = "";
      for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        if ( layer.isUserFileLayer ) continue;
        layersHash += (layersHash != "" ? "|" : "") + layer.id;
        if (layer.opacity < 1)
          layersHash += "," + (Math.floor(layer.opacity * 100) / 100);
        dispHash += (layer.visible ? "1" : "0");
      }

      hash += "&ls=" + encodeURIComponent(layersHash);
      hash += "&disp=" + dispHash;

    }


    if ( forceLeftPanel || ( !withoutLeftPanel && this._leftPanel.visible ) ) {
      hash += "&";
      hash += "d=l";
    }

    var relief = GSIBV.Map.Layer.FreeRelief.DataManager.instance.text;
    if ( relief) {
      hash += "&reliefdata=" + relief;
    }

    return hash;
  }

  _refresh() {
    /*
    var center = this._map.center;
    var zoom = this._map.zoom;

    this._currentHash = "#" + this.getPosition();

    if ( this._app.lang != "ja") {
      this._currentHash += "&lang=" + this._app.lang;

    } 
    var layers = this._map.layers;

    if (layers.length > 0) {

      var layersHash = "";
      var dispHash = "";
      for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        if ( layer.isUserFileLayer ) continue;
        layersHash += (layersHash != "" ? "|" : "") + layer.id;
        if (layer.opacity < 1)
          layersHash += "," + (Math.floor(layer.opacity * 100) / 100);
        dispHash += (layer.visible ? "1" : "0");
      }

      this._currentHash += "&ls=" + encodeURIComponent(layersHash);
      this._currentHash += "&disp=" + dispHash;

    }


    if (this._leftPanel.visible) {
      this._currentHash += "&";

      this._currentHash += "d=l";


    }
    */
   this._currentHash = this.makeHash();

    window.location.replace(this._currentHash);
  }

  _parse(hash) {
    var pattern = /^#([+,-]?([1-9]\d*|0)(\.\d+)?)\/([+,-]?([1-9]\d*|0)(\.\d+)?)\/([+,-]?([1-9]\d*|0)(\.\d+)?)/;

    var result = hash.match(pattern);

    var params = null;
    if (result) {
      params = {
        zoom: parseFloat(result[1]),
        center: [parseFloat(result[7]), parseFloat(result[4])]
      };
    }

    
    if ( GSIBV.CONFIG.LANG) {
      pattern = /lang\=([^&]+)/;
      result = hash.match(pattern);
      if (result) {

        if (!params) params = {};

        var lang = result[1];
        if ( GSIBV.CONFIG.LANG[lang.toUpperCase()])
          params["lang"] = result[1];


      }
    }


    pattern = /ls\=([^&]+)/;
    result = hash.match(pattern);

    if (result) {

      if (!params) params = {};

      params["ls"] = decodeURIComponent(result[1]).split("|");
      for (var i = 0; i < params["ls"].length; i++) {
        var parts = params["ls"][i].split(",");
        params["ls"][i] = {
          "id": parts[0],
          "opacity": 1
        }
        if (parts.length >= 2) {
          params["ls"][i].opacity = parseFloat(parts[1]);
        }
      }
    }


    pattern = /d\=([^&]+)/;
    result = hash.match(pattern);
    if (result) {

      params["d"] = {};

      if (result[1].indexOf("l") >= 0) {
        params["d"]["l"] = true;

      }
    }



    pattern = /disp\=([^&]+)/;
    result = hash.match(pattern);
    if (result) {
      params["disp"] = result[1].split("");
      for (var i = 0; i < params["disp"].length; i++) {
        params["disp"][i] = (params["disp"][i] == "0" ? false : true);
      }
    }

    pattern = /reliefdata\=([^&]+)/;
    result = hash.match(pattern);
    if (result) {
      params["reliefdata"] = GSIBV.Map.Layer.FreeRelief.decodeElevationDataText(result[1])
      
    }
    
    


    if (params) this.fire("change", params);

    return params;
  }


}

/***************************************
    GSIBV.Application
    バイナリベクトルタイルアプリケーション
***************************************/
GSIBV.Application.TooltipManager = class extends MA.Class.Base {

  constructor(app) {
    super();
    this._application = app;
  }

  add(elem, message) {
    if ( !this._elements) {
      this._elements = [];
    }

    var info = this.getByElem( elem );
    if ( info ) {
      info.message = message;
      return;
    }

    info = this._createInfo( elem, message );
    this._elements.push( info );
  }

  getByElem( elem) {
    if ( !this._elements ) return null;

    for( var i=0; i<this._elements.length; i++ ) {
      var info = this._elements[i];
      if ( info.elem == elem ) {
        return info;
      }
    }

    return null;
  }

  _createInfo( elem, message) {
    if (!this._mouseOverHandler) {
      this._mouseOverHandler = MA.bind( this._onMouseOver, this );
    }
    if (!this._mouseOutHandler) {
      this._mouseOutHandler = MA.bind( this._onMouseOut, this );
    }

    MA.DOM.on( elem, "mouseenter", this._mouseOverHandler);
    MA.DOM.on( elem, "mouseleave", this._mouseOutHandler);

    var info = {
      elem : elem,
      message : message,
    };

    elem._tooltipMessage = message;
    return info;
  }

  _onMouseOver(evt) {
    if (!evt.target._tooltipMessage) return;
    var message = evt.target._tooltipMessage;


    this._showTooltip(evt.target, message);
  }

  _onMouseOut(evt) {
    this._hideTooltip();
  }

  _showTooltip(elem, message) {
    this._createTooltip();
    var pos = MA.DOM.offset(elem);
    var size = MA.DOM.size(elem);

    this._container.innerHTML = message;
    var visible = ( this._container.style.display == "none");
    
    this._container.style.visibility = "hidden";
    this._container.style.display = "block";
  

    var tipSize = MA.DOM.size(this._container);
    this._container.style.visibility = "visible";
    this._container.style.display = "none";

    pos.top += size.height+ 4;
    pos.left = pos.left + (size.width /2 ) - (tipSize.width/2);

    if ( pos.left< 0 ) pos.left = 0;

    this._container.style.left = pos.left + "px";
    this._container.style.top = pos.top + "px";

    MA.DOM.fadeIn( this._container,300);
  }

  _hideTooltip() {
    if ( !this._container ) return;
    MA.DOM.fadeOut( this._container,100);
  }

  _createTooltip() {
    if ( this._container) return;
    this._container = MA.DOM.create("div");
    MA.DOM.addClass( this._container, "-gsibv-tooltip");
    this._container.style.display = "none";

    document.body.appendChild( this._container );

  }
};

GSIBV.application = new GSIBV.Application();


