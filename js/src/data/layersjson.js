GSIBV.LayersJSON = class extends MA.Class.Base {

  constructor(gsimapsLayers, url) {
    super();

    this._hasSrcDirList = [];

    this._loader = new GSIBV.LayersJSON.Loader ();

    if ( url ) {
      this._url = url;
    } else {
      this._url = window.location.href;
    }

    this._root = new GSIBV.LayersJSON.Directory(this, null, null, this._url);

    this._root.on("load", MA.bind( function() {
      this.fire("load");
      
      if ( this._loadNext ) {
        this._loadSrcDirList();
      }

    },this));
    var urlList = [];
    for( var i=0; i<gsimapsLayers.length; i++ ) {
      urlList.push( gsimapsLayers[i].url );
    }
    this._root.src = urlList;
  }

  addSrcDir(dir) {
    this._hasSrcDirList.push( dir );
  }

  set loadNext(loadNext) {
    this._loadNext = loadNext;
  }

  get url() { return this._url; }

  get root() { return this._root; }
 
  get loader() {
    return this._loader;
  }
 
  load() {
    if ( this._loading  ) return;
    this._loading = true;
    this._loadNext  = false;
    this._root.load();
  }

  _loadSrcDirList() {
    this._loadNext = false;

    if ( this._hasSrcDirList.length <= 0 ) return;


    if ( !this._loadSrcDirHandler ) {
      this._loadSrcDirHandler = MA.bind( this._onLoadSrcDir, this );
    }

    this._loadingList = [];
    for( var i=0 ; i<this._hasSrcDirList.length; i++ ) {
      var dir = this._hasSrcDirList[i];
      if ( !dir.hasSrc) continue;
      dir.on("load", this._loadSrcDirHandler ) ;
      this._loadingList.push( dir );
    }
    this._hasSrcDirList = [];

    for( var i=0 ; i<this._loadingList.length; i++ ) {
      var dir = this._loadingList[i];
      dir.load();
    }

  }

  _onLoadSrcDir(e) {

    for( var i=0 ; i<this._loadingList.length; i++ ) {
      var dir = this._loadingList[i];
      if ( dir == e.from ) {
        this._loadingList.splice(i,1);
        break;
      }
    }

    if ( this._loadingList.length <= 0 ) {
      
      if ( this._loadNext ) {
        this._loadSrcDirList();
      }
    }
  }
};


GSIBV.LayersJSON.LoadingLayer = class {

  constructor(owner, parent, url) {
    this._owner = owner;
    this._parent = parent;
    this._url = url;
  }

  get owner() {return this._owner;}
  get parent() {return this._parent;}
  get url() {return this._url;}

};

GSIBV.LayersJSON.Layer = class extends GSIBV.LayerInfo {

  constructor(owner, parent, data) {
    super(parent);
    this._owner = owner;
    this._options = {};
    if (data) {
      if (data.title) this._title = data.title;
      if (data.id) this._id = data.id;
      if (data.minZoom) this._minZoom = data.minZoom;
      if (data.maxZoom) this._maxZoom = data.maxZoom;
      if (data.minNativeZoom) this._minNativeZoom = data.minNativeZoom;
      if (data.maxNativeZoom) this._maxNativeZoom = data.maxNativeZoom;
      if (data.iconUrl) this._iconUrl = data.iconUrl;
      if (data.html) this._html = data.html;
      if (data.legendUrl) this._legendUrl = data.legendUrl;
      if (data.url) this._url = data.url;
      if (data.area) this._area = data.area;
      if (data.opacity != undefined) this._opacity = data.opacity;

      for( var key in data ) {
        this._options [key] = data[key];
      }
    }

  }

  get options() {
    return this._options;
  }
  clone(parent) {
    var result = new GSIBV.LayersJSON.Layer(parent);
    this.copyTo(result);

    return result;
  }
};



GSIBV.LayersJSON.MultiLayer = class extends GSIBV.LayersJSON.Layer {

  constructor(owner,parent, data) {
    super(owner,parent, data);
    this._children = [];

    if (data) {
      for (var i = 0; i < data.entries.length; i++) {
        var item = data.entries[i];
        if (item.type != "Layer") continue;
        this._children.push(new GSIBV.LayersJSON.Layer(owner, this, item));
      }
    }
  }

  get isMulti() { return true; }
  get children() { return this._children; }

  clone(parent) {
    var result = new GSIBV.LayersJSON.MultiLayer(parent);
    this.copyTo(result);

    return result;
  }

  copyTo(dest) {
    super.copyTo(dest);

    dest._children = [];

    for (var i = 0; i < this._children.length; i++) {

      dest._children.push(this._children[i].clone(dest));
    }
  }

}


