GSIBV.Map.Layer.TYPES["hillshade"] = "陰影起伏図";
GSIBV.Map.Layer.FILTERS.unshift(function (l) {

  if ( l.type == "hillshade") {
    return new GSIBV.Map.Layer.Hillshade({
      "id": l.id,
      "title": l.title,
      "url": l.url,
      "html": l.html,
      "legendUrl": l.legendUrl,
      "minzoom": l.minZoom,
      "maxzoom": l.maxZoom,
      "minNativeZoom": l.minNativeZoom,
      "maxNativeZoom": l.maxNativeZoom,
      "layerType": l.layerType

    });
  }
  return null;

} );


GSIBV.Map.Layer.Hillshade = class extends GSIBV.Map.Layer.TileImage {

  constructor(options) {
    super(options);
    this._type = "hillshade";
    this._url = "";
    this._drawer = new GSIBV.Map.Layer.Hillshade.TileDrawer ();

    if ( options ) {
      this._layerType = options.layerType;
    }
  }

  get isBackground() {
    return this._layerType === "background";
  }
  
  _createTile(x,y,z) {
    return new GSIBV.Map.Layer.Hillshade.Tile(this,this._drawer,x,y,z,{
      opacity : this._opacity,
      visible : this._visible
    });
  }

  _onDataChange() {
    this._destroyTiles();
    this._refresh();
  }

  _add(map) {
    this._bearing = map.map.getBearing();
    super._add(map);

    if ( !this._handleRotateEnd ) {
      this._handleRotateEnd = MA.bind( this._onMapRotateEnd, this );
    }

    map.map.on("rotateend", this._handleRotateEnd );

    if ( !this._dataChangeHandler) {
      this._dataChangeHandler = MA.bind( this._onDataChange, this );
    }
    

    return true;
  }

  _remove(map) {

    if ( this._handleRotateEnd ) {
      map.map.off("rotateend", this._handleRotateEnd );
      this._handleRotateEnd = undefined;
    }

    if ( this._demManager ) {
      this._demManager.destroy();
    }
    this._destroyTiles();
    if ( this._dataChangeHandler) {
      this._dataChangeHandler = null;
    }

    super._remove(map);
  }
 
  _onMapRotateEnd() {
    this._bearing = this._map.map.getBearing();

    let bearing = this._bearing;
    bearing = ( bearing < 0 ? Math.abs(bearing) : 180 + (180-bearing) );
    let az = -bearing- 45;
    if ( az < 0 ) az = 360  + az;
    console.log(bearing, az);

    this._refresh();
  }

  _refresh() {
    
    if ( !this._map ) return;

    var map = this._map.map;
    var zoom = this._getZoom();

    var bearing = this._bearing;
    

    // 必要なタイル一覧取得
    var coordsList = GSIBV.Map.Layer.TileImage.getCoordsList(map,zoom, true);
    var tiles = {};
    if ( !this._tiles) this._tiles = {};

    
    for( var i=0; i<coordsList.length; i++) {
      var coords = coordsList[i];
      
      var tile = this._createTile(coords.x, coords.y, coords.z);
      tile.bearing = bearing;

      if ( this._tiles[tile.key]) {
      // 現在表示中タイルがあればそれを利用
        tiles[tile.key] = this._tiles[tile.key];
        delete this._tiles[tile.key];
      } else {
        tiles[tile.key] = tile;
      } 
      tiles[tile.key].bearing = bearing;
    }

    // 不要なタイル破棄
    for( var key in this._tiles) {
      const tile = this._tiles[key];
      if ( this._demManager) {
        this._demManager.remove(tile.x,tile.y,tile.z);
      }
      tile.destroy();
    }

    // タイル更新
    this._tiles = tiles;


    // 中心から近い順の配列を生成
    var centerLatLng = map.getCenter();
    var center = GSIBV.Map.Layer.TileImage.latlngToCoords(centerLatLng.lat, centerLatLng.lng, zoom);

    var loadTiles = [];

    for (var key in this._tiles) {
      var tile = this._tiles[key];
      tile.distance = 
        Math.sqrt(Math.pow(center.x - tile.x, 2) + Math.pow(center.y - tile.y, 2));
      loadTiles.push(tile);
    }

    loadTiles.sort(function (a, b) {
      if (a.distance < b.distance) return -1;
      if (a.distance > b.distance) return 1;
      return 0;
    });

    // タイル読み込み
    for( var i=0; i<loadTiles.length; i++ ) {
      loadTiles[i].load();
    }

  }

  loadDEM(x, y, z) {

    if ( !this._demManager) {
      this._demManager = new GSIBV.Map.Layer.Hillshade.DEMManager ();
      this._demManager.on("load", (e)=>{
        // 周辺のタイルの読み込み状況をチェック
        const key = GSIBV.Map.Layer.FreeRelief.Tile.makeKey(e.params.x,e.params.y,e.params.z);
        var tile = this._tiles[key];
        tile.setData(e.params.data);
      });
    }

    const info = this._demManager.get(x,y,z);
    if ( !info ) {
      this._demManager.load(x,y,z);
    }

  }
}


