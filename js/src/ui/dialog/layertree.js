GSIBV.UI.Dialog.LayerTree = class extends GSIBV.UI.Dialog.Modeless {

  constructor(options) {
    super(options);
    this._position = {left:242,top:266};
    this._resizable = true;
    this._current = null;
  }

  set layersJSON( layersJSON) {
    this._layersJSON = layersJSON;
    this._current = this._layersJSON.root;

    if ( !this._layerJSONChangeHanler ) {
      this._layerJSONChangeHanler = MA.bind( this._onLayersJSONChange, this );
    }

    this._layersJSON.root.on("change", this._layerJSONChangeHanler );
  }

  set current( current ) {

    if ( current && current.title == "指定緊急避難場所") {
      if ( !GSIBV.application.showEvacConfirm( MA.bind( function(current){
        this.current = current;
      },this, current))) {
        return;
      }
    }

    this._current = current;
    if ( this._current == undefined) this._current = this._layersJSON.root;
    this._current .off("change", this._layerJSONChangeHanler );
    this._current .on("change", this._layerJSONChangeHanler );

    this._current.load();
    this._refresh();

  }
  _onLayersJSONChange(e) {
 
    if ( e.from == this._current) {
      this._refresh();
    }
  }

  show() {
    this._adjustContents();
    super.show();
  }
  
  _resize() {
    this._adjustContents();
    this._updateScroll();
  }

  _adjustContents() {
    if (!this._frame ) return;
    var visible = !(this._frame.style.display == 'none' );

    if ( !visible ) {
      this._frame.style.visibility = 'hidden';
      this._frame.style.display = '';
    }

    var size = MA.DOM.size(this._pankuzuFrame);
    this._contents.style.top = ( size.height +3 )+"px";

    if ( !visible ) {
      this._frame.style.display = 'none';
      this._frame.style.visibility = 'visible';
    }
  }

  _create() {
    super._create();
    if ( this._pankuzuFrame ) return;

    var windowSize = MA.DOM.size( this._parentElement );

    if ( this._position.top + this._size.height > windowSize.height) {
      this._position.top = windowSize.height - this._size.height;
    }
    
    if ( this._position.left + this._size.width > windowSize.width) {
      this._position.left = windowSize.width - this._size.width;
    }

    this._frame.style.left = this._position.left + "px";
    this._frame.style.top = this._position.top + "px";

    this._pankuzuFrame = MA.DOM.create("div");
    MA.DOM.addClass( this._pankuzuFrame, "pankuzu");
    this._contentsFrame.appendChild( this._pankuzuFrame );


    try {
      this._listScrollBar = new PerfectScrollbar(this._contents);
    } catch (e) { }

    this._listContainer = MA.DOM.create("ul");

    this._contents.appendChild( this._listContainer );

    MA.DOM.addClass( this._frame, "layertree");
    
    this._refresh();
  }

  _updateScroll() {
    if ( !this._listScrollBar ) return;
    
    setTimeout( MA.bind(function(){
      this._listScrollBar.update();
    }, this),10);
    
  }
  
  _refreshPankuzu() {
    if( !this._pankuzuFrame) return;
    this._pankuzuFrame.innerHTML = '';

    var elem = MA.DOM.create("span");
    MA.DOM.addClass( elem, "current-dir" );
    elem.innerHTML = (this._layersJSON.root== this._current  ? 'TOP': this._current.title );
    this._pankuzuFrame.appendChild(elem);
    
    var prev = elem;
    var target = this._current.parent;
    while( target) {
      elem = MA.DOM.create("span");
      MA.DOM.addClass( elem, "sep" );
      elem.innerHTML = '&nbsp;&nbsp;&nbsp;&nbsp;';
      this._pankuzuFrame.insertBefore(elem,prev);
      prev = elem;

      elem = MA.DOM.create("a");
      elem.setAttribute("href","javascript:void(0);")
      elem.innerHTML = (this._layersJSON.root== target ? 'TOP': target.title );
      MA.DOM.on(elem,"click", MA.bind(function(item){
        this.current = item;
      },this, target));
      this._pankuzuFrame.insertBefore(elem,prev);
      prev = elem;
      target = target.parent;
    }

    this._adjustContents();
  }
  
  _refresh() {
    if ( !this._listContainer) return;
    this._refreshPankuzu();
    this._listContainer.innerHTML = '';
    if ( this._current == undefined) return;

    for( var i=0; i<this._current.length; i++ ) {
      var li = MA.DOM.create("li");

      var item = this._current.get(i);
      if ( item.title == undefined ) {
        li.innerHTML =  "loading...";
        MA.DOM.addClass(li,"wait");
      } else {
        var a = MA.DOM.create("a");
        a.setAttribute("href","javascript:void(0);");
        a.innerHTML =  item.title;
        MA.DOM.addClass( li, ( item instanceof GSIBV.LayersJSON.Directory ? "directory" : "layer") );
        
        if ( item.iconUrl ) {
          li.style.backgroundImage = "url(" +item.iconUrl + ')';
        }

        var buttonCount = 0;
        if ( item.html ) {
          var infoButton = MA.DOM.create("a");
          infoButton.setAttribute("href","javascript:void(0);");
          //areaButton.setAttribute("title","javascript:void(0);");
          infoButton.innerHTML = "i";
          MA.DOM.addClass(infoButton,"info");
          li.appendChild(infoButton);
          buttonCount++;
          infoButton.style.right ="4px";

          MA.DOM.on( infoButton, "click", MA.bind( this._onInfoButtonClick, this, li, item ));
        }
        if ( item.area ) {

          var areaButton = MA.DOM.create("a");
          areaButton.setAttribute("href","javascript:void(0);");
          //areaButton.setAttribute("title","javascript:void(0);");
          areaButton.innerHTML = "";
          MA.DOM.addClass(areaButton,"area");
          areaButton.style.right =( buttonCount == 0 ? "4px" : "26px" );
          li.appendChild(areaButton);
          buttonCount++;

          MA.DOM.on( areaButton, "click", MA.bind( this._onAreaButtonClick, this, item ));
        }

        if ( buttonCount == 1) {
          MA.DOM.addClass(li,"hasinfo");
        } else if ( buttonCount == 2) {
          MA.DOM.addClass(li,"hasarea");
        }

        MA.DOM.on( a, "click", MA.bind( this._onItemClick, this, item ));
        li.appendChild( a );
        MA.DOM.removeClass(li,"wait");

      }
      this._listContainer.appendChild(li);

    }
    this._updateScroll();

    this._updateHint();
  }
  
  _updateHint() {

    try {
      for( var key in GSIBV.CONFIG.LANG.JA.UI.LAYERTREE_HINT ) {
        var value = GSIBV.CONFIG.LANG.JA.UI.LAYERTREE_HINT[key];
        
        var list = MA.DOM.find(this._listContainer,key);
        for( var i=0; i<list.length; i++ ) {
          list[i].setAttribute( "title", value );
        }
      }
    } catch(ex) {

    }
  }

  _createHeader(headerContainer) {
    this._titleContainer = MA.DOM.create("div");
    this._titleContainer.innerHTML = '地図や写真を追加';
    headerContainer.appendChild(this._titleContainer);
    super._createHeader(headerContainer);

  }

  _onItemClick( item ) {
    if ( item instanceof GSIBV.LayersJSON.Directory ) {
      // directory
      this.current = item;

    } else {
      // layer
      this.fire("select", { "layerInfo": item });
    }
  }

  _onInfoButtonClick( li, item) {

    this._showInfo(li,item);
  }
  _onAreaButtonClick( item) {
    this.fire("area", { "area": item.area });
  }

  _showInfo(li,item) {
    if ( !this._infoWindow ) {
      this._infoWindow = new GSIBV.UI.Dialog.LayerInfoWindow();
    }
    var pos = MA.DOM.offset(li);
    var size = MA.DOM.size(li);
    pos.left += size.width;
    this._infoWindow.show( item, pos );
  }
  
};

