
GSIBV.UI.Dialog.LayerInfoWindow = class extends GSIBV.UI.Base {


  constructor(options) {
    super(options);
    this._options = options;
  }

  show(item, position) {
    this._create();
    this.clear();
    this.hide();
    this._item = item;
    this._initMouseDownHandler();

    this._container.style.left = "0px";
    this._container.style.top = "0px";
    this._container.style.width = "auto";

    
    var html = '';
    if (this._item.html) {
      html = this._item.html;
    }
    if (this._item.legendUrl) {
      html += '<div><a target="_blank" href="' + this._item.legendUrl + '">凡例を表示</a></div>';
    }

    if (html == '') return;


    this._content.innerHTML = html;

    if ( item.id=="relief_free")
      this._content.appendChild(GSIBV.Map.Layer.FreeRelief.DataManager.instance.getImage(true));
    
    this._container.style.visibility = 'hidden';
    this._container.style.display = 'block';
    var size = MA.DOM.size(this._container);

    var windowSize = MA.DOM.size(this._container.parentNode);
    
    if ( position.left + size.width > windowSize.width) {
      position.left = windowSize.width -size.width;
    }

    if ( position.top + size.height > windowSize.height) {
      position.top = windowSize.height -size.height;
    }

    this._container.style.width = size.width + "px";
    this._container.style.display = 'none';
    this._container.style.visibility = 'visible';

    this._container.style.left = position.left + "px";
    this._container.style.top = position.top + "px";
    this._container.style.display = 'block';
    MA.DOM.fadeIn(this._container, 300);
    
  }

  _create() {
    if ( this._container)return;
    this._container = MA.DOM.create("div");
    MA.DOM.addClass( this._container, "-gsibv-layerinfowindow" );
    this._content = MA.DOM.create("div");
    MA.DOM.addClass( this._content, "-gsibv-layerinfowindow-content" );
    this._container.appendChild( this._content);

    document.body.appendChild( this._container);
  }

  clear() {
    if ( !this._container ) return;
    this._content.innerHTML = "";
  }
  
  _onBodyMouseDown(e) {
    if (e.type != "ps-scroll-y") {
      var target = e.target;

      while (target) {
        if (target == this._container) {
          return;
        }
        target = target.parentNode;
      }
    }
    this.hide();
  }
  _initMouseDownHandler() {
    if (!this._bodyMouseDownHandler) {
      this._bodyMouseDownHandler =  MA.bind( this._onBodyMouseDown, this );
      MA.DOM.on(document.body, "mousedown", this._bodyMouseDownHandler);
    }
  }


  _destroyMouseDownHandler() {
    if (this._bodyMouseDownHandler) {
      MA.DOM.off(document.body, "mousedown", this._bodyMouseDownHandler);
      this._bodyMouseDownHandler =  null;
    }
  }

  hide() {
    this._destroyMouseDownHandler();
    if ( !this._container ) return;
    //this._container.style.display = 'none';
    MA.DOM.fadeOut(this._container, 300);
  }

};