GSIBV.Map.Layer.TYPES["relief_free"] = "自分で作る色別標高図";
GSIBV.Map.Layer.FILTERS.unshift(function (l) {

  if ( l.id == "relief_free") {

    return new GSIBV.Map.Layer.FreeRelief({
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
  return null;

} );


GSIBV.Map.Layer.FreeRelief = class extends GSIBV.Map.Layer.TileImage {

  constructor(options) {
    super(options);
    this._type = "relief_free";
    this._dataManager = GSIBV.Map.Layer.FreeRelief.DataManager.instance;
    this._url = "";
    this._drawer = new GSIBV.Map.Layer.FreeRelief.TileDrawer ();

  }

  _initializeElevationData(data) {
    if (!data || !data.colors) return null;

    var result = {
      gradate: data.gradate,
      useHillshademap: data.useHillshademap,
      colors: []
    };

    for (var i = 0; i < data.colors.length; i++) {
      var c = data.colors[i];
      if (typeof (c.color) == "string" || c.color instanceof String) {
        var color = GSIBV.Map.Layer.FreeRelief.colorStringToRGBA(c.color);

        c.color = color;
      }
      result.colors.push(c);
    }

    result.colors.sort(function (a, b) {
      if (!a.h && a.h != 0) return 1;
      if (!b.h && b.h != 0) return -1;
      if (a.h < b.h) return -1;
      if (a.h > b.h) return 1;
      return 0;
    });

    return result;
  }
  /*
  _getZoom() {
    
    var map = this._map.map;
    var zoom = map.getZoom()+1;
    zoom = Math.floor(zoom);
    if ( this._maxNativeZoom) {
      if ( zoom > this._maxNativeZoom ) zoom = this._maxNativeZoom;
    }

    return zoom;
  }
  */

  _createTile(x,y,z) {
    return new GSIBV.Map.Layer.FreeRelief.Tile(this,this._drawer,x,y,z,{
      opacity : this._opacity,
      visible : this._visible
    });
  }

  _onDataChange() {
    this._destroyTiles();
    this._refresh();
  }

  _add(map) {
    super._add(map);

    if ( !this._dataChangeHandler) {
      this._dataChangeHandler = MA.bind( this._onDataChange, this );
      this._dataManager.on("change", this._dataChangeHandler);
    }
    

    return true;
  }

  _remove(map) {
    
    if ( this._dataChangeHandler) {
      this._dataManager.off("change", this._dataChangeHandler);
      this._dataChangeHandler = null;
    }

    super._remove(map);
  }
 
  _refresh() {
    
    this._drawer.setElevationData(this._initializeElevationData(this._dataManager.data));
    super._refresh();
    
  }


 

};


GSIBV.Map.Layer.FreeRelief.colorStringToRGBA = function (c) {
  var toHex = function (v) {
    return '0x' + (('0000' + v.toString(16).toUpperCase()).substr(-4));
  };
  if (typeof (c) == "string" || c instanceof String) {
    var color = {
      r: 0, g: 0, b: 0, a: 0
    };

    try {
      if (c.substring(0, 1) == "#" && c.length == 7) {
        color.r = parseInt(toHex(c.substring(1, 3)));
        color.g = parseInt(toHex(c.substring(3, 5)));
        color.b = parseInt(toHex(c.substring(5, 7)));
        color.a = 255;
      }
      else if (c.substring(0, 1) != "#" && c.length == 6) {
        color.r = parseInt(toHex(c.substring(0, 2)));
        color.g = parseInt(toHex(c.substring(2, 4)));
        color.b = parseInt(toHex(c.substring(4, 6)));
        color.a = 255;
      }
    }
    catch (e) { }

    c = color;
  }


  return c;
};

// 初期データ取得
GSIBV.Map.Layer.FreeRelief.getDefaultData = function () {
  return JSON.parse( JSON.stringify(GSIBV.Map.Layer.FreeRelief._defaultData) );
};






GSIBV.Map.Layer.FreeRelief._defaultData =
{
  gradate: false,
  useHillshademap: false,
  colors: [
    {
      "h": 5,
      "color": "#0000FF"
    },
    {
      "h": 10,
      "color": "#0095FF"
    },
    {
      "h": 50,
      "color": "#00EEFF"
    },
    {
      "h": 100,
      "color": "#91FF00"
    },
    {
      "h": 500,
      "color": "#FFFF00"
    },
    {
      "h": 1500,
      "color": "#FF8C00"
    },
    {
      "h": null,
      "color": "#FF4400"
    }
    /*
    { h: 0, color: "#2db4b4" },
    { h: 100, color: "#71b42d" },
    { h: 300, color: "#b4a72d" },
    { h: 1000, color: "#b4562d" },
    { h: 2000, color: "#b4491b" },
    { h: 4000, color: "#b43d09" },
    { h: null, color: "#b43d09" }
    */
  ]
};

// データのURL用エンコード
GSIBV.Map.Layer.FreeRelief.encodeElevationData = function (data) {
  if (!data) return;

  var result = "";

  for (var i = 0; i < data.colors.length; i++) {
    var c = data.colors[i];

    var hText = "";
    if (c.h || c.h == 0)
      hText = c.h.toString(16);
    var colorText = ""

    if (c && c.color) {
      if (typeof (c.color) == "string" || c.color instanceof String) {
        if (c.color.charAt(0) == "#")
          colorText = c.color.slice(1);
        else
          colorText = c.color;
      }
      else {

        colorText =
          ("00" + c.color.r.toString(16).toUpperCase()).substr(-2)
          + ("00" + c.color.g.toString(16).toUpperCase()).substr(-2)
          + ("00" + c.color.b.toString(16).toUpperCase()).substr(-2);
      }
    }

    result += (result == "" ? "" : "G") + hText + "G" + colorText;


  }

  //parseInt(suji2,2);


  var flags = (data.desc ? "1" : "0") + (data.gradate ? "1" : "0") + (data.useHillshademap ? "1" : "0");
  result = parseInt(flags, 2) + result;
  return result.toUpperCase();
};

// URL用データから内部データへ変換
GSIBV.Map.Layer.FreeRelief.decodeElevationDataText = function (txt) {
  if ( txt == "0G000000") return null;


  var result = {};
  try {

    var flags = parseInt(txt.charAt(0)).toString(2);
    flags = ('000' + flags).slice(-3);

    result.desc = (flags.charAt(0) == "1" ? true : false);
    result.gradate = (flags.charAt(1) == "1" ? true : false);
    result.useHillshademap = (flags.charAt(2) == "1" ? true : false);

    txt = txt.slice(1);

    var parts = txt.split("G");
    result.colors = [];
    for (var i = 0; i < parts.length; i += 2) {
      var item = {};

      if (parts[i] == "") {
        item.h = null;
      } else {
        if (parts[i].match(/\.8$/)){
					var g = parts[i].indexOf(".");

					var dec = parseInt(parts[i].substr(0, g),16);
					var pt = 0;
					for(var a = 0; a < parts[i].substr(g + 1).length; a++){
						pt = pt + parts[i].charAt(a + g + 1) / Math.pow(16, a + 1);
					}
					item.h = dec + pt;
        }
        else{
          item.h = parseInt(parts[i], 16);
        }
      }

      if (parts[i + 1] == "")
        item.color = null;
      else
        item.color = GSIBV.Map.Layer.FreeRelief.colorStringToRGBA("#" + parts[i + 1]);

      if ( isNaN(item.h) ) return null;
      
      result.colors.push(item);
    }

  }
  catch (e) {
    console.log(e);
    result = null;
  }

  return result;
};


GSIBV.Map.Layer.FreeRelief.DataManager = class extends MA.Class.Base {
  constructor() {
    super();
    this._data = JSON.parse( JSON.stringify(GSIBV.Map.Layer.FreeRelief._defaultData) );
    this._defaultText = GSIBV.Map.Layer.FreeRelief.encodeElevationData( this._data );
    this._text = this._defaultText;
  }

  get data() {
    return this._data;
  }

  get image() {
    return GSIBV.Map.Layer.FreeRelief.makeHanreiImage( this.data );
  }

  getImage(transparentBackground) {
    return GSIBV.Map.Layer.FreeRelief.makeHanreiImage( this.data, transparentBackground );
  }

  set data(data ) {

    
    try {
      this._data = JSON.parse( JSON.stringify(data) );
    }catch(e) {
      this._data =null;
    }
    if( !this._data) {
      this._data = JSON.parse( JSON.stringify(GSIBV.Map.Layer.FreeRelief._defaultData) );
    }
    var text = GSIBV.Map.Layer.FreeRelief.encodeElevationData( this._data);
    if  ( text != this._text) {
      this._text = text;
      this.fire("change");
    }
  }

  get text() {
    if ( this._defaultText != this._text)
    return this._text;
  }
};


GSIBV.Map.Layer.FreeRelief.DataManager.instance = new GSIBV.Map.Layer.FreeRelief.DataManager();



GSIBV.Map.Layer.FreeRelief.Tile = class extends GSIBV.Map.Layer.TileImage.Tile {

  constructor( layer, drawer, x,y,z, options) {
    super(layer, x,y,z,options);
    this._drawer = drawer;
    
  }

  get loading() {
    return ( this._loader ? true : false );
  }

  get loaded() {
    return this._canvas ? true : false;
  }



  load() {
    if ( this.loading ) return;
    if ( this._loaded ) {
      this._addLayer();
      return;
    }
    this._loadHandler = MA.bind(this._onDEMLoad,this );
    //console.log( this._drawer.elevationData );

    this._loader = new GSIBV.DEMLoader( this._x, this._y, this._z,{
      useHillshademap:this._drawer.elevationData.useHillshademap
    });
    this._loader.on("load",this._loadHandler);
    this._loader.load();
  }

  _clearLoader() {

    if ( this._loadHandler) {

      this._loader.off("load",this._loadHandler);
      this._loadHandler = null;
    }
    if ( this._loader ) {
      this._loader.destroy();
    }
    this._loader = null;
  }

  _onDEMLoad() {
    this._demData = this._loader.getData();
    
    this._hillshademapImage = this._loader.getHillshademapImage();
    this._refreshCanvas(this._demData, 
      this._drawer.elevationData.useHillshademap ? this._hillshademapImage : null );
    this._addLayer();
    this._clearLoader();
  }

  destroy() {
    this._clearLoader();
    if ( this._canvas ) delete this._canvas;
    this._canvas = null;
    super.destroy();
  }

  
  _getUrl() {
    if ( !this._canvas) return null;
    return this._canvas.toDataURL();
  }

  _refreshCanvas( dem, hillshadeImage ) {
    if ( !this._canvas ) {
      this._canvas = document.createElement("canvas");
      this._canvas.width = 256;
      this._canvas.height = 256;
      //document.body.append( this._canvas);
    }
    this._drawer.draw(this._canvas, dem,hillshadeImage);
    

  }
};

GSIBV.Map.Layer.FreeRelief.Tile.makeKey = function(x,y,z) {
  return x + ":" + y + ":" +z;
};








/*******************************************************

 GSIBV.Map.Layer.FreeRelief.TileDrawer
    タイル描画

*******************************************************/
GSIBV.Map.Layer.FreeRelief.TileDrawer = class extends MA.Class.Base {

  constructor(options){
    super( options);
    this.options = {
      transparentGradate : false
    };
  }


  setElevationData (data) {
    this._elevationData = data;
  }

  get elevationData() {
    return this._elevationData;
  }

  // 高さから色取得
  _hToColor (h) {
    if (h == null) return null;

    var colors = this._elevationData.colors;
    var prev = null;
    var current = null;

    for (var i = 0; i < colors.length; i++) {
      var color = colors[i];

      if (!color.h && color.h != 0) continue;
      if (color.h >= h) {
        if (i > 0) {
          current = colors[i];
          if (i > 0) prev = colors[i - 1];
        }
        else {
          current = colors[0];

        }
        break;
      }


    }


    if (!current) return colors[colors.length - 1].color;
    if (!prev) return current.color;

    if (!this._elevationData.gradate) {
      return current.color;
    }

    var p = (h - prev.h) / (current.h - prev.h);

    var result = {
      r: 0, g: 0, b: 0, a: 0
    };
    if (current.color && prev.color) {
      result = {
        r: Math.round(prev.color.r + ((current.color.r - prev.color.r) * p)),
        g: Math.round(prev.color.g + ((current.color.g - prev.color.g) * p)),
        b: Math.round(prev.color.b + ((current.color.b - prev.color.b) * p)),
        a: 255
      };
    }
    else if (!current.color && prev.color) {
      if (this.options.transparentGradate) {
        result = {
          r: prev.color.r,
          g: prev.color.g,
          b: prev.color.b,
          a: Math.round(255 + (-255 * p)),
        };
      }
    }
    else if (current.color && !prev.color) {
      if (this.options.transparentGradate) {
        result = {
          r: current.color.r,
          g: current.color.g,
          b: current.color.b,
          a: Math.round(255 * p),
        };
      }
      else {
        result = {
          r: current.color.r,
          g: current.color.g,
          b: current.color.b,
          a: 255,
        };
      }
    }
    if (result.r > 255) result.r = 255;
    if (result.g > 255) result.g = 255;
    if (result.b > 255) result.b = 255;
    if (result.a > 255) result.a = 255;
    return result;
  }


  // Canvasへ描画
  draw (dstCanvas, demData, hillshadeMapImage) {
    if (!this._elevationData || !demData) return;

    var destCtx = dstCanvas.getContext('2d');
    var destData = destCtx.createImageData(256, 256);
    destCtx.clearRect(0, 0, 256, 256);
    destCtx.beginPath();
    var hillshadeData = null;
    var hillshadeScale = 1;
    var hillshadePoint = null;
    
    if (hillshadeMapImage) {
      var hillshadeCanvas = GSIBV.Map.Layer.FreeRelief.TileDrawer.getCanvas();
      var hillshadeCtx = hillshadeCanvas.getContext('2d');
      hillshadeCtx.clearRect(0, 0, 256, 256);
      hillshadeCtx.beginPath();
      hillshadeCtx.drawImage(hillshadeMapImage, 0, 0);
      hillshadeData = hillshadeCtx.getImageData(0, 0, 256, 256).data;
      hillshadeScale = hillshadeMapImage._scale;
      hillshadePoint = hillshadeMapImage._point;
      
    }


    var idx = 0, destIdx = 0,hillshadeIdx =0, color, hillshadeColor = { r: 0, g: 0, b: 0, a: 0 };
    for (var y = 0; y < 256; ++y) {
      for (var x = 0; x < 256; ++x) {
        color = this._hToColor(demData[idx]);

        if (color) {
          if (hillshadeData) {
            if (hillshadeScale != 1) {
              var x2 = Math.floor((hillshadePoint.x + x) / hillshadeScale);
              var y2 = Math.floor((hillshadePoint.y + y) / hillshadeScale);
              hillshadeIdx = (y2 * 256 * 4) + (x2 * 4);
            }
            else
              hillshadeIdx = (y * 256 * 4) + (x * 4);
            hillshadeColor.r = hillshadeData[hillshadeIdx];
            hillshadeColor.g = hillshadeData[hillshadeIdx + 1];
            hillshadeColor.b = hillshadeData[hillshadeIdx + 2];
            hillshadeColor.a = hillshadeData[hillshadeIdx + 3];
            if (hillshadeColor.a > 0) {
              destData.data[destIdx] = Math.round(color.r * (hillshadeColor.r / 255));
              destData.data[destIdx + 1] = Math.round(color.g * (hillshadeColor.g / 255));
              destData.data[destIdx + 2] = Math.round(color.b * (hillshadeColor.b / 255));
              destData.data[destIdx + 3] = Math.round(color.a * (hillshadeColor.a / 255));
            }
            else {
              destData.data[destIdx] = color.r;
              destData.data[destIdx + 1] = color.g;
              destData.data[destIdx + 2] = color.b;
              destData.data[destIdx + 3] = color.a;
            }
          }
          else {

            destData.data[destIdx] = color.r;
            destData.data[destIdx + 1] = color.g;
            destData.data[destIdx + 2] = color.b;
            destData.data[destIdx + 3] = color.a;
          }
        }
        else {
          destData.data[destIdx] = 0;
          destData.data[destIdx + 1] = 0;
          destData.data[destIdx + 2] = 0;
          destData.data[destIdx + 3] = 0;
        }

        destIdx += 4;
        idx++;
      }


    }

    destCtx.putImageData(destData, 0, 0);

  }
};


// 描画時作業用Canvas取得
GSIBV.Map.Layer.FreeRelief.TileDrawer.getCanvas = function () {
  if (!GSIBV.Map.Layer.FreeRelief.TileDrawer._canvas) {
    GSIBV.Map.Layer.FreeRelief.TileDrawer._canvas = document.createElement('canvas');
    GSIBV.Map.Layer.FreeRelief.TileDrawer._canvas.width = 256;
    GSIBV.Map.Layer.FreeRelief.TileDrawer._canvas.height = 256;
  }
  return GSIBV.Map.Layer.FreeRelief.TileDrawer._canvas;
};





// 凡例画像生成（他からも利用する）
GSIBV.Map.Layer.FreeRelief.HanreiImageInfo = {
  cellPadding: 2,
  padding: 4,
  colorWidth: 40,
  colorHeight: 20,
  margin: 8,
  colorRadius: 3,
  gradateWidth: 14,
  font: '12px "Lucida Grande","Hiragino Kaku Gothic ProN", "ヒラギノ角ゴ ProN W3", Meiryo, メイリオ, sans-serif'
};

GSIBV.Map.Layer.FreeRelief.HanreiImageInfo.lineHeight =
  GSIBV.Map.Layer.FreeRelief.HanreiImageInfo.colorHeight +
  (GSIBV.Map.Layer.FreeRelief.HanreiImageInfo.cellPadding * 2);

  GSIBV.Map.Layer.FreeRelief._initializeHanreiImage = function (data, transparentBackground) {
  var canvas = document.createElement("canvas");
  var ctx = canvas.getContext("2d");
  ctx.font = GSIBV.Map.Layer.FreeRelief.HanreiImageInfo.font;
  var info = GSIBV.Map.Layer.FreeRelief.HanreiImageInfo;

  var rows = [];
  var textWidth = {};

  var size = ctx.measureText("-");
  textWidth["-"] = size.width;
  size = ctx.measureText("以上");
  textWidth["以上"] = size.width;
  size = ctx.measureText("未満");
  textWidth["未満"] = size.width;
  var maxTextWidth = 0;

  for (var i = 0; i < data.colors.length; i++) {
    var c = data.colors[i];
    var text = "";
    var textSize = 0;

    if (c.h != undefined) {
      text = (c.h + "").replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,') + "m";
      size = ctx.measureText(text);
      textSize = size.width;
      if (maxTextWidth < textSize) maxTextWidth = textSize;
      textWidth[text] = textSize;
    }

    var color = c.color;
    if (color != undefined && (typeof color != "string")) {
      color = "rgba(" + color.r + "," + color.g + "," + color.b + "," + (color.a / 255) + ")";
    }
    rows.push({
      "h": c.h,
      "text": text,
      "color": color,
      "width": textSize
    });
  }

  maxTextWidth += (textWidth["未満"] > textWidth["以上"] ? textWidth["未満"] : textWidth["以上"]);

  var canvasWidth = (maxTextWidth + (info.cellPadding * 2)) * 2;
  canvasWidth += (textWidth["-"] + (info.cellPadding * 2));
  canvasWidth += (info.padding * 2);
  canvasWidth += info.margin;

  var colorLeft = info.padding + info.cellPadding;
  var gradateLeft = 0;
  var textLeft = 0;


  if (data.gradate) {
    canvasWidth += info.gradateWidth + (info.padding * 2);
    gradateLeft = info.padding + info.cellPadding;
    textLeft = gradateLeft + info.gradateWidth + info.cellPadding + info.margin + info.cellPadding;
  } else {
    canvasWidth += (info.colorWidth + (info.cellPadding * 2));
    gradateLeft = info.padding + (info.cellPadding * 2) + info.colorWidth + info.cellPadding;
    textLeft = info.padding + (info.cellPadding * 2) + info.colorWidth + info.margin + info.cellPadding;
  }

  var canvasHeight = (info.colorHeight + (info.cellPadding * 2)) * rows.length;
  canvasHeight += (info.padding * 2);

  canvasWidth = Math.ceil(canvasWidth);
  canvasHeight = Math.ceil(canvasHeight);


  canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  ctx = canvas.getContext("2d");
  if ( !transparentBackground ) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }
  ctx.font = GSIBV.Map.Layer.FreeRelief.HanreiImageInfo.font;

  return {
    width: canvasWidth,
    height: canvasHeight,
    rows: rows,
    textWidth: textWidth,
    maxTextWidth: maxTextWidth,
    canvas: canvas,
    ctx: ctx,
    colorLeft: colorLeft,
    gradateLeft: gradateLeft,
    textLeft: textLeft
  };

}

GSIBV.Map.Layer.FreeRelief.makeHanreiImage = function (data, transparentBackground) {
  if (!data) return undefined;

  var info = GSIBV.Map.Layer.FreeRelief.HanreiImageInfo;
  var drawInfo = GSIBV.Map.Layer.FreeRelief._initializeHanreiImage(data, transparentBackground);


  var canvas = drawInfo.canvas;
  var ctx = drawInfo.ctx;



  function drawColor(gradate, drawInfo, lineNo, ctx, row) {
    var info = GSIBV.Map.Layer.FreeRelief.HanreiImageInfo;
    var left = drawInfo.colorLeft; //info.padding + info.cellPadding;
    var top = info.padding + (info.lineHeight * lineNo) + info.cellPadding;

    var right = left + info.colorWidth;
    var bottom = top + info.colorHeight;
    var yOffset = 0;
    ctx.fillStyle = "#bbb";
    for (var x = left; x < right; x += 4) {
      if (yOffset == 0) yOffset = 4;
      else yOffset = 0;

      for (var y = top + yOffset; y < bottom; y += 8) {
        var w = 4;
        var h = 4;
        if (x + w > right) w = right - x;
        if (y + h > bottom) h = bottom - y;
        ctx.fillRect(x, y, w, h);

      }
    }


    ctx.beginPath();
    ctx.moveTo(left + info.colorRadius, top);

    ctx.lineTo(left + info.colorWidth - info.colorRadius, top);
    ctx.arc(left + info.colorWidth - info.colorRadius, top + info.colorRadius, info.colorRadius, Math.PI * 1.5, 0, false);

    ctx.lineTo(left + info.colorWidth, top + info.colorHeight - info.colorRadius);
    ctx.arc(left + info.colorWidth - info.colorRadius, top + info.colorHeight - info.colorRadius, info.colorRadius, 0, Math.PI * 0.5, false);


    ctx.lineTo(left + info.colorRadius, top + info.colorHeight);
    ctx.arc(left + info.colorRadius, top + info.colorHeight - info.colorRadius, info.colorRadius, Math.PI * 0.5, Math.PI, false);

    ctx.lineTo(left, top + info.colorRadius);
    ctx.arc(left + info.colorRadius, top + info.colorRadius, info.colorRadius, Math.PI, Math.PI * 1.5, false);
    ctx.closePath();

    ctx.fillStyle = row.color;
    ctx.strokeStyle = "#999";
    if (row.color) ctx.fill();
    ctx.stroke();

  }


  function drawText(gradate, drawInfo, lineNo, ctx, prev, row) {
    var info = GSIBV.Map.Layer.FreeRelief.HanreiImageInfo;
    var left = drawInfo.textLeft;
    var right = drawInfo.width - (info.padding + info.cellPadding);
    var top = info.padding + (info.lineHeight * lineNo) + info.cellPadding;
    var middle = top + (info.colorHeight / 2);

    //if ( gradate ) left += info.gradateWidth + (info.cellPadding*2);

    ctx.textBaseline = "middle";
    ctx.fillStyle = "#000000";

    // 下限
    if (prev) {
      ctx.textAlign = "right";
      ctx.fillText(prev.text + "以上", left + drawInfo.maxTextWidth, middle);
    }

    //　上限
    if (row.text != "") {
      ctx.textAlign = "right";
      ctx.fillText(row.text + "未満", right, middle);
    }

    // ～

    ctx.textAlign = "left";
    //ctx.fillText("-", left +  + drawInfo.maxTextWidth + ( info.cellPadding * 2 ), middle );

  }

  function drawGradateBar(drawInfo, data, ctx) {
    var info = GSIBV.Map.Layer.FreeRelief.HanreiImageInfo;
    var top = info.padding; // + ( info.lineHeight * lineNo ) + info.cellPadding;
    var left = drawInfo.gradateLeft; //info.padding + (info.cellPadding * 2) + info.colorWidth + info.cellPadding;

    var lineHeight = info.lineHeight;



    var bottom = top + (lineHeight * data.colors.length);

    ctx.fillStyle = "#fff";
    ctx.fillRect(left, top, info.gradateWidth, (lineHeight / 2) + info.cellPadding);
    ctx.fillRect(left, bottom + (lineHeight / 2) - info.cellPadding, info.gradateWidth, (lineHeight / 2));

    top += (lineHeight / 2) + info.cellPadding;
    bottom += (lineHeight / 2) - info.cellPadding;

    ctx.fillStyle = "#bbb";
    var yOffset = 0;
    for (var x = left; x < left + info.gradateWidth; x += 4) {
      if (yOffset == 0) yOffset = 4;
      else yOffset = 0;

      for (var y = top + yOffset; y < bottom; y += 8) {
        var w = 4;
        var h = 4;
        if (x + w > left + info.gradateWidth) w = left + info.gradateWidth - x;
        if (y + h > bottom) h = bottom - y;
        ctx.fillRect(x, y, w, h);

      }
    }

    top = info.padding - lineHeight / 2;

    var prev = null;
    for (var idx = 0; idx < data.colors.length; idx++) {

      var lineNo = (data.desc ? data.colors.length - idx - 1 : idx);

      var row = data.colors[lineNo];
      var color = row.color;
      if (color) color = GSIBV.Map.Layer.FreeRelief.colorStringToRGBA(color);

      var startY = top + (idx * lineHeight);// - Math.round( lineHeight/ 2 )-1;

      for (var y = startY; y < startY + lineHeight; y++) {
        var yP = (y - startY) / lineHeight;

        if (color) {
          var c = {
            r: color.r,
            g: color.g,
            b: color.b,
            a: 255
          };
          ctx.globalAlpha = 1;
          if (prev) {
            c.r = prev.r + Math.round((color.r - prev.r) * yP);
            c.g = prev.g + Math.round((color.g - prev.g) * yP);
            c.b = prev.b + Math.round((color.b - prev.b) * yP);
          } else if (idx > 0) {
            //if ( yP < 0.5 ) 
            if (y < startY + (lineHeight / 2)) continue;
          }

          if (c.r > 255) c.r = 255;
          if (c.g > 255) c.g = 255;
          if (c.b > 255) c.b = 255;
          if (c.a > 255) c.a = 255;

          ctx.fillStyle = "rgb(" + c.r + "," + c.g + "," + c.b + ")";

        } else {
          if (prev) {
            var c = {
              r: prev.r,
              g: prev.g,
              b: prev.b,
              a: 255
            };


            if (y >= startY + (lineHeight / 2)) c.a = 0;

            if (c.r > 255) c.r = 255;
            if (c.g > 255) c.g = 255;
            if (c.b > 255) c.b = 255;
            if (c.a > 255) c.a = 255;

            ctx.fillStyle = "rgb(" + c.r + "," + c.g + "," + c.b + ")";
            ctx.globalAlpha = c.a / 255;
          }
          else {
            ctx.fillStyle = "rgb(255,255,255)";
            ctx.globalAlpha = 0;
          }


        }
        ctx.fillRect(left, y, info.gradateWidth, 1);

        if (idx == data.colors.length - 1 && y == startY + lineHeight - 1) {

          ctx.fillRect(left, y + 1, info.gradateWidth, lineHeight + 1);
        }
      }


      prev = color;
    }

    var bottom = top + (lineHeight * data.colors.length);

    ctx.fillStyle = "#fff";
    ctx.fillRect(left, top, info.gradateWidth, (lineHeight / 2) + info.cellPadding);
    ctx.fillRect(left, bottom + (lineHeight / 2) - info.cellPadding, info.gradateWidth, (lineHeight / 2));

    top += (lineHeight / 2) + info.cellPadding;
    bottom += (lineHeight / 2) - info.cellPadding;


    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.lineTo(left + info.gradateWidth, top);
    ctx.lineTo(left + info.gradateWidth, bottom);
    ctx.lineTo(left, bottom);
    ctx.lineTo(left, top);
    ctx.closePath();

    ctx.strokeStyle = "#999";
    ctx.stroke();

  }



  var prev = null;
  var rows = drawInfo.rows;
  if (data.gradate)
    drawGradateBar(drawInfo, data, ctx);

  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    // 昇順、降順による描画位置
    var lineNo = (data.desc ? rows.length - i - 1 : i);
    if (!data.gradate) drawColor(data.gradate, drawInfo, lineNo, ctx, row);
    drawText(data.gradate, drawInfo, lineNo, ctx, prev, row);
    prev = row;
  }


  return canvas;

};
