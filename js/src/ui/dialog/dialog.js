GSIBV.UI.Dialog = {};

GSIBV.UI.Dialog.Base = class extends MA.Class.Base {

  constructor() {
    super();
    this._parentElement = MA.DOM.select("#main")[0];
    this._zIndex = 0;
    this._frameClass = [];
    this._buttons = undefined;

  }

  get align() { return this._align; }
  get zIndex() { return this._zIndex; }
  set zIndex(zIndex) {
    this.setZIndex(zIndex);
  }


  setZIndex(zIndex) {
    this._zIndex = zIndex;
    if (!this._frame) return;
    this._frame.style.zIndex = zIndex;
  }

  show() {
    this._create();
    this.setZIndex(this._zIndex);
    if (this._beforeShow) this._beforeShow();

    this._showFrame(this._frame);
  }

  get size() {

    this._frame.style.visibility = 'hidden';
    this._frame.style.display = '';

    var headerSize = MA.DOM.size(this._header);
    var footerSize = (this._footer ? MA.DOM.size(this._footer) : { width: 0, height: 0 });
    var size = {
      width: MA.DOM.size(this._frame).width,
      height: headerSize.height + footerSize.height,
    };



    this._frame.style.display = 'none';
    this._frame.style.visibility = 'visible';

    return size;
  }
  _getContentsSize() {

    this._frame.style.visibility = 'hidden';
    this._frame.style.display = '';

    var size = MA.DOM.size(this._contents);
    this._frame.style.display = 'none';
    this._frame.style.visibility = 'visible';

    return size;

  }

  get isVisible() {
    if ( !this._frame ) return false;
    return !(this._frame.style.display == 'none');
  }

  _showFrame(frame) {
    if (!frame) return;
    
    this._finished = false;
    MA.DOM.zoomFadeIn(frame, 200);
  }

  hide() {
    this._hideFrame(this._frame);
    this.fire("hide");
  }
  _hideFrame(frame) {
    if (!frame) return;
    this._finished = true;
    MA.DOM.zoomFadeOut(frame, 200);
  }


  destroy() {
    if (this._frame) {
      this._frame.parentNode.removeChild(this._frame);
      this._frame = undefined;
    }
  }
  _createHeader(headerContainer) {

    this._closeButton = MA.DOM.create("button");
    MA.DOM.addClass(this._closeButton, "close-button");

    MA.DOM.on(this._closeButton, "click", MA.bind(this._onCloseClick, this));
    headerContainer.appendChild(this._closeButton);

  }
  _createContents(contentsContainer) { }

  _createFooter() {

    this._footer = MA.DOM.create("div");
    MA.DOM.addClass(this._footer, "footer");
    MA.DOM.addClass(this._frame, "has-footer");
    this._container.appendChild(this._footer);

    for (var i = 0; i < this._buttons.length; i++) {
      var btnInfo = this._buttons[i];
      var btn = MA.DOM.create("button");
      btn.innerHTML = btnInfo.title;
      btnInfo.element = btn;
      this._footer.appendChild(btn);

      MA.DOM.on(btn, "click", MA.bind(this._onButtonClick, this, btnInfo));
    }


  }

  _onButtonClick(btnInfo) {
    if( this._finished ) {
      this.hide();
      return;
    }
    var info = { "id": btnInfo.id, "cancel": false };

    this.fire("buttonclick", info);
    if (!info.cancel) this.hide();
  }
  _create() {
    if (this._frame) return;

    if ( !this._parentElement ) 
      this._parentElement = MA.DOM.select("#main")[0];

    this._frame = MA.DOM.create("div");
    MA.DOM.addClass(this._frame, "-gsibv-dialog");
    if (this._frameClass) {
      for (var i = 0; i < this._frameClass.length; i++)
        MA.DOM.addClass(this._frame, this._frameClass[i]);
    }

    this._container = MA.DOM.create("div");
    MA.DOM.addClass(this._container, "container");
    this._header = MA.DOM.create("div");
    MA.DOM.addClass(this._header, "header");
    this._contentsFrame = MA.DOM.create("div");
    MA.DOM.addClass(this._contentsFrame, "contents-frame");

    this._contents = MA.DOM.create("div");
    MA.DOM.addClass(this._contents, "contents");

    this._createHeader(this._header);
    this._createContents(this._contents);

    this._container.appendChild(this._header);
    this._contentsFrame.appendChild(this._contents);
    this._container.appendChild(this._contentsFrame);
    this._frame.appendChild(this._container);

    if (this._buttons != undefined && this._buttons.length > 0) {
      this._createFooter();
    }



    this._frame.style.display = 'none';
    this._parentElement.appendChild(this._frame);
  }

  _onCloseClick() {
    this.hide();
  }





};

