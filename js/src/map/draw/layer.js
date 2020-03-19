
GSIBV.Map.Draw.Layer = class extends GSIBV.Map.Layer {

  constructor(id, featureCollection, options) {
    super(options);
    this._id = id;
    this._type = "draw";
    this._featureCollection = featureCollection;
    this._layers = [];
  }

  get tileSize() { return this._tileSize; }


  getVisible() {
    var map = this._map.map;
    return (map.getLayoutProperty(this.mapid, "visibility") == "visible");
  }

  setVisible(visible) {
    var map = this._map.map;
    if ( !map.getLayer(this.mapid))return;
    map.setLayoutProperty(this.mapid, "visibility", visible ? "visible" : "none");
    if (!this._layers) return;
    for (var i = 0; i < this._layers.length; i++) {
      map.setLayoutProperty(this._layers[i].id, "visibility", visible ? "visible" : "none");
    }

  }

  get featureCollection() {
    return this._featureCollection;
  }

  update() {
    if ( !this._map) return;
    var map = this._map.map;

    var source = map.getSource(this.mapid);
    if ( !source ) {
      this._initializeLayer();
      source = map.getSource(this.mapid);
    }
    
    if ( this._featureCollection.length <= 0 ) {
      this._destroyLayers();
    } else {
      
      if (this._layers) {
        //for (var i = 0; i < this._layers.length; i++)
          //this._map.map.removeLayer(this._layers[i].id);
        //this._layers = undefined;

      }

      var geoJSON = this._featureCollection.toMapboxGeoJSON();


      source.setData( this._initGeoJSON(geoJSON) );
      

      //this._addLayers();
    }

    map.repaint = true;
  }

  _initializeLayer() {
    if ( this._featureCollection.length <= 0 ) return;
    var map = this._map.map;

    if (!map.getLayer(this.mapid)) {

      map.addLayer({
        "id": this.mapid,
        "type": "background",
        "paint": {
          "background-color": "rgba(255,255,255,0)"
        },
        "layout": {
          "visibility": (this._visible ? "visible" : "none")
        }
      });

      this._addToMap();

    }
  }

  _add(map) {
    super._add(map);
    this._initializeLayer();
      /*
      map.map.addLayer({
        "id": this.mapid,
        "type": "background",
        "paint": {
          "background-color": "rgba(255,255,255,0.5)"
        },
        "layout": {
          "visibility": (this._visible ? "visible" : "none")
        }


      });
      */

    return true;
  }

  _addToMap() {
    
    if ( this._featureCollection.length <= 0 ) return;

    var geoJSON = this._featureCollection.toMapboxGeoJSON();
    var map = this._map.map;
    map.addSource(this.mapid, {
      "type": "geojson",
      "data": this._initGeoJSON(geoJSON)
    });

    this._addLayers();
  }
  
  _initGeoJSON(geoJSON) {
    var loadIcons = [];
    var imageManager = GSIBV.Map.ImageManager.instance;

    for( var i=0; i<geoJSON.features.length; i++ ) {
      var feature = geoJSON.features[i];
      switch( feature.properties["-sakuzu-type"]) {
        case "Point":
          if ( feature.properties["-sakuzu-marker-type"] == "Icon") {
            
            var icon = feature.properties["_iconUrl"];
            if (!imageManager.has(icon)) {
              loadIcons.push(icon);
            } else {
              this._setMarkerIconInfo(feature, feature.properties["_iconUrl"]);
            }
          } else if ( feature.properties["-sakuzu-marker-type"] == "Circle") {
            
          } else if ( feature.properties["-sakuzu-marker-type"] == "DivIcon") {
            if ( !this._textManager )
              this._textManager = new GSIBV.Map.Draw.Layer.TextToCanvasManager(this._map.map);
            this._textManager.set( feature.properties["-sakuzu-id"], {
              "text" : feature.properties["_text"],
              "size" : feature.properties["_textSize"],
              "color" : feature.properties["_color"],
              "backgroundColor" : feature.properties["_backgroundColor"],
              "italic" : feature.properties["_italic"],
              "bold" : feature.properties["_bold"],
              "underline" : feature.properties["_underline"]
            });

          } else if ( feature.properties["-sakuzu-marker-type"] == "CircleMarker") {
            if ( !this._circleManager )
              this._circleManager = new GSIBV.Map.Draw.Layer.CircleToCanvasManager(this._map.map);
            this._circleManager.set( feature.properties["-sakuzu-id"], {
              "radius" : feature.properties["_radius"],
              "lineColor" : feature.properties["_lineColor"],
              "weight" : feature.properties["_weight"],
              "lineOpacity" : feature.properties["_lineOpacity"],
              "lineDashArray" : feature.properties["_lineDashArray"],
              "backgroundOpacity" : feature.properties["_backgroundOpacity"],
              "backgroundColor" : feature.properties["_backgroundColor"],
              "weight" : feature.properties["_weight"]
            });

          }
          break;
      }
    }

    if (loadIcons.length > 0) {
      var hash = {};
      var loadIcons2 = loadIcons;
      loadIcons = [];
      for (var i = 0; i < loadIcons2.length; i++) {
        var url = loadIcons2[i];
        if ( !hash[url]) loadIcons.push( url);
        hash[url] = true;
      }

      if ( this._iconLoadHandler ) imageManager.off("load", this._iconLoadHandler);
      if ( this._iconLoadErrorHandler) imageManager.off("error", this._iconLoadErrorHandler);
      this._iconLoadHandler = MA.bind(this._onIconLoad, this, loadIcons,geoJSON);
      this._iconLoadErrorHandler = MA.bind(this._onIconLoadError, this, loadIcons,geoJSON);
      imageManager.on("load", this._iconLoadHandler);
      imageManager.on("error", this._iconLoadErrorHandler);

      for (var i = 0; i < loadIcons.length; i++) {
        var url = loadIcons[i];
        imageManager.load(url);
      }
   
    }

    return geoJSON;
  }

  _setMarkerIconInfo(feature, url) {
    if ( !url )return;
    var imageManager = GSIBV.Map.ImageManager.instance;
    var image = imageManager.getImage(url);
    if ( !image )return;
    feature.properties["_iconScale"] = 1;
    if ( feature.properties["_iconSize"]) {
      feature.properties["_iconScale"] = feature.properties["_iconSize"][0] / image.width;
    }
  
  }

  _checkIconLoad( url, loadIcons, geoJSON ) {
    for (var i = 0; i < loadIcons.length; i++) {
      if (loadIcons[i] == url) {
        loadIcons.splice(i, 1);
        break;
      }
    }
    if (loadIcons.length <= 0) {
      var imageManager = GSIBV.Map.ImageManager.instance;
      imageManager.off("load", this._iconLoadHandler);
      imageManager.off("error", this._iconLoadErrorHandler);

      for( var i=0; i<geoJSON.features.length; i++ ) {
        var feature = geoJSON.features[i];
        if ( feature.properties ) {
          this._setMarkerIconInfo(feature, feature.properties["_iconUrl"]);
        }
      }
      var source = this._map.map.getSource(this.mapid);
      source.setData(geoJSON);
    }
  }
  
  _onIconLoad(loadIcons,geoJSON, e) {
    if ( !e.params) return;
    var url = e.params.url;
    this._checkIconLoad( url, loadIcons,geoJSON);
  }

  _onIconLoadError(loadIcons,geoJSON, e) {
    var url = e.params.url;
    this._checkIconLoad( url, loadIcons,geoJSON);
  }

  _setSymbolImage() {

    var map = this._map.map;

   // map.setLayoutProperty(this.mapid + "-symbol", "icon-image", ["concat", "-gsibv-image-", ["get", "_iconUrl"]])

  }

  _addPolygonLayer() {
    var layer = {
      "filter" : ["==", "-sakuzu-type", "Polygon"],
      "id": this.mapid + "-fill",
      "source": this.mapid,
      "type": "fill",
      "paint": {
        "fill-color": ["case", ["has", "_fillColor"], ["get", "_fillColor"], "rgba(0,0,0,0)"]
      }
    };
    this._layers.push(layer);
  }

  _addLineLayer() {
    var line = {
      "source": this.mapid,
      "type": "line",
      "paint": {
        "line-width": ["case", ["has", "_weight"], ["get", "_weight"], 0],
        "line-color": ["case", ["has", "_color"], ["get", "_color"], "rgba(0,0,0,0)"]
      },
      "layout" : {
        "line-cap" : "round",
        "line-join" : "round"
      }
    };


    var noDashArrayLine = JSON.parse(JSON.stringify(line)); 
    noDashArrayLine["id"] = this.mapid + "-line-0";
    noDashArrayLine["filter"] = ["==", "_dashArray", 0 ];
    this._layers.push(noDashArrayLine);


    var dashArrayLine = JSON.parse(JSON.stringify(line));
    dashArrayLine["id"] = this.mapid + "-line-1";
    dashArrayLine["filter"] = ["==", "_dashArray", 1 ];
    dashArrayLine["paint"]["line-dasharray"] = [4,2];
    this._layers.push(dashArrayLine);

    var dotArrayLine = JSON.parse(JSON.stringify(line));
    dotArrayLine["id"] = this.mapid + "-line-2";
    dotArrayLine["filter"] = ["==", "_dashArray", 2 ];
    dotArrayLine["paint"]["line-dasharray"] = [0,2];
    this._layers.push(dotArrayLine);
  }

  _addCircleMarkerLayer2() {
    var layer = {
      "filter" : ["all",["==", "-sakuzu-type", "Point"],["==", "-sakuzu-marker-type", "CircleMarker"]],
      "id": this.mapid + "-circlemarker",
      "source": this.mapid,
      "type": "circle",
      "paint": {
        "circle-stroke-width": ["case", ["has", "_weight"], ["get", "_weight"], 0],
        "circle-stroke-color": ["case", ["has", "_color"], ["get", "_color"], "rgba(0,0,0,0)"],
        "circle-color": ["case", ["has", "_fillColor"], ["get", "_fillColor"], "rgba(0,0,0,0)"],
        "circle-radius": ["case", ["has", "_radius"], ["get", "_radius"], 0],
      }
    };
    this._layers.push(layer);

  }

  _addCircleMarkerLayer() {
    var layer = {
      "filter" : ["all",["==", "-sakuzu-type", "Point"],["==", "-sakuzu-marker-type", "CircleMarker"]],
      "id": this.mapid + "-circlemarker",
      "source": this.mapid,
      "type": "symbol",
      "paint":{
        "icon-opacity": ["case", ["has", "-sakuzu-visible"], 1, 0]
      },
      "layout": {
        "icon-image": ["concat", "-gsibv-image-draw-circle-", ["get", "-sakuzu-id"]],
        "icon-size": 1,
        "icon-pitch-alignment": "viewport",
        "symbol-placement": "point",
        "icon-anchor" : "center",
        "icon-keep-upright": true,
        "icon-allow-overlap": true
      }
    };
    this._layers.push(layer);
  }

  _addCircleLayer() {
    // ポリゴンで表示
    
  }

  _addMarkerLayer() {
    var layer = {
      "filter" : ["all",["==", "-sakuzu-type", "Point"],["==", "-sakuzu-marker-type", "Icon"]],
      "id": this.mapid + "-symbol",
      "source": this.mapid,
      "type": "symbol",
      "paint":{
        "icon-opacity": ["case", ["has", "-sakuzu-visible"], 1, 0]
      },
      "layout": {
        "icon-image": ["concat", "-gsibv-image-", ["get", "_iconUrl"]],
        "icon-size": ["case", ["has", "_iconScale"], ["get", "_iconScale"], 1],
        "icon-pitch-alignment": "viewport",
        "symbol-placement": "point",
        "icon-keep-upright": true,
        "icon-allow-overlap": true
      }
    };
    this._layers.push(layer);

  }

  
  _addTextLayer2() {
    var layer = {
      "filter" : ["all",["==", "-sakuzu-type", "Point"],["==", "-sakuzu-marker-type", "DivIcon"]],
      "id": this.mapid + "-text",
      "source": this.mapid,
      "type": "symbol",
      "paint": {
        "text-color": ["case", ["has", "_color"], ["get", "_color"], "#000000"],
        "text-halo-color": ["case", ["has", "_backgroundColor"], ["get", "_backgroundColor"], "rgba(25,255,255,0.5)"],
        "text-halo-width": ["case", ["has", "_backgroundColor"], 1, 0]
      },
      "layout": {
        "text-font": ["NotoSansCJKjp-Regular"],
        "text-field": "{_text}",
        "text-max-width": 999,
        "text-size":["case", ["has", "_textSize"], ["get", "_textSize"], 14],
        "text-allow-overlap": true
      }
    };
    this._layers.push(layer);

  }

  _addTextLayer() {
    var layer = {
      "filter" : ["all",["==", "-sakuzu-type", "Point"],["==", "-sakuzu-marker-type", "DivIcon"]],
      "id": this.mapid + "-text",
      "source": this.mapid,
      "type": "symbol",
      "paint":{
        "icon-opacity": ["case", ["has", "-sakuzu-visible"], 1, 0]
      },
      "layout": {
        "icon-image": ["concat", "-gsibv-image-draw-text-", ["get", "-sakuzu-id"]],
        "icon-size": 1,
        "icon-pitch-alignment": "viewport",
        "symbol-placement": "point",
        "icon-anchor" : "top-left",
        "icon-keep-upright": true,
        "icon-allow-overlap": true
      }
    };
    this._layers.push(layer);

  }


  _addLayers() {
    this._layers = [];
    
    // ポリゴン (ポリゴンを下に追加)
    this._addPolygonLayer();

    // ライン
    this._addLineLayer();

    
    // サークル
    //this._addCircleLayer();

    // サークルマーカー
    this._addCircleMarkerLayer();

    // divマーカー
    this._addTextLayer();

    // マーカー
    this._addMarkerLayer();
    
    var map = this._map.map;
    for (var i = 0; i < this._layers.length; i++) {
      var layer = this._layers[i];
      if (!layer.layout) layer.layout = {};
      layer.layout["visibility"] = (this._visible ? "visible" : "none");

      map.addLayer(layer);
      map.moveLayer(layer.id, this.mapid);
    }
    if (this._layers.length > 0)
      map.moveLayer(this.mapid, this._layers[0].id);


  }

  _destroyLayers() {
    
    if (this._layers) {
      for (var i = 0; i < this._layers.length; i++)
        this._map.map.removeLayer(this._layers[i].id);
      this._layers = undefined;

    }
    if( this._map.map.getSource(this.mapid) ) {
      this._map.map.removeLayer(this.mapid);
      this._map.map.removeSource(this.mapid);
    }
  }

  _remove(map) {
    if ( this._textManager )this._textManager.clear();
    this._textManager = undefined;

    if ( this._circleManager )this._circleManager.clear();
    this._circleManager = undefined;
    if (!map) return;


    var imageManager = GSIBV.Map.ImageManager.instance;
    imageManager.off("load", this._iconLoadHandler);
    imageManager.off("error", this._iconLoadErrorHandler);

    this._destroyLayers();
    super._remove(map);
  }

  _moveToFront() {
    var map = this._map.map;

    if ( !map ) return;
    
    if( !map.getSource(this.mapid) ) {
      return;
    }

    map.repaint = false;
    map.moveLayer(this.mapid);


    if (!this._layers) return;

    for (var i = 0; i < this._layers.length; i++) {
      map.moveLayer(this._layers[i].id);
    }

    map.repaint = true;
  }
  /*
  _addToMap(withSymbol) {
    var map = this._map.map;
    map.addSource(this.mapid, {
      "type": "geojson",
      "data": this._geojson
    });

    this._layers = [];
    this._layers.push({
      "id": this.mapid + "-fill",
      "source": this.mapid,
      "type": "fill",
      "paint": {
        "fill-color": ["case", ["has", "_fillColor"], ["get", "_fillColor"], "rgba(0,0,0,0)"]
      }
    });


    this._layers.push({
      "id": this.mapid + "-line",
      "source": this.mapid,
      "type": "line",
      "paint": {
        "line-width": ["case", ["has", "_weight"], ["get", "_weight"], 0],
        "line-color": ["case", ["has", "_color"], ["get", "_color"], "rgba(0,0,0,0)"]
      }
    });


    this._layers.push({
      "id": this.mapid + "-circle",
      "source": this.mapid,
      "filter": ["all", ["has", "_radius"]],
      "type": "circle",
      "paint": {
        "circle-radius": ["case", ["has", "_radius"], ["get", "_radius"], 0],
        "circle-color": ["case", ["has", "_fillColor"], ["get", "_fillColor"], "rgba(0,0,0,0)"],
        "circle-stroke-width": ["case", ["has", "_weight"], ["get", "_weight"], 0],
        "circle-stroke-color": ["case", ["has", "_color"], ["get", "_color"], "rgba(0,0,0,0)"],
        "circle-pitch-alignment": "map"
      }
    });

    this._layers.push({
      "id": this.mapid + "-symbol",
      "source": this.mapid,
      "filter": ["all", ["has", "_iconUrl"]],
      "type": "symbol",
      "layout": {
        "icon-size": ["case", ["has", "iconScale"], ["get", "iconScale"], 1],
        "icon-pitch-alignment": "map",
        "symbol-placement": "point",
        "icon-keep-upright": true,
        "icon-allow-overlap": true
      }
    });

    this._layers.push({
      "id": this.mapid + "-label",
      "source": this.mapid,
      "filter": ["all", ["==", ["get", "_markerType"], "DivIcon"]],
      "type": "symbol",
      "paint": {
        "text-color": ["case", ["has", "_text-color"], ["get", "_text-color"], "rgba(0,0,0,1)"],
        "text-halo-color": "rgba(255,255,255,1)",
        "text-halo-width": 1
      },
      "layout": {
        "text-field": "{_text}",
        "text-size": ["case", ["has", "_text-size"], ["get", "_text-size"], 10.5],
        "text-font": [
          "NotoSansCJKjp-Regular"
        ],
        "text-pitch-alignment": "map",
        "text-rotation-alignment": "map",
        "text-keep-upright": true,
        "text-allow-overlap": true,
        "text-max-width": 100
      }
    });

    for (var i = 0; i < this._layers.length; i++) {
      var layer = this._layers[i];
      if (!layer.layout) layer.layout = {};
      layer.layout["visibility"] = (this._visible ? "visible" : "none");

      map.addLayer(layer);
      map.moveLayer(layer.id, this.mapid);
    }
    if (this._layers.length > 0)
      map.moveLayer(this.mapid, this._layers[0].id);

    if (withSymbol) {
      this._setSymbolImage();
    }

  }
  */

}