/*******************************************************

 GSIBV.Map.Layer.Hillshade.DEMManager
    タイル

*******************************************************/



GSIBV.Map.Layer.Hillshade.DEMManager = class extends MA.Class.Base {

  constructor() {
    super();
    this._loadingHash = {};
  }


  get(x,y,z) {
    const key = GSIBV.Map.Layer.FreeRelief.Tile.makeKey(x,y,z);

    return this._loadingHash [key];
  }

  checkLoaded(targetInfo) {

    if ( !targetInfo) return false;
    if ( targetInfo.loaded) return true;
    const x = targetInfo.x;
    const y = targetInfo.y;
    const z = targetInfo.z;

    // 必要な周辺データが読み込み完了しているか判定
    let loaded = true;
    
    for( let x2=x; x2<=x+1; x2++ ) {
      for( let y2=y; y2<=y+1; y2++ ) {
        const info = this.get(x2,y2,z);
        if ( !info  || !info.demLoaded) loaded = false;
      }

    }
    
    if ( loaded ) {
      targetInfo.data = [];
      // 周辺のデータと合わせた配列を生成
      const demData = targetInfo.loader.getData();
      if ( demData ) {
        for( let y2=0; y2<256; y2++) {
          for( let x2=0; x2<256; x2++) {
            const srcIndex = (y2 * 256) + (x2);
            const destIndex = (y2 * 257) + (x2);
            targetInfo.data[destIndex] = demData[srcIndex];
          }
        }
      }

      // 右の一列埋める
      const rightInfo = this.get(x+1,y,z);
      if (rightInfo ) {
        const rightData = rightInfo.loader.getData();
        if ( rightData ) {
          for( let y2=0; y2<256; y2++) {
            const srcIndex = (y2 * 256);
            const destIndex = (y2 * 257) + 256;
            targetInfo.data[destIndex] = rightData[srcIndex];
    
          }
        }
      }


      // 下の１行埋める
      const bottomInfo = this.get(x,y+1,z);
      if (bottomInfo ) {
        const bottomData = bottomInfo.loader.getData();
        if ( bottomData ) {
          for( let x2=0; x2<256; x2++) {
            const srcIndex = x2;
            const destIndex = (256 * 257) + x2;
            targetInfo.data[destIndex] = bottomData[srcIndex];
    
          }
        }
      }


      // 右下の1px埋める
      const bottomRightInfo = this.get(x+1,y+1,z);
      if (bottomRightInfo ) {
        const bottomRightData = bottomRightInfo.loader.getData();
        if ( bottomRightData ) {
          const destIndex = (256 * 257) + 256;
          targetInfo.data[destIndex] = bottomRightData[0];
  
        }
      }
      
      //console.log( targetInfo.data );

    }

    targetInfo.loaded = loaded;


    return loaded;

  }
  _onDEMLoad = (e) => {
    const x = e.from._coords.x;
    const y = e.from._coords.y;
    const z = e.from._coords.z;
    
    const info = this.get(x,y,z);
    if ( !info) return;
    
    info.demLoaded = true;
    this.checkLoaded(info);


    for( let x2=x-1; x2<=x+1; x2++ ) {
      for( let y2=y-1; y2<=y+1; y2++ ) {
        const info2 = this.get(x2,y2,z);
        if ( !info2  || info2.loaded) continue;

        this.checkLoaded( info2);
        if ( info2.loaded ) {
          this.fire("load",{
            x:info2.x,
            y:info2.y,
            z:info2.z,
            data:info2.data
          });
        }

      }

    }


    if ( !info.loaded ) return;

    this.fire("load",{
      x:x,
      y:y,
      z:z,
      data:info.data
    });
  }

  remove(x,y,z) {
    const key = GSIBV.Map.Layer.FreeRelief.Tile.makeKey(x,y,z);
    const info = this._loadingHash [key];

    if ( info ) {
      info.loader.destroy();
      delete this._loadingHash [key];
    }


  }


  load(x,y,z) {

    const key = GSIBV.Map.Layer.FreeRelief.Tile.makeKey(x,y,z);
    if ( !this._loadingHash [key] ) { 
      this._loadingHash [key] = {
        loader : new GSIBV.DEMLoader( x, y, z, {}),
        key : key,
        x : x,
        y : y,
        z : z
      };
      // DEM10Bのみ使用
      this._loadingHash [key].loader._urlList = [{
        id: "DEM10B",
        url: "https://cyberjapandata.gsi.go.jp/xyz/dem_png/{z}/{x}/{y}.png",
        minZoom: 0,
        maxZoom: 15
      }];

      this._loadingHash [key].loader.on("load", this._onDEMLoad);
      this._loadingHash [key].loader.load();
    }

    
  }

  destroy() {

    for( var key in this._loadingHash ) {
      const info = this._loadingHash [key];

      if ( info ) {
        info.loader.destroy();
        delete this._loadingHash [key];
      }
    }

    this._loadingHash = {};

  }

};