GSIBV.UI.Dialog.Modeless = class extends GSIBV.UI.Dialog.Base {

  constructor(options) {
    super();
    
    this._resizable = ( options ? options.resizable : false );
    this._size = ( options && options.size ? options.size : {width:300, height:300} );
    this._minSize = {width:64, height:64};
    this._position = {left:0,top:0};
    this.position = ( options ? options.position : null );
    this._manager = GSIBV.UI.Dialog.Modeless.Manager.get();
    this._opacity = 1.0;

  }

  set position(position) {
    if ( !position ) return;
    if ( position.left ) this._position.left = position.left;
    if ( position.top ) this._position.top = position.top;
    this.refreshPosition();
  }

  get left() {
    return this._position.left;
  }
  set left(value) {
    if ( !value ) return;
    this._position.left = value;
    this.refreshPosition();
  }

  refreshPosition() {
    
    if ( !this._frame ) return;
    this._frame.style.left = this._position.left + "px";
    this._frame.style.top = this._position.top + "px";
  }

  set opacity(opacity) {
    this._opacity = opacity;
    
    if ( !this._frame ) return;
    this._frame.style.opacity = this._opacity;

    /*
    try {
      var style = window.getComputedStyle(this._frame, null);
      var bgColor = style.getPropertyValue("background-color");
      bgColor = MA.Color.parse( bgColor );
      bgColor.a = this._opacity;
      this._frame.style.backgroundColor = MA.Color.toString(bgColor);
    } catch(ex) {

    }
    */
  }
  _create() {
    
    if ( this._frame ) return;
    super._create();

    
    this.refreshPosition();
    this._frame.style.width = this._size.width + "px";
    this._frame.style.height = this._size.height + "px";

    this._header.style.cursor ='move';
    MA.DOM.on(this._header, "mousedown",
      MA.bind(this._onHandleMouseDown, this, this._header)
    );
    MA.DOM.on(this._header, "touchstart",
      MA.bind(this._onHandleMouseDown, this, this._header)
    );
    MA.DOM.on(this._frame, "mousedown",
      MA.bind(this._onMouseDown, this)
    );
    MA.DOM.on(this._frame, "touchstart",
      MA.bind(this._onMouseDown, this)
    );
    
    MA.DOM.addClass(this._frame, "modeless");

    
    this._frame.style.opacity = this._opacity;

    if (this._resizable) this._createResizeHandle(this._frame);
  }
  
  show() {
    this._manager.add(this);
    super.show();
    this.adjust(null,true);
  }

  _showFrame(frame) {
    if (!frame) return;

    MA.DOM.zoomFadeIn(frame, 200,this._opacity);
  }

  hide() {
    super.hide();
    this._manager.remove(this);
  }

  _hideFrame(frame) {
    if (!frame) return;
    this._finished = true;
    MA.DOM.zoomFadeOut(frame, 200);
  }
  _createResizeHandle(frame) {

    var $this = this;
    var __create = function (id, style) {
      var result = MA.DOM.create("div");
      result.style.zIndex = 3;
      result.style.position = 'absolute';
      result.style.background = '';

      for (var key in style) result.style[key] = style[key];

      frame.appendChild(result);

      MA.DOM.on(result, "mousedown",
        MA.bind($this._onResizeHandleMouseDown, $this, result, id)
      );
      return result;
    };

    var handleSize = "12px";
    var handleHalfSize = "6px";
    var handleMargin = "-6px";

    // 上
    __create("T", {
      left: handleHalfSize,
      top: "0px",
      right: handleHalfSize,
      height: handleSize,
      marginTop: handleMargin,
      cursor: "n-resize"
    });
    // 左
    __create("L", {
      left: "0px",
      top: handleHalfSize,
      bottom: handleHalfSize,
      width: handleSize,
      marginLeft: handleMargin,
      cursor: "w-resize"
    });
    // 右
    __create("R", {
      right: "0px",
      top: handleHalfSize,
      bottom: handleHalfSize,
      width: handleSize,
      marginRight: handleMargin,
      cursor: "e-resize"
    });
    // 下
    __create("B", {
      left: handleHalfSize,
      bottom: "0px",
      right: handleHalfSize,
      height: handleSize,
      marginBottom: handleMargin,
      cursor: "s-resize"
    });
    // 左上
    __create("LT", {
      left: "0px",
      top: "0px",
      width: handleSize,
      height: handleSize,
      marginLeft: handleMargin,
      marginTop: handleMargin,
      cursor: "nw-resize"
    });
    // 右上
    __create("RT", {
      right: "0px",
      top: "0px",
      width: handleSize,
      height: handleSize,
      marginRight: handleMargin,
      marginTop: handleMargin,
      cursor: "ne-resize"
    });
    // 右下
    __create("RB", {
      right: "0px",
      bottom: "0px",
      width: handleSize,
      height: handleSize,
      marginRight: handleMargin,
      marginBottom: handleMargin,
      cursor: "se-resize"
    });
    // 左下
    __create("LB", {
      left: "0px",
      bottom: "0px",
      width: handleSize,
      height: handleSize,
      marginLeft: handleMargin,
      marginBottom: handleMargin,
      cursor: "sw-resize"
    });

  }

  _onMouseDown() {
    this._manager.add( this );
  }

  _onResizeHandleMouseDown( handle, id, e) {

    this._dragState = { "mode": "size" };

    this._dragState.mousePagePosition = {
      left: e.pageX,
      top: e.pageY
    };

    this._resizeHandleMouseMoveHandler = MA.bind(this._onResizeHandleMouseMove, this, handle, id);
    this._resizeHandleMouseUpHandler = MA.bind(this._onResizeHandleMouseUp, this, handle, id);

    MA.DOM.on(document, "mousemove", this._resizeHandleMouseMoveHandler);
    MA.DOM.on(document, "mouseup", this._resizeHandleMouseUpHandler);
    if (e.preventDefault) e.preventDefault();


  }

  _onResizeHandleMouseMove (handle, id, e) {
    if (!this._dragState || this._dragState.mode != "size") {
      MA.DOM.off(document, "mousemove", this._resizeHandleMouseMoveHandler);
      MA.DOM.off(document, "mouseup", this._resizeHandleMouseUpHandler);
      return true;
    }


    var pos = MA.DOM.offset(this._frame, this._manager.frame);
    var pagePos = MA.DOM.offset(this._frame);
    var size = MA.DOM.size(this._frame);

    var newSize = {};

    if (id.indexOf("R") >= 0) {
      newSize.width = e.pageX - pagePos.left;
    }
    if (id.indexOf("B") >= 0) {
      newSize.height = e.pageY - pagePos.top;
    }
    if (id.indexOf("L") >= 0) {
      newSize.width = size.width + (pagePos.left - e.pageX);
      newSize.left = pos.left - (newSize.width - size.width)
    }
    if (id.indexOf("T") >= 0) {
      newSize.height = size.height + (pagePos.top - e.pageY);
      newSize.top = pos.top - (newSize.height - size.height)
      if (newSize.top < 0) {
        delete newSize["height"];
        delete newSize["top"];
      }
    }

    if ( newSize.width < this._minSize.width ) newSize.width = this._minSize.width;
    if ( newSize.height < this._minSize.height ) newSize.height = this._minSize.height;

    if (newSize.left) this._frame.style.left = newSize.left + "px";
    if (newSize.top) this._frame.style.top = newSize.top + "px";
    if (newSize.width) this._frame.style.width = newSize.width + "px";
    if (newSize.height) this._frame.style.height = newSize.height + "px";


    if (e.preventDefault) e.preventDefault();

    if ( newSize.width ) {
      this._width = newSize.width;
    }
    this._resize();
    return false;
  }

  _resize() {

  }

  _onResizeHandleMouseUp (handle, id, e) {

    MA.DOM.off(document, "mousemove", this._resizeHandleMouseMoveHandler);
    MA.DOM.off(document, "mouseup", this._resizeHandleMouseUpHandler);
    this._dragState = null;
  }

  _getCursorOffsetPosition(e) {
    var offset = MA.DOM.offset( this._frame,
      this._manager.frame);
    if ( e.touches && e.touches.length ) {
      return {
        x: e.touches[0].pageX - offset.left,     
        y: e.touches[0].pageY - offset.top
      };
    } else {
      return {
        x: e.pageX - offset.left,     
        y: e.pageY - offset.top
      };
    }
  }
  _getCursorPagePosition(e) {
    return ( e.touches && e.touches.length > 0  ?  {x:e.touches[0].pageX, y:e.touches[0].pageY} : {x:e.pageX, y: e.pageY} )
  }

  _onHandleMouseDown( handle,  e) {
    if( e.target == this._closeButton) {
      return;
    }

    this._manager.add( this );
    this._dragState = { "mode": "drag" };

    this._dragState.clientMousePosition = MA.DOM.offset(
      handle,
      this._frame
    );

    var pos = this._getCursorOffsetPosition( e);
    this._dragState.clientMousePosition.left = parseFloat(pos.x);
    this._dragState.clientMousePosition.top = parseFloat(pos.y);

    pos = this._getCursorPagePosition(e);
    this._dragState.pageMousePosition = {
      left: pos.x,
      top: pos.y
    };

    this._handleMouseMoveHandler = MA.bind(this._onHandleMouseMove, this, handle);
    this._handleMouseUpHandler = MA.bind(this._onHandleMouseUp, this, handle);

    MA.DOM.on(document, "mousemove", this._handleMouseMoveHandler);
    MA.DOM.on(document, "mouseup", this._handleMouseUpHandler);
    MA.DOM.on(document, "touchmove", this._handleMouseMoveHandler);
    MA.DOM.on(document, "touchend", this._handleMouseUpHandler);
    if (e.preventDefault) e.preventDefault();
    return false;

  }

  _onHandleMouseMove(handle, e) {
    if (!this._dragState || this._dragState.mode != "drag") {
      MA.DOM.off(document, "mousemove", this._handleMouseMoveHandler);
      MA.DOM.off(document, "mouseup", this._handleMouseUpHandler);
      MA.DOM.off(document, "touchmove", this._handleMouseMoveHandler);
      MA.DOM.off(document, "touchend", this._handleMouseUpHandler);
      return true;
    }
    var pos = this._getCursorPagePosition(e);
    this._updatePosition(pos.x, pos.y);
    if (!e.touches && e.preventDefault) e.preventDefault();
    return false;

  }

  _onHandleMouseUp(handle, e) {
    
    var pos = this._getCursorPagePosition(e);
    this._updatePosition(pos.x, pos.y);

    MA.DOM.off(document, "mousemove", this._handleMouseMoveHandler);
    MA.DOM.off(document, "mouseup", this._handleMouseUpHandler);
    MA.DOM.off(document, "touchmove", this._handleMouseMoveHandler);
    MA.DOM.off(document, "touchend", this._handleMouseUpHandler);
    this._dragState = null;
  }

  _updatePosition(mousePageX, mousePageY, adjust) {
    var position = MA.DOM.offset(
      this._frame,
      this._manager.frame
    );


    if ( this._dragState &&this._dragState.pageMousePosition ) {
      var left = parseInt(0 //position.left
        + (mousePageX - this._dragState.clientMousePosition.left)
      );

      var top = parseInt(0//position.top
        + (mousePageY - this._dragState.clientMousePosition.top)
      );
      this.setPosition(left, top, adjust);
      this._dragState.pageMousePosition = {
        left: mousePageX,
        top: mousePageY
      };
    }
  }

  adjust(pos, withMove) {

    if (!pos) pos = this.getPosition();

    if ( this._frame.style.display == "none") return pos;
    var frameSize = MA.DOM.size(this._manager.frame);
    var size = MA.DOM.size(this._frame);

    if (pos.left > frameSize.width - 50) pos.left = frameSize.width - 50
    if (pos.left + (size.width - 50) < 0) {
      pos.left = - parseInt(size.width - 50);

    }

    if (pos.top > frameSize.height - 50) pos.top = frameSize.height - 50;
    if (pos.top < 0) pos.top = 0;
    if ( withMove ) {
      this.setPosition(pos.left,pos.top);
    }
    return pos;
  }

  getPosition() {
    return MA.DOM.offset(this._frame, this._manager._frame);
  }

  setPosition(left, top, adjust) {
    if (adjust) {
      var pos = this.adjust({ left: left, top: top });
      left = pos.left;
      top = pos.top;

    }

    this.position = {
      left :left,
      top : top
    };
    //this._frame.style.left = left + 'px';
    //this._frame.style.top = top + 'px';

  }


};


