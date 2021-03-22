GSIBV.Map.Layer.TYPES["raster"] = "画像タイル";

GSIBV.Map.Layer.FILTERS.unshift(function (l) {


  if ( l.id == CONFIG.COMPAREPHOTO_ID ) {
    return new GSIBV.Map.Layer.ComparePhoto({
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

});



GSIBV.Map.Layer.ComparePhoto = class extends GSIBV.Map.Layer.Raster {

  constructor(options) {
    super(options);
    this._photoIndex = 0;
  }

  get url() { return CONFIG.COMPAREPHOTO_PHOTOLIST[this._photoIndex].url; }

  set photoIndex(index) {
    if ( index < 0 ) index = 0;
    if ( CONFIG.COMPAREPHOTO_PHOTOLIST.length <= index ) index = CONFIG.COMPAREPHOTO_PHOTOLIST.length-1;

    if ( this._photoIndex == index ) return;

    this._photoIndex = index;
    this._addSourceLayer(this._map);
    this.fire("change",{index:index});
  }

  get photoIndex() {
    return this._photoIndex;
  }

}
