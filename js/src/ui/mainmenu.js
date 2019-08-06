GSIBV.UI.MainMenu = class extends MA.Class.Base {

  constructor(app, options) {
    super();

    this._app = app;
    this._options = options;
    
    this._origMenu = JSON.parse( JSON.stringify(this._options.menu) );
    this._menu = JSON.parse( JSON.stringify(this._options.menu) );
    this._onLangChange();
    this._app.on("langchange", MA.bind( this._onLangChange, this ) );
  }

  initialize() {
    this._button = MA.DOM.select(this._options.button)[0];
    MA.DOM.on(this._button, "click", MA.bind(this._onButtonClick, this));

  }

  _onLangChange(e) {
    var lang = this._app.lang;
    this._menu = JSON.parse( JSON.stringify(this._origMenu) );
    
    if ( lang == "ja") return;

    var mainMenu = GSIBV.CONFIG.LANG[lang.toUpperCase()].UI.MAINMENU;

    for( var i=0; i<this._menu.length; i++ ) {
      this._menu[i].title = mainMenu[ this._menu[i].id ];
    }

  }

  _onButtonClick() {
    if (!this._popuMenu) {
      this._popupMenu = new GSIBV.UI.Popup.Menu();
      this._popupMenu.on( "select", MA.bind(this._onMenuItemClick,this));

    }

    this._popupMenu.items = this._menu;
    this._popupMenu.show(this._button);
  }

  _onMenuItemClick(e) {
    switch( e.params.item.id) {
      case "gsimaps":
        var url = this._app.getGSIMapsUrl();
        window.open( url, '_blank' );
        break;
      case "help":
        this._app.showHelp();
        break;
      case "eng":
        this._app.lang = ( this._app.lang == "ja" ? "en" : "ja" );
        break;
      case "centercross":
        this._app._map.centercrosschange();
        break;
    }
  }

};