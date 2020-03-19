GSIBV.VectorTileSource = class {
  constructor(tiles, minZoom, maxZoom) {

    this._tiles = JSON.parse(JSON.stringify(tiles));

    this._minZoom = ( minZoom ? minZoom : GSIBV.CONFIG.VectorTileSource.minzoom);
    this._maxZoom = ( maxZoom ? maxZoom : GSIBV.CONFIG.VectorTileSource.maxzoom);

    this._id = "gsibv-vectortile-source-" + GSIBV.VectorTileSource.getUniqID();
  }

  static getUniqID() {
    if (!GSIBV.VectorTileData._uniqIDInc) GSIBV.VectorTileData._uniqIDInc = 0;
    GSIBV.VectorTileData._uniqIDInc++;

    if (GSIBV.VectorTileData._uniqIDInc > 9999999) GSIBV.VectorTileData._uniqIDInc = 1;

    return GSIBV.VectorTileData._uniqIDInc;
  }

  tilesEquals(tiles, minZoom, maxZoom) {

    if ( this._minZoom != minZoom || this._maxZoom != maxZoom ) return false;
    if (this._tiles.length != tiles.length) return false;

    var a = this._tiles.sort();
    var b = tiles.sort();

    for (var i = 0; i < a.length; i++) {
      if (a[i] != b[i]) return false;
    }


    return true;
  }
  get id() { return this._id; }

  get mapboxSource() {
    if ( this._mapboxSource ) return this._mapboxSource;


    var source = {
      "type": "vector",
      "tiles": this._tiles,
      "minzoom": this._minZoom,
      "maxzoom": this._maxZoom
    };;



    return source;
    /*
    var result =[];

    var sourceList = GSIBV.CONFIG.VectorTileSourceList;
    

    for( var i=0; i<sourceList.length; i++ ) {
      
      var source = {
        "type": "vector",
        "tiles": this._tiles,
        "minzoom": sourceList[i]["minzoom"],
        "maxzoom": sourceList[i]["maxzoom"]
      };

      result.push( source );
    }

    this._mapboxSource = result;
    return result;
    */
  }

}
GSIBV.VectorTileSource.Manager = class {
  constructor() {
    this._sourceList = [];
  }

  getSource(tiles, minZoom, maxZoom ) {

    if ( !minZoom ) minZoom = GSIBV.CONFIG.VectorTileSource.minzoom;
    if ( !maxZoom ) maxZoom = GSIBV.CONFIG.VectorTileSource.maxzoom;

    for (var i = 0; i < this._sourceList.length; i++) {
      var source = this._sourceList[i];
      if (source.tilesEquals(tiles, minZoom, maxZoom)) {
        return source;
      }

    }
    var source = new GSIBV.VectorTileSource(tiles, minZoom, maxZoom);

    this._sourceList.push(source);

    return source;

  }
}

GSIBV.VectorTileSource.Manager.manager = new GSIBV.VectorTileSource.Manager();
