/***************************************
    GSIBV.UI.ComparePhotoControl
    時系列表示
***************************************/
GSIBV.UI.ComparePhotoControl = class extends GSIBV.UI.Base {
  constructor(options) {
    super(options);
    this._options = options;
    this.initialize();
    
  }

  set layer(layer) {
    this._layer = layer;
  }

  initialize() {

  }

  destroyHandler() {


    if ( this._containsChecker ) {
      this._containsChecker.stop();
      this._containsChecker = undefined;
    }

    if ( this._layerChangeHandler ) {
      this._layer.off("change", this._layerChangeHandler);
      this._layerChangeHandler = undefined;
    }
    if ( this._resizeHandler ) {
      MA.DOM.off(window,"resize", this._resizeHandler);
      this._resizeHandler = undefined;
    }

  }

  destroyMouseHandler() {

    if ( this._windowMouseMoveHandler ) {
      MA.DOM.off(window,"mousemove", this._windowMouseMoveHandler);
      this._windowMouseMoveHandler = undefined;
    }
    if ( this._windowMouseUpHandler ) {
      MA.DOM.off(window,"mouseup", this._windowMouseUpHandler);
      this._windowMouseUpHandler = undefined;
    }
  }

  destroy() {
    MA.DOM.removeClass(document.body,"-gsibv-slider-moving");
    this.destroyHandler();
    if ( !this._container) return;
    this._container.parentNode.removeChild( this._container);
    this._container = undefined;
    this.fire("hide");
  }

  show() {

    this.create();
    this.refresh();


    if ( !this._resizeHandler ) {
      this._resizeHandler = MA.bind( this._onWindowResize, this );
    }
    MA.DOM.on(window,"resize", this._resizeHandler);
    
    if ( !this._layerChangeHandler) this._layerChangeHandler = MA.bind(function(){
      this.refresh();
    },this);
    this._layer.on("change", this._layerChangeHandler);

    if ( !this._containsChecker ) {
      this._containsChecker = new GSIBV.UI.ComparePhotoControl.ContainsTileChecker( this._layer.map.map);
      this._containsChecker.on("load", MA.bind(function(e){
        this._idList = e.params.idList;
        this.refresh();
      },this));
    }
    this._containsChecker.map = this._layer.map.map;
    this._containsChecker.start();

    this.fire("show");
  }

  hide() {
    this.destroyHandler();
    if ( !this._container ) return;

    this._container.style.display="none";
    this.fire("hide");
  }

  _onWindowResize() {
    this.refresh();
  }

  create() {
    
    if ( this._container ) return;
    
    this._container =MA.DOM.create("div");
    MA.DOM.addClass( this._container, "-gsibv-comparephoto-control");


    var contentsFrame = MA.DOM.select("#main .content")[0];

    this._sliderContainer = MA.DOM.create("div");
    MA.DOM.addClass( this._sliderContainer, "slider-container");
    MA.DOM.on( this._sliderContainer, "click", MA.bind(function(e){

      var x = e.pageX-MA.DOM.offset(this._sliderContainer).left;
      var width =MA.DOM.size( this._sliderContainer).width;

      var index = Math.round(( (CONFIG.COMPAREPHOTO_PHOTOLIST.length -1 ) * ( x/width) ));
      
      this.setPhotoIndex(index);

    },this) );


    this._sliderHandle = MA.DOM.create("div");
    MA.DOM.addClass( this._sliderHandle, "slider-handle");
    this._sliderContainer.appendChild( this._sliderHandle);

    MA.DOM.on( this._sliderHandle, "mousedown", MA.bind(this._onHandleMouseDown, this) );


    this._items = [];
    for( var i=0; i<CONFIG.COMPAREPHOTO_PHOTOLIST.length; i++ ) {
      var photo = CONFIG.COMPAREPHOTO_PHOTOLIST[i];
      var item = {
        elem : MA.DOM.create("div"),
        line : MA.DOM.create("div"),
        photo : photo,
        left :0
      };
      MA.DOM.addClass( item.elem, "label" );
      MA.DOM.addClass( item.line, "line" );
      item.elem.innerHTML = photo.year.from + (photo.year.to ? "<br>〜" + photo.year.to : "" );
      this._container.appendChild( item.elem);
      this._sliderContainer.appendChild( item.line);

      MA.DOM.on( item.elem, "click", MA.bind(function(index,photo){
        this.setPhotoIndex(index);
      }, this, i,item.photo));

      this._items.push( item );
    }



    this._container.appendChild( this._sliderContainer);

    contentsFrame.appendChild( this._container);
  }

  _onHandleMouseDown(e) {

    this.destroyMouseHandler();

    this._windowMouseMoveHandler = MA.bind( this._onWindowMouseMove, this);
    MA.DOM.on(window,"mousemove", this._windowMouseMoveHandler);
    this._windowMouseUpHandler = MA.bind( this._onWindowMouseUp, this);
    MA.DOM.on(window,"mouseup", this._windowMouseUpHandler);
    
    MA.DOM.addClass(document.body,"-gsibv-slider-moving");

    e.preventDefault();
    e.stopPropagation();
  }

  _onWindowMouseMove(e) {

    var x = e.pageX-MA.DOM.offset(this._sliderContainer).left;
    var width =MA.DOM.size( this._sliderContainer).width;

    var index = Math.round(( (CONFIG.COMPAREPHOTO_PHOTOLIST.length -1 ) * ( x/width) ));
    
    this.setPhotoIndex(index);

    e.preventDefault();
    e.stopPropagation();

  }
  _onWindowMouseUp(e) {

    this.destroyMouseHandler();

    MA.DOM.removeClass(document.body,"-gsibv-slider-moving");
  }
  


  setPhotoIndex(index) {
    this._layer.photoIndex = index;
  }


  refresh() {
    
    var containerSize = MA.DOM.size( this._container);
    var isSmall = containerSize.width < 800 ? true : false;
    
    if ( isSmall ) {
      MA.DOM.addClass(this._container, "small");
    } else {
      MA.DOM.removeClass(this._container, "small");
    }

    var marginSide = 20;
    var interval = ( ( containerSize.width-(marginSide*2)) / (this._items.length -1 ) );

    var labelMaxHeight = 0;

    for ( var i=0; i<this._items.length; i++ ) {
      var item = this._items[i];
      var labelSize = MA.DOM.size(item.elem);
      item.left = i * interval - (labelSize.width/2) + marginSide;
      item.labelSize = labelSize;
      if ( labelMaxHeight < labelSize.height) labelMaxHeight = labelSize.height;

      item.elem.style.left = Math.round( item.left) +  "px";
      item.line.style.left = Math.round( i * interval ) +  "px";

      if ( i == 0 || i === this._items.length-1) {
        item.line.style.display ="none";
      }

      if ( this._layer.photoIndex == i) {
        this._sliderHandle.style.left = Math.round( i * interval ) +  "px";
      }

      if ( this._idList && this._idList.indexOf( item.photo.id) >= 0 ) {
        MA.DOM.removeClass(item.elem, "disabled");
      } else {
        MA.DOM.addClass(item.elem, "disabled");
      }

    }

    labelMaxHeight+= 4;
    var containerHeight = (isSmall ? labelMaxHeight*2 + 22  : labelMaxHeight + 30 );

    for ( var i=0; i<this._items.length; i++ ) {
      var item = this._items[i];

      if ( isSmall) {
        if ( i %2 == 0 ) {
          item.elem.style.top =  (22 + labelMaxHeight) +"px"
        } else {
          item.elem.style.top =  ((labelMaxHeight / 2 ) - (item.labelSize.height / 2 ) ) +"px"
        }
      } else {
        item.elem.style.bottom = "auto";
        item.elem.style.top = "32px";
      }
    }

    this._sliderContainer.style.top = ( isSmall ? labelMaxHeight : 8  )+ "px";
    this._sliderContainer.style.left = marginSide + "px";
    this._sliderContainer.style.right = marginSide + "px";

    this._container.style.height = containerHeight+ "px";


    this.fire("resize", {height:containerHeight});
  }

};