GSIBV.UI.Dialog.Modeless.Manager = class extends MA.Class.Base {
  constructor() {
    super();
    this._dialogs = [];
    this._startZIndex = 10000;
    this._frame = MA.DOM.select("#main")[0];

  }
  get frame() { 
    if (!this._frame) 
      this._frame = MA.DOM.select("#main")[0];
    return this._frame; 
  }
  static get() {
    if (!GSIBV.UI.Dialog.Modeless.Manager._instance) {
      GSIBV.UI.Dialog.Modeless.Manager._instance = new GSIBV.UI.Dialog.Modeless.Manager();
    }

    return GSIBV.UI.Dialog.Modeless.Manager._instance;

  }


  get count() {
    return this._dialogs.length;
  }

  show() {
    for( var i=0; i<this._dialogs.length; i++ ) {
      this._dialogs[i]._frame.style.display = "";
      this._dialogs[i]._frame.style.transform = "scale(1)";
      this._dialogs[i]._frame.style.opacity = 1;
      this._dialogs[i].adjust(null, true);
    }
    this.refresh();
  }

  hide() {
    for( var i=0; i<this._dialogs.length; i++ ) {
      this._dialogs[i]._frame.style.display = "none";
    }
  }

  refresh() {
    var zIndex = this._startZIndex + ( this._dialogs.length * 10);
    var opacity = 0.95;
    for (var i = this._dialogs.length-1; i >=0; i--) {
      this._dialogs[i].zIndex = zIndex;

      this._dialogs[i].opacity = opacity;
      
      opacity-=0.1;
      if ( opacity < 0.3 ) opacity = 0.3;
      zIndex -= 10;
    }
  }

  add(dlg) {
    var idx = this._dialogs.indexOf(dlg);
    if (idx >= 0) {

      this._dialogs.splice(idx, 1);

    }

    this._dialogs.push(dlg);
    this.refresh();

    if ( this._dialogs.length > 0) {
      if ( this._windowResizeHandler ) {
        return;
      }

      this._windowResizeHandler = MA.bind( this._onWindowResize,this);
      MA.DOM.on(window,"resize", this._windowResizeHandler);
    }

  }

  _onWindowResize() {
    var frameSize = MA.DOM.size( this.frame);
    for( var i=0; i<this._dialogs.length; i++ ) {
      var dlg = this._dialogs[i];
      if ( dlg.align == "right" && this._frameSize ) {
        dlg.left += (frameSize.width - this._frameSize.width );
      }
      dlg.adjust(null, true);
    }
    this._frameSize = frameSize;
  }

  remove(dlg) {
    var idx = this._dialogs.indexOf(dlg);
    if (idx < 0) {
      return;
    }
    this._dialogs.splice(idx, 1);
    this.refresh();

    if ( this._dialogs.length <= 0) {
      if ( !this._windowResizeHandler ) {
        return;
      }

      MA.DOM.off(window,"resize", this._windowResizeHandler);
      this._windowResizeHandler = null
    }
  }


};



GSIBV.UI.Dialog.Modal = class extends GSIBV.UI.Dialog.Base {

  constructor() {
    super();

    this._manager = GSIBV.UI.Dialog.Modal.Manager.get();
  }

  destroy() {
    super.destroy();
    if (this._blind) {
      this._blind.parentNode.removeChild(this._blind);
      this._blind = undefined;
    }
  }

  setZIndex(zIndex) {
    this._zIndex = zIndex;
    if (!this._frame) return;
    this._frame.style.zIndex = zIndex + 1;
    if (this._blind) this._blind.style.zIndex = zIndex;
  }

  show() {
    this._manager.add(this);
    this._createBlind();
    
    MA.DOM.fadeIn(this._blind, 200,this._opacity);
    super.show();
  }

  hide() {
    super.hide();
    MA.DOM.fadeOut(this._blind, 200);
    this._manager.remove(this);
  }
  _create() {
    super._create();
    MA.DOM.addClass(this._frame, "modal");
  }
  _createBlind() {

    if (!this._blind) {
      this._blind = MA.DOM.create("div");
      MA.DOM.addClass(this._blind, "-gsibv-dialog-blind");
      this._blind.style.display = 'none';
      this._parentElement.appendChild(this._blind);
    }
  }
};


GSIBV.UI.Dialog.Modal.Manager = class extends MA.Class.Base {
  constructor() {
    super();
    this._dialogs = [];
    this._startZIndex = 20000;
  }

  static get() {
    if (!GSIBV.UI.Dialog.Modal.Manager._instance) {
      GSIBV.UI.Dialog.Modal.Manager._instance = new GSIBV.UI.Dialog.Modal.Manager();
    }

    return GSIBV.UI.Dialog.Modal.Manager._instance;

  }

  refresh() {
    var zIndex = this._startZIndex;
    for (var i = 0; i < this._dialogs.length; i++) {
      this._dialogs[i].zIndex = zIndex;
      zIndex += 10;
    }
  }

  add(dlg) {
    var idx = this._dialogs.indexOf(dlg);
    if (idx >= 0) {

      this._dialogs.splice(idx, 1);

    }

    this._dialogs.push(dlg);
    this.refresh();


  }

  remove(dlg) {
    var idx = this._dialogs.indexOf(dlg);
    if (idx < 0) {
      return;
    }
    this._dialogs.splice(idx, 1);
    this.refresh();

  }


};




GSIBV.UI.Dialog.Alert = class extends GSIBV.UI.Dialog.Modal {


  constructor() {
    super();
    this._dialogs = [];
    this._frameClass = ["alert"];
    this._hideAroundClick = false; 
  }

  set autoDestroy(autoDestroy) {
    this._autoDestroy = autoDestroy;
  }

  show(title, msg, buttons) {
    this._title = title;
    this._msg = msg;
    this._buttons = buttons;
    super.show();

  }
  
  hide() {
    super.hide();
    if ( this._autoDestroy ) {
      setTimeout(MA.bind(function(){
        this.destroy();
      },this),1000);
    }
  }

  
  _createBlind() {
    super._createBlind();
    MA.DOM.on( this._blind, "click", MA.bind(function(){
      if ( this._hideAroundClick) {
        this.hide();
      }
    }, this) );
  }


  _beforeShow() {
    var frameSize = this.size;
    var size = this._getContentsSize();
    var height = (frameSize.height + size.height + 6);
    this._frame.style.height = (frameSize.height + size.height + 6) + "px";
    this._frame.style.marginLeft = -Math.round(frameSize.width / 2) + "px";
    this._frame.style.marginTop = -Math.round(height / 2) + "px";

  }

  _createHeader(headerContainer) {
    super._createHeader(headerContainer);
    this._titleContainer = MA.DOM.create("div");
    this._titleContainer.innerHTML = this._title;
    headerContainer.appendChild(this._titleContainer);
  }

  _createContents(contentsContainer) {
    if (!this._msg) return;

    if (typeof this._msg == "string") {
      this._contents.innerHTML = this._msg;
    } else {
      this._contents.appendChild(this._msg);
    }

  }
};



GSIBV.UI.Dialog.Confirm = class extends GSIBV.UI.Dialog.Alert {

  constructor(){
    super();
    this._frameClass = ["confirm"];
    this._autoDestroy = true;
  }

  show(title, msg) {
    var buttons = [
      {
        id : "ok",
        title : "OK"  
      },
      {
        id : "cancel",
        title : "キャンセル"  
      }
    ];
    super.show(title, msg, buttons);
  }

  _onButtonClick(btnInfo) {

    if ( btnInfo.id == "ok") {
      this.fire("ok");
    } else {
      this.fire("cancel");
    }
    this.hide();
  }

  

};
