GSIBV.VectorTileData.FillInfo = class extends GSIBV.VectorTileData.DrawInfoBase {
  constructor(data) {
    super(data);
  }
  clone() {
    return this.copyTo( new GSIBV.VectorTileData.FillInfo() );
  }
};




GSIBV.VectorTileData.FillDrawStyle = class extends GSIBV.VectorTileData.DrawStyleBase {
  constructor(info, draw) {
    super();
    this._paintTypes = GSIBV.VectorTileData.PaintType["fill"];
    this._layoutTypes = GSIBV.VectorTileData.LayoutType["fill"];
    if (info) {
      this._info = new GSIBV.VectorTileData.FillInfo(info);
    }

    this.fromHash(draw);

    if ( this._data["fill-style"] == undefined || this._data["fill-style"] == "" ) {
      this._data["fill-style"] = "fill";
    }

    if ( this._data["fill-hatch-bgcolor"] == "" )
      delete this._data["fill-hatch-bgcolor"];

    if (this._data["fill-visible"] == undefined) {
      this._data["fill-visible"] = true;
    }

    if (this._data["outline-visible"] == undefined &&
        this._data["outline-color"] ) {
      this._data["outline-visible"] = true;
    } else {
      if ( this._data["outline-visible"]) this._data["outline-visible"] = true;
      else this._data["outline-visible"] = false;

    }
  }

  clone() {
    var result = new GSIBV.VectorTileData.FillDrawStyle();
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


    var outlineVisible = this._data["outline-visible"];

    result["line-color"] = this._data["outline-color"];
    result["line-width"] = this._data["outline-width"];
    result["line-dasharray"] = this._data["outline-dasharray"];
    
    if ( result["line-width"] == undefined || result["line-width"] == "" )
      delete result["line-width"] ;
    
    if ( result["line-color"] == undefined || result["line-color"] == "" )
      outlineVisible = false;;
    
    if ( result["line-dasharray"] == undefined || result["line-dasharray"] == "" )
      delete result["line-dasharray"];
    

    if ( this._data["fill-style"] !=undefined && 
        this._data["fill-style"]  != "" &&
        this._data["fill-style"]  != "fill" ) {
      
      result["gsi-fill-hatch-style"] = this._data["fill-style"];
      if ( this._data["fill-hatch-bgcolor"] != undefined && 
          this._data["fill-hatch-bgcolor"]  != "") {
        //hatchStyle += "/" + this._data["fill-hatch-bgcolor"]
        result["gsi-fill-hatch-bgcolor"] = this._data["fill-hatch-bgcolor"];

      }
      //result["gsi-fill-hatch-bgcolor"] = "rgba(255,0,0,0.2)";

      //"gsi-fill-hatch-style": "ltrb\/255,255,255,1"
    }


    if (!this._data["fill-visible"]) {
      this._deleteFillStyle(result);
    }
    if (!outlineVisible) {
      this._deleteLineStyle(result);
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

    if (!this._data["fill-visible"]) {
      this._deleteFillStyle(result);
    }
    if (!this._data["outline-visible"]) {
      this._deleteLineStyle(result);
    }

    return result;
  }

};  