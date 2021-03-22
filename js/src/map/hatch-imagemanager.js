GSIBV.Map.HatchImageManager = class extends MA.Class.Base {
  constructor(map) {
    super();
    this._map = map;
    this._types = {
      "ltrb": true,
      "rtlb": true,
      "cross": true,
      "plus": true,
      "minus": true,
      "dot": true
    };
    this._images = {};

    map.on("styledata", MA.bind(this.refresh, this));
  }

  refresh() {
    for (var key in this._images) {
      if (this._map.hasImage(key)) {
        continue;
      }
      this._map.addImage(key, this._images[key]);

    }

  }

  static create(map) {
    if (!GSIBV.Map.HatchImageManager.instance) {
      GSIBV.Map.HatchImageManager.instance =
        new GSIBV.Map.HatchImageManager(map);
    }
  }

  getImageId(type, r, g, b, a, size, bgColor) {
    //size=6;
    //type="cross";
    if (!type) return null;

    var typeParts = type.split("/");

    type = typeParts[0];

    if (!this._types[type]) return null;

    if (typeParts.length >= 2) {
      bgColor = MA.Color.parse("rgba(" + typeParts[1] + ")");
    }


    if (!size) size = GSIBV.Map.HatchImageManager.getSize(type);
    if (a == undefined) a = 1;

    var key = "-gsibv-hatch-" + type + "-" + size + "-" +
      r + "," + g + "," + b + "," + (a != undefined ? a : 1) + "-" +
      (bgColor != undefined ? bgColor.r + "," + bgColor.g + "," + bgColor.b + "," + bgColor.a : "");

    if (this._map.hasImage(key)) {
      return key;
    }
    var color = { r: r, g: g, b: b, a: a }
    var imageData = new Uint8Array(size * size * 4);
    GSIBV.Map.HatchImageManager.drawHatch(imageData, type, size, color, bgColor);

    this._images[key] = {
      data: imageData,
      width: size,
      height: size
    };

    this._map.addImage(key, this._images[key], { pixelRatio: 1 });
    return key;
  }
  static getSize(type) {
    return (type == "minus" ? 12 : 4);
  }
  static drawHatch(data, type, size, color, bgColor) {

    if (bgColor) {

      for (var i = 0; i < data.length; i += 4) {
        data[i] = bgColor.r;
        data[i + 1] = bgColor.g;
        data[i + 2] = bgColor.b;
        data[i + 3] = bgColor.a * 255;
      }
    }
    else {
      for (var i = 0; i < data.length; i++) data[i] = 0;
    }
    // 左上→右下のライン描画
    switch (type) {
      case "ltrb":
      case "cross":
        for (var y = 0; y < size; y++) {
          var idx = (y * size * 4) + y * 4;
          data[idx] = color.r;
          data[idx + 1] = color.g;
          data[idx + 2] = color.b;
          data[idx + 3] = color.a * 255;
        }
        break;

      case "minus":
        for (var x = 1; x < size; x++) {
          var y = 3;
          var idx = (y * size * 4) + x * 4;
          data[idx] = color.r;
          data[idx + 1] = color.g;
          data[idx + 2] = color.b;
          data[idx + 3] = color.a * 255;
        }
        for (var x = 0; x < size - 1; x++) {
          var y = 9;
          var idx = (y * size * 4) + x * 4;
          data[idx] = color.r;
          data[idx + 1] = color.g;
          data[idx + 2] = color.b;
          data[idx + 3] = color.a * 255;
        }
        break;

      case "dot":
        var x = 1;
        var y = 2;
        var idx = (y * size * 4) + x * 4;
        data[idx] = color.r;
        data[idx + 1] = color.g;
        data[idx + 2] = color.b;
        data[idx + 3] = color.a * 255;
        break;

    }




    // 右下→左上のライン描画
    switch (type) {
      case "rtlb":
      case "cross":
        for (var y = 0; y < size; y++) {
          var idx = (y * size * 4) + (size - y - 1) * 4;
          data[idx] = color.r;
          data[idx + 1] = color.g;
          data[idx + 2] = color.b;
          data[idx + 3] = color.a * 255;
        }
        break;
    }




  }

}