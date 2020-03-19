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
    if (!this._popupMenu) {
      this._popupMenu = new GSIBV.UI.Popup.Menu();
      this._popupMenu.parentContainer = this._button;

      this._popupMenu.on( "select", MA.bind(this._onMenuItemClick,this));

    } else if (this._popupMenu.isVisible ) {
      this._popupMenu.hide();
      return;
    }

    for( var i=0; i<this._menu.length; i++ ) {
      if ( this._menu[i].id == "centercross" ) {
        this._menu[i].checked = this._app._map.centerCrossVisible;
      }
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
      case "to-pc":
        var url = this._app.getPCUrl();
        location.href = url;
        break;
      case "to-mobile":
        var url = this._app.getMobileUrl();
        location.href = url;
        break;
      case "print":
        this._app.print();
        break;
      case "draw":
        this._app.startSakuzu();
        break;
    }
  }

};