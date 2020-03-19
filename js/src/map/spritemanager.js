GSIBV.Map.SpriteManager = class extends MA.Class.Base {

  constructor() {
    super();

    this._sprites = {};
    this._groupList = [];
  }

  static spriteId(id, itemId) {
    return ( id == undefined || id == "" ? GSIBV.CONFIG.Sprite.defaultGroup: id ) + "///" + itemId;
  }

  get groupList() {
    return this._groupList;
  }

  add(id, title, url) {
    if (this._sprites[id]) {
      if (!this._sprites[id].loading) {
        setTimeout( MA.bind(function(){
          this.fire("load");
        },this),0);
      }
    } else {
      this._groupList.push({"id":id, "title": title});
      this._load(id, title, url);
    }
  }

  _load(id, title, url) {
    var request = {
      img: MA.DOM.create("img"),
      req: new MA.HTTPRequest({
        "url": url + ".json",
        "type": "json"
      }),
      id: id,
      title : title
    };
    request.img.crossOrigin = "anonymous";
    MA.DOM.on(request.img, "load", MA.bind(this._onImageLoad, this, request));
    MA.DOM.on(request.img, "error", MA.bind(this._onImageLoadError, this, request));

    request.req.on("load", MA.bind(this._onJSONLoad, this, request));
    request.req.on("finish", MA.bind(this._onJSONLoadFinish, this, request));

    this._sprites[id] = { "loading": true };
    request.img.src = url + ".png";
    request.req.load();

  }

  _onImageLoad(request) {

    request.imageLoaded = true;
    var w = request.img.width;
    var h = request.img.height;

    var canvas = MA.DOM.create("canvas");
    canvas.width = w;
    canvas.height = h;

    var ctx = canvas.getContext("2d");
    ctx.drawImage(request.img, 0, 0);
    request.imgData = ctx.getImageData(0, 0, w, h);
    delete request["img"];

    /*
    var imgData = new Uint8Array(w*h*4);


    for( var i=0; i<imgData.length; i++ ) {
        imgData[i] = srcImgData.data[i];
    }
    */


    this._onLoad(request);
  }
  _onImageLoadError(request) {
    request.imageLoaded = true;
    this._onLoad(request);
  }

  _onJSONLoad(request, e) {
    request.jsonData = e.params.response;

  }

  _onJSONLoadFinish(request) {
    request.jsonLoaded = true;
    this._onLoad(request);
  }

  _onLoad(request) {
    if (!request.jsonLoaded || !request.imageLoaded) return;

    if (request.jsonData && request.imgData) {
      this._sprites[request.id].title = request.title;
      this._sprites[request.id].data = request.jsonData;
      this._sprites[request.id].img = request.imgData;
      this._sprites[request.id].imgW = request.imgW;
      this._sprites[request.id].imgH = request.imgH;
    }

    this._sprites[request.id].loading = false;

    this.fire("load");
  }

  isLoaded(id) {
    return( this._sprites[id].loading == false );
    
  }

  getList(id) {
    var result = [];
    if (id) {

      if (!this._sprites[id] || !this._sprites[id].data) return result;
      var json = this._sprites[id].data;
      var imgData = this._sprites[id].img;
      for (var key in json) {
        var info = json[key];
        var img = this._getImg(imgData,
          info.x, info.y, info.width, info.height);
          
        info.id = key;
        result.push({
          "info": info,
          "img": { width: info.width, height: info.height, data: img },
          "id": id
        });
      }
    } else {
      for (var key in this._sprites) {
        id = key;
        if (!this._sprites[id] || !this._sprites[id].data) continue;
        var json = this._sprites[id].data;
        var imgData = this._sprites[id].img;
        for (var key in json) {
          var info = json[key];
          var img = this._getImg(imgData,
            info.x, info.y, info.width, info.height);

          info.id = key;
          result.push({
            "info": info,
            "img": { width: info.width, height: info.height, data: img },
            "id": id
          });
        }
      }

    }

    return result;

  }

  _getImg(srcImgData, srcX, srcY, destW, destH) {


    var imgData = new Uint8Array(destW * destH * 4);
    var srcW = srcImgData.width;
    var srcH = srcImgData.height;

    for (var y = 0; y < destH; y++) {
      for (var x = 0; x < destW; x++) {
        var destIdx = (y * (destW * 4)) + (x * 4);
        var x2 = srcX + x;
        var y2 = srcY + y;
        var srcIdx = -1;

        if (x2 < srcW && y2 < srcH) {
          srcIdx = (y2 * (srcW * 4)) + (x2 * 4);
        }

        if (srcIdx >= 0) {
          imgData[destIdx] = srcImgData.data[srcIdx];
          imgData[destIdx + 1] = srcImgData.data[srcIdx + 1];
          imgData[destIdx + 2] = srcImgData.data[srcIdx + 2];
          imgData[destIdx + 3] = srcImgData.data[srcIdx + 3];
        }
      }
    }

    return imgData;

  }

};