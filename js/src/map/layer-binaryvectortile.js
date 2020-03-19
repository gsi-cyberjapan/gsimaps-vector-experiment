GSIBV.Map.Layer.TYPES["binaryvector"] = "バイナリタイル";
GSIBV.Map.Layer.FILTERS.push(function (l) {

  if (l._type && l._type == "binaryvector") {
    return new GSIBV.Map.Layer.BinaryVectorTile({
      "id": l.id,
      "title": l.title,
      "url": l.url,
      "html": l.html,
      "legendUrl": l.legendUrl,
      "minzoom": l.minZoom,
      "maxzoom": l.maxZoom,
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



GSIBV.Map.Layer.BinaryVectorTile = class extends GSIBV.Map.Layer {

  constructor(options) {
    super(options);
    this._type = "binaryvector";
    this._backgroundColor = "rgba(0,0,0,0)";
    this._url = "";
    this._idPrefix = "gsibv-vectortile-layer-";
    if (options) {
      this._title = (options.title ? options.title : "");
      this._url = (options.url ? options.url : "");
      this._isUserFileLayer = ( options.user ? true : false );
      this._maxNativeZoom = options.maxNativeZoom;
    }
  }

  get title() { return this._title; }
  set title(title) {
    this._title = title; 
    if ( this._data ) this._data.title= title;
  }
  get isUserFileLayer() { return this._isUserFileLayer; }
  get data() { return this._data; }
  get url() { return this._url; }
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
    
    var total = ( this.mapboxLayerCount != undefined ? this.mapboxLayerCount : 0);
    var current = ( this.mapboxLayerAddedCount != undefined ? this.mapboxLayerAddedCount : 0);
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
/*
  static showLoading(l) {
    if ( !GSIBV.Map.Layer.BinaryVectorTile._loadingList )
      GSIBV.Map.Layer.BinaryVectorTile._loadingList =[];
    
    var loadingList = GSIBV.Map.Layer.BinaryVectorTile._loadingList;
    
    for( var i=0; i<loadingList.length; i++ ) {
      if ( loadingList[i] == l) {
        return;
      }
    }

    loadingList.push(l);
    
    var container = GSIBV.Map.Layer.BinaryVectorTile._loadingContainer;
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
      progressMessage.innerHTML = 'ベクトルタイルのスタイル情報を地図に追加しています。';
      container.appendChild( progressMessage );


      var cancelButton = MA.DOM.create("button");
      MA.DOM.addClass(cancelButton,"progress-cancel-button");
      cancelButton.innerHTML = '読み込みを中止';
      container.appendChild( cancelButton );
      
      MA.DOM.on( cancelButton, "click", MA.bind( function() {
        var loadingList = [];
        for( var i=0; i< GSIBV.Map.Layer.BinaryVectorTile._loadingList.length; i++ ) {
          loadingList.push( GSIBV.Map.Layer.BinaryVectorTile._loadingList[i] );

        }

        for( var i=0; i< loadingList.length; i++ ) {
          loadingList[i].remove();
        }
      }, this ) );

      document.body.appendChild( container);
      GSIBV.Map.Layer.BinaryVectorTile._loadingContainer = container;
    }


    GSIBV.Map.Layer.BinaryVectorTile.updataLoading();
    MA.DOM.fadeIn( container, 300);

  }

  static updataLoading() {
    var container = GSIBV.Map.Layer.BinaryVectorTile._loadingContainer;
    var loadingList = GSIBV.Map.Layer.BinaryVectorTile._loadingList;
    if ( !container || !loadingList) return;
    
    var total = 0;
    var current = 0;
    for( var i=0; i<loadingList.length; i++ ) {
      var l = loadingList[i];
      total += ( l.mapboxLayerCount != undefined ? l.mapboxLayerCount : 0);
      current += ( l.mapboxLayerAddedCount != undefined ? l.mapboxLayerAddedCount : 0);
      
    }

    var percent = Math.floor( current/ total * 100 );
    if ( isNaN(percent) ) percent =0;
    percent +='%';

    MA.DOM.find( container, ".progress-current")[0].style.width = percent;
    MA.DOM.find( container, ".progress-text")[0].innerHTML = percent;

    //container.innerHTML = Math.floor( current/ total * 100 ) +'%';
  }

  static hideLoading(l) {
    if ( !GSIBV.Map.Layer.BinaryVectorTile._loadingList ) return;

    var loadingList = GSIBV.Map.Layer.BinaryVectorTile._loadingList;
    
    for( var i=0; i<loadingList.length; i++ ) {
      if ( loadingList[i] == l) {
        loadingList.splice( i, 1 );
        break;
      }
    }

    if ( loadingList.length > 0 ) return;

    var container = GSIBV.Map.Layer.BinaryVectorTile._loadingContainer;
    if ( container ) {
      MA.DOM.fadeOut( container, 300);
    }
  }
*/
  set mapboxLayerCount(count) {
    this._mapboxLayerCount = count;
  }

  get mapboxLayerCount() {
    return this._mapboxLayerCount;
  }
  
  get mapboxLayerAddedCount() {
    return this._mapboxLayerAddedCount;
  }

  set mapboxLayerAddedCount(count) {
    this._mapboxLayerAddedCount = count;
    
    //GSIBV.Map.Layer.BinaryVectorTile.updataLoading();
    this.updataLoading();

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
   
    var visibility = visible ? "visible" : "none";
    
    if (this._map) {
      var map = this._map.map;
      
      map.setLayoutProperty(this.mapid, "visibility", visibility);
      map.setLayoutProperty(this.mapid+"-last", "visibility", visibility);

      
      try {
        map.repaint = false;
        var z = Math.floor( this._map.zoom );

        for (var i = 0; i < this._layers.length; i++) {
          var layer = this._layers[i];

          // 20190809 ID8 現在の可視状態に合わせて表示を切り替え
          visibility =  visible ? "visible" : "none";
          if ( visible && !layer.layer.getVisible(z) ) {
            visibility = "none";
          }

          if (layer.list) {
            //if (!layer.added) continue;
            for (var j = 0; j < layer.list.length; j++) {
              var id = layer.list[j].id;
              
              if ( !map.getLayer(id)) continue;
              map.setLayoutProperty(id, "visibility", visibility);
            }
          }
        }
        map.repaint = true;
      } catch (e) {
        console.log(e);
      }
    }
  }

  get viewPoints() {
    return (this._data ? this._data.viewPoints : []);
  }

  getOpacity() {
    var map = this._map.map;
    return this._opacity;
  }

  _setOpacity(map, layer, opacity) {

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

  setOpacity(opacity) {
    opacity = opacity != undefined ? opacity : 1;
    if (this._map) {
      var map = this._map.map;
      try {
        map.repaint = false;
        for (var i = 0; i < this._layers.length; i++) {
          var layer = this._layers[i];
          //if (!layer.added) continue;
          if (layer.list) {
            for (var j = 0; j < layer.list.length; j++) {
              this._setOpacity(map, layer.list[j], opacity);
            }
          }
        }
        map.repaint = true;
      } catch (e) {
        console.log(e);
      }
    }
    this._opacity = opacity;
  }

  _add(map) {
    super._add(map);

    this.fire("loading");
    this.loading = true;
    this.loadingState = "loading";

    if (this._layers) {
      this._mapboxLayerAddedCount = 0
      this.fire("load");
      this._addLayers();

      return true;
    }

    if (this._request) this._request.abort();
    this._request = null;

    if ( !this._data ) {

      this._request = new MA.HTTPRequest({
        url: this._url,
        type: "json"
      });

      this._request.on("load", MA.bind(this._onDataLoad, this));
    }

    //this._timerId = setTimeout( MA.bind(function(){

    //    clearTimeout( this._timerId );
    //    this._timerId = null;
    this._addDummyLayer();
    if ( this._request ) this._request.load();
    
    if ( this._data ) {
      setTimeout( MA.bind(function(){
        this.fire("load");
        this._addLayers();
      },this),1);
    }
    //},this), 100);
    return true;
  }

  _addDummyLayer() {
    var map = this._map;
    if (!map.map.getLayer(this.mapid)) {

      map.map.addLayer({
        "id": this.mapid,
        "type": "background",
        "paint": {
          "background-color": this._backgroundColor
        },
        "layout": {
          "visibility": (this._visible ? "visible" : "none")
        }
      });


      map.map.addLayer({
        "id": this.mapid + "-last",
        "type": "background",
        "paint": {
          "background-color": this._backgroundColor
        },
        "layout": {
          "visibility": (this._visible ? "visible" : "none")
        }
      });

    }

  }

  reload() {
    if ( !this._data) return;
    
    this.fire("loading");
    this.loading = true;
    this.loadingState = "loading";
    this._clear( this._map );
    this._data.reset();
    
    this.fire("load");
    this._addLayers();
  }

  set data ( data ) {
    this._data = data;
    this._data.on("change", MA.bind(this._onDataChange, this));
    if ( this._map ) this._addLayers();
  }

  _onDataLoad(e) {
    this._request.abort();
    this._request = null;

    this.fire("load");
    this._data = new GSIBV.VectorTileData(e.params.response,{
      maxNativeZoom : this._maxNativeZoom
    });
    this._data.on("change", MA.bind(this._onDataChange, this));
    if ( this._title != undefined) this._data.title = this._title;
    this._addLayers();

  }

  _onDataChange(e) {
    var map = this._map.map;
    map.repaint = false;

    if (e.params.removeLayers) {
      var layers = e.params.removeLayers;
      for (var i = 0; i < layers.length; i++) {
        map.removeLayer(layers[i].id);

      }
    }

    if (e.params.addLayers) {
      var layers = e.params.addLayers.layers;
      if (layers) {
        for (var i = 0; i < layers.length; i++) {
          map.addLayer(layers[i], (e.params.addLayers.insertBefore ? e.params.addLayers.insertBefore.id : null));
        }
      }
    }

    map.repaint = true;
  }

  _onLayerChange(l,group, e) {
    //var l = this._findLayer(e.from);
    if (!l) return;
    var map = this._map.map;
    //map.repaint = false;
    
    if (l.list) {
      for (var i = 0; i < l.list.length; i++) {
        var id = l.list[i].id;
        if ( !l.list[i].metadata) l.list[i].metadata = {};
        l.list[i].metadata.removed = true;
        if (!id) continue;
        if (!map.getLayer(id)) continue;
        map.removeLayer(id);
      }
      delete l["list"];
    }
    //l.visible = e.from.visible;

    var mapboxLayerList = e.from.refreshMapboxLayers();
    
    l.list = [];

    var nextId = this._getNextLayerId(l);
    for (var i = 0; i < mapboxLayerList.length; i++) {
      
      var mapboxLayer = mapboxLayerList[i];

      if ( !group.filter(mapboxLayer)) {
        continue;
      }

      if ( !mapboxLayer.metadata) mapboxLayer.metadata = {};
      mapboxLayer.metadata.added = true;

      mapboxLayer.id = MA.getId( this._idPrefix);
      
      if ( group.additionalFilter ) {
        mapboxLayer.filter = ["all",
          group.additionalFilter,mapboxLayer.filter  ]
      }
      
      l.list.push( mapboxLayer);
      map.addLayer(mapboxLayer, nextId);
    }
    
    //map.repaint = true;


  }

  _getNextLayerId(l) {
    if (!l.next) return null;

    var map = this._map.map;

    if (l.next.list && l.next.list.length > 0) {
      for (var i = 0; i < l.next.list.length; i++) {
        var id = l.next.list[i].id
        if (map.getLayer(id)) {
          return id;
        }
      }
    }
    if (l.next)
      return this._getNextLayerId(l.next);
    else return null;

  }
  
  _makeMapboxLayer(group, layer) {
    var layerInfo = { "visible": layer.visible, layer: layer };
    var list = JSON.parse(JSON.stringify(layer.mapBoxLayers));
    layerInfo.list = [];
    for( var i=0; i<list.length; i++) {

      var mapboxLayer = list[i];

      if ( !group.filter(mapboxLayer)) {
        continue;
      }

      if ( group.additionalFilter ) {
        mapboxLayer.filter = ["all",
          group.additionalFilter,mapboxLayer.filter  ]
      }
      layerInfo.list.push(mapboxLayer);
      mapboxLayer.id = MA.getId( this._idPrefix );
    }

    return layerInfo;
  }

  _addLayers() {
    try {

      var map = this._map.map;
      this._addDummyLayer();

      // ソースを追加
      var source = this._data.source;
      var sourceId = source.id;
      var s = JSON.parse(JSON.stringify( source.mapboxSource ) );
      if (!map.getSource(sourceId + "-" + s.minzoom + "-" + s.maxzoom )) {
        //console.log(sourceId + "-" + sources[i].minzoom + "-" + sources[i].maxzoom );
        map.addSource(sourceId + "-" + s.minzoom + "-" + s.maxzoom, s );
      }
      /*
      var sources = source.mapboxSource;
      var sourceId = source.id;
      for( var i=0; i<sources.length; i++ ) {
        var s = JSON.parse(JSON.stringify( sources[i] ) );
        if (!map.getSource(sourceId + "-" + s.minzoom + "-" + s.maxzoom )) {
          //console.log(sourceId + "-" + sources[i].minzoom + "-" + sources[i].maxzoom );
          map.addSource(sourceId + "-" + s.minzoom + "-" + s.maxzoom, s );
        }
      } 
      */
      
      // 描画順に並んだレイヤーリスト生成
      if (!this._groupList) {
        this._groupList = this._data.groupList;
        this._layers = [];
        var prefLayer = null;
        for (var i = 0; i < this._groupList.list.length; i++) {
          var g = this._groupList.list[i];
          for (var j = 0; j < g.items.length; j++) {
            var item = g.items[j];
            
            var layerInfo = this._makeMapboxLayer(g,item);
            layerInfo.layer.on("change", MA.bind(this._onLayerChange, this, layerInfo, g));
            this._layers.push(layerInfo);
            if (prefLayer) {
              prefLayer.next = layerInfo;
            }
            prefLayer = layerInfo;
          }
        }
      }


      // キューを作成
      this._addMapboxLayerList = [];

      for (var i = 0; i < this._layers.length; i++) {
        var layer = this._layers[i];
        
        if ( !layer.list || !layer.visible) continue;
        
        for (var j = 0; j < layer.list.length; j++) {
          var l = layer.list[j];
          if (!l.id ||  ( l.metadata && l.metadata["added"] ) ) {
            continue
          }

          if ( l.layout && l.layout["visibility"] == "none") continue;

          this._addMapboxLayerList.push({
            "mapboxlayer" : l,
            "layer" : layer
          });
        }


      }


      // 読み込み開始
      
      this._startTime = (new Date()).getTime();
      this.mapboxLayerCount = this._addMapboxLayerList.length;
      this.mapboxLayerAddedCount = 0;
      
      if (this._layers.length > 0) {
        this._addNext(Math.floor( map.getZoom() ),0);
        
        console.log( 
          "start layers(" + this._addMapboxLayerList.length + ")"  );

      }

    } catch (err) {
      console.log(err);
    }

  }

  _addNext( zoom, currentIndex ) {
    if (this._timerId) clearTimeout(this._timerId);
    this._timerId = null;

    var map = this._map.map;
    
    var max = GSIBV.CONFIG.LayerAppend[( zoom != undefined ? "count" : "count2" )];
    //var lastIndex = currentIndex + max;
    var interval = GSIBV.CONFIG.LayerAppend[( zoom != undefined ? "interval" : "interval2" )];
    var addedcount = 0;
    
    //map.repaint = false;

    var visible = this.getVisible() ;


    for (; /*currentIndex < lastIndex*/ addedcount <max && currentIndex < this._addMapboxLayerList.length; currentIndex++) {
      
      var layerInfo = this._addMapboxLayerList[currentIndex];
      var l = layerInfo.mapboxlayer;

      if (!layerInfo.layer.visible ) {
        this.mapboxLayerAddedCount ++;
        continue;
      }

      if ( l.metadata && ( l.metadata["added"] || l.metadata["removed"] ) )  {
        if ( zoom != undefined ) {
          this.mapboxLayerAddedCount ++;
        }
        continue;
      }

      if ( zoom != undefined) {
        if ( l.minzoom > zoom || l.maxzoom-1 < zoom  ) {
          continue;
        }
      }

      // visibleの設定
      if ( !l["layout"]) l["layout"] = {};

      l["layout"]["visibility"] =  ( visible ? "visible" : "none");

      // opacityの設定
      var opacity = this._opacity != undefined ? this._opacity : 1;

      if (opacity < 1) {
        if (!l.paint) l.paint = {};

        switch (l["type"]) {
          case "line":
            l.paint["line-opacity"] = opacity;
            break;
          case "fill":
            l.paint["fill-opacity"] = opacity;
            break;
        }

        if (l["layout"] && l["layout"]["icon-image"])
          l.paint["icon-opacity"] = opacity;

        if (l["layout"] && l["layout"]["text-field"])
          l.paint["text-opacity"] = opacity;
      }

      if ( !l.metadata ) l.metadata={};
      l.metadata["added"] = 1;

      this.mapboxLayerAddedCount ++;
      addedcount++;

      var nextId = ( zoom ? undefined : this._getNextMapboxId(currentIndex) );
      if ( nextId == undefined ) nextId = this.mapid + "-last";
      map.addLayer(l, nextId);
    }
    
    //map.repaint = true;

    if (currentIndex >= this._addMapboxLayerList.length ) {

      if ( this._checkAdded() ) {
        // 全て終わり
        this.loading = false;
        this.loadingState = "finish";
        console.log( 
          "finish layers(" + this._addMapboxLayerList.length + ")" , 
          ( (new Date()).getTime() - this._startTime ) +"ms"
        );
        this.fire("finish");
        return;
      } else {
        //対象ズームのデータ終わり
        this.fire("breakpoint");
        this.loadingState = "loading2";
        console.log( 
          "added zl:" + zoom + " layers(" + this.mapboxLayerAddedCount + ")" , 
          ( (new Date()).getTime() - this._startTime ) +"ms"
        );
        zoom = undefined;
        currentIndex = 0;
        interval = 0;
      }
    }

    this._timerId = setTimeout(MA.bind(this._addNext,this), interval, zoom, currentIndex);

  }

  _getNextMapboxId( idx ) {

    for( var i=idx+1; i< this._addMapboxLayerList.length; i++ ) {
      
      var layerInfo = this._addMapboxLayerList[i];
      var l = layerInfo.mapboxlayer;

      if  ( l.metadata && l.metadata["added"]) {
        return l.id;
      }
    }

    return undefined;

  }

  _checkAdded() {
    for( var i=0; i< this._addMapboxLayerList.length; i++ ) {
      
      var layerInfo = this._addMapboxLayerList[i];
      var l = layerInfo.mapboxlayer;

      if (!layerInfo.layer.visible ) {
        continue;
      }
      if  ( !l.metadata || !l.metadata["added"]) {
        return false;
      }
    }

    return true;
  }

  _getSourceId(tiles) {

    if (!tiles || tiles.length <= 0) return "unknown";


    if (!GSIBV.Map.Layer.BinaryVectorTile._sourceId)
      GSIBV.Map.Layer.BinaryVectorTile._sourceId = {};

    for (var key in GSIBV.Map.Layer.BinaryVectorTile._sourceId) {
      if (GSIBV.Map.Layer.BinaryVectorTile._sourceId[key] == tiles[0]) {
        return key;
      }
    }

    if (!GSIBV.Map.Layer.BinaryVectorTile._sourceIdInc)
      GSIBV.Map.Layer.BinaryVectorTile._sourceIdInc = 0;
    GSIBV.Map.Layer.BinaryVectorTile._sourceIdInc++;

    var id = "gsibv-binaryvectortile-" + GSIBV.Map.Layer.BinaryVectorTile._sourceIdInc;
    GSIBV.Map.Layer.BinaryVectorTile._sourceId[id] = tiles[0];

    return id;
  }

  _removeAllLayers(map) {
    try {

      for (var i = 0; i < this._layers.length; i++) {
        var layer = this._layers[i];
        for (var j = 0; j < layer.list.length; j++) {
          var l = layer.list[j];
          var id = l.id;
          if ( l.metadata ) delete l.metadata["added"];
          if (!id) continue;
          if (!map.map.getLayer(id)) continue;
          map.map.removeLayer(id);
        }
      }
    } catch (e) {
      console.log(e);
    }

    if (!map.map.getLayer(this.mapid)) map.map.removeLayer(this.mapid);
    if (!map.map.getLayer(this.mapid + "-last")) map.map.removeLayer(this.mapid + "-last");

  }

  _clear(map) {
    this._removeAllLayers(map);
    this._groupList = undefined;
    this._layers = undefined;
  }

  _remove(map) {

    if (this._timerId) clearTimeout(this._timerId);
    this._timerId = null;
    if (this._request) this._request.abort();
    this._request = null;
    if (!map) return;

    if (this._loading) this.fire("finish");
    this.loading = false;
    this.loadingState = undefined;

    /*
    map.map.repaint = false;

    try {
      for (var i = 0; i < this._layers.length; i++) {
        var layer = this._layers[i];
        if (layer.added) {
          if (!layer.list) {
            layer.added = false;
            continue;
          }
          for (var j = 0; j < layer.list.length; j++) {
            if (!layer.list[j].id) continue;
            map.map.removeLayer(layer.list[j].id);
          }
        }
        layer.added = false;

      }
    } catch (e) { }

    try {
      map.map.removeLayer(this.mapid);
    } catch (e) { }
    try {
      map.map.removeLayer(this.mapid + "-last");
    } catch (e) { }
    map.map.repaint = true;
    */
   
    this._removeAllLayers(map);
    //map.map.removeLayer( this.mapid);
    //map.map.removeSource( this.mapid);

    super._remove(map);
  }

  _moveToFront() {
    var map = this._map.map;
    map.repaint = false;
    map.moveLayer(this.mapid);
    if (this._layers) {
      for (var i = 0; i < this._layers.length; i++) {
        var layer = this._layers[i];
        /*
        if (layer.added) {
          if (!layer.list) {
            layer.added = false;
            continue;
          }
          for (var j = 0; j < layer.list.length; j++) {
            if (!layer.list[j].id) continue;
            map.moveLayer(layer.list[j].id);
          }
        }
        */
        if (!layer.list) continue;
        for (var j = 0; j < layer.list.length; j++) {
          var id = layer.list[j].id
          if (!id) continue;
          if (!map.getLayer(id)) continue;
          map.moveLayer(id);
        }

      }
    }
    map.moveLayer(this.mapid + "-last");

    map.repaint = true;

  }
}