GSIBV.Map.Draw.Layer.TextToCanvasManager = class extends MA.Class.Base {

  constructor(map) {
    super();
    this._map = map;
    
    this._texts = {};
  }

  clear() {
    for ( var key in this._texts ) {
      var textInfo = this._texts[key];
      this._map.removeImage( textInfo.imageId );
    }
    this._texts = {};
  }

  set(key, text) {
    var textInfo = this._texts[key];
    
    var textInfoText = JSON.stringify( text );
    if ( textInfo ) {
      if ( textInfo.txt == textInfoText) {
        return;
      }


      this._map.removeImage( textInfo.imageId);
      
    }

    //console.log("テキスト用Canvas再生成");

    textInfo = {
      imageId : "-gsibv-image-draw-text-" + key,
      txt : textInfoText
    };
    this._texts[key] = textInfo;

    var textToCanvas = new GSIBV.Map.Draw.Layer.TextToCanvas();
    textToCanvas.text = text.text;
    if ( text.size)textToCanvas.fontSize = text.size;
    if ( text.color)textToCanvas.color = text.color;
    if ( text.backgroundColor)textToCanvas.backgroundColor = text.backgroundColor;
    if ( text.bold)textToCanvas.bold = text.bold;
    if ( text.underline)textToCanvas.underline = text.underline;
    if ( text.italic)textToCanvas.italic = text.italic;

    var canvas = textToCanvas.execute();
    var ctx = canvas.getContext("2d");
    var w = canvas.width;
    var h = canvas.height;

    var srcImgData = ctx.getImageData(0, 0, w, h);
    var imgData = new Uint8Array(w * h * 4);


    for (var i = 0; i < imgData.length; i++) {
      imgData[i] = srcImgData.data[i];
    }

    var data = {
      width: w,
      height: h,
      data: imgData
    };

    this._map.addImage(textInfo.imageId, data, { pixelRatio: 1 });

  }


};

