

GSIBV.Map.HanreiLoader = class extends MA.Class.Base {
  constructor(map, hanreiList) {
    super();
    this._map = map;
    this._hanreiList = hanreiList;
    this._map.map.on("click", MA.bind(this._onClick, this));
  }

  _onClick(evt) {
    var layerList = this._map.layerList;
    if ( !layerList ) return;

    if ( !this._layerListChangeHandler) {
      this._layerListChangeHandler =MA.bind( function(){
        if ( this._popup ) {
          try {
            this._popup.remove();
          }catch(ex) {}
          this._popup = null;
        }
      },this );
      layerList.on("change", this._layerListChangeHandler);
    }

    var hanrei = null;
    var layer = null;
    for( var i=0; i<layerList.length; i++ ) {
      layer = layerList.get(i);
      var id = layer.id;
      if ( this._hanreiList[id] ) {
        hanrei = this._hanreiList[id];
        break;
      }
    }
    if ( !hanrei ) return;
    if ( hanrei.layer ) layer = hanrei.layer;
    
    var zoom = GSIBV.Map.Layer.TileImage.getZoom (this._map.map);
    if ( layer.maxNativeZoom < zoom ) zoom = layer.maxNativeZoom;
    this._load( layer, hanrei, evt.lngLat, zoom );  
  
  }

  _load (layer, hanrei, latlng, zoom) {
    
    this._clearImageRGBLoader();
    if ( !this._tileImageRGBLoader ) {
      this._createImageRGBLoader();
    }

    if ( !this._targetHanrei || this._targetHanrei.id != layer.id ) {
      
      this._targetHanrei = {
        "id" : layer.id,
        "hanrei" : hanrei
      };

      if ( !hanrei.data ) {
        this._loadData(this._targetHanrei);
      }
    }
    this._tileImageRGBLoader.load( latlng, zoom, layer);

  }
  
  _loadData(target) {
    var req = new MA.HTTPRequest({
      "url": target.hanrei.url,
      "type": "text"
    });

    req.on("load", MA.bind(function(target,evt){
      try {
        target.hanrei.data = JSON.parse(evt.params.response);
      }catch( e) {
        target.hanrei.data = this._csvToData(evt.params.response);
        if ( !target.hanrei.data) return;
      }
      if ( this._waitingData && this._waitingData.id == target.id && this._targetHanrei && this._targetHanrei.id == target.id ) {
        this._showPopup( this._waitingData.color, this._waitingData.latlng)
      }


    }, this, target));

    req.load();

  }
  
  _csvToData(txt) {
    var isValid = function(item) {
      var pattern = /^([1-9]\d*|0)$/;
      if( item.r == undefined || ! pattern.test(item.r)) return false;
      if( item.g == undefined || ! pattern.test(item.g) ) return false;
      if( item.b == undefined || ! pattern.test(item.b) ) return false;
      item.r = parseInt( item.r);
      item.g = parseInt( item.g);
      item.b = parseInt( item.b);
      return true;
    };
    var data = [];
    var arr = MA.Util.parseCSV( txt, ",");
    for( var i=0; i<arr.length; i++ ) {
      var line = arr[i];
      if( line.length < 5) continue;
      var item = {
        "title" : line[0],
        "description" : line[1],
        "r" : line[2],
        "g" : line[3],
        "b" : line[4]
      };
      if( isValid(item))data.push( item );
      
    }
    if ( data.length > 0 ) {
      return data;
    } else {
      return undefined;
    }
  }

  _showPopup(color, latlng) {
    
    var data = this._targetHanrei.hanrei.data;

    if ( !data ) {
      this._waitingData = {
        "id" : this._targetHanrei.id,
        "color" : color,
        "latlng" : latlng
      };
      return;
    }


    for( var i=0; i<data.length; i++) {
      var item = data[i];
      if ( item.r == color.r && item.g == color.g && item.b == color.b) {
        
        var html = "<h3>" + item.title + "</h3>";
        if ( item.description && item.description != "")
          html+="<div>" + item.description + "</div>";

        html+="<div>" + "r:"+ color.r + "," + "g:"+ color.g + "," + "b:"+ color.b + "</div>";
        
        this._popup = new mapboxgl.Popup({closeOnClick: true})
          .setLngLat([latlng.lng, latlng.lat])
          .setHTML(html)
          .addTo(this._map.map);
        return;
      }
    }
    
    
    var html ='<div>' + "r:"+ color.r + "," + "g:"+ color.g + "," + "b:"+ color.b + "</div>";
    
    this._popup = new mapboxgl.Popup({closeOnClick: true})
      .setLngLat([latlng.lng, latlng.lat])
      .setHTML(html)
      .addTo(this._map.map);

  }

  _createImageRGBLoader () {
    this._tileImageRGBLoader = new GSIBV.Map.HanreiLoaderTileImageRGBLoader(this._map);
    this._tileImageRGBLoader.on("load", MA.bind(this._onImageRGBLoad,this));
  }
  
  
  _clearImageRGBLoader() {
    if( this._tileImageRGBLoader ) {
      this._tileImageRGBLoader.cancel();
      this._tileImageRGBLoader = null;
    }
  }

  _onImageRGBLoad( evt ) {
    
    if ( this._targetHanrei && this._targetHanrei.id == evt.params.layer.id) {
      this._showPopup(evt.params.color,evt.params.latlng);
    }
  }

};





