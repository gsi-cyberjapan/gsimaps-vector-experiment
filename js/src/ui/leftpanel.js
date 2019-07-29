
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

    // 表示中リスト表示切替
    this._showDisplayLayerListButton = MA.DOM.find( this._container, ".detail-button" )[0];
    MA.DOM.on(this._showDisplayLayerListButton,"click", MA.bind(this._onShowDisplayLayerListButtonClick, this));


    // 表示中リスト
    this._displayLayerListView = new GSIBV.UI.DisplayLayerListView({
      container: this._options.displayListContainer,
      owner : this,
      contextMenu : this._contextMenu
    });
    this._displayLayerListView.on("layerremove", MA.bind(this._onRequestLayerRemove, this));

    // 新規データ
    this._newDataButton = MA.DOM.find(this._container, "button.new-data-button")[0];
    MA.DOM.on(this._newDataButton, "click", MA.bind(this._onNewDataButtonClick, this));

    // ファイルを開く
    this._openDataButton = MA.DOM.find(this._container, "button.open-data-button")[0];
    MA.DOM.on(this._openDataButton, "click", MA.bind(this._onOpenDataButtonClick, this));

    // レイヤー選択
    this._selectLayerButton = MA.DOM.find(this._container, "button.select-layer-button")[0];
    MA.DOM.on(this._selectLayerButton, "click", MA.bind(this._onSelectLayerButtonClick, this));

    // 開閉
    this._toggleButton = MA.DOM.find(this._container, ".toggle-button")[0];
    MA.DOM.on(this._toggleButton, "click", MA.bind(this._onToggleButtonClick, this));


    if (visible) this.show();
  }

  show() {

    MA.DOM.addClass(this._container, "-ma-expand");
    this._container.style.transition = 'margin-left 300ms';
    this._container.style.marginLeft = '0px';
    MA.DOM.addClass(this._container, "-ma-expand");
    if (this._contextMenu) {
      this._contextMenu.left = 300;
    }
    this.fire("show");
  }

  hide() {
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

  _onRecommendChange(e) {
    this.fire("recommendchange", e.params)
  }

  _onRequestLayerRemove(e) {
    this.fire("requestlayerremove", e.params);
  }
}


