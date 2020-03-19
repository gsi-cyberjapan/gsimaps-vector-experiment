/*******************************************************
 GSIBV.DEMLoader
    標高タイル読込
    自分で作る色別標高図などで利用
*******************************************************/

GSIBV.DEMLoader = class extends MA.Class.Base {


  // 初期化
  constructor(x, y, z, options) {
    super( options );
    if ( !this.options ) this.options = {};

    this.options.minZoom = 8;
    this.options.overZooming = true;
    this.options.useHillshademap = options.useHillshademap;
    this.options.tms = false;
    
    this._hillshademapUrl= 'https://cyberjapandata.gsi.go.jp/xyz/hillshademap/{z}/{x}/{y}.png';
    if (!GSIBV.DEMLoader.pow2_8) {
      // 利用するべき乗キャッシュ
      GSIBV.DEMLoader.pow2_8 = Math.pow(2, 8);
      GSIBV.DEMLoader.pow2_16 = Math.pow(2, 16);
      GSIBV.DEMLoader.pow2_23 = Math.pow(2, 23);
      GSIBV.DEMLoader.pow2_24 = Math.pow(2, 24);
    }


    this._coords = {
      x: x,
      y: y,
      z: z
    };

  }

  // 表示に必要な範囲
  /*
  _pxBoundsToTileRange (bounds) {
    var tileSize = 256;
    return new L.Bounds(
      bounds.min.unscaleBy(tileSize).floor(),
      bounds.max.unscaleBy(tileSize).ceil().subtract([1, 1]));
  }
  */

  // 後始末、破棄
  destroy() {
    if (this._demImage) {
      this._demImage.onload = null;
      this._demImage.onerror = null;
      MA.DOM.off(this._demImage,"load");
      MA.DOM.off(this._demImage, "error");
      
      delete this._demImage;
      this._demImage = null;
    }

    if (this._hillshademapImage) {
      this._hillshademapImage.onload = null;
      this._hillshademapImage.onerror = null;
      MA.DOM.off(this._hillshademapImage,"load");
      MA.DOM.off(this._hillshademapImage, "error");
      delete this._hillshademapImage;
      this._hillshademapImage = null;
    }

    if (this._demData) {
      delete this._demData;
      this._demData = null;
    }
    if (this._demInfo) {
      delete this._demInfo;
      this._demInfo = null;
    }
  }

  // 読み込んだデータ
  getData () {
    return this._demData;
  }

  // 読み込んだデータの情報
  getInfo () {
    return this._demInfo;
  }

  // 読み込んだ陰影画像
  getHillshademapImage () {
    return (this._hillshademapLoaded && !this._hillshademapError ? this._hillshademapImage : null);
  }

  // 読み込み開始
  load () {

    this._demData = null;
    this._demInfo = null;
    this._demLoaded = false;
    this._currentCoords = {};
    for( var key in this._coords) {
      this._currentCoords[key] = this._coords[key];
    }

    if ( !this._urlList ) {
      this._urlList = GSIBV.DEMLoader.getURLList(this._coords.x, this._coords.y, this._coords.z);
    }

    this._urlList = this._makeUrlList( this._urlList );


    this._startLoadDEM(this._currentCoords);
    if (this.options.useHillshademap) {
      this._loadHillshademap(this._currentCoords);
    }

  }

  _makeUrlList( list ) {
    var zoomList = [];
    for( var i=0; i<20; i++ ) {
      zoomList.push([]);
    }
    for( var i=0; i<list.length; i++ ) {
      for( var z=list[i].maxZoom; z>= list[i].minZoom; z-- ) {
        var item = {};
        for( var key in list[i]) {
          item[key] = list[i][key];
        }
        item.minZoom = z;
        item.maxZoom = z;
        zoomList[z].push(item);
      }
    }
    
    if ( !this.options.useTileList) {
      this.options.useTileList = ["DEM5A","DEM5B","DEM5C","DEM10B","DEMGM"];
    }

    var useTileList = this.options.useTileList;

    var result = [];
    for( var z=zoomList.length-1; z>=0; z--) {
      for( var i=0; i<zoomList[z].length; i++ ) {
        var item = zoomList[z][i];
        if ( useTileList.indexOf( item.id ) >= 0 ) {
          if ( item.complementList ) {
            var complementList = [];
            for( var j=0; j<item.complementList.length; j++ ) {

              var complement = item.complementList[j];
              if ( useTileList.indexOf( complement.id) >= 0)
                complementList.push(complement);

            }
            item.complementList = complementList;
          }
          result.push( zoomList[z][i]); 
        }
      }
    }

    if ( result.length <= 0 && useTileList.indexOf("DEMGM")==0) {
      
      result.push( {
        id: "DEMGM",
        url: "https://cyberjapandata.gsi.go.jp/xyz/demgm_png/{z}/{x}/{y}.png",
        minZoom: 0,
        maxZoom: 8
      });
    }
    return result;
  }

  // 陰影画像読み込み
  _loadHillshademap(coords) {

    var url = this.getDEMTileUrl(this._hillshademapUrl, coords);
    this._hillshademapImage = document.createElement('img');
    this._hillshademapImage.onload = MA.bind(
      function (coords) {
        
        var scale = 1, lt, rb, point;
        if (this._coords.z != coords.z) {
          scale = Math.pow(2, this._coords.z - coords.z);

          lt = {
            x :coords.x * 256 * scale,
            y :coords.y * 256 * scale
          };
          rb = {
            x :(coords.x + 1) * 256 * scale,
            y :(coords.y + 1) * 256 * scale
          }

          point = {
            x :this._coords.x * 256,
            y : this._coords.y * 256
          };

          point.x -= lt.x;
          point.y -= lt.y;
        }
        else {
          point = {
           x:0,
           y:0 
          };
        }
        
        this._hillshademapImage._point = point;
        this._hillshademapImage._scale = scale;
        
        this._hillshademapLoadSuccess();
      }, this, coords);
      
      
    this._hillshademapImage.onerror = MA.bind(
      function (e) {
        this._hillshademapLoadError();
      }, this);

    this._hillshademapImage.setAttribute('crossOrigin', 'anonymous');
    this._hillshademapImage.setAttribute('role', 'presentation');

    this._hillshademapImage.src = url;
  }

  // URL生成
  getDEMTileUrl (url, coords) {


    return url.replace("{x}", coords.x).replace("{y}",coords.y).replace("{z}",coords.z);

  }

  // 指定のタイルが無い場合一つ上のズーム
  _nextZoom () {

    var nextZoom = this._currentCoords.z - 1;


    if (nextZoom < this.options.minZoom) {
      this._demLoadError();
      return;
    }

    var scale = Math.pow(2, this._coords.z - nextZoom);
    //var point = L.point(this._coords.x * 256 / scale, this._coords.y * 256 / scale)
    //  .divideBy(256)._floor();

    var point = {
      x : this._coords.x * 256 / scale,
      y : this._coords.y * 256 / scale
    };

    point.x = Math.floor(point.x/256);
    point.y = Math.floor(point.y/256);


    this._currentCoords = {
      x: point.x,
      y: point.y,
      z: nextZoom
    };

    this._startLoadDEM(this._currentCoords);


  }

  // 読み込み開始
  _startLoadDEM (coords) {

    var urlList = JSON.parse(JSON.stringify(this._urlList) );//$.extend(true, [], this._urlList);
    this._loadDEM(urlList, coords);


  }

  // 標高データ取得
  _loadDEM (urlList, coords) {
    var targetUrl = null;
    var targetId = null;
    var z = coords.z;

    while (urlList.length > 0) {
      var urlInfo = urlList.shift();
      if (urlInfo.minZoom <= z && z <= urlInfo.maxZoom) {
        targetUrl = {};
        
        for( var key in urlInfo) {
          targetUrl[key] = urlInfo[key];
        }

        targetId = urlInfo.id;
        break;
      }
    }

    if (!targetUrl) {
      //err
      if (z > 0 && this.options.overZooming) {
        this._nextZoom();
      }
      else {
        this._demLoadError();
      }
      return;
    }

    var url = this.getDEMTileUrl(targetUrl.url, coords);

    this._demImage = document.createElement('img');

    this._demImage.onload = MA.bind(
      function (urlList, coords, targetUrl, targetId) {
        this._demLoadSuccess(urlList, coords, targetUrl, targetId);
      }, this, urlList, coords, targetUrl, targetId);
    this._demImage.onerror = MA.bind(
      function (urlList, coords, e) {
        this._loadDEM(urlList, coords);
      }, this, urlList, coords);
    

    this._demImage.setAttribute('crossOrigin', 'anonymous');
    this._demImage.setAttribute('role', 'presentation');
    this._demImage.src = url;

  }

  // 読み込み完了後解析
  _demLoadSuccess (urlList, coords, targetUrl, targetId) {
    var scale = 1, lt, rb, point, idx = 0, destIdx = 0;
    if (this._coords.z != coords.z) {
      scale = Math.pow(2, this._coords.z - coords.z);

      lt = {x:coords.x * 256 * scale, y:coords.y * 256 * scale};
      rb = {x:(coords.x + 1) * 256 * scale, y:(coords.y + 1) * 256 * scale};

      point ={x:this._coords.x * 256, y:this._coords.y * 256};

      point.x -= lt.x;
      point.y -= lt.y;
    }
    else {
      point = {x:0,y:0};
    }



    var pow2_8 = GSIBV.DEMLoader.pow2_8;
    var pow2_16 = GSIBV.DEMLoader.pow2_16;
    var pow2_23 = GSIBV.DEMLoader.pow2_23;
    var pow2_24 = GSIBV.DEMLoader.pow2_24;

    var demData = (this._demData ? this._demData : []);
    var demInfo = ( this._demInfo ? this._demInfo : []);

    var canvas = GSIBV.DEMLoader.getCanvas();
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0,0,256,256);
    ctx.beginPath();
    ctx.drawImage(this._demImage, 0, 0, 256, 256);
    var data = ctx.getImageData(0, 0, 256, 256).data;
    var hasErrorPixel = false;


    for (var y = 0; y < 256; ++y) {
      for (var x = 0; x < 256; ++x) {

        if (!this._demData || this._demData[destIdx] == null) {

          if (scale != 1) {
            var x2 = Math.floor((point.x + x) / scale);
            var y2 = Math.floor((point.y + y) / scale);
            idx = (y2 * 256 * 4) + (x2 * 4);
          }
          else
            idx = (y * 256 * 4) + (x * 4);


          var r = data[idx + 0];
          var g = data[idx + 1];
          var b = data[idx + 2];
          var h = 0;
          if ( (r !=undefined && g != undefined && b != undefined ) && ( r != 128 || g != 0 || b != 0) ) {
            var d = r * pow2_16 + g * pow2_8 + b;
            h = (d < pow2_23) ? d : d - pow2_24;
            if (h == -pow2_23) h = 0;
            else h *= 0.01;
            demData[destIdx] = h;
            demInfo[destIdx] = {
              "id" : targetId,
              "zoom" : coords.z
            };
          }
          else {
            hasErrorPixel = true;
            demData[destIdx] = null;
            demInfo[destIdx] = null;
          }

        }

        destIdx++;
      }

    }
    if (this._demData) {
      hasErrorPixel = false;

      for (var i = 0; i < demData.length; i++) {
        if (demData[i] == null) {
          hasErrorPixel = true;
          break;
        }
      }
      if (hasErrorPixel) {
        hasErrorPixel = false;
        var complementList = JSON.parse(JSON.stringify(this._urlList) ); //$.extend(true, [], this._urlList);

        for (var i = 0; i < complementList.length; i++) {
          if (complementList[i].url == targetUrl.url &&
            complementList[i].minZoom == targetUrl.minZoom &&
            complementList[i].maxZoom == targetUrl.maxZoom) {
            complementList.splice(i, 1);
            if (complementList.length > 0) {
              targetUrl.complementList = complementList;
              hasErrorPixel = true;
            }
            break;
          }

        }
      }
    }
    this._demData = demData;
    this._demInfo = demInfo;


    if (hasErrorPixel && targetUrl.complementList) {
      
      // DEM5aなどの境目補完
      // urlリストを補完用に変更
      this._urlList = JSON.parse(JSON.stringify(targetUrl.complementList) ); //$.extend(true, [], targetUrl.complementList);
      this._startLoadDEM(this._currentCoords);

    }
    else {

      this._demLoaded = true;
      this._checkLoaded();
    }

  }

  _demLoadError () {
    
    this._demLoaded = true;
    this._checkLoaded();
  }

  _hillshademapLoadSuccess () {
    this._hillshademapLoaded = true;
    this._hillshademapError = false;
    this._checkLoaded();
  }


  _hillshademapLoadError () {

    this._hillshademapLoaded = true;
    this._hillshademapError = true;
    this._checkLoaded();
  }

  // 読み込み完了チェック
  _checkLoaded () {
    if (this._demLoaded &&
      (!this.options.useHillshademap || this._hillshademapLoaded)) {
      this.fire("load");
    }
  }

};