/************************************************************************
 GSIBV.Map.HanreiLoaderTileImageRGBLoader
************************************************************************/
GSIBV.Map.HanreiLoaderTileImageRGBLoader = class extends MA.Class.Base {

  constructor(map, options) {
    super();
    this._map = map;

  }

  load (latlng, zoom, layer) {

    this._destroyImage();
    this._latlng = latlng;
    this._zoom = zoom;
    this._layer = layer;

    this._load();
  }

  _destroyImage () {
    if (this._img) {

      this._img.removeEventListener("load", this._imgLoadHandler);
      this._img.removeEventListener("error", this._imgLoadErrorHandler);

      this._imgLoadHandler = null;
      this._imgLoadErrorHandler = null;
      delete this._img;
      this._img = null;
    }
  }

  cancel () {
    this._destroyImage();

  }


  _load () {
    this._destroyImage();

    var tileInfo = this._getTileInfo(this._latlng.lat, this._latlng.lng, this._zoom);
    this._img = document.createElement("img");
    this._img.setAttribute("crossorigin", "anonymous");

    this._imgLoadHandler = MA.bind(this._onImgLoad, this, tileInfo, this._img);
    this._imgLoadErrorHandler = MA.bind(this._onImgLoadError, this, tileInfo, this._img);

    this._img.addEventListener("load", this._imgLoadHandler);
    this._img.addEventListener("error", this._imgLoadErrorHandler);
    
    function makeUrl(url, zoom, tileInfo) {
      var result = url.replace("{x}", tileInfo.x);
      result = result.replace("{y}", tileInfo.y);
      result = result.replace("{z}", zoom);
      return result;
    }
    var url = this._layer.url;
    if ( url.slice(0,2) == "//") {
      url = "https:" + url;
    }
    this._img.src = makeUrl(url, this._zoom, tileInfo);

  }

  _onImgLoad (tileInfo, img) {


    if (!this._canvas) {
      this._canvas = document.createElement("canvas");
      this._canvas.width = 256;
      this._canvas.height = 256;
    }
    var ctx = this._canvas.getContext("2d");
    ctx.clearRect(0,0,256,256);
    ctx.beginPath();

    ctx.drawImage(img, 0, 0);

    var imgData = ctx.getImageData(0, 0, 256, 256);
    var idx = (tileInfo.pY * 256 * 4) + (tileInfo.pX * 4);
    var r = imgData.data[idx + 0];
    var g = imgData.data[idx + 1];
    var b = imgData.data[idx + 2];
    var a = imgData.data[idx + 3];
    
    if ( a == 0 ) {
      return;
    }

    this.fire("load", {
      "color":{"r":r, "g":g, "b":b},
      "layer" : this._layer,
      "latlng" : this._latlng,
      "zoom" : this._zoom
    });
  }

  _onImgLoadError (url, current, tileInfo, img) {
  }



  _getTileInfo ( lat, lng, z ) {
    var lng_rad = lng * Math.PI / 180;
    var R = 128 / Math.PI;
    var worldCoordX = R * (lng_rad + Math.PI);
    var pixelCoordX = worldCoordX * Math.pow(2, z);
    var tileCoordX = Math.floor(pixelCoordX / 256);

    var lat_rad = lat * Math.PI / 180;
    var worldCoordY = - R / 2 * Math.log((1 + Math.sin(lat_rad)) / (1 - Math.sin(lat_rad))) + 128;
    var pixelCoordY = worldCoordY * Math.pow(2, z);
    var tileCoordY = Math.floor(pixelCoordY / 256);

    return {
      x: tileCoordX,
      y: tileCoordY,
      pX: Math.floor(pixelCoordX - tileCoordX * 256),
      pY: Math.floor(pixelCoordY - tileCoordY * 256)
    };

  }

};