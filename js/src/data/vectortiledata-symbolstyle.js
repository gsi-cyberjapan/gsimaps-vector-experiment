GSIBV.VectorTileData.SymbolInfo = class  extends GSIBV.VectorTileData.DrawInfoBase {
  constructor(data) {
    super(data);
    this._textVerticalField = undefined;
    this._textRotateField = undefined;
    this._textAnchorField = undefined;
    this._textField = undefined;
    this._textFieldRound = undefined;
  }

  getData( key ) {
    if (this._data[key] == undefined || this._data[key] == ""  ) return undefined;
    return this._data[key];
  }
  get textVerticalField() { return this.getData("text-vertical-field"); }
  get textRotateField() { return this.getData("text-rotate-field"); }
  get textAnchorField() { return this.getData("text-anchor-field"); }
  get textField() { return this.getData("text-field"); }
  get textFieldRound() { return this.getData("text-field-round"); }

  clone() {
    return this.copyTo( new GSIBV.VectorTileData.SymbolInfo() );
  }


};


GSIBV.VectorTileData.SymbolDrawStyle = class extends GSIBV.VectorTileData.DrawStyleBase {
  constructor(info, draw) {
    super();
    this._paintTypes = GSIBV.VectorTileData.PaintType["symbol"];
    this._layoutTypes = GSIBV.VectorTileData.LayoutType["symbol"];
    if (info) {
      this._info = new GSIBV.VectorTileData.SymbolInfo(info);
    }

    this.fromHash(draw);
    if ( this._data["text-visible"] == undefined ) {
      if ( this.hasTextField) this._data["text-visible"]  = true;
    }
    
    if ( !this._data["text-visible"]) this._data["text-visible"] = false;

    
    if ( this._data["icon-visible"] == undefined ) {
      if ( this._data["icon-image"] != undefined ) this._data["icon-visible"]  = true;
    }
    if ( this._data["icon-group"] == undefined ) {
      if ( this._data["icon-image"] != undefined ) {
        this._data["icon-group"] = GSIBV.CONFIG.Sprite.defaultGroup;
      }
    }

    
    if ( !this._data["icon-visible"]) this._data["icon-visible"] = false;

  }

  clone() {
    var result = new GSIBV.VectorTileData.SymbolDrawStyle();
    if (this._info) result._info = this._info.clone();
    if (this._data) result._data = JSON.parse(JSON.stringify(this.data));
    return result;
  }

  copyFrom(src) {
    this._data = JSON.parse(JSON.stringify(src._data));
  }

  get hasTextField() {
    return (this._info && this._info.textField != undefined);

  }
  
  get hasTextAnchorField() {
    return (this._info && this._info.textAnchorField != undefined);

  }
  get hasTextVerticalField() {
    return (this._info && this._info._textVerticalField != undefined);

  }

  fromHash(hash) {
    if (hash)
      this._data = JSON.parse(JSON.stringify(hash));
      
      if (this._data["text-pitch-alignment"] == undefined)
        this._data["text-pitch-alignment"] = "auto";
      if (this._data["text-rotation-alignment"] == undefined)
        this._data["text-rotation-alignment"] = "auto";
      
        
    if (this._data["icon-pitch-alignment"] == undefined)
      this._data["icon-pitch-alignment"] = "auto";
    if (this._data["icon-rotation-alignment"] == undefined)
      this._data["icon-rotation-alignment"] = "auto";
    

      if (this._data["text-offset"] == undefined)
        this._data["text-offset"] = "auto";

  }

  get paint() {
    var result = undefined;
    if (!this._data) return result;
    for (var key in this._data) {
      if (!this._paintTypes[key]) continue;
      if (!result) result = {};
      result[key] = this._data[key];

    }

    
    if (!this._data["icon-visible"]  ){
      this._deleteIconStyle(result);
    }
    if (!this._data["text-visible"]  ){
      this._deleteTextStyle(result);
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

    
    if ( this._data["icon-image"] != undefined) {
      result["icon-image"] = GSIBV.Map.SpriteManager.spriteId( 
        this._data["icon-group"] , 
        this._data["icon-image"]  );
    }
    
    if (!this._data["icon-visible"]  ){
      this._deleteIconStyle(result);
    }
    

    var textField = this._info.textField;
    var textVerticalField = this._info.textVerticalField;
    var textAnchorField = this._info.textAnchorField;
    var textRotateField = this._info.textRotateField;

    if (this._data["text-offset"] == "auto" || this._data["text-offset"] == undefined) {
      this._data["text-offset"] = "auto";
      if (textAnchorField != undefined) {

        result["text-offset"] = [
          "case",
          ["any",
            ["==", ["get", textAnchorField], "LT"],
            ["==", ["get", textAnchorField], "LC"],
            ["==", ["get", textAnchorField], "LB"]
          ],
          ["literal", [0.5, 0]],
          ["any",
            ["==", ["get", textAnchorField], "RT"],
            ["==", ["get", textAnchorField], "RC"],
            ["==", ["get", textAnchorField], "RB"]
          ],
          ["literal", [-0.5, 0]],
          ["any",
            ["==", ["get", textAnchorField], "CT"]
          ],
          ["literal", [0, 0.5]],
          ["any",
            ["==", ["get", textAnchorField], "CB"]
          ],
          ["literal", [0, -0.5]],
          ["literal", [0, 0]]
        ];
      } else {
        delete result["text-offset"];
      }
    }

    if (this._data["text-rotate"] == "auto" || this._data["text-rotate"] == undefined) {
      this._data["text-rotate"] = "auto";
      if (textVerticalField && textRotateField) {
        result["text-rotate"] = ["case",
          ["==", ["get", textVerticalField], 2],
          ["*", ["+", ["to-number", ["get", textRotateField]], 90], -1],
          ["*", ["to-number", ["get", textRotateField]], -1]
        ];
      } else {
        delete result["text-rotate"];
      }
    }

    if (this._data["text-anchor"] == "auto" || this._data["text-anchor"] == undefined) {
      this._data["text-anchor"] = 'auto';
      if (textVerticalField && textAnchorField) {
        result["text-anchor"] = ["case",
          ["==", ["get", textVerticalField], 2],
          ["case",
            ["==", ["get", textAnchorField], "LC"], "top",
            "center"
          ],
          ["case",
            ["==", ["get", textAnchorField], "LT"], "top-left",
            ["==", ["get", textAnchorField], "CT"], "top",
            ["==", ["get", textAnchorField], "RT"], "top-right",
            ["==", ["get", textAnchorField], "LC"], "left",
            ["==", ["get", textAnchorField], "CC"], "center",
            ["==", ["get", textAnchorField], "RC"], "right",
            ["==", ["get", textAnchorField], "LB"], "bottom-left",
            ["==", ["get", textAnchorField], "CB"], "bottom",
            ["==", ["get", textAnchorField], "RB"], "bottom-right",
            "center"
          ]
        ];
      } else if (textAnchorField) {
        result["text-anchor"] = ["case",
            ["==", ["get", textAnchorField], "LT"], "top-left",
            ["==", ["get", textAnchorField], "CT"], "top",
            ["==", ["get", textAnchorField], "RT"], "top-right",
            ["==", ["get", textAnchorField], "LC"], "left",
            ["==", ["get", textAnchorField], "CC"], "center",
            ["==", ["get", textAnchorField], "RC"], "right",
            ["==", ["get", textAnchorField], "LB"], "bottom-left",
            ["==", ["get", textAnchorField], "CB"], "bottom",
            ["==", ["get", textAnchorField], "RB"], "bottom-right",
            "center"
          ];
      } else {
        delete result["text-anchor"];
      }
    }

    if (this._data["text-visible"] && textField != undefined) {

      result["text-field"] = "{" + textField + "}";

      var textField2 = ["get", textField];

      if (this._info.textFieldRound) {
        var roundnum = Math.log10(this._info.textFieldRound);
        
        if(roundnum > 0 && Number.isInteger(roundnum)){
        
          var zerotext = ".";
          for(var i = 0;  i < roundnum;  i++  ){
            zerotext = zerotext + "0";
          }
        
          textField2 =
            ["to-string",
              ["case",
                ["!", ["has", textField]],
                ["to-string", ""],
                ["==", ["get", textField], ""],
                ["to-string", ""],
                ["in", ".",
                  ["to-string", ["/", ["round", ["*", ["to-number", ["get", textField]], this._info.textFieldRound]], this._info.textFieldRound]]
                ], 
                ["to-string", ["/", ["round", ["*", ["to-number", ["get", textField]], this._info.textFieldRound]], this._info.textFieldRound]],
                ["concat", 
                  ["to-string", ["/", ["round", ["*", ["to-number", ["get", textField]], this._info.textFieldRound]], this._info.textFieldRound]],
                  zerotext
                ]
              ]
            ];
          
        }else{
          
          textField2 =
            ["to-string", ["/", ["round", ["*", ["to-number", ["get", textField]], this._info.textFieldRound]], this._info.textFieldRound]];
          
        }

        result["text-field"] = textField2;

      }

      if (this._data["text-vertical"] == "auto" || this._data["text-vertical"] == undefined) {
        this._data["text-vertical"] = "auto";
        if (textVerticalField != undefined) {

          result["text-field"] = [
            "case",
            ["!=", ["get", textVerticalField], 2],
            ["get", textField],
            ["concat", "<gsi-vertical>", textField2, "<\/gsi-vertical>"]
          ];
        }
      } else if (this._data["text-vertical"] == true) {

        result["text-field"] =
          ["concat", "<gsi-vertical>", textField2, "<\/gsi-vertical>"];
      }

    } else {
      //delete result["text-field"];
      this._deleteTextStyle( result);

    }

    delete result["text-vertical"];


    return result;
  }
};