/*******************************************************

 GSIBV.Map.Layer.Hillshade.Tile
    タイル

*******************************************************/



GSIBV.Map.Layer.Hillshade.Tile = class extends GSIBV.Map.Layer.TileImage.Tile {

  constructor( layer, drawer, x,y,z, options) {
    super(layer, x,y,z,options);
    this._drawer = drawer;
    this._bearing = 0;
    
  }

  set bearing(bearing) {
    if ( this._bearing !== bearing ) {
      this._bearing = bearing;
      if ( this._data ) {
        this._refreshCanvas(this._data );
        this._addLayer(true);
      }
    }
  }
  get bearing() {
    return this._bearing;
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

    this._layer.loadDEM(this._x, this._y, this._z);
    /*
    this._loadHandler = MA.bind(this._onDEMLoad,this );
    //console.log( this._drawer.elevationData );

    this._loader = new GSIBV.DEMLoader( this._x, this._y, this._z);
    this._loader.on("load",this._loadHandler);
    this._loader.load();
    */
  }

  setData(data) {
    this._data = data;
    this._refreshCanvas(data );
    this._addLayer();
  }


  destroy() {
    if ( this._canvas ) delete this._canvas;
    this._canvas = null;
    super.destroy();
  }

  
  _getUrl() {
    if ( !this._canvas) return null;
    return this._canvas.toDataURL();
  }

  _refreshCanvas( demData ) {
    if ( !this._canvas ) {
      this._canvas = document.createElement("canvas");
      this._canvas.width = 256;
      this._canvas.height = 256;
      //document.body.append( this._canvas);
    }
    this._drawer.draw(this._canvas, demData, {x:this._x, y:this._y, z:this._z}, this._bearing );
    

  }
};

GSIBV.Map.Layer.Hillshade.Tile.makeKey = function(x,y,z) {
  return x + ":" + y + ":" +z;
};




