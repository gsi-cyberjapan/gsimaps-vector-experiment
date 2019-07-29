GSIBV.UI.Select = {};

GSIBV.UI.Select.Select = class extends MA.Class.Base {

  constructor(container, list, value) {
    super();
    this._container = container;
    this._list = list;
    this._initialize();
    this._value =value;
    if ( value != undefined )
      this._select.value = value;
  }

  get value() {
    return this._value;
  }

  _onSelectChange() {
    this._value = this._select.value;
  }
  _initialize() {
    this._container.innerHTML = '';

    this._select = MA.DOM.create("select");

    function makeOption(value, title) {
      var option = document.createElement('option');
      option.value = value;
      option.appendChild(document.createTextNode(title));

      return option;
    }

    for (var i = 0; i < this._list.length; i++) {
      var option = makeOption(this._list[i].value, this._list[i].title);
      this._select.appendChild(option);
    }

    this._container.appendChild(this._select);

    MA.DOM.on(this._select, "change", MA.bind( this._onSelectChange, this));

    this._onLangChange();
    
    if( !this._langChangeHandler ) {
      this._langChangeHandler = MA.bind( this._onLangChange, this );
      GSIBV.application.on("langchange", this._langChangeHandler );
    }
  }
  _onLangChange() {
    try {
      var lang = GSIBV.application.lang;
      
      var optionList = MA.DOM.find( this._select, "option");

      for (var i = 0; i < this._list.length; i++) {
        var option = optionList[i];
        option.innerHTML = ( lang == "ja" ? this._list[i].title : this._list[i].titleEng );
      }

    } catch(e) {console.log(e);}
  }
  destroy() {
    
    if ( this._langChangeHandler ) {
      GSIBV.application.on("langchange", this._langChangeHandler );
      this._langChangeHandler = null;
    }
  }

};