GSIBV.Map.Draw.Layer.TextToCanvas = class {
  constructor() {
    this._text="";
    this._font = "";
    this._fontSize = 9.5;
    this._color = "#000000";
    this._backgroundColor = undefined;
    this._bold = false;
    this._italic = false;
    this._underline = false;
    this._padding = {
      top:3,
      bottom:3,
      left:1,
      right:1
    };
  }

  set text(value ) {
    this._text = value ;
    this._lines = this._text.split(/\r\n|\n/);
  }

  set font(value) {
    this._font = value ;
  }
  
  set color(value) {
    this._color = value ;
  }

  set backgroundColor(value) {
    this._backgroundColor = value ;
  }

  set fontSize(value) {
    this._fontSize = value ;
  }

  set color(value) {
    this._color = value ;
  }

  set bold(value) {
    this._bold = value ;
  }

  set italic(value) {
    this._italic = value ;
  }

  set underline(value) {
    this._underline = value ;
  }


  execute() {
    var textInfo = this.getTextInfo();
    var canvas = MA.DOM.create("canvas");
    canvas.width = textInfo.width;
    canvas.height = textInfo.height;
    var ctx = this._initCanvas( canvas );


    // 背景塗りつぶし
    if ( this._backgroundColor ) {
      ctx.fillStyle = this._backgroundColor;
      ctx.fillRect( 0,0, textInfo.width, textInfo.height);
    }

    // 文字列描画
    ctx.fillStyle = this._color;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    var y= this._padding.top;
    var x = this._padding.left;
    for( var i=0; i<this._lines.length; i++ ) {
      var lineHeight = textInfo.lineHeight[i];
      var lineWidth = textInfo.lineWidth[i];
      ctx.fillText(this._lines[i], x, y + 2);

      if ( this._underline ) {
        ctx.beginPath();
        ctx.lineWidth = this._bold ? 2 : 1;
        ctx.strokeStyle = this._color;
        ctx.moveTo(x+1,y+lineHeight-1.5);
        ctx.lineTo(x+lineWidth-1,y+lineHeight-1.5);
        ctx.stroke();

      }
      y += lineHeight;
    }
    return canvas;
  }

  getTextInfo() {

    var info = {
      width : 0
    };
    var canvas = MA.DOM.create("canvas");
    canvas.height = Math.ceil( this._fontSize * 2);

    var ctx = this._initCanvas( canvas );
    

    info.width= 0;

    info.lineWidth = [];

    for( var i=0; i<this._lines.length; i++ ) {
      var width = ctx.measureText( this._lines[i] ).width+2;
      info.lineWidth.push(width);
      if ( info.width < width) info.width = width;
    }


    canvas.width = info.width + 10;
    ctx = this._initCanvas( canvas );

    info.lineHeight = [];
    info.height = 0;
    for( var i=0; i<this._lines.length; i++ ) {
      var lineHeight = this._getTextHeight( this._lines[i], ctx, canvas.width, canvas.height)+4;
      info.lineHeight.push( lineHeight);
      info.height += lineHeight;
    }

    canvas = undefined;


    info.width += (this._padding.left * this._padding.right);
    info.height += (this._padding.top * this._padding.bottom);
    return info;
  }

  _initCanvas(canvas) {
    var ctx = canvas.getContext("2d");
    
    ctx.font = 
      ( this._bold ? "bold " : "normal " )
      + ( this._italic ? "italic " : "" )
      + this._fontSize + "pt " 
      + "'Lucida Grande','Hiragino Kaku Gothic ProN','ヒラギノ角ゴ ProN W3','Meiryo','メイリオ','sans-serif'";

    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    return ctx;
  }

  _getTextHeight( text, ctx,width, height) {
    ctx.fillText(text, 0, 0);
    
    var pixels = ctx.getImageData(0, 0, width, height);
    var data = pixels.data;
    var textHeight = 0;
    var maxRow = -1;
    var minRow = height;
    for (var i = 0, len = data.length; i < len; i += 4) {
      var r = data[i], g = data[i+1], b = data[i+2], alpha = data[i+3];
      if (alpha > 0) {
        var row = Math.floor((i / 4) / width);
        if (row > maxRow) {
          maxRow = row;
        }
        if ( row <minRow) minRow = row;
      }
    }

    return maxRow;
  }


  static execute(text, fontSize, color, backgroundColor, bold, italic, underline) {
    var obj = new TextToCanvas();
    obj.text = text;
    obj.fontSize = fontSize;
    obj.color = color;
    obj.backgroundColor = backgroundColor;
    obj.bold = bold;
    obj.italic = italic;
    obj.underline = underline;

    return obj.execute();

  }
};










