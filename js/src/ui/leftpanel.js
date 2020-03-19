
/***************************************
    GSIBV.UI.LeftPanel
    画面左パネル管理
***************************************/
GSIBV.UI.LeftPanel = class extends GSIBV.UI.Base {


  constructor(options) {
    super(options);
    this._options = options;

  }

  get recommendSelector() { return this._recommendSelector; }
  get displayLayerListView() { return this._displayLayerListView; }
  set contextMenu(contextMenu) { 
    this._contextMenu = contextMenu; 
    if ( this._displayLayerListView  )
      this._displayLayerListView .contextMenu = contextMenu;
  }

  _onLangChange(e) {
    var lang = GSIBV.application.lang;
    var panelLang = GSIBV.CONFIG.LANG[lang.toUpperCase()].UI.LEFTPANEL;

    for( var key in panelLang) {
      var elem = MA.DOM.find( this._container, key );
      if ( elem.length <= 0 ) continue;
      elem[0].innerHTML = panelLang[key];
    }
  }

  initialize(data, visible) {
    GSIBV.application.on("langchange", MA.bind( this._onLangChange, this ) );
    if (typeof this._options.container == "string") {
      this._container = MA.DOM.select(this._options.container)[0];
    } else {
      this._container = this._options.container;
    }
    this._onLangChange();


    // おすすめ選択
    this._recommendSelector = new GSIBV.UI.RecommendSelector({
      container: this._options.recommendContainer,
      data: data.recommendData
    });
    this._recommendSelector.on("change", MA.bind(this._onRecommendChange, this));

    // 表示中リスト表示切替 2020/03/03廃止
    this._showDisplayLayerListButton = MA.DOM.find( this._container, ".detail-button" )[0];
    MA.DOM.on(this._showDisplayLayerListButton,"click", MA.bind(this._onShowDisplayLayerListButtonClick, this));
    this._showDisplayLayerListButton.style.display = "none";

    // 表示中リスト
    this._displayLayerListView = new GSIBV.UI.DisplayLayerListView({
      container: this._options.displayListContainer,
      owner : this,
      contextMenu : this._contextMenu
    });
    this._displayLayerListView.on("layerremove", MA.bind(this._onRequestLayerRemove, this));

    // 新規データ 2020/03/03廃止
    //this._newDataButton = MA.DOM.find(this._container, "button.new-data-button")[0];
    //MA.DOM.on(this._newDataButton, "click", MA.bind(this._onNewDataButtonClick, this));

    // ファイルを開く 2020/03/03廃止
    //this._openDataButton = MA.DOM.find(this._container, "button.open-data-button")[0];
    //MA.DOM.on(this._openDataButton, "click", MA.bind(this._onOpenDataButtonClick, this));

    // デザインを追加
    this._addStyleButton = MA.DOM.find(this._container, "button.style-add-button")[0];
    MA.DOM.on(this._addStyleButton, "click", MA.bind(this._onAddStyleButtonClick, this));

    
    // レイヤー選択
    this._selectLayerButton = MA.DOM.find(this._container, "button.select-layer-button")[0];
    MA.DOM.on(this._selectLayerButton, "click", MA.bind(this._onSelectLayerButtonClick, this));

    // 開閉
    this._toggleButton = MA.DOM.find(this._container, ".toggle-button")[0];
    MA.DOM.on(this._toggleButton, "click", MA.bind(this._onToggleButtonClick, this));


    
    if ( GSIBV.CONFIG.MOBILE ) {
      try {
        this._listScrollBar = new PerfectScrollbar(MA.DOM.find(this._container, ".scroll")[0]);
      } catch (e) { }
    }
    if (visible) this.show();
  }

  show() {

    MA.DOM.addClass(this._container, "-ma-expand");
    this._container.style.transition = 'margin-left 300ms';
    this._container.style.marginLeft = '0px';
    MA.DOM.addClass(this._container, "-ma-expand");
    if (this._contextMenu) {
      this._contextMenu.left = 240;
    }
    this.fire("show");
  }

  hide(noEffect) {
    var size = MA.DOM.size(this._container);

    this._container.style.transition = 'margin-left 300ms';
    
    this._container.style.marginLeft = '-' + size.width + 'px';
    var elem = this._container;
    var handler = function (e) {
      MA.DOM.removeClass(elem, "-ma-expand");
      elem.removeEventListener('transitionend', handler);
    };
    this._container.addEventListener('transitionend', handler);

    MA.DOM.removeClass(this._container, "-ma-expand");


    if (this._contextMenu) {
      this._contextMenu.left = 0;
    }

    this.fire("hide");

  }

  set visible (value) {
    if ( value) {
      this.show();
    } else {
      this.hide(true);
    }
  }

  get visible() { return (MA.DOM.hasClass(this._container, "-ma-expand") ? true : false); }


  _onToggleButtonClick() {
    if (MA.DOM.hasClass(this._container, "-ma-expand")) {
      this.hide();
    } else {
      this.show();
    }
  }

  _onShowDisplayLayerListButtonClick() {
    if (MA.DOM.hasClass(this._showDisplayLayerListButton, "-ma-expand")) {
      this._displayLayerListView.hide();
      MA.DOM.removeClass( this._showDisplayLayerListButton, "-ma-expand" );

    } else {
      
      this._displayLayerListView.show();
      MA.DOM.addClass( this._showDisplayLayerListButton, "-ma-expand" );
    
    }
  }
  _onNewDataButtonClick() {
    this.fire("newdata");
  }
  _onOpenDataButtonClick() {
    this.fire("opendata");
  }

  _onSelectLayerButtonClick() {
    this.fire("showselectlayer");
  }

  _onAddStyleButtonClick() {

    if ( this._popupMenu ) {
      if ( this._popupMenu.isVisible ) {
        this._popupMenu.hide();
        return;
      }
      this._popupMenu.destroy();
    }

    this._popupMenu = new GSIBV.UI.Popup.Menu ();
    this._popupMenu.on("select",MA.bind(function(e){
      switch(e.params.item.id){
        case "new":
          this.fire("newdata");
          break;
        case "open":
          this.fire("opendata");
          break;
      }
    }, this ) );

    
    this._popupMenu.items = [
      {
        "id":"new", "title":"新しい地図デザインを作成",
        "class" : "-gsibv-popupmenu-newfile"
      }, 
      {
        "id":"open", "title":"地図デザインファイルを開く",
        "class" : "-gsibv-popupmenu-openfile"
      }
    ];

    this._popupMenu.show(this._addStyleButton,"right");

  }
  _onRecommendChange(e) {
    this.fire("recommendchange", e.params)
  }

  _onRequestLayerRemove(e) {
    this.fire("requestlayerremove", e.params);
  }
}


