GSIBV.UI.Dialog.Help = class extends GSIBV.UI.Dialog.Modeless {

  constructor(options) {
    super(options);
    this._file = options.contents;
    this._refreshLang();

    this._loadContents();
    this._pageNo = 0;
    
    this._langChangeHandler = MA.bind( this._onLangChange, this );
    GSIBV.application.on("langchange", this._langChangeHandler );

  }

  _loadContents() {
    var url = this._file;

    if( GSIBV.application.lang == "en") {
      url = url.replace( /\.html$/i, "-en.html");
    }
    this._req = new MA.HTTPRequest( {
      "url":url,
      "type":"text"
    });
    this._req.on("load", MA.bind(this._onLoad, this ));
    this._req.load();

  }

  _onLoad(e) {
    var html = e.params.response;

    var  parser = new DOMParser();
    var doc = parser.parseFromString(html, "text/html");
    var helpPages =MA.DOM.find(doc.body, ".help-page" );
    this._pageList = [];

    for( var i=0; i<helpPages.length; i++ ) {
      this._pageList.push( helpPages[i]);
    }
    
    this._pageNo = 0;
    this._refresh();

  }

  _onLangChange() {
    this._refreshLang();
    this._loadContents();
  }

  _refreshLang() {

    
    try {
      this._lang = GSIBV.CONFIG.LANG[GSIBV.application.lang.toUpperCase()].UI.HELP;
      
    } catch(e) {return;}    

    
    if ( this._titleContainer )
      this._titleContainer.innerHTML = this._lang.title;
    if ( this._prevPageButton )
      this._prevPageButton.innerHTML = this._lang.prev;
    if ( this._nextPageButton )
      this._nextPageButton.innerHTML = this._lang.next;

  }

  show() {
    super.show();
  }
  
  _resize() {
    this._updateScroll();
  }
  _create() {
    super._create();
    
    if ( this._prevPageButton) return;
    try {
      this._listScrollBar = new PerfectScrollbar(this._contents);
    } catch (e) { }

    MA.DOM.addClass( this._frame, "help");
    
    this._prevPageButton = MA.DOM.create("button");
    MA.DOM.addClass( this._prevPageButton, "button");
    MA.DOM.addClass( this._prevPageButton, "prev-button");
    this._nextPageButton = MA.DOM.create("button");
    MA.DOM.addClass( this._nextPageButton, "button");
    MA.DOM.addClass( this._nextPageButton, "next-button");
    
    this._prevPageButton.innerHTML = this._lang.prev;
    this._nextPageButton.innerHTML = this._lang.next;

    MA.DOM.on( this._prevPageButton,"click", MA.bind( this._onPrevPageClick,this ) );
    MA.DOM.on( this._nextPageButton,"click", MA.bind( this._onNextPageClick,this ) );

    this._contentsFrame.appendChild( this._prevPageButton);
    this._contentsFrame.appendChild( this._nextPageButton);
    this._refresh();
  }

  _createHeader(headerContainer) {
    this._titleContainer = MA.DOM.create("div");
    this._titleContainer.innerHTML = this._lang.title;
    headerContainer.appendChild(this._titleContainer);
    super._createHeader(headerContainer);

  }
  _createContents(contentsContainer) {

    this._pageFrame = MA.DOM.create("div");
    MA.DOM.addClass(this._pageFrame,"page-frame");
    this._pageFrame.style.padding = "10px";
    contentsContainer.appendChild(this._pageFrame);
    
  }
  _onPrevPageClick() {
    this.pageNo = this._pageNo-1;
  }
  _onNextPageClick() {
    this.pageNo = this._pageNo+1;
  }
  

  set pageNo(pageNo) {
    if ( !this._pageList) return;
    this._pageNo = pageNo;
    if ( this._pageNo < 0 ) this._pageNo = this._pageList.length-1;
    if ( this._pageNo > this._pageList.length-1 ) this._pageNo = 0;
    this._refresh();
  }

  _refresh() {
    if ( !this._frame || !this._pageList) return;

    if ( this._currentPage ) {
      MA.DOM.fadeOut( this._currentPage, 200,MA.bind( function(){
        this._showPage();
      },this) );
    } else {
      this._showPage();
    }

  }

  _showPage() {
    
    var currentPage = this._pageList[this._pageNo].cloneNode(true);

    var anchorList = MA.DOM.find( currentPage, "a" );

    for( var i=0; i<anchorList.length; i++ ) {
      var a =anchorList[i];
      var href = a.getAttribute("href");
      if ( href.indexOf("#") == 0 ) {
        MA.DOM.on( a,"click", MA.bind(this._anchorClick, this,href.slice(1) ));
      }
    }


    this._pageFrame.innerHTML ='';

    this._pageFrame.appendChild( currentPage );
    this._currentPage = currentPage;
    this._currentPage.style.display = 'none';

    this._contents.scrollTop = 0;

    MA.DOM.fadeIn( this._currentPage, 200 );
    this._updateScroll();

  }

  _updateScroll() {
    if ( !this._listScrollBar ) return;
    
    setTimeout( MA.bind(function(){
      this._listScrollBar.update();
    }, this),10);
    
  }

  _anchorClick(id,e) {
    e.preventDefault();
    if ( id == "" ) {
      this.pageNo = 0;
      return;
    }
    for( var i=0; i<this._pageList.length; i++ ) {
      var page = this._pageList[i];

      if ( page.getAttribute("gsi-id") == id ) {
        this.pageNo = i;
        break;
      }


    }
  }
};