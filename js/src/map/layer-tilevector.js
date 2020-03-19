GSIBV.Map.Layer.TYPES["binaryvector"] = "バイナリタイル";
GSIBV.Map.Layer.FILTERS.push(function (l) {
  if (l._type && l._type == "tilevector") {
    return new GSIBV.Map.Layer.TileVector({
      "id": l.id,
      "title": l.title,
      "url": l.url,
      "html": l.html,
      "legendUrl": l.legendUrl,
      "minzoom": l.minZoom,
      "maxzoom": l.maxZoom,
      "minNativeZoom": l.minNativeZoom,
      "maxNativeZoom": l.maxNativeZoom,
      "stylejs": ( l.options ? l.options.stylejs : null),
      "drawfile": ( l.options ? l.options.drawfile : null)

    });
  }

  var url = l.url.split("?")[0];
  if (url.match(/\{z\}/i) && url.match(/\.pbf$/i)) {
    return new GSIBV.Map.Layer.TileVector({
      "id": l.id,
      "title": l.title,
      "url": l.url,
      "html": l.html,
      "legendUrl": l.legendUrl,
      "minzoom": l.minZoom,
      "maxzoom": l.maxZoom,
      "minNativeZoom": l.minNativeZoom,
      "maxNativeZoom": l.maxNativeZoom,
      "stylejs": ( l.options ? l.options.stylejs : null),
      "drawfile": ( l.options ? l.options.drawfile : null)

    });
  }


  return null;

});