GSIBV.LayersJSON.Directory = class extends GSIBV.LayerDirectoryInfo {
  
  constructor(owner, parent, data, url ) {
    super(parent);
    this._owner = owner;
    this._url = url;
    
    if (data) {
      if (data.title) this._title = data.title;
      if (data.iconUrl) this._iconUrl = data.iconUrl;
      if (data.html) this._html = data.html;

      this._entries = this._parseEntries( data.entries, this.url );

      if ((!this._entries || this._entries.length == 0 ) && data.src) {
        this._src = data.src;
        this._initSrc();
      }
    }
  }

  get hasSrc() {
    return ( this._src != undefined && this._src.length > 0 );
  }
  get url() {
    return ( this._url != undefined ? this._url : this._parent.url );
  }
  get iconUrl() {
    return ( this._iconUrl );
  }
  get html() {
    return ( this._html );
  }

  _initSrc() {
    if ( this._src == undefined) return;

    this._src  = (typeof this._src  == "string" ? [this._src] : this._src );

    for( var i=0; i<this._src.length; i++ ) {
      var src = this._src[i];
      if (src.indexOf("./") == 0) {
        var srcURL = this.url;
        
        var urlParts = srcURL.split("/");
        urlParts.pop();
        this._src[i] = src.replace("./", urlParts.join("/") + "/");
        
      } else if (src.indexOf("../") == 0) {
  
        //console.log(this.url);
      } else if ( src.indexOf("//") != 0 && src.indexOf("http://") != 0  && src.indexOf("https://") != 0) {
        var srcURL = this._owner.url;
        var urlParts = srcURL.split("/");
        urlParts.pop();
        this._src[i] = urlParts.join("/") + ( src.indexOf("/") == 0 ? "": "/" ) +src;
      }
    }
    
  }
  set src( src ) {
    this._src = src;
    this._initSrc();
  }

  load() {
    if ( this._src == undefined || this._src.length <= 0) {
      return false;
    }
    this._requestQueue = this._src;

    for( var i=0; i<this._src.length; i++ ) {
      var layer = new GSIBV.LayersJSON.LoadingLayer( this._owner, this, this._src[i] );
      this._entries.push( layer );
    }

    //this._urlList = JSON.parse( JSON.stringify(this._requestQueue ) );

    this._src = undefined;
    if ( !this._loadHandler ) {
      this._loadHandler = MA.bind( this._onLoad, this );
      this._owner.loader.on("load", this._loadHandler);
    }
    this._owner.loader.load(this._requestQueue );

    this.fire("change");
    return true;
  }

  _onLoad(e) {
    var hit = false;
    for( var i=0; i<this._requestQueue.length; i++ ) {
      if ( this._requestQueue[i] == e.params.url ) {
        this._requestQueue.splice( i,1);
        hit = true;
        break;
      }
    }
    if ( !hit) return;

    
    for( var i=0; i<this._entries.length; i++ ){
      var layer = this._entries[i];
      if ( ! ( layer instanceof GSIBV.LayersJSON.LoadingLayer  ) ) continue;
      if ( layer.url == e.params.url ) {
        if ( e.params.json  ) {
          var json = JSON.parse(JSON.stringify(e.params.json ));
          var list = this._parseEntries( json.layers, layer.url );
          Array.prototype.splice.apply(this._entries,[i,1].concat(list));
          this.fire("change");
        }
        break;
      }
    } 

    if ( this._requestQueue.length <= 0) {
      //finish
      //this._owner.loader.off("load", this._loadHandler);
      //this._loadHandler = null;
      this.fire("load");
    }
  }

  _fireLayerLoad(layer) {
    var params = {"layer":layer,loadNext:false};
    this._owner.fire("layerload", params );
    this._owner.loadNext = params.loadNext;
  }

  _parseEntries( layers, url ) {
    if ( !layers ) return [];

    var result = [];

    for( var i=0; i<layers.length; i++ ) {
      var item = layers[i];
      if (item.type == "LayerGroup" && (!item.id || item.id == "")) {
        var group = new GSIBV.LayersJSON.Directory(this._owner,this, item,url);
        if ( group.hasSrc) {
          this._owner.addSrcDir(group);
        }
        result.push( group );
      } else if (item.type == "LayerGroup") {
        var layer = new GSIBV.LayersJSON.MultiLayer(this._owner,this, item);
        result.push( layer );
        this._fireLayerLoad(layer);
      } else if (item.type = "Layer") {
        var layer = new GSIBV.LayersJSON.Layer(this._owner,this, item);
        result.push( layer );
        this._fireLayerLoad(layer);
      } else console.log(item);
    }

    return result;
  }
  


  clone(parent) {
    var result = new GSIBV.LayersJSON.Directory(parent);
    this.copyTo(result);
    return result;
  }

  copyTo(dest) {
    super.copyTo(dest);
    dest._src = this._src;

  }
};

GSIBV.LayersJSON.Loader = class extends MA.Class.Base {

  constructor() {
    super();
    this._urlHash = {};
  }

  load(url) {
    url = (typeof url == "string" ? [{ "url": url }] : url);
    var finished = true;
    for (var i = 0; i < url.length; i++) {
      var item = this._urlHash[url[i]];
      if (!item) {
        item = {
          req: new MA.HTTPRequest({ "type": "json", url: url[i] }),
          loaded: false,
          url : url[i]
        };
        item.req.on("load", MA.bind(this._onHTTPLoad, this, item));
        item.req.on("error", MA.bind(this._onHTTPError, this, item));
        item.req.on("finish", MA.bind(this._onHTTPFinish, this, item));
        item.req.load();
      } else if ( item.loaded ) {
        setTimeout(MA.bind( this.fireLoad,this,item),0);
      }
      this._urlHash[url[i]] = item;
    }

  }

  fireLoad(item) {
    this.fire("load",item); 
  }
  
  _onHTTPLoad(item,e) {
    var json = e.params.response;
    item.json = json;

  }

  _onHTTPError(item,e) {
    console.log(e,item);
  }

  _onHTTPFinish(item,e) {
    //item.req.abort();
    //delete item.req;

    item.loaded = true;
    this.fireLoad( item );
  }
};

