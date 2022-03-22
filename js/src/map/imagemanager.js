GSIBV.Map.ImageManager = class extends MA.Class.Base {
  constructor(map) {
    super();
    this._map = map;
    this._images = {};
    this._imagePopupContents = {};
    this._keyPrefix = "-gsibv-image-";

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
    var key = this._keyPrefix + url;
    if(!this._images[key]) return false;
    return this._images[key].data || this._images[key].canvas;
  }

  getImage(url) {
    var key = this._keyPrefix + url;
    return (this._images[key] && this._images[key].data ? this._images[key].data : null);
  }

  getImageCanvas(url){
    var key = this._keyPrefix + url;
    return (this._images[key] && this._images[key].canvas ? this._images[key].canvas : null);
  }

  getImagePopupContent(url){
    var key = this._keyPrefix + url;
    return (this._imagePopupContents[key] ? this._imagePopupContents[key] : null);
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

  initLocalTiff(url){
    var key = this._keyPrefix + url;
    var image = {
      url: url,
      key: key
    };
    this._images[key] = image;
    return key;
  }

  loadLocalTiff(url, data) {
    var key = this._keyPrefix + url;
    if(!this._images[key]) return;

    (async function(instance){
      const tiff = await GeoTIFF.parse(data);
      const image = await tiff.getImage();
      const meta = await image.getFileDirectory();

      if (!instance._images[key]["canvas"]) {
        instance._images[key]["canvas"] = MA.DOM.createInContainer('canvas', 'image-layer');
      }
      
      image.readRGB(MA.bind(function (samplesperPixcel, raster) {
        var canvas = instance._images[key]["canvas"];
        canvas.style.position = "absolute";
        canvas.style.zIndex = 1111111;
        canvas.width = image.getWidth();
        canvas.height = image.getHeight();
        var ctx = canvas.getContext("2d");
        var imageData = ctx.createImageData(image.getWidth(), image.getHeight());
        var data = imageData.data;
        var o = 0;
        var inc = (samplesperPixcel == 4 ? 4 : 3);
        for (var i = 0; i < raster.length; i += inc) {
          data[o] = raster[i];
          data[o + 1] = raster[i + 1];
          data[o + 2] = raster[i + 2];
          data[o + 3] = (inc == 4 ? raster[i + 3] : 255);
          o += 4;
        }
        ctx.putImageData(imageData, 0, 0);
  
        instance.fire("loaded");
      }, this, meta.SamplesPerPixel));
    })(GSIBV.Map.ImageManager.instance);
  }

  loadLocalJPEGImage(data, filename, file){
    var jpeg = new GSIBV.Map.Jpeg(data, filename, file);
    if(jpeg.imageInfo){
      jpeg.on("loaded", MA.bind( this._updateJpeg, this ));
    }
    return jpeg.imageInfo;
  }

  _updateJpeg(evt){
    var jpeg = evt.params.target;
    if(!jpeg instanceof GSIBV.Map.Jpeg) return;

    var key = this._keyPrefix + jpeg.imageInfo.options.iconUrl;
    this._imagePopupContents[key] = jpeg.popupContent;
    this.fire("loaded");
  }
}

GSIBV.Map.Jpeg = class extends MA.Class.Base {
  constructor(bytes, fileName, file, options) {
    super();
    this.ICONLIST = {
      "none": "https://maps.gsi.go.jp/portal/sys/v4/symbols/180.png",
      "w": "https://maps.gsi.go.jp/portal/sys/v4/symbols/188.png",
      "nw": "https://maps.gsi.go.jp/portal/sys/v4/symbols/181.png",
      "n": "https://maps.gsi.go.jp/portal/sys/v4/symbols/182.png",
      "ne": "https://maps.gsi.go.jp/portal/sys/v4/symbols/183.png",
      "e": "https://maps.gsi.go.jp/portal/sys/v4/symbols/184.png",
      "se": "https://maps.gsi.go.jp/portal/sys/v4/symbols/185.png",
      "s": "https://maps.gsi.go.jp/portal/sys/v4/symbols/186.png",
      "sw": "https://maps.gsi.go.jp/portal/sys/v4/symbols/187.png"
    }

    this._fileName = fileName;
    this._exif = EXIF.readFromBinaryFile(bytes);

    if(this._exif){
      this._gpsInfo = this._getGPSInfoFromExif(this._exif);

      var directionIcon = this.ICONLIST[this._gpsInfo.directionKey];
      
      if (!options) options = {};
      Object.assign(options, {
        iconUrl: directionIcon,
        iconSize: [20, 20],
        iconOffset: [0, 0]
      })

      this._gpsInfo.options = options;
      this._loadLocalJPEGImage(file);
    } else {
      this._gpsInfo = undefined;
    }
  }

  get imageInfo(){
    return this._gpsInfo;
  }

  get popupContent(){
    return this._popupContent;
  }

  _getGPSInfoFromExif(exif){
    var lat = exif["GPSLatitude"];
    var lng = exif["GPSLongitude"];
    var result = {
      lat: lat[0] + (lat[1] / 60) + (lat[2] / 3600),
      lng: lng[0] + (lng[1] / 60) + (lng[2] / 3600),
      direction: exif["GPSImgDirection"]
    };

    if (exif["GPSLatitudeRef"] == "S") {
      result.lat = -result.lat;
    }
    if (exif["GPSLongitudeRef"] == "W") {
      result.lng = -result.lng;
    }
    result.directionKey = this._getDirectionKey(result.direction);
    return result;
  }

  _getDirectionKey(direction){
    if (direction >= 337.5 && direction < 22.5) {
      return "n";
    } else if (direction >= 22.5 && direction < 67.5) {
      return "ne";
    } else if (direction >= 67.5 && direction < 112.5) {
      return "e";
    } else if (direction >= 112.5 && direction < 157.5) {
      return "se";
    } else if (direction >= 157.5 && direction < 202.5) {
      return "s";
    } else if (direction >= 202.5 && direction < 247.5) {
      return "sw";
    } else if (direction >= 247.5 && direction < 292.5) {
      return "w";
    } else if (direction >= 292.5 && direction < 337.5) {
      return "nw";
    } else {
      return "none";
    }
  }

  _loadLocalJPEGImage(file){
    this._jpegImage = new Image();
    var reader = new FileReader();

    reader.onload = MA.bind(function (reader) {
      this._jpegImage.onload = MA.bind(function () {
        var orientation = this._exif["Orientation"];
        var rotate = 0;
        switch (orientation) {
          case 3:
            rotate = 180;
            break;
          case 6:
            rotate = 90;
            break;
          case 8:
            rotate = 270;
            break;
        }
        var canvas = this._createCanvas(this._jpegImage, rotate);

        this._canvasImage = new Image();
        this._canvasImage.src = canvas.toDataURL('image/jpeg');
        this._popupContent = this._createPopupContent(canvas.width, canvas.height);

        this.fire("loaded", { "target":this });
      }, this);
      this._jpegImage.src = reader.result;
    }, this, reader);
    reader.readAsDataURL(file);
  }

  _createCanvas(img, rotate){
    var canvas = document.createElement("canvas");

    var srcSize = {
      width: img.width,
      height: img.height
    }
    canvas.width = srcSize.width;
    canvas.height = srcSize.height;

    var srcCtx = canvas.getContext("2d");
    srcCtx.drawImage(img, 0, 0);
    var srcData = srcCtx.getImageData(0, 0, srcSize.width, srcSize.height);

    var size = {
      width: (rotate == 0 || rotate == 180 ? srcSize.width : srcSize.height),
      height: (rotate == 0 || rotate == 180 ? srcSize.height : srcSize.width)
    };

    var destData = srcCtx.createImageData(size.width, size.height);
    this._rotateImage(srcData, srcSize, destData, size, rotate);

    canvas.width = size.width;
    canvas.height = size.height;
    srcCtx.putImageData(destData, 0, 0, 0, 0, size.width, size.height);

    return canvas;
  }

  _rotateImage(src, srcSize, dest, destSize, rotate){
    for (var y = 0; y < srcSize.height; y++) {
      for (var x = 0; x < srcSize.width; x++) {
        var srcIdx = (y * srcSize.width * 4) + (x * 4);
        var x2 = x;
        var y2 = y;
        switch (rotate) {
          case 90:
            x2 = destSize.width - y - 1;
            y2 = x;
            break;
          case 180:
            x2 = srcSize.width - x - 1;
            y2 = srcSize.height - y - 1;
            break;
          case 270:
            x2 = y;
            y2 = destSize.height - x - 1;
            break;
        }

        var destIdx = (y2 * destSize.width * 4) + (x2 * 4);
        dest.data[destIdx] = src.data[srcIdx];
        dest.data[destIdx + 1] = src.data[srcIdx + 1];
        dest.data[destIdx + 2] = src.data[srcIdx + 2];
        dest.data[destIdx + 3] = src.data[srcIdx + 3];
      }
    }
  }

  _createPopupContent(width, height){
    var html = '<div class="gsi-jpeginfo-popup">';

    html += '<img style="' + (width > height ? "max-width:300px" : "max-height:300px") + ';" src="' + this._canvasImage.src + '">';

    html += "<table>";
    html += '<tr><th>撮影日時</th><td>' +
      (this._exif['DateTimeOriginal'] ? this._exif['DateTimeOriginal'] : "不明") + '</td></tr>';
    html += '<tr><th>撮影位置</th><td>' +
      this._gpsInfo.lat + ",<br>" + this._gpsInfo.lng + '</td></tr>';
    html += '<tr><th>撮影向き</th><td>' +
      (!this._gpsInfo.direction || isNaN(this._gpsInfo.direction) ? "不明" : this._gpsInfo.direction + "度") + '</td></tr>';
    html += "</table>";

    html += "</div>";
    return html;
  }
}