// 標高png読み取り用Canvas
GSIBV.DEMLoader.getCanvas = function () {
  if (!GSIBV.DEMLoader._canvas) {
    GSIBV.DEMLoader._canvas = document.createElement('canvas');
    GSIBV.DEMLoader._canvas.width = 256;
    GSIBV.DEMLoader._canvas.height = 256;
  }
  return GSIBV.DEMLoader._canvas;
};



/*******************************************************

 GSIBV.DEMLoader.getURLList
    標高データURL

*******************************************************/

/*******************************************************
 標高タイルのエリア
   GSIBV..DEMLoader.DEMAREA
   GSIBV..DEMLoader.DEMAREA2
   GSIBV..DEMLoader.DEMAREA3
   ※それぞれ上記ハッシュにコピーされ削除される
*******************************************************/
GSIBV.DEMLoader.DEMAREALIST = [
  "8/215/108",
  "8/215/109",
  "8/215/110",
  "8/216/108",
  "8/216/109",
  "8/216/110",
  "8/217/109",
  "8/218/107",
  "8/218/108",
  "8/219/101",
  "8/219/102",
  "8/219/103",
  "8/219/104",
  "8/219/105",
  "8/219/106",
  "8/219/107",
  "8/219/108",
  "8/220/101",
  "8/220/102",
  "8/220/103",
  "8/220/104",
  "8/220/105",
  "8/220/106",
  "8/220/107",
  "8/221/101",
  "8/221/102",
  "8/221/103",
  "8/221/104",
  "8/221/105",
  "8/221/108",
  "8/221/109",
  "8/221/110",
  "8/221/99",
  "8/222/100",
  "8/222/101",
  "8/222/102",
  "8/222/103",
  "8/223/100",
  "8/223/101",
  "8/223/102",
  "8/224/100",
  "8/224/101",
  "8/224/102",
  "8/224/113",
  "8/224/99",
  "8/225/100",
  "8/225/101",
  "8/225/102",
  "8/225/98",
  "8/225/99",
  "8/226/100",
  "8/226/101",
  "8/226/102",
  "8/226/98",
  "8/226/99",
  "8/227/100",
  "8/227/101",
  "8/227/102",
  "8/227/103",
  "8/227/104",
  "8/227/105",
  "8/227/93",
  "8/227/94",
  "8/227/95",
  "8/227/96",
  "8/227/97",
  "8/227/98",
  "8/227/99",
  "8/228/100",
  "8/228/107",
  "8/228/108",
  "8/228/109",
  "8/228/110",
  "8/228/91",
  "8/228/92",
  "8/228/93",
  "8/228/94",
  "8/228/95",
  "8/228/96",
  "8/228/97",
  "8/228/98",
  "8/228/99",
  "8/229/107",
  "8/229/108",
  "8/229/91",
  "8/229/92",
  "8/229/93",
  "8/229/94",
  "8/229/95",
  "8/229/97",
  "8/230/92",
  "8/230/93",
  "8/230/94",
  "8/231/92",
  "8/231/93",
  "8/231/94",
  "8/232/91",
  "8/232/92",
  "8/232/93",
  "8/233/91",
  "8/233/92",
  "8/237/110"
];
GSIBV.DEMLoader.DEMAREA2LIST = [
  "9/442/198",
  "9/438/202",
  "9/438/203",
  "9/439/202",
  "9/439/203",
  "9/457/182",
  "9/458/182",
  "9/442/197"
];

