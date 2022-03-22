GSIBV.Map.Layer.TYPES["binaryvector"] = "mapbox";
GSIBV.Map.Layer.FILTERS.push(function (l) {
  if (l._type && l._type == "mapboxstyle") {
    return new GSIBV.Map.Layer.MapboxStyle({
      "id": l.id,
      "title": l.title,
      "url": l.url,
      "html": l.html,
      "legendUrl": l.legendUrl,
      "minzoom": l.minZoom,
      "maxzoom": l.maxZoom,
      "minZoom": l.minZoom,
      "maxZoom": l.maxZoom,
      "minNativeZoom": l.minNativeZoom,
      "maxNativeZoom": l.maxNativeZoom

    });
  }


  /*
  if (l.url.match(/\{z\}/i) && l.url.match(/\.pbf$/i)) {
    return new GSIBV.Map.Layer.BinaryVectorTile({
      "id": l.id,
      "title": l.title,
      "url": l.url,
      "minzoom": l.minZoom,
      "maxzoom": l.maxZoom,
      "minNativeZoom": l.minNativeZoom,
      "maxNativeZoom": l.maxNativeZoom

    });
  }
  */


  return null;

});


GSIBV.Map.Layer.MapboxStyle = class extends GSIBV.Map.Layer {


  constructor(options) {
    super(options);
    this._type = "mapboxstyle";

    this._url = "";

    if (options) {
      this._url = (options.url ? options.url : "");
      this._data = (options.data ? options.data : undefined);
      this._isUserFileLayer = ( options.user ? true : false );
    }
  }

  get isUserFileLayer() { return this._isUserFileLayer; }
  get title() { return this._title; }
  set title(title) {
    this._title = title; 
  }
  
  getVisible() {
    var map = this._map.map;
    return (map.getLayoutProperty(this.mapid, "visibility") == "visible");
  }

  setVisible(visible) {
    /*
    var map = this._map.map;
    try {
      map.setLayoutProperty(this.mapid, "visibility", visible ? "visible" : "none");

      for (var i = 0; i < this._layers.length; i++) {
        if (this._layers[i]._added)
          map.setLayoutProperty(this._layers[i].id, "visibility", visible ? "visible" : "none");
      }
    } catch (e) { }
    */
   
    
    if (this._map) {
      var map = this._map.map;
      
      map.setLayoutProperty(this.mapid, "visibility", visibility);

      
      try {
        map.repaint = false;
        var z = Math.floor( this._map.zoom );

        for (var i = 0; i < this._layers.length; i++) {
          var layer = this._layers[i];
          var mapboxLayer = map.getLayer(layer.id);
          if ( !mapboxLayer) continue;
          var visibility = visible ? "visible" : "none";

          if ( mapboxLayer.metadata && mapboxLayer.metadata["----original-visibility"] == "none") {
            visibility = "none";
          }

          map.setLayoutProperty(layer.id, "visibility", visibility);
        }
        map.repaint = true;
      } catch (e) {
        console.log(e);
      }
    }
  }


  getOpacity() {
    var map = this._map.map;
    return this._opacity;
  }


  setOpacity(opacity) {
    opacity = opacity != undefined ? opacity : 1;
    if (this._map) {
      var map = this._map.map;
      try {
        map.repaint = false;
        for (var i = 0; i < this._layers.length; i++) {
          var layer = this._layers[i];
          var id = layer.id;
      
          if ( !map.getLayer(id)) return;
      
          switch (layer["type"]) {
            case "line":
              map.setPaintProperty(id, "line-opacity", opacity);
              break;
            case "fill":
              map.setPaintProperty(id, "fill-opacity", opacity);
              break;
          }
      
          if (layer["layout"] && layer["layout"]["icon-image"])
            map.setPaintProperty(id, "icon-opacity", opacity);
          if (layer["layout"] && layer["layout"]["text-field"])
            map.setPaintProperty(id, "text-opacity", opacity);
        }
        map.repaint = true;
      } catch (e) {
        console.log(e);
      }
    }
    this._opacity = opacity;
  }


  get loading() { return this._loading; }

  set loading( loading) {
    this._loading = ( loading ? true : false );
  }

  set loadingState(state) {
    this._state = state;
    
    if ( !GSIBV.CONFIG.ProgressMode )GSIBV.CONFIG.ProgressMode = 'full-righttop';

    if ( GSIBV.CONFIG.ProgressMode == 'none') return;
    
    switch( state ) {
      case "loading":
        //GSIBV.Map.Layer.BinaryVectorTile.showLoading(this);
        if ( GSIBV.CONFIG.ProgressMode == 'righttop') {
          this.showLoading2();
        } else {
          this.showLoading();
        }
        break;

      case "loading2":
        if ( GSIBV.CONFIG.ProgressMode == 'full-righttop') {
          this.showLoading2();
        }
        break;

      case "finish":
      case undefined:
        //GSIBV.Map.Layer.BinaryVectorTile.hideLoading(this);
        this.hideLoading();
        break;
    }
  }

  get langMessage() {

    var result = null;
    var lang = GSIBV.application.lang;
    
    try {
      result = GSIBV.CONFIG.LANG[lang.toUpperCase()].UI.VECTORTILELOADING;
    }catch(e) {

    }
    
    if ( !result ) {
      result = {
        "message1" : "loading",
        "message2" : "loading",
        "cancel" : "cancel"
      };
    }

    return result;
  }

  showLoading() {

    var langMessage = this.langMessage;


    if ( this._loadingContainer2 ) {
      this._loadingContainer2.style.display = 'none';
    }

    var container = this._loadingContainer;
    if ( !container ) {
      container = MA.DOM.create("div");
      MA.DOM.addClass(container,"-gsibv-binarytile-loading-frame");
      container.style.display = 'none';
      var progressBg = MA.DOM.create("div");
      MA.DOM.addClass(progressBg,"progress-bg");

      var progressCurrent = MA.DOM.create("div");
      MA.DOM.addClass(progressCurrent,"progress-current");
      progressCurrent.style.width = '0%';
      

      var progressText = MA.DOM.create("div");
      MA.DOM.addClass(progressText,"progress-text");
      progressText.innerHTML = '0%';

      progressBg.appendChild( progressCurrent );
      progressBg.appendChild( progressText );
      container.appendChild( progressBg );

      var progressMessage = MA.DOM.create("div");
      MA.DOM.addClass(progressMessage,"progress-message");
      progressMessage.innerHTML = langMessage.message1;
      container.appendChild( progressMessage );


      var cancelButton = MA.DOM.create("button");
      MA.DOM.addClass(cancelButton,"progress-cancel-button");
      cancelButton.innerHTML = langMessage.cancel;;
      container.appendChild( cancelButton );
      
      MA.DOM.on( cancelButton, "click", MA.bind( function() {
        
        this.remove();
      }, this ) );

      document.body.appendChild( container);
      this._loadingContainer = container;
    }


    this.updataLoading();
    container.style.display = 'block';
  }

  showLoading2() {
    var langMessage = this.langMessage;

    if ( this._loadingContainer ) {
      this._loadingContainer.style.display = 'none';
    }

    var container = this._loadingContainer2;
    if ( !container ) {
      container = MA.DOM.create("div");
      MA.DOM.addClass(container,"-gsibv-binarytile-loading-frame2");
      container.style.display = 'none';


      var progressCurrent = MA.DOM.create("div");
      MA.DOM.addClass(progressCurrent,"progress-current");
      progressCurrent.style.width = '0%';
      container.appendChild( progressCurrent );


      var progressMessage = MA.DOM.create("div");
      MA.DOM.addClass(progressMessage,"progress-message");
      progressMessage.innerHTML = langMessage.message2;
      container.appendChild( progressMessage );
      /*
      var progressText = MA.DOM.create("div");
      MA.DOM.addClass(progressText,"progress-text");
      progressText.innerHTML = '0%';
      container.appendChild( progressText );
      */

      MA.DOM.select("#main")[0].appendChild(container);
      this._loadingContainer2 = container;
    }


    this.updataLoading();
    container.style.display = 'block';
  }

  updataLoading() {
    
    var total = ( this._queLayerCount != undefined ? this._queLayerCount : 0);
    var current = ( this._layersQue ? total - this._layersQue.length : 0 );
    var percent = Math.floor( current/ total * 100 );
    if ( isNaN(percent) ) percent =0;
    percent +='%';
    if ( this._loadingContainer ) {

      MA.DOM.find( this._loadingContainer, ".progress-current")[0].style.width = percent;
      MA.DOM.find( this._loadingContainer, ".progress-text")[0].innerHTML = percent;
    } 
    if ( this._loadingContainer2 ) {

      MA.DOM.find( this._loadingContainer2, ".progress-current")[0].style.width = percent;
      //MA.DOM.find( this._loadingContainer2, ".progress-text")[0].innerHTML = percent;

    }
  }
  
  hideLoading() {
    
    if ( this._loadingContainer ) {
      //MA.DOM.fadeOut( this._loadingContainer, 300);
      this._loadingContainer.style.display = 'none';
    }
    
    if ( this._loadingContainer2 ) {
      this._loadingContainer2.style.display = 'none';
    }

  }


  _initSource(map, sources, origSourceId ) {

    var tiles = ["https://cyberjapandata.gsi.go.jp/xyz/experimental_bvmap/{z}/{x}/{y}.pbf"];

    if ( sources && sources[ origSourceId] && sources[ origSourceId].type === "vector") {
      if ( sources[ origSourceId].url )
        tiles = [sources[ origSourceId].url ];
      else {
        tiles = sources[origSourceId].tiles;
      }
    }

    this._source = GSIBV.VectorTileSource.Manager.manager.getSource(tiles );

      
    var sourceId = this._source.id;
    var s = JSON.parse(JSON.stringify( this._source.mapboxSource ) );
    const result = sourceId + "-" + s.minzoom + "-" + s.maxzoom;

    if (!map.getSource( result )) {
      //console.log(sourceId + "-" + sources[i].minzoom + "-" + sources[i].maxzoom );
      map.addSource(result, s );
    }

    return result;
    
  }

  _add(map) {
    super._add(map);

    this.fire("loading");
    this.loading = true;
    this.loadingState = "loading";
    
    if ( this._data ) {

      setTimeout(()=>{
        this._onLoad({params:{response:this._data}});
      }, 0);

    } else {
      this._request = new MA.HTTPRequest({
        "type": "json",
        "url": this._url
      });
      this._request.on("load", MA.bind(this._onLoad, this));
      this._request.on("finish", MA.bind(this._onLoadFinish, this));
      this._request.load();
    }

    if (!map.map.getLayer(this.mapid)) {

      map.map.addLayer({
        "id": this.mapid,
        "type": "background",
        "paint": {
          "background-color": "rgba(255,0,0,0)"
        },
        "layout": {
          "visibility": (this._visible ? "visible" : "none")
        }
      });
    }

    return true;
  }

  
  _remove(map) {
    if (!map) return;
    
    if (this._loading) this.fire("finish");
    this.loading = false;
    this.loadingState = undefined;

    if (this._layers) {
      for (var i = 0; i < this._layers.length; i++)
        this._map.map.removeLayer(this._layers[i].id);
    }
    this._layers = [];
    this._layersQue = undefined;
    this._map.map.removeLayer(this.mapid);
    //this._map.map.removeSource(this.mapid);
    super._remove(map);



  }


  _getSpriteId(url) {
    if ( !url ) return undefined;

    if ( !GSIBV.Map.Layer.MapboxStyle.spliteList ) {
      GSIBV.Map.Layer.MapboxStyle.spliteList = {};
    }

    let id = GSIBV.Map.Layer.MapboxStyle.spliteList[url];
    if ( !id ) {
      if ( !GSIBV.Map.Layer.MapboxStyle.spliteListId ) GSIBV.Map.Layer.MapboxStyle.spliteListId = 0;
      GSIBV.Map.Layer.MapboxStyle.spliteListId++;
      id = "MapboxStyle" + GSIBV.Map.Layer.MapboxStyle.spliteListId;
      GSIBV.Map.Layer.MapboxStyle.spliteList[url] = id;
    }

    return id;
  }

  getSliteManager(map) {

    if ( !GSIBV.Map.Layer.MapboxStyle.spriteManager ) {
      GSIBV.Map.Layer.MapboxStyle.spriteManager = new GSIBV.Map.SpriteManager();
      const spriteManager = GSIBV.Map.Layer.MapboxStyle.spriteManager;
      
      spriteManager.on("load", () => {
        var list = spriteManager.getList();

        for( let i=0; i<list.length; i++ ) {
          const item = list[i];
          const imageId = GSIBV.Map.SpriteManager.spriteId( item.id, item.info.id );
          if (map.hasImage(imageId)) continue;
          map.addImage(imageId, item.img, { pixelRatioany: 1 })
        }
      });
    }

    return GSIBV.Map.Layer.MapboxStyle.spriteManager;
  }

  _onLoad(e) {
    const json = e.params.response;
    var map = this._map.map;

    this._layers = [];
    this._layersQue = [];

    const spriteId = this._getSpriteId(json.sprite);
    const spriteManager = this.getSliteManager(map);

    if ( spriteId ) {
      spriteManager.add(spriteId, "", json.sprite);
    }

    const sourceIdHash = {};
    for( let i=0; i<json.layers.length; i++ ) {
      let sourceId = json.layers[i].source;
      if ( !sourceId ) {
        sourceId = "";
        json.layers[i].source = "";
      }
      if ( sourceIdHash[sourceId] ) continue;
      sourceIdHash[sourceId] = this._initSource( map, json.sources, sourceId);
    }


    //if (!map.map.getSource(sourceId + "-" + s.minzoom + "-" + s.maxzoom )) {


    var opacity = (this._opacity != undefined ? this._opacity : 1);
    for( let i=0; i<json.layers.length; i++ ) {
      const layer = json.layers[i];
      layer.id =this.mapid + "-mapboxstyle-" + i;
      layer.source = sourceIdHash[ layer.source];

      if (!layer.layout) layer.layout = {};
      if (!layer.paint) layer.paint = {};
      if (!layer.metadata) layer.metadata = {};


      if ( spriteId && layer.layout["icon-image"]) {
        layer.layout["icon-image"] = GSIBV.Map.SpriteManager.spriteId( spriteId, layer.layout["icon-image"] );
      }

      const visibility = layer.layout["visibility"];

      layer.metadata["----original-visibility"] = visibility;

      layer.layout["visibility"] = (visibility != "none" && this._visible ? "visible" : "none");

      if (opacity < 1) {
        if (!layer.paint) layer.paint = {};

        switch (layer["type"]) {
          case "line":
            layer.paint["line-opacity"] = opacity;
            break;
          case "fill":
            layer.paint["fill-opacity"] = opacity;
            break;
          case "symbol":
            layer.paint["icon-opacity"] = opacity;
            layer.paint["text-opacity"] = opacity;
            break;
        }
      }

      

      //map.addLayer(layer, this.mapid);
      this._layersQue.push(layer);

    }
    
    /*
    if (this._layers.length > 0)
      map.moveLayer(this.mapid, this._layers[0].id);
    */
   if (this._layersQue.length > 0) {
     this._queLayerCount = this._layersQue.length;
    this._addNext();
   } else {
    this.loading = false;
    this.loadingState = "finish";
    this.fire("finish");

   }

  }

  _addNext(zoom) {
    if (this._timerId) clearTimeout(this._timerId);
    this._timerId = null;

    var map = this._map.map;
    
    var max = GSIBV.CONFIG.LayerAppend[( zoom != undefined ? "count" : "count2" )];
    //var lastIndex = currentIndex + max;
    var interval = GSIBV.CONFIG.LayerAppend[( zoom != undefined ? "interval" : "interval2" )];
    var addedcount = 0;
    
    //map.repaint = false;

    var visible = this.getVisible() ;


    if ( this._layersQue.length > 0 ) {
      for (let i=0; i<max; i++) {
        const layer = this._layersQue.shift();

        map.addLayer(layer, this.mapid);
        this._layers.push(layer);
        if ( this._layersQue.length <= 0 ) {
          break;
        }
      }
    }
    this.updataLoading();


    if ( this._layersQue.length > 0 ) {
      this._timerId = setTimeout(MA.bind(this._addNext,this), interval, zoom);
    } else {
      this.loading = false;
      this.loadingState = "finish";
      this.fire("finish");

    }

  }

  _onLoadFinish(e) {

  }


  _moveToFront() {
    var map = this._map.map;
    map.repaint = false;
    map.moveLayer(this.mapid);


    if (!this._layers) return;

    for (var i = 0; i < this._layers.length; i++) {
      if ( map.getLayer(this._layers[i].id)) {
        map.moveLayer(this._layers[i].id);
      }
    }

    map.repaint = true;
    //this._map.map.moveLayer( this.mapid);
  }


};