GSIBV.VectorTileData.LineInfo = class extends GSIBV.VectorTileData.DrawInfoBase {
  constructor(data) {
    super(data);
  }
  clone() {
    return this.copyTo( new GSIBV.VectorTileData.LineInfo() );
  }
};



GSIBV.VectorTileData.LineDrawStyle = class extends GSIBV.VectorTileData.DrawStyleBase {
  constructor(info, draw) {
    super();
    this._paintTypes = GSIBV.VectorTileData.PaintType["line"];
    this._layoutTypes = GSIBV.VectorTileData.LayoutType["line"];
    if (info) {
      this._info = new GSIBV.VectorTileData.LineInfo(info);
    }

    this.fromHash(draw);

    if (this._data["line-visible"] == undefined ){
      this._data["line-visible"] = true;
    }
  }
  clear(toDefault) {
    this._data = {};
    if ( toDefault ) {
      this._data["line-visible"] = true;
      this._data["line-color"] = "rgba(0,0,0,1)";
      this._data["line-width"] = 1;
      this._data["line-cap"] = "butt";
    }
  }
  clone() {
    var result = new GSIBV.VectorTileData.LineDrawStyle();
    if (this._info) result._info = this._info.clone();
    if (this._data) result._data = JSON.parse(JSON.stringify(this.data));
    return result;
  }

  copyFrom(src) {
    this._data = JSON.parse(JSON.stringify(src._data));
  }

  fromHash(hash) {
    if (hash)
      this._data = JSON.parse(JSON.stringify(hash));


  }

  get paint() {
    var result = undefined;
    if (!this._data) return result;
    for (var key in this._data) {
      if (!this._paintTypes[key]) continue;
      if (!result) result = {};
      result[key] = this._data[key];

    }


    if (!this._data["line-visible"]) {
      this._deleteLineStyle(result);
    }
    return result;
  }

  get metadata() {
    var result = {};


    if ( this._data["line-role"]) {
      result["line-role"] = this._data["line-role"];
    }

    return result;
  }

  get layout() {

    var result = undefined;
    if (!this._data) return result;
    for (var key in this._data) {
      if (!this._layoutTypes[key]) continue;
      if (!result) result = {};

      result[key] = this._data[key];

    }

    if (!this._data["line-visible"]) {
      this._deleteLineStyle(result);
      result["visibility"] = "none";
    }

    return result;
  }

};  