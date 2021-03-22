

GSIBV.Map.ImageManager = class extends MA.Class.Base {
  constructor(map) {
    super();
    this._map = map;
    this._images = {};

    map.on("styledata", MA.bind(this.refresh, this));
  }

  refresh() {
    for (var key in this._images) {
      if (this._map.hasImage(key)) {
        continue;
      }

      if (this._images[key].data)
        this._map.addImage(key, this._images[key].data, { pixelRatio: 1 });

    }

  }

  has(url) {
    var key = "-gsibv-image-" + url;
    return (this._images[key] && this._images[key].data ? true : false);
  }

  getImage(url) {
    var key = "-gsibv-image-" + url;
    return (this._images[key] && this._images[key].data ? this._images[key].data : null);
  }

  static get(map) {
    GSIBV.Map.ImageManager.create(map);
    return GSIBV.Map.ImageManager.instance; 
  }
  
  static create(map) {
    if (!GSIBV.Map.ImageManager.instance) {
      GSIBV.Map.ImageManager.instance =
        new GSIBV.Map.ImageManager(map);
    }
  }

  load(url) {

    //setTimeout(MA.bind(function(url){
    var key = "-gsibv-image-" + url;
    if (!this._images[key]) {
      var img = MA.DOM.create("img");
      img.crossOrigin = "anonymous";

      var image = {
        url: url,
        img: img,
        key: key
      };
      MA.DOM.on(img, "load", MA.bind(this._onImageLoad, this, image, url));
      MA.DOM.on(img, "error", MA.bind(this._onImageLoadError, this, image, url));
      this._images[key] = image;
      img.src = url;
    } else {
    }
    return key;

    //},this,url), 2000);

  }
  
  add(key, img, url) {
    if ( this._images[key] ) return;

    
    var image = {
      url: url,
      img: img,
      key: key
    };

    this._images[key] = image;
    this._onImageLoad( image, url );
  }

  remove( key ) {
    if ( !this._images[key] ) return;
    if( this._map.hasImage(key) ) this._map.removeImage(key);
    delete this._images[key];

  }

  _onImageLoad(image, url) {
    var canvas = document.createElement('canvas');
    var w = image.img.width;
    var h = image.img.height;

    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(image.img, 0, 0);

    var srcImgData = ctx.getImageData(0, 0, w, h);
    var imgData = new Uint8Array(w * h * 4);


    for (var i = 0; i < imgData.length; i++) {
      imgData[i] = srcImgData.data[i];
    }

    image.data = {
      width: w,
      height: h,
      data: imgData
    };
    this._map.addImage(image.key, image.data, { pixelRatio: 1 });
    //delete icon[ "img" ];
    this.fire("load", image);
  }
  _onImageLoadError(image, url) {
    delete this._images[image.key];
    this.fire("load", null);
    this.fire("error", {url:url});
  }
}