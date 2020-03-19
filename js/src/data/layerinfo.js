GSIBV.LayerInfoBase = class  extends MA.Class.Base{

  constructor(parent) {
    super();
    this._parent = parent;
    this._title = "";
  }

  get title() { return this._title; }

  getTitle() {
    if ( !GSIBV.CONFIG.LANG ) return this._title;

    var lang = ( GSIBV.application ? GSIBV.application.lang : "ja" );
    
    var title = this._title;
    if ( lang != "ja") {
      var titleLang = GSIBV.CONFIG.LANG[lang.toUpperCase()].LAYER[title];
      if ( titleLang != undefined) title = titleLang;
    }
    return title; 
  }
  
  get parent() { return this._parent; }

  clone() {

  }

  copyTo(dest) {
    dest._title = this._title;
  }

  find(layer) {

  }
}


GSIBV.LayerInfo = class extends GSIBV.LayerInfoBase {

  constructor(parent) {
    super(parent);
    this._id = "";
    this._minZoom = null;
    this._maxZoom = null;
    this._minNativeZoom = null;
    this._maxNativeZoom = null;
    this._iconUrl = "";
    this._html = "";
    this._url = "";
    this._legendUrl = "";
    this._area = null;
    this._opacity = null;
  }

  get id() { return this._id; }
  get minZoom() { return this._minZoom; }
  get maxZoom() { return this._maxZoom; }
  get minNativeZoom() { return this._minNativeZoom; }
  get maxNativeZoom() { return this._maxNativeZoom; }
  get iconUrl() { return this._iconUrl; }
  get html() { return this._html; }
  get legendUrl() { return this._legendUrl; }
  get url() { return this._url; }
  get area() { return this._area; }
  get opacity() { return this._opacity; }

  get layer() {
    if (this._layer) return this._layer;

    this._layer = GSIBV.Map.Layer.generate(this);

    /*
    if ( !this._type ) {
        
        var url = this._url;
        
        if ( url.match(/\{z\}/i) ) {
            if ( url.match( //i ) ) {
                
            } else {
                this._type = "tilegeojson"
            }
        }
        
    }
    if ( this._type ) {
        if ( this._type == "raster" ) {
            this._layer = new GSIBV.Map.Layer.Raster({
                "id" : this.id,
                "title" : this.title,
                "url" : this.url
            });
         } else if ( this._type == "binaryvector" ) {
            this._layer = new GSIBV.Map.Layer.BinaryVectorTile({
                "id" : this.id,
                "title" : this.title,
                "url" : this.url
            });
         }
    }
    */
    return this._layer;
  }

  clone() {
    var result = new GSIBV.LayerInfo(null);
    this.copyTo(result);

    return result;
  }

  copyTo(dest) {
    super.copyTo(dest);
    dest._minZoom = this._minZoom;
    dest._maxZoom = this._maxZoom;
    dest._minNativeZoom = this._minNativeZoom;
    dest._maxNativeZoom = this._maxNativeZoom;
    dest._iconUrl = this._iconUrl;
    dest._html = this._html;
    dest._url = this._url;
    dest._id = this._id;
    dest._legendUrl = this._legendUrl;
    dest._area = this._area;
    dest._opacity = this._opacity;
  }

}




GSIBV.LayerDirectoryInfo = class extends GSIBV.LayerInfo {

  constructor(parent) {
    super(parent);
    this._entries = [];

  }

  get isDirectory() { return true; }
  get length() { return this._entries.length; }

  add(item) {
    this._entries.push(item);
  }


  get(idx) {
    return this._entries[idx];
  }


  clone() {
    var result = new GSIBV.LayerDirectoryInfo(null);

    this.copyTo(result);
    return result;
  }

  copyTo(dest) {
    super.copyTo(dest);

    for (var i = 0; i < this._entries.length; i++) {
      dest._entries.push(this._entries[i].clone(dest));
    }
  }
  find(layer) {
    if (layer == this) return this;
    return this._find(this, layer);
  }
  _find(parent, layer) {
    if (!parent.isDirectory) return null;

    for (var i = 0; i < parent.length; i++) {
      var child = parent.get(i);
      if (child == layer) return child;
      else if (child.isDirectory) {
        return this._find(child, layer);
      }
    }

    return null;

  }

  findById(id) {
    if (this.id == id) return this;
    return this._findId(this, id);
  }
  _findId(parent, id) {
    if (!parent.isDirectory) return null;

    for (var i = 0; i < parent.length; i++) {
      var child = parent.get(i);
      if (child.id == id) return child;
      else if (child.isDirectory) {
        return _findId._find(child, id);
      }
    }

    return null;

  }
}