GSIBV.DEMLoader.DEMAREA3LIST = [
  "10/879/406",
  "10/879/407"
];


GSIBV.DEMLoader.DEMAREA = {};
GSIBV.DEMLoader.DEMAREA2 = {};
GSIBV.DEMLoader.DEMAREA3 = {};
for (var i = 0; i < GSIBV.DEMLoader.DEMAREALIST.length; i++) GSIBV.DEMLoader.DEMAREA[GSIBV.DEMLoader.DEMAREALIST[i]] = 1;
for (var i = 0; i < GSIBV.DEMLoader.DEMAREA2LIST.length; i++) GSIBV.DEMLoader.DEMAREA2[GSIBV.DEMLoader.DEMAREA2LIST[i]] = 1;
for (var i = 0; i < GSIBV.DEMLoader.DEMAREA3LIST.length; i++) GSIBV.DEMLoader.DEMAREA3[GSIBV.DEMLoader.DEMAREA3LIST[i]] = 1;
delete GSIBV.DEMLoader.DEMAREALIST; GSIBV.DEMLoader.DEMAREALIST = null;
delete GSIBV.DEMLoader.DEMAREA2LIST; GSIBV.DEMLoader.DEMAREA2LIST = null;
delete GSIBV.DEMLoader.DEMAREA3LIST; GSIBV.DEMLoader.DEMAREA3LIST = null;