GSIBV.Map.Draw.Layer.CircleToCanvasManager = class extends MA.Class.Base {

  constructor(map) {
    super();
    this._map = map;
    
    this._circles = {};
  }

  clear() {
    for ( var key in this._circles ) {
      var circleInfo = this._circles[key];
      this._map.removeImage( circleInfo.imageId );
    }
    this._circles = {};
  }

  set(key, circle) {
    var circleInfo = this._circles[key];
    
    var circleInfoText = JSON.stringify( circle );
    if ( circleInfo ) {
      if ( circleInfo.txt == circleInfoText) {
        return;
      }


      this._map.removeImage( circleInfo.imageId);
      
    }

    //console.log("サークル用Canvas再生成");

    circleInfo = {
      imageId : "-gsibv-image-draw-circle-" + key,
      txt : circleInfoText
    };
    this._circles[key] = circleInfo;

    var circleToCanvas = new GSIBV.Map.Draw.Layer.CircleToCanvas();
    circleToCanvas.text = circle.text;
    if ( circle.radius)circleToCanvas.radius = circle.radius;
    if ( circle.lineColor)circleToCanvas.lineColor = circle.lineColor;
    if ( circle.weight)circleToCanvas.weight = circle.weight;
    if ( circle.backgroundColor)circleToCanvas.backgroundColor = circle.backgroundColor;
    if ( circle.lineOpacity)circleToCanvas.lineOpacity = circle.lineOpacity;
    if ( circle.backgroundOpacity)circleToCanvas.backgroundOpacity = circle.backgroundOpacity;
    if ( circle.lineDashArray)circleToCanvas.lineDashArray = circle.lineDashArray;

    var canvas = circleToCanvas.execute();
    var ctx = canvas.getContext("2d");
    var w = canvas.width;
    var h = canvas.height;

    var srcImgData = ctx.getImageData(0, 0, w, h);
    var imgData = new Uint8Array(w * h * 4);


    for (var i = 0; i < imgData.length; i++) {
      imgData[i] = srcImgData.data[i];
    }

    var data = {
      width: w,
      height: h,
      data: imgData
    };

    this._map.addImage(circleInfo.imageId, data, { pixelRatio: 1 });

  }


};