GSIBV.UI.ComparePhotoControl.ContainsTileChecker =  class extends MA.Class.Base {

  constructor(map) {
    super();
    this._map = map;
  }

  set map(map) {
    if ( this._map != map ) {
      if ( this._map ) {
        this.stop();
      }
      this._map = map;
    }
  }


  start () {
    if ( !this._onMapMoveEndHandler ) {
      this._onMapMoveEndHandler = MA.bind( this._onMapMoveEnd, this );
      this._map.on("moveend", this._onMapMoveEndHandler);
    }

    this._onMapMoveEndHandler();
  }

  stop() {

    this._destroyRequest();
    if ( this._onMapMoveEndHandler) {
      this._map.off("moveend", this._onMapMoveEndHandler);
      this._onMapMoveEndHandler = undefined;
    }
  }


  _destroyRequest() {
    if ( this._requests ) {
      for( var i=0; i<this._requests.length; i++ ) {
        //try {
          this._requests[i].request.abort();
        //} catch(ex) {}
      }

      this._requests = undefined;
    }
  }


  _getTileX(z, lon) {
    var lng_rad = lon * Math.PI / 180; var R = 128 / Math.PI; var worldCoordX = R * (lng_rad + Math.PI);
    var pixelCoordX = worldCoordX * Math.pow(2, z); var tileCoordX = Math.floor(pixelCoordX / 256);
    return { n: tileCoordX, px: Math.floor(pixelCoordX - tileCoordX * 256) };
  }

  _getTileY (z, lat) {
    var lat_rad = lat * Math.PI / 180; var R = 128 / Math.PI; var worldCoordY = - R / 2 * Math.log((1 + Math.sin(lat_rad)) / (1 - Math.sin(lat_rad))) + 128; var pixelCoordY = worldCoordY * Math.pow(2, z); var tileCoordY = Math.floor(pixelCoordY / 256);
    return { n: tileCoordY, px: Math.floor(pixelCoordY - tileCoordY * 256) };
  }

  _loadCheck(req) {
    var loaded = true;
    for( var i=0; i<this._requests.length; i++ ) {
      if ( req == this._requests[i].request) {
        this._requests[i].loaded = true;
      }

      if ( !this._requests[i].loaded ) {
        loaded = false;
      }
    }

    
    if ( loaded ) {
      this.fire("load", {idList:this._idList} );
    }
  }

  _onMapMoveEnd() {


    var z = Math.floor( this._map.getZoom() );
    var center = this._map.getCenter();


    var hash = {};

    for( var i=0; i<CONFIG.COMPAREPHOTO_PHOTOLIST.length; i++ ) {
      var photo = CONFIG.COMPAREPHOTO_PHOTOLIST[i];
      var maxNativeZoom = photo.maxNativeZoom;
      var url = CONFIG.COMPAREPHOTO_COCOTILEURL;
      if ( maxNativeZoom && maxNativeZoom < z ) {
        if( hash[maxNativeZoom+""] ) continue;

        var x = this._getTileX(maxNativeZoom, center.lng);
        var y = this._getTileY(maxNativeZoom, center.lat);
        url = url.replace( "{x}", x.n).replace( "{y}", y.n).replace("{z}", maxNativeZoom);
        hash[maxNativeZoom+""] = url;
      } else {
        if( hash[z+""] ) continue;

        var x = this._getTileX(z, center.lng);
        var y = this._getTileY(z, center.lat);
        url = url.replace( "{x}", x.n).replace( "{y}", y.n).replace("{z}", z );

        hash[z+""] = url;
      }
    }

    this._requests = [];
    this._idList = [];
    for( var key in hash) {
      var url = hash[key];


      var request = new MA.HTTPRequest({
        "type": "text",
        "url": url
      });

      request.on("load", MA.bind(function (request,e) {
        var data = e.params.response;
        try {
          var ids = data.split(",");
          for( var i=0; i<ids.length; i++ ) {
            if ( this._idList.indexOf(ids[i]) < 0 ) {
              this._idList.push(ids[i]);
            }
          }
        }catch(ex) {

        }
        this._loadCheck(request);
      }, this,request));

      request.on("error", MA.bind(function(request){
        this._loadCheck(request);
      }, this,request));


      this._requests.push( {
        request : request,
        loaded : false
      } );

      request.load();


    }

  }


}