// タイル座標から標高タイルURLを決定
GSIBV.DEMLoader.getURLList = function (x, y, z) {

  //-------------------------------------------------------------------------------
  var getCoords = function (x, y, z, targetZoom) {
    var scale = Math.pow(2, z - targetZoom);
    var point = {x:x * 256 / scale, y:y * 256 / scale};
    point.x=Math.floor(point.x/256);
    point.y=Math.floor(point.y/256);
      //.divideBy(256)._floor();

    return {
      x: point.x,
      y: point.y,
      z: targetZoom
    };
  };
  var coordsToKey = function (coords) { return coords.z + "/" + coords.x + "/" + coords.y; };
  //-------------------------------------------------------------------------------


  // ZL8以下はdem_gm
  if (z <= 8) {
    return [{
      id: "DEMGM",
      url: "https://cyberjapandata.gsi.go.jp/xyz/demgm_png/{z}/{x}/{y}.png",
      minZoom: 0,
      maxZoom: 8
    }];
  }


  // ZL9以上
  var key;

  // DEMAREAになけれdem_gm
  key = coordsToKey(getCoords(x, y, z, 8));
  if (!GSIBV.DEMLoader.DEMAREA[key]) return [{
    id: "DEMGM",
    url: "https://cyberjapandata.gsi.go.jp/xyz/demgm_png/{z}/{x}/{y}.png",
    minZoom: 0,
    maxZoom: 8
  }];


  // DEMAREA2になければdem
  key = coordsToKey(getCoords(x, y, z, 9));
  if (!GSIBV.DEMLoader.DEMAREA2[key])
    return [
      {
        id: "DEM5A",
        url: "https://cyberjapandata.gsi.go.jp/xyz/dem5a_png/{z}/{x}/{y}.png",
        minZoom: 9,
        maxZoom: 15,
        complementList: [
          {
            id: "DEM5B",
            url: "https://cyberjapandata.gsi.go.jp/xyz/dem5b_png/{z}/{x}/{y}.png",
            minZoom: 9,
            maxZoom: 15
          },
          {
            id: "DEM5C",
            url: "https://cyberjapandata.gsi.go.jp/xyz/dem5c_png/{z}/{x}/{y}.png",
            minZoom: 9,
            maxZoom: 15
          },
          {
            id: "DEM10B",
            url: "https://cyberjapandata.gsi.go.jp/xyz/dem_png/{z}/{x}/{y}.png",
            minZoom: 9,
            maxZoom: 14
          }
        ]
      },
      {
        id: "DEM5B",
        url: "https://cyberjapandata.gsi.go.jp/xyz/dem5b_png/{z}/{x}/{y}.png",
        minZoom: 9,
        maxZoom: 15,
        complementList: [
          {
            id: "DEM5C",
             url: "https://cyberjapandata.gsi.go.jp/xyz/dem5c_png/{z}/{x}/{y}.png",
             minZoom: 9,
             maxZoom: 15
          },
          {
            id: "DEM10B",
            url: "https://cyberjapandata.gsi.go.jp/xyz/dem_png/{z}/{x}/{y}.png",
            minZoom: 9,
            maxZoom: 14
          }
        ]
      },
      {
        id: "DEM5C",
        url: "https://cyberjapandata.gsi.go.jp/xyz/dem5c_png/{z}/{x}/{y}.png",
        minZoom: 9,
        maxZoom: 15,
        complementList: [
          {
            id: "DEM10B",
            url: "https://cyberjapandata.gsi.go.jp/xyz/dem_png/{z}/{x}/{y}.png",
            minZoom: 9,
            maxZoom: 14
          }
        ]
      },
      {
        id: "DEM10B",
        url: "https://cyberjapandata.gsi.go.jp/xyz/dem_png/{z}/{x}/{y}.png",
        minZoom: 9,
        maxZoom: 14,
        complementList: [
        ]
      }
    ];



  key = coordsToKey(getCoords(x, y, z, 10));
  if (!GSIBV.DEMLoader.DEMAREA3[key] == -1) {
    // DEMAREA2にあって、DEMAREA3になければdemgm
    return [{
      id: "DEMGM",
      url: "https://cyberjapandata.gsi.go.jp/xyz/demgm_png/{z}/{x}/{y}.png",
      minZoom: 0,
      maxZoom: 8
    }];
  }
  else {
    // DEMAREA2にあって、DEMAREA3にあればdem
    return [{
      id: "DEM10B",
      url: "https://cyberjapandata.gsi.go.jp/xyz/dem_png/{z}/{x}/{y}.png",
      minZoom: 0,
      maxZoom: 14,
      complementList: [
        {
          id: "DEMGM",
          url: "https://cyberjapandata.gsi.go.jp/xyz/demgm_png/{z}/{x}/{y}.png",
          minZoom: 0,
          maxZoom: 8
        }
      ]
    }
    ];
  }


};