GSIBV.Map.Draw.Layer.CircleToCanvas  = class {
  constructor() {
    this._lineColor = "#000000";
    this._lineOpacity = 0.5;
    this._weight = 3;
    this._backgroundColor = "#ff0000";
    this._backgroundOpacity = 0.5;
    this._radius = 100;
    this._lineDashArray = [];

  }

  set lineColor(value ) {
    this._lineColor = value ;
  }

  set lineOpacity(value) {
    this._lineOpacity = value ;
  }
  set lineDashArray(value) {
    this._lineDashArray = value ;
  }
  
  set weight(value) {
    this._weight = value ;
  }

  set backgroundColor(value) {
    this._backgroundColor = value ;
  }

  set backgroundOpacity(value) {
    this._backgroundOpacity = value ;
  }

  set radius(value) {
    this._radius = value ;
  }

  execute() {
    var info = this.getCircleInfo();

    var canvas = MA.DOM.create("canvas");
    canvas.width= info.width;
    canvas.height = info.height;

    var ctx = canvas.getContext('2d');

    if ( this._backgroundColor ){
      ctx.fillStyle = this._backgroundColor;
    }


    if ( this._lineColor ){
      ctx.strokeStyle = this._lineColor;
      ctx.lineWidth = this._weight;
    }

    ctx.beginPath();
    ctx.arc(canvas.width/2, canvas.height/2, this._radius, 0, Math.PI * 2, true);

    if ( this._backgroundColor ){
      ctx.globalAlpha = ( this._backgroundOpacity == undefined ? 1 : this._backgroundOpacity );
      ctx.fill();
    }
    if ( this._lineColor ){
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      if ( this._lineDashArray) {
        if ( ctx.setLineDash !== undefined )   ctx.setLineDash(this._lineDashArray);
        if ( ctx.mozDash !== undefined )       ctx.mozDash = this._lineDashArray;
      }
      ctx.globalAlpha = ( this._lineOpacity == undefined ? 1 : this._lineOpacity );
      ctx.stroke();
    }

    return canvas;
  }

  getCircleInfo() {
    var info = {

    };

    info.width = this._radius * 2 + this._weight;
    info.height = this._radius * 2 + this._weight;
    
    return info;
  }
};