/*******************************************************

 GSIBV.Map.Layer.Hillshade.TileDrawer
    タイル描画

*******************************************************/
GSIBV.Map.Layer.Hillshade.TileDrawer = class extends MA.Class.Base {

  constructor(options){
    super( options);
    this.options = {
    };
  }

  pointToLatLng(point, zoom) {

		var w = Math.pow( 2, zoom ) * 256,	
    yy = Math.atan( Math.pow( Math.E, ( 0.5 - point.y / w ) * 2 * Math.PI ) );
    return { lat: yy / Math.PI * 360 - 90, lng: point.x / w * 360 - 180 };

  }
  

  // Canvasへ描画
  draw (dstCanvas, demData, coord, bearing) {
    if (!demData) return;

    bearing = ( bearing < 0 ? Math.abs(bearing) : 180 + (180-bearing) );
    let az = -bearing- 45;
    if ( az < 0 ) az = 360  + az;
    var destCtx = dstCanvas.getContext('2d');
    destCtx.clearRect(0, 0, 256, 256);
    destCtx.beginPath();
    var destData = destCtx.createImageData(256, 256);

    const baseColor = {r:255,g:255,b:255};
		const shaded_elv = 45;
    const shaded_az = az;
    const gamma = 1;
    const hf = 100;

    var lat = this.pointToLatLng( { x: 0, y: coord.y * 256 + 128 }, coord.z ).lat;
    var nz = ( Math.abs( 2 * Math.PI * 6378137 * Math.cos ( lat / 180 ) / ( 256 * Math.pow( 2, coord.z )))) * 100;
    // 単位ベクトル
    var ix = Math.cos( shaded_elv * Math.PI / 180 ) * Math.sin( shaded_az * Math.PI / 180 );
    var iy = - Math.cos( shaded_elv * Math.PI / 180 ) * Math.cos( shaded_az * Math.PI / 180 );
    var iz = Math.sin( shaded_elv * Math.PI / 180 );
    
    var destIdx = 0;
    for (var y = 0; y < 256; ++y) {
      for (var x = 0; x < 256; ++x) {
        const srcIndex = (y * 257) + (x);
        
        var r=0,g=0,b=0,a=0;

        const h = demData[srcIndex];

        if( h !== "e" && h != null && h!=undefined){
          // 右，下との標高差
          var rh = demData[ srcIndex + 1 ];
          var bh = demData[ srcIndex + 257 ];
                                  
          var hx = ( rh ) ? ( h - rh ) : 0; // 右
          var hy = ( bh ) ? ( h - bh ) : 0; // 下
          // 陰影タイルに必要なRGB値
          var l = Math.pow( Math.pow( hx, 2 ) + Math.pow( hy, 2 ) + Math.pow( nz / hf, 2 ), 1 / 2 ),
            c = Math.max( 0, ( ( hx * ix ) + ( hy * iy ) + ( nz * iz )  / hf ) / l );
          
          if( baseColor ) {
            // 基準色指定あり
            r = Math.pow( c, 1 / gamma ) * baseColor.r;
            g = Math.pow( c, 1 / gamma ) * baseColor.g;
            b = Math.pow( c, 1 / gamma ) * baseColor.b;
          }else{
            r = g = b = Math.pow( c, 1 / gamma ) * 255;
            //console.log( r );
              
          }
          a = 255;
        } else {
          a = 0;
        }
        //input.data.set( [ r, g, b, a ], m * 4 );
        destData.data[ destIdx ] = r;
        destData.data[ destIdx + 1 ] = g;//g;
        destData.data[ destIdx + 2 ] = b;//b;
        destData.data[ destIdx + 3 ] = a;//a;


        destIdx += 4;
      }


    }

    destCtx.putImageData(destData, 0, 0);

  }
};


// 描画時作業用Canvas取得
GSIBV.Map.Layer.Hillshade.TileDrawer.getCanvas = function () {
  if (!GSIBV.Map.Layer.Hillshade.TileDrawer._canvas) {
    GSIBV.Map.Layer.Hillshade.TileDrawer._canvas = document.createElement('canvas');
    GSIBV.Map.Layer.Hillshade.TileDrawer._canvas.width = 256;
    GSIBV.Map.Layer.Hillshade.TileDrawer._canvas.height = 256;
  }
  return GSIBV.Map.Layer.Hillshade.TileDrawer._canvas;
};
