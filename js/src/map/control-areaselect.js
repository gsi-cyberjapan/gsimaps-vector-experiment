GSIBV.Map.AreaSelector = class extends MA.Class.Base {

  constructor(map, options) {
    super();
    this._map = map;
    this._rotate = false;
    this._visible = true;
    if (options) {
      if (options.visible == false) this._visible = false;
    }

    if (this._visible) this.create();
  }

  set visible(visible) {
    if (this._visible != visible) {
      this._visible = visible;
      if (this._visible) {
        this.create();
      } else {
        this.destroy();
      }

    }
  }

  get left() {
    return this._data.left;
  }

  get top() {
    return this._data.top;
  }
  

  get width() {
    return this._data.width;
  }

  get height() {
    return this._data.height;
  }
  

  get range() {
    return this._data.range;

  }
  
  set width(width) {
    this._data.setSize(width);
    this.refreshContainer();
  }

  set height(height) {
    this._data.setSize(undefined, height);
    this.refreshContainer();
  }
  
  set minLat(lat) {
    const left = this._data.left;
    const top = this._data.top;
    const height = this._data.height;
    const latlng = this._map.unproject({x:left,y:top+height});
    latlng.lat = lat;

    const pos = this._map.project(latlng);
    this._data.setSize(undefined, pos.y - top );

    this.refreshContainer();
  }
  set maxLat(lat) {
    const left = this._data.left;
    const top = this._data.top;
    const height = this._data.height;
    const latlng = this._map.unproject({x:left,y:top});
    latlng.lat = lat;

    const pos = this._map.project(latlng);
    this._data.setPosition(undefined, pos.y)

    this.refreshContainer();
  }
  
  set minLng(lng) {
    const left = this._data.left;
    const top = this._data.top;
    const latlng = this._map.unproject({x:left,y:top});
    latlng.lng = lng;
    const pos = this._map.project(latlng);
    this._data.setPosition(pos.x );

    this.refreshContainer();
  }
  set maxLng(lng) {
    const left = this._data.left;
    const top = this._data.top;
    const width = this._data.width;
    const latlng = this._map.unproject({x:left + width,y:top});
    latlng.lng = lng;

    const pos = this._map.project(latlng);
    this._data.setSize(pos.x - left);

    this.refreshContainer();
  }

  start(mode) {
    this._visible = true;

    if ( !this._data) {
      this._data = new GSIBV.Map.AreaSelector.Data(this._map,mode);
      this._data.on("change", this._onDataChange);
      this._data.on("move", ()=> {this.fire("move");} );
    } else {
      this._data.mode = mode;
    }
    
    this.create();
    this.refreshContainer();
    this.check();
  }

  _onDataChange = () => {
    this.refreshContainer();
    this.check();
  }

  check() {
    // 回転チェック
    this._rotate = false;
    if ( this._map.getBearing() !== 0 || this._map.getPitch() !== 0 ) {
      this._rotate = true;
      if ( this._data.mode === "size") {
        
      } else {
        this.fire("invalid",{rotate:this._rotate,message:"回転中は範囲を固定して画像を保存できません。回転をリセットして下さい。"});
        return;
      }
    }


    // 値チェック
    if( this._data.width < 256 || this._data.height < 256 ) {
      this.fire("invalid",{rotate:this._rotate,message:"大きさを256×256以上の範囲で指定して下さい。"});
      return;
    }


    const mapContainer = this._map.getContainer();

    const containerRect = mapContainer.getBoundingClientRect();

    if ( this._data.left < 0 || this._data.top < 0 ||
      containerRect.width < this._data.left + this._data.width || 
      containerRect.height < this._data.top + this._data.height
      ) {
        this.fire("invalid",{rotate:this._rotate,message:"画面内の範囲で指定して下さい。"});
        return;
    }

    this.fire("valid",{rotate:this._rotate});
  }

  refreshContainer() {
    if (!this._container) return;
    const container = this._container;
    
    container.style.left = this._data.left + "px";
    container.style.top = this._data.top + "px";
    container.style.width = this._data.width + "px";
    container.style.height = this._data.height + "px";
  }

  create() {
    if (this._container) return;
    var canvasContainer = this._map.getContainer();
    //var rect = canvasContainer.getBoundingClientRect();

    var container = MA.DOM.create("div");
    container.style.position = "absolute";
    container.style.backgroundColor = "transparent";
    container.style.pointerEvents = "none";

    var line = MA.DOM.create("div");
    line.style.position = "absolute";
    line.style.left = "0px";
    line.style.right = "0px";
    line.style.bottom = "0px";
    line.style.top = "0px";
    line.style.margin = "-1px";
    line.style.border = "2px solid red";
    container.appendChild(line);

    // 中央
    const centerHandle = this.createHandle("center",{
      "cursor":"move", "left":"50%", "top":"50%", "width":"24px", "height":"24px", "marginLeft":"-12px", "marginTop":"-12px",
      "border":"none", "backgroundColor" : "transparent", "backgroundImage": "url('./image/control/move.svg')"
    });
    container.appendChild(centerHandle);

    // 左上
    const leftTopHandle = this.createHandle("lt", { "cursor":"nw-resize", "left":"0px", "top":"0px", "marginLeft":"-6px", "marginTop":"-6px"});
    container.appendChild(leftTopHandle);
    // 右上
    const rightTopHandle = this.createHandle("rt", { "cursor":"ne-resize", "right":"0px", "top":"0px", "marginRight":"-6px", "marginTop":"-6px"});
    container.appendChild(rightTopHandle);


    // 左下
    const leftBottomHandle = this.createHandle("lb", { "cursor":"sw-resize", "left":"0px", "bottom":"0px", "marginLeft":"-6px", "marginBottom":"-6px"});
    container.appendChild(leftBottomHandle);
    // 右下
    const rightBottomHandle = this.createHandle("rb", { "cursor":"se-resize", "right":"0px", "bottom":"0px", "marginRight":"-6px", "marginBottom":"-6px"});
    container.appendChild(rightBottomHandle);
    
    
    canvasContainer.appendChild(container);
    this._container = container;
  }

  createHandle(type, style) {

    var handle = MA.DOM.create("div");
    handle.style.position = "absolute";
    handle.style.backgroundColor = "#fff";
    handle.style.border = "1px solid red";
    handle.style.width="12px";
    handle.style.height="12px";
    handle.style.pointerEvents = "auto";
    handle.style.userSelect = "none";
    handle.style.backgroundSize = "100% 100%";
    handle.style.userSelect = "none";
    handle.style.userSelect = "none";

    if ( style) {
      for( var key in style) {
        handle.style[key] = style[key];
      }
    }


    MA.DOM.on( handle, "mousedown", (e)=>{
      e.preventDefault();
      e.stopPropagation();
      this.dragStart(type, e.target, e.pageX, e.pageY);
    });

    return handle;
  }

  destroyDragInfo() {
    this._dragInfo = undefined;
  }

  dragStart(type, target, x, y) {
    this.destroyDragInfo();

    const rect = target.getBoundingClientRect();

    this._dragInfo = {
      left :this._data.left,
      top :this._data.top,
      width :this._data.width,
      height :this._data.height,
      targetRect : rect,
      startX:x,
      startY:y,
      clientX: x-rect.left,
      clientY: y-rect.top
    };

    this.initMouseEvents( type);
  }

  initMouseEvents(type) {
    this.destroyMouseEvents();
    this._handleMouseMove = MA.bind(this._onMouseMove,this,type);
    this._handleMouseUp = MA.bind(this._onMouseUp,this,type);

    MA.DOM.on( window, "mousemove", this._handleMouseMove );
    MA.DOM.on( window, "mouseup", this._handleMouseUp );
  }

  _onMouseMove(type,e) {
    
    switch(type) {
      case "lt":
        this._data.setPosition(
          this._dragInfo.left + ( e.pageX- this._dragInfo.startX),
          this._dragInfo.top + ( e.pageY- this._dragInfo.startY)
        );
        break;
      case "rt":
        this._data.setPosition(
          undefined,
          this._dragInfo.top + ( e.pageY- this._dragInfo.startY)
        );
        this._data.setSize(
          this._dragInfo.width + ( e.pageX- this._dragInfo.startX)
        );
        break;
      case "lb":
        this._data.setPosition(
          this._dragInfo.left + ( e.pageX- this._dragInfo.startX),
        );
        this._data.setSize(
          undefined,
          this._dragInfo.height + ( e.pageY- this._dragInfo.startY)
        );
        break;

      case "rb":
        this._data.setSize(
          this._dragInfo.width + ( e.pageX- this._dragInfo.startX),
          this._dragInfo.height + ( e.pageY- this._dragInfo.startY)
        );
        break;
      
      case "center":
        this._data.setPosition(
          this._dragInfo.left + ( e.pageX- this._dragInfo.startX),
          this._dragInfo.top + ( e.pageY- this._dragInfo.startY),
          true
        );
        break;

      default:

    }

    this.refreshContainer();
    this.fire("change");

    this.check();
  }

  _onMouseUp(type) {
    this.destroyDragInfo();
    this.destroyMouseEvents();
  }



  destroyMouseEvents() {
    if ( this._handleMouseMove) {
      MA.DOM.off( window, "mousemove", this._handleMouseMove );
      this._handleMouseMove = undefined;
    }
    if ( this._handleMouseUp) {
      MA.DOM.off( window, "mousemove", this._handleMouseUp );
      this._handleMouseUp = undefined;
    }
  }

  destroy() {
    this.destroyMouseEvents();

    if ( this._data ) {
      this._data.destroy();
      this._data = undefined;
    }
    if (!this._container) return;

    var canvasContainer = this._map.getContainer();
    canvasContainer.removeChild(this._container);
    delete this._container;
    this._container = undefined;
  }


};