GSIBV.UI.Select.SelectEx = class extends MA.Class.Base {
  
  constructor(container, list, value, popupFrame) {
    super();
    this._container = container;
    this._popupFrame = ( popupFrame ? popupFrame : MA.DOM.select("#main")[0] );
    this._list = list;
    this._initialize();
    this._selectedIndex = undefined;
    this.value = value;
  }

  
  set value(value) {
    var selectedIndex = -1;

    for( var i=0; i<this._list.length; i++ ) {
      if ( this._list[i].value == value ) {
        selectedIndex = i;
        break;
      }
    }

    this.selectedIndex= selectedIndex;
  }
  set selectedIndex(idx ) {

    if ( idx != this._selectedIndex) {
      this._selectedIndex = idx;
      this._refreshView();
      this.fire("change");
    }
  }


  get value() {
    if ( this._selectedIndex < 0 || this._selectedIndex >= this._list.length) {
      return undefined;
    } else {
      var item = this._list[this._selectedIndex];
      return item.value;
    }
  }

  _initialize() {
    this._container.innerHTML = '';
    
    this._selectedViewFrame = MA.DOM.create("div");
    MA.DOM.addClass(this._selectedViewFrame, "-gsibv-ui-selectex");

    this._selectedView = MA.DOM.create("a");

    this._selectedViewFrame.appendChild( this._selectedView );

    this._container.appendChild( this._selectedViewFrame );

    MA.DOM.on( this._selectedView, "click", MA.bind(this._onClick, this ));
    
    this._onLangChange();
    if( !this._langChangeHandler ) {
      this._langChangeHandler = MA.bind( this._onLangChange, this );
      GSIBV.application.on("langchange", this._langChangeHandler );
    }
  }

  _refreshView() {
    var lang = GSIBV.application.lang;

    

    if ( this._selectedIndex  == undefined || this._selectedIndex < 0 || this._selectedIndex >= this._list.length) {
      this._selectedIndex =-1;
      this._selectedView.innerHTML = GSIBV.CONFIG.LANG[lang.toUpperCase()].UI.EDITINPUT["pleaseselect"];
      MA.DOM.addClass( this._selectedView, "no-select");
      return;
    }
    
    var item = this._list[this._selectedIndex];
    MA.DOM.removeClass( this._selectedView, "no-select");
    this._selectedView.innerHTML = "";//this._list[this._selectedIndex].title;

    if ( item.img) {
      var canvas = MA.DOM.create("canvas");
      var ctx = canvas.getContext("2d");
      canvas.width = item.img.width;
      canvas.height = item.img.height;
      ctx.drawImage( item.img, 0, 0 );
      var imageContainer = MA.DOM.create("div");
      MA.DOM.addClass( imageContainer, "image-container" );

      imageContainer.style.backgroundImage = "url(" + canvas.toDataURL("image/png")+ ")";
      this._selectedView.appendChild( imageContainer );
      this._selectedView.style.paddingLeft = "18px";
    } else {
      this._selectedView.style.paddingLeft = "4px";
    }

    if ( lang == "ja") {
      this._selectedView.appendChild( document.createTextNode(item.title));
    } else {
      this._selectedView.appendChild( document.createTextNode(item.titleEng));
    }
  }

  _onLangChange() {
    this._refreshView();
    this._destroyPopup();
  }

  _destroyPopup() {

    if ( this._onBodyMouseDownHandler) {
      MA.DOM.off( document.body, "mousedown", this._onBodyMouseDownHandler) ;
      this._onBodyMouseDownHandler = null;
    }
    if ( this._popupContainer ) {
      this._popupContainer.parentNode.removeChild( this._popupContainer );
      delete this._popupContainer;
    }
  }

  destroy() {
    
    if ( this._langChangeHandler ) {
      GSIBV.application.on("langchange", this._langChangeHandler );
      this._langChangeHandler = null;
    }
    this._destroyPopup();
  }

  _onClick(e) {
    e.preventDefault();
    this.showPopup();

  }

  showPopup() {

    this._createPopup();

    this.rePositionPopup();

    if ( !this._onBodyMouseDownHandler) {
      this._onBodyMouseDownHandler = MA.bind( this._onBodyMouseDown, this );
      MA.DOM.on( document.body, "mousedown", this._onBodyMouseDownHandler) ;
    }
    MA.DOM.fadeIn( this._popupContainer, 300 );
  }

  hidePopup() {

    if ( this._onBodyMouseDownHandler) {
      MA.DOM.off( document.body, "mousedown", this._onBodyMouseDownHandler) ;
      this._onBodyMouseDownHandler = null;
    }
    MA.DOM.fadeOut( this._popupContainer, 300 );
  }

  _onBodyMouseDown(e) {
    var target = e.target;

    while(target) {
      if ( target == this._popupContainer ) return;
      if ( target == this._selectedViewFrame ) return;
      target = target.parentNode;
    }

    this.hidePopup();

  }
  
  rePositionPopup() {
    if( !this._popupContainer ) return;
    var pos = MA.DOM.offset( this._selectedView, this._popupFrame );
    var size = MA.DOM.size( this._selectedView );
    var windowSize = MA.DOM.size(this._popupContainer.parentNode);
    
    var buttonSize= MA.DOM.size( this._selectedView );

    this._popupContainer.style.minWidth = buttonSize.width + "px";
    this._popupContainer.style.left = "auto";
    this._popupContainer.style.right = Math.round( windowSize.width - pos.left - size.width) + "px";

    if ( pos.top + size.height/2 > windowSize.height/ 2 ) {
      // 上に表示
      this._popupContainer.style.top = "auto";
      this._popupContainer.style.bottom =  ( windowSize.height - pos.top + 1 ) + "px";
    } else {
      // 下に表示
      this._popupContainer.style.bottom = "auto";
      this._popupContainer.style.top =  ( pos.top + size.height + 1 ) + "px";
    }
  }


  _createPopup() {
    if ( this._popupContainer ) return;
    
    var lang = GSIBV.application.lang;

    this._popupContainer = MA.DOM.create("div");
    MA.DOM.addClass(this._popupContainer ,"-gsibv-popup-menu");
    MA.DOM.addClass(this._popupContainer ,"-gsibv-ui-selectex-popup");

    var ul = MA.DOM.create("ul");
    for( var i=0; i<this._list.length; i++ ) {
      var item = this._list[i];
      var li = MA.DOM.create("li");
      var a = MA.DOM.create("a");
      var div = MA.DOM.create("div");

      if ( item.img) {
        var canvas = MA.DOM.create("canvas");
        var ctx = canvas.getContext("2d");
        canvas.width = item.img.width;
        canvas.height = item.img.height;
        ctx.drawImage( item.img, 0, 0 );
        var imageContainer = MA.DOM.create("div");
        MA.DOM.addClass( imageContainer, "image-container" );

        imageContainer.style.backgroundImage = "url(" + canvas.toDataURL("image/png")+ ")";
        div.appendChild( imageContainer );
        div.style.paddingLeft = "18px";
      }
      MA.DOM.on( a, "click", MA.bind( this._onPopupItemClick, this, i ));
      if ( lang == "ja") {
        div.appendChild( document.createTextNode( item.title) );
      } else {
        div.appendChild( document.createTextNode( item.titleEng) );
      }
      a.appendChild(div);

      li.appendChild(a);
      ul.appendChild( li );

    }
    this._popupContainer.appendChild( ul);

    this._popupFrame.appendChild( this._popupContainer);
  }

  _onPopupItemClick(idx) {
    this.selectedIndex = idx;
    this.hidePopup();
  }
}