GSIBV.Map.Layer.TileVector = class extends GSIBV.Map.Layer {

  constructor(options) {
    super(options);
    this._type = "tilevector";

    this._url = "";
    this._tileSize = 256;
    if (options) {
      this._url = (options.url ? options.url : "");
      this._minzoom = (options.minZoom ? options.minZoom : (options.minzoom ? options.minzoom : null));
      this._maxzoom = (options.maxZoom ? options.maxZoom : (options.maxzoom ? options.maxzoom : null));
      this._maxNativeZoom = (options.maxNativeZoom ? options.maxNativeZoom : null);
      this._minNativeZoom = (options.minNativeZoom ? options.minNativeZoom : null);
      this._html = (options.html ? options.html : "");
      this._legendUrl = (options.legendUrl ? options.legendUrl : "");
      this._style = ( options.stylejs ? options.stylejs : null );
      this._drawfile = ( options.drawfile ? options.drawfile : null );
    }
    this._layers = [];
    this._visible = true;

  }
  getVisible() {
    var map = this._map.map;
    return (map.getLayoutProperty(this.mapid, "visibility") == "visible");
  }

  setVisible(visible) {
    var map = this._map.map;
    map.setLayoutProperty(this.mapid, "visibility", visible ? "visible" : "none");
    if ( !this._layers) return;
    
    for( var i=0; i<this._layers.length; i++ ) {
      var layer = this._layers[i];
      map.setLayoutProperty(layer.id, "visibility", visible ? "visible" : "none");
    }
    this._visible = visible;
  }

  getOpacity() {
    return this._opacity;
  }

  setOpacity(opacity) {
    opacity = opacity != undefined ? opacity : 1;
    if ( !this._layers) return;
    var map = this._map.map;
    try {
      for( var i=0; i<this._layers.length; i++ ) {
        var layer = this._layers[i];
        switch (layer["type"]) {
          case "line":
            map.setPaintProperty(layer.id, "line-opacity", opacity);
            break;
          case "fill":
            map.setPaintProperty(layer.id, "fill-opacity", opacity);
            break;
          case "symbol":
            map.setPaintProperty(layer.id, "icon-opacity", opacity);
            map.setPaintProperty(layer.id, "text-opacity", opacity);
            break;
        }
      }
    }catch(ex){}
    this._opacity = opacity;
  }

  _remove(map) {
    if (!map) return;

    
    var popupManager = GSIBV.Map.Layer.TileVector.PopupManager.get();
    popupManager.remove( this );

    if ( this._imageManager ) {
      this._imageManager.destroy();
      this._imageManager = undefined;
    }

    var map = this._map.map;
    if ( this._fillPatterns) {
      for( var key in this._fillPatterns ) {
        if ( map.hasImage( key ) ) {
          map.removeImage( key );
        }
      }

      this._fillPatterns = undefined;
    }
    /*
    var imageManager = GSIBV.Map.ImageManager.instance;
    imageManager.off("load", this._iconLoadHandler);
    this._iconLoadHandler = null;

    map.map.off("moveend", this._onMapMoveHandler);
    */

    for( var i=0; i<this._layers.length; i++ ) {
      var layer = this._layers[i];
      if ( map.getLayer(layer.id))
        map.removeLayer( layer.id);
    }
    if ( map.getLayer(this.mapid))
      map.removeLayer(this.mapid);

    this._layers = [];

    if ( map.getSource(this.mapid)) {
      map.removeSource(this.mapid);
    }
    if (this._request) this._request.abort();
    super._remove(map);
    this._layerData = undefined;
    this._style = undefined;
  }

  _moveToFront() {
    var map = this._map.map;
    map.repaint = false;
    map.moveLayer(this.mapid);
    for( var i=0; i<this._layers.length; i++ ) {
      var layer = this._layers[i];
      if ( map.getLayer(layer.id))
        map.moveLayer( layer.id);
    }
    map.repaint = true;

  }

  _add(map) {
    super._add(map);

    if (!map.map.getLayer(this.mapid)) {

      map.map.addLayer({
        "id": this.mapid,
        "type": "background",
        "paint": {
          "background-color": "rgba(255,255,255,0)"
        },
        "layout": {
          "visibility": (this._visible ? "visible" : "none")
        }
      });
    }

    this._loadStyle();
    this._loadLayer();
    var popupManager = GSIBV.Map.Layer.TileVector.PopupManager.get(this._map);
    popupManager.add( this );
    return true;
  }

  

  _loadStyle() {
    
    var url = this._url;
    if ( this._style ) {
      url = this._style;
    } else {
      url = url.replace(/\/\{z\}\/\{x\}\/\{y\}.+/i, "/style.js");
    }
    this._request = new MA.HTTPRequest({
      "url": url,
      "type": "text",
      "noCache": true
    });

    this._request.on("load", MA.bind(this._onStyleLoad, this));
    this._request.on("error", MA.bind(this._onStyleLoadError, this));
    this._request.load();
  }

  _onStyleLoad(e) {
    try {
      eval("this._style =" + e.params.response + ";");
      if (this._style) {
        if (this._style.options && this._style.options.maxNativeZoom && !this._maxNativeZoom)
          this._maxNativeZoom = this._style.options.minNativeZoom;
        if (this._style.options && this._style.options.minNativeZoom && !this._minNativeZoom)
          this._minNativeZoom = this._style.options.minNativeZoom;
      }
      
      this._addToMap();

    } catch (e) {
      console.log(e);
    }
  }

  _onStyleLoadError() {
    this._style = {};
    this._addToMap();
  }

  
  _loadLayer() {
    var url = this._url;
    
    if ( this._drawfile ) {
      url = this._drawfile;
    } else {
      url = url.replace(/\/\{z\}\/\{x\}\/\{y\}.+/i, "/layer.txt");
    }
    this._layerRequest = new MA.HTTPRequest({
      "url": url,
      "type": "json",
      "noCache": true
    });

    this._layerRequest.on("load", MA.bind(this._onLayerLoad, this));
    this._layerRequest.on("error", MA.bind(this._onLayerLoadError, this));
    this._layerRequest.load();
  }

  _onLayerLoad(e) {
    this._layerData = e.params.response;
    this._addToMap();
    
  }

  _onLayerLoadError() {
    this._layerData = "error";
    this._addToMap();

  }
  
  _addToMap() {
    if ( !this._style || !this._layerData ) {
      return;
    }

    if (this._layerData == "error" ) {
      // レイヤーデータ取得エラー
      return;
    }


    var images = [];
    for( var i=0; i<this._layerData.length; i++ ) {
      var layer= this._layerData[i];
      if ( !layer.layout || !layer.layout["icon-image"] ) continue;
      images.push(layer.layout["icon-image"]);
      layer.layout["icon-image"] = GSIBV.Map.Layer.TileVector.ImageManager.urlToId(layer.layout["icon-image"]);
    }
    if ( images.length > 0 ) {
      this._imageManager = new GSIBV.Map.Layer.TileVector.ImageManager( this._map.map);
      this._imageManager.on("load", MA.bind(this._refresh, this) );
      this._imageManager.load( images);
    } else {
      this._refresh();
    }
  }

  _refresh() {
    var map = this._map.map;
    if ( map.getSource(this.mapid) ) return;


    var url = this._url;
    if ( url.match(/^\.\//)) {

      var pathName = location.pathname;
      var parts = pathName.split("/");
      
      if ( parts[parts.length-1] == "") {
        parts.pop();
      }

      if ( parts[parts.length-1].match(/\./g) ) {
        parts.pop();
        pathName = parts.join("/");
      }
      if ( pathName.charAt(pathName.length-1) != "/") pathName += "/";

      url = url.replace(/\.\//,
        location.protocol +"//" + location.host + pathName );
    }
    
    var source = {
      "type": "vector",
      "tiles": [url],
      "minzoom": this._minzoom,
      "maxzoom": this._maxNativeZoom ? this._maxNativeZoom : this._maxzoom
    };

    
    
    map.addSource(this.mapid,source );


    for( var i=0; i<this._layerData.length; i++ ) {
      var layer = this._layerData[i];
      layer.id = this.mapid + "-" + i;
      layer.source = this.mapid;

      if ( !layer.minzoom && this._minzoom ) layer.minzoom = this._minzoom;
      if ( !layer.maxzoom && this._maxzoom ) layer.maxzoom = this._maxzoom;
      if ( !layer.metadata) layer.metadata = {};
      layer.metadata["mapid"] = this.mapid;
      if ( !layer.layout ) layer.layout = {};
      if ( this._visible) {
        layer.layout["visibility"] = "visible";
      } else {
        layer.layout["visibility"] = "none";

      }
      
      if ( layer ["gsi-fill-patterns"] && layer.paint && layer.paint["fill-pattern"]) {
        if ( !this._fillPatterns ) this._fillPatterns = {};
        var patterns = layer ["gsi-fill-patterns"];
        
        var fillPatternTxt = JSON.stringify(layer.paint["fill-pattern"]);
        for( var key in patterns) {
          var patternKey = "-gsi-tilevector-fillpattern-" + layer.id  +"-" + key;
          if ( !map.hasImage( patternKey )){
            this._fillPatterns[ patternKey ] = patterns[key];
            map.addImage( patternKey, patterns[key]);
          }
          //console.log( txt) ;
          fillPatternTxt = fillPatternTxt.replace(/"(.*?)"/g,           
            function(){ 
              var v = arguments[0];
              return ( v == '"'+key +'"' ? '"'+patternKey +'"' : v ) ;
            });
          

        }
        layer.paint["fill-pattern"] = JSON.parse(fillPatternTxt);
        delete layer ["gsi-fill-patterns"];
      }
      map.addLayer(layer,this.mapid );
      this._layers.push( layer );
    }

  }

};



GSIBV.Map.Layer.TileVector.PopupManager = class extends MA.Class.Base {

  constructor(map) {
    super();
    this._map = map;
    GSIBV.Map.Layer.TileVector.PopupManager._instance = this;

    this._tileVectorList = [];
  }

  static get(map) {
    if ( !GSIBV.Map.Layer.TileVector.PopupManager._instance ) {
      GSIBV.Map.Layer.TileVector.PopupManager._instance = new GSIBV.Map.Layer.TileVector.PopupManager(map);
    }
    return GSIBV.Map.Layer.TileVector.PopupManager._instance;

  }

  add( tlieVector ) {
    this._hidePopup();
    if ( this._tileVectorList.indexOf( tlieVector) >= 0 ) return;
    this._tileVectorList.push( tlieVector );
    this._initEvents();
  }

  remove(tlieVector) {
    this._hidePopup();
    var idx = this._tileVectorList.indexOf( tlieVector);
    if ( idx < 0 ) return;
    this._tileVectorList.splice( idx,1);
    if ( this._tileVectorList.length <= 0 ) {
      this._destroyEvents();
    }
  }

  _onMapZoom() {
    this._hidePopup();
  }

  
  _hidePopup() {
    if ( this._popup ) {
      try {
        this._popup.remove();
      }catch(ex){}
      this._popup = undefined;
    }
  }


  _onMapClick(e) {


    if ( this._map.drawManager.drawing) return;

    var map = this._map.map;

    var layers = [];
    var layerIdToTileVector = {};

    for( var i=0; i<this._tileVectorList.length; i++ ) {
      var tileVector = this._tileVectorList[i];
      if ( !tileVector.visible || !tileVector._style.geojsonOptions) continue;
      
      var onEachFeature = tileVector._style.geojsonOptions.onEachFeature;
      if (!onEachFeature ) continue;

      
      for( var j=0; j<tileVector._layers.length; j++ ) {
        layers.push( tileVector._layers[j].id);
        layerIdToTileVector[tileVector._layers[j].id] = tileVector;
      }
    }

    if ( layers.length <= 0 ) return;
   

    var features = map.queryRenderedFeatures(e.point);
    if ( !features || features.length <= 0 ) return;

    
    var vectorFeatures = [];
    var targetOnEachFeature = null;
    var hasPopupContent = false;
    for( var i=0; i<features.length; i++ ) {
      var f = features[i];
      if ( !hasPopupContent ) hasPopupContent = ( f.properties["-gsibv-popupContent"] ? true : false);
      var tileVector = layerIdToTileVector[f.layer.id];
      if (!tileVector) continue;
      if ( hasPopupContent ) return;
      var onEachFeature = tileVector._style.geojsonOptions.onEachFeature;
      if ( !targetOnEachFeature ) {
        if ( onEachFeature ) {
          targetOnEachFeature = onEachFeature;
          vectorFeatures.push( f);
        }
      } else if ( onEachFeature == targetOnEachFeature) {

        vectorFeatures.push( f);
      }
    }

    
    if ( vectorFeatures.length > 0 ) {
      var tileVector = layerIdToTileVector[vectorFeatures[0].layer.id];
      if (!tileVector) return;
      var onEachFeature = tileVector._style.geojsonOptions.onEachFeature;

      var layer = {
        bindPopup : function(html) {
          this.html = html;
        }
      };
      MA.bind( onEachFeature,tileVector._style.geojsonOptions  )( vectorFeatures, layer );
      var screenSize = MA.getScreenSize();
      var maxWidth = Math.round(screenSize.width/2 );
      if ( maxWidth > 350 ) maxWidth = 350;
      this._popup = new mapboxgl.Popup({ 
        "className": "-gisbv-popup-content"})
          .setLngLat(e.lngLat)
          .setHTML(layer.html)
          .setMaxWidth( maxWidth + "px" )
          .addTo(map);
    }
  }

  _initEvents() {
    var map = this._map.map;

    if ( !this._mapZoomHandler ) {
      this._mapZoomHandler = MA.bind(this._onMapZoom,this);
      map.on("zoomstart",this._mapZoomHandler);
    }
    if ( !this._mapClickHandler ) {
      this._mapClickHandler = MA.bind(this._onMapClick,this);
      map.on("click",this._mapClickHandler);
    }
  }

  _destroyEvents() {
    var map = this._map.map;

    if ( this._mapZoomHandler ) {
      map.off("zoomstart",this._mapZoomHandler);
      this._mapZoomHandler =undefined;
    }

    if ( this._mapClickHandler ) {
      map.off("click",this._mapClickHandler);
      this._mapClickHandler =undefined;
    }
    

  }

};


GSIBV.Map.Layer.TileVector.ImageManager = class extends MA.Class.Base {
  constructor(map) {
    super();
    this._map = map;
    this._images = {};
    this._manager = GSIBV.Map.ImageManager.get(map);

  }

  destroy() {
    for( var i=0; i<this._loadingImages.length; i++ ) {
      this._loadingImages[i].img.onload=undefined;
      this._loadingImages[i].img.onerror=undefined;
      delete this._loadingImages[i].img;
      this._loadingImages[i].img = undefined;
    }
    this._loadingImages = [];
    for( var id in this._images ) {
      try {
        this._manager.remove( id);
      }catch(ex){
        console.log( ex );
      }
    }

    this._images = {};
  }

  static urlToId(url) {
    return "-gsibv-tilevector-layer-icon-" + url;

  }

  load( images ) {
    if ( !images ) {
      return;
    }

    this._loadingImages = [];
    for( var i=0; i<images.length; i++ ) {
      var image = {
        img : MA.DOM.create("img"),
        url : images[i]
      };
      image.id = GSIBV.Map.Layer.TileVector.ImageManager.urlToId(image.url);
      this._loadingImages.push( image );
      image.img.crossOrigin = "anonymous";
      image.img.onload = MA.bind(this._onImageLoad, this, image);
      image.img.onerror = MA.bind(this._onImageError, this, image) ;

    }

    for( var i=0; i<this._loadingImages.length; i++ ) {
      this._loadingImages[i].img.src = this._loadingImages[i].url;
    }
  }

  _onImageLoad(image) {

    image.loaded = true;

    
    if ( this._map.hasImage(image.id) ) {
      this._checkLoaded();
      return;
    }


    this._images[ image.id ] = true;
    this._manager.add( image.id, image.img, image.url );

    this._checkLoaded();
  }

  _onImageError(image) {
    image.loaded = true;
    image.error = true;
    this._checkLoaded();
  }

  _checkLoaded() {
    
    for( var i=0; i<this._loadingImages.length; i++ ) {
      if ( !this._loadingImages[i].loaded ) return;

    }

    this._loadingImages = [];

    this.fire("load");
  }

};