GSIBV.Map.AreaSelector.Data = class extends MA.Class.Base {

  constructor(map, mode) {
    super();
    this._map = map;
    this.mode = ( mode ? mode : "size" );

    this._map.on("move", this._onMapMove);
    this._map.on("rotate", this._onMapRotate);

  }

  get mode() {
    return this._mode;
  }

  get left() {
    return this._sizeInfo.left;
  }

  get top() {
    return this._sizeInfo.top;
  }
  get width() {
    return this._sizeInfo.width;
  }
  get height() {
    return this._sizeInfo.height;
  }

  get range() {
    return this._sizeInfo.range;
  }

  refreshCenter() {

    this._centerPos = {
      x: this._sizeInfo.left + Math.round( this._sizeInfo.width / 2 ),
      y: this._sizeInfo.top + Math.round( this._sizeInfo.height / 2 )
    };

    this._center = this._map.unproject( this._centerPos);
  }

  setPosition( left, top, moveOnly) {

    if ( left !== undefined ) {
      if ( !moveOnly ) {
        let width = this._sizeInfo.width + (this._sizeInfo.left - left);
        if ( width > 12) this._sizeInfo.width = width;
      }
      this._sizeInfo.left = left;
    }

    if ( top !== undefined ) {
      if ( !moveOnly ) {
        let height = this._sizeInfo.height + (this._sizeInfo.top - top);
        if ( height > 12) this._sizeInfo.height = height;
      }
      this._sizeInfo.top = top;
    }

    this.refreshCenter();
    this.refreshRange();
  }

  setSize(width,height) {

    if ( width !== undefined) {
      if ( width < 12 ) width = 12;
      this._sizeInfo.width = width;
    }

    if ( height !== undefined) {
      if ( height < 12 ) height = 12;
      this._sizeInfo.height = height;
    }
    this.refreshCenter();
    this.refreshRange();
  }

  refreshRange() {

    this._sizeInfo.range = {
      min:this._map.unproject({x:this._sizeInfo.left,y:this._sizeInfo.top+this._sizeInfo.height}),
      max:this._map.unproject({x:this._sizeInfo.left+this._sizeInfo.width,y:this._sizeInfo.top})
    };

  }

  destroy() {
    this._map.off("rotate", this._onMapRotate);
    this._map.off("move", this._onMapMove);
  }

  _onMapRotate = () => {
    this._onMapMove();
  }

  _onMapMove = () => {
    if ( !this._center ) this._center = this._map.getCenter();
    this._centerPos = this._map.project( this._center );

    if ( !this._sizeInfo ) {
      this._sizeInfo = {
        width:256,
        height:256,
        left:Math.round( this._centerPos.x - (256/2) ),
        top:Math.round( this._centerPos.y - (256/2) )
      };
      this.refreshRange();

    } else {
      
      if ( this._mode === "size") {
        this._sizeInfo.left = Math.round( this._centerPos.x - (this._sizeInfo.width/2) );
        this._sizeInfo.top = Math.round( this._centerPos.y - (this._sizeInfo.height/2) );
      } else {

        const leftTopPos = this._map.project( {lat:this._sizeInfo.range.max.lat, lng :this._sizeInfo.range.min.lng});
        const rightBottomPos = this._map.project( {lat:this._sizeInfo.range.min.lat, lng :this._sizeInfo.range.max.lng});

        this._sizeInfo.left = Math.round( leftTopPos.x );
        this._sizeInfo.top = Math.round( leftTopPos.y);
        this._sizeInfo.width = Math.round( rightBottomPos.x - leftTopPos.x );
        this._sizeInfo.height = Math.round( rightBottomPos.y - leftTopPos.y);
      }
    }


    this.fire("move");

    this.fire("change");
  }

  set mode(mode) {

    if( this._mode === mode ) return;

    this._mode = mode;
    this._onMapMove();


  }

};


