GSIBV.UI.Edit.Symbol = class extends GSIBV.UI.Edit.Base {

  constructor(map, drawStyle, minzoom, maxzoom) {
    super(map, drawStyle);
    this._minzoom = minzoom;
    this._maxzoom = maxzoom;
  }


  get changed() {

    var drawStyle = this._getDrawStyle();


    return !drawStyle.equals(this._drawStyle);


  }

  destroy() {
    if (this._iconSizeInput) this._iconSizeInput.destroy();
    if (this._iconSelector) this._iconSelector.destroy();
    if (this._iconAnchor) this._iconAnchor.destroy();
    if (this._iconPitchAlignment) this._iconPitchAlignment.destroy();
    if (this._iconRotationAlignment) this._iconRotationAlignment.destroy();

    if (this._textColorInput) this._textColorInput.destroy();
    if (this._textSizeInput) this._textSizeInput.destroy();
    if (this._textHaloColorInput) this._textHaloColorInput.destroy();
    if (this._textHaloWidthInput) this._textHaloWidthInput.destroy();
    if (this._textAnchor) this._textAnchor.destroy();
    if (this._textOffset) this._textOffset.destroy();
    if (this._textVertical) this._textVertical.destroy();
    if (this._textPitchAlignment) this._textPitchAlignment.destroy();
    if (this._textRotationAlignment) this._textRotationAlignment.destroy();

  }

  _getDrawStyle() {

    var drawStyle = this._drawStyle.clone();


    var data = drawStyle.data;

    function setValue(data, key, value) {
      if (value != undefined) {
        data[key] = value;
      } else {
        delete data[key];
      }
    }
    setValue(data, "icon-visible", this._iconVisibleCheck.checked);
    setValue(data, "icon-size", this._iconSizeInput.value);
    /*
    setValue(data, "icon-group", this._iconSelector.selectedGroupId);
    setValue(data, "icon-image", this._iconSelector.selectedId);
    */
    if ( this._iconAnchor.value == undefined || this._iconAnchor.value == "" ) {
      setValue(data, "icon-anchor", data["icon-anchor"] );
    } else {
      setValue(data, "icon-anchor", this._iconAnchor.value );
    }
    setValue(data, "icon-pitch-alignment", this._iconPitchAlignment.value);
    setValue(data, "icon-rotation-alignment", this._iconRotationAlignment.value);

    function n$( value ) {
      return ( value == "" || value == undefined);
    }

    if (this._textColorInput) {
      setValue(data, "text-visible", this._textVisibleCheck.checked);
      setValue(data, "text-color", n$( this._textColorInput.value ) ? undefined : this._textColorInput.value );
      setValue(data, "text-size", this._textSizeInput.value);
      setValue(data, "text-halo-color", n$( this._textHaloColorInput.value ) ? undefined : this._textHaloColorInput.value );
      
      //setValue(data, "text-halo-color", this._textHaloColorInput.value);
      setValue(data, "text-halo-width", this._textHaloWidthInput.value);
      setValue(data, "text-offset", this._textOffset.value);

      setValue(data, "text-anchor", n$( this._textAnchor.value ) ? data["text-anchor"] : this._textAnchor.value );
      
      switch(this._textVertical.value ) {
        case "horz":
          setValue(data, "text-vertical", false);
          break;
        case "vert":
          setValue(data, "text-vertical", true);
          break;
        default:
          setValue(data, "text-vertical", "auto");
          break;
      }
      setValue(data, "text-pitch-alignment", this._textPitchAlignment.value);
      setValue(data, "text-rotation-alignment", this._textRotationAlignment.value);


    }

    return drawStyle;

  }


  flush() {
    this._drawStyle = this._getDrawStyle();
  }


  _createCanvas(img) {
    var canvas = MA.DOM.create("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    var ctx = canvas.getContext("2d");

    var data = ctx.createImageData(img.width, img.height);

    for (var i = 0; i < img.data.length; i++) {
      data.data[i] = img.data[i];
    }
    ctx.putImageData(data, 0, 0);

    return canvas;
  }
  initialize(parentElement, template) {
    super.initialize(parentElement, template);


    this._iconDetailButton =MA.DOM.find(this._container, ".icon-detail-button")[0];
    MA.DOM.on( this._iconDetailButton, "click", MA.bind( function() {
      var elems = MA.DOM.find(this._container, ".edit-icon.detail");
      if ( MA.DOM.hasClass( this._iconDetailButton, "-ma-expand")) {
        MA.DOM.removeClass( this._iconDetailButton, "-ma-expand");
        
        for (var i = 0; i < elems.length; i++) {
          elems[i].style.display = 'none';
        }
      } else {
        MA.DOM.addClass( this._iconDetailButton, "-ma-expand");
        for (var i = 0; i < elems.length; i++) {
          elems[i].style.display = '';
        }
      }
    }, this ));

    
    // visible
    this._iconVisibleCheck = MA.DOM.find(this._container, "input[name=icon-visible]")[0];
    this._iconVisibleCheck.checked = (this.drawStyle.getValue("icon-visible") ? true : false );
    var iconVisibleLabel = MA.DOM.find(this._container, ".icon-visible")[0];
    var id= MA.getId( "-gsibv-edit-" );
    this._iconVisibleCheck.setAttribute( "id", id );
    iconVisibleLabel.setAttribute( "for", id );


    // icon-size
    this._iconSizeInput = new GSIBV.UI.Input.Size(
      MA.DOM.find(this._container, ".icon-size")[0],
      this._minzoom, this._maxzoom,
      this.drawStyle.getValue("icon-size"));

    // icon-image
    /*
    var spriteManager = this._map.spriteManager;
    this._iconSelector = new GSIBV.UI.Select.Image(
      MA.DOM.find(this._container, ".icon-image")[0]);
    var spriteGroupList = [];

    for( var i=0; i<spriteManager.groupList.length; i++ ) {
      var spriteGroup = spriteManager.groupList[i];

      var group = {
        "id": spriteGroup.id,
        "title" : spriteGroup.title,
        "imageList" : []
      };
      var spriteImageList = spriteManager.getList(group.id);
      for (var j = 0; j < spriteImageList.length; j++) {
        var spriteImage = spriteImageList[j];
        group.imageList.push({
          "id": spriteImage.info.id,
          "img": this._createCanvas(spriteImage.img),
          "title": spriteImage.info.id
        });
      }

      spriteGroupList.push( group );
    }

    
    this._iconSelector.list = spriteGroupList;

    this._iconSelector.setSelected(
      this.drawStyle.getValue("icon-group") != undefined ? this.drawStyle.getValue("icon-group") : GSIBV.CONFIG.Sprite.defaultGroup,
      this.drawStyle.getValue("icon-image")
    );
    */
    
    // icon-anchor
    this._iconAnchor = new GSIBV.UI.Select.Anchor(
      MA.DOM.find(this._container, ".icon-anchor")[0],
      false, // デフォルト設定があるかどうか
      this.drawStyle.getValue("icon-anchor")
    );

    // icon-pitch-alignment
    var pitchAlignList = [];
    pitchAlignList.push({
      "value":"auto", 
      "title":GSIBV.CONFIG.LANG.JA.UI.EDITINPUT["auto2"],
      "titleEng":GSIBV.CONFIG.LANG.EN.UI.EDITINPUT["auto2"]
    });
    pitchAlignList.push({
      "value":"map", 
      "title":GSIBV.CONFIG.LANG.JA.UI.EDITINPUT["fitmap"],
      "titleEng":GSIBV.CONFIG.LANG.EN.UI.EDITINPUT["fitmap"]
    });
    pitchAlignList.push({
      "value":"viewport", 
      "title":GSIBV.CONFIG.LANG.JA.UI.EDITINPUT["fitviewport"],
      "titleEng":GSIBV.CONFIG.LANG.EN.UI.EDITINPUT["fitviewport"]
    });
    var pitchAlign = this.drawStyle.getValue("icon-pitch-alignment");
    if ( pitchAlign == undefined) pitchAlign = "auto";
    this._iconPitchAlignment = new GSIBV.UI.Select.Select(
      MA.DOM.find(this._container, ".icon-pitch-alignment")[0],
      pitchAlignList,
      pitchAlign
    );

    // icon-rotation-alignment
    var rotationAlignList = [];
    rotationAlignList.push({
      "value":"auto", 
      "title":GSIBV.CONFIG.LANG.JA.UI.EDITINPUT["auto2"],
      "titleEng":GSIBV.CONFIG.LANG.EN.UI.EDITINPUT["auto2"]
    });
    rotationAlignList.push({
      "value":"map", 
      "title":GSIBV.CONFIG.LANG.JA.UI.EDITINPUT["fitmap"],
      "titleEng":GSIBV.CONFIG.LANG.EN.UI.EDITINPUT["fitmap"]
    });
    rotationAlignList.push({
      "value":"viewport", 
      "title":GSIBV.CONFIG.LANG.JA.UI.EDITINPUT["fitviewport"],
      "titleEng":GSIBV.CONFIG.LANG.EN.UI.EDITINPUT["fitviewport"]
    });
    var rotationAlign = this.drawStyle.getValue("icon-pitch-alignment");
    if ( rotationAlign == undefined) rotationAlign = "auto";
    this._iconRotationAlignment = new GSIBV.UI.Select.Select(
      MA.DOM.find(this._container, ".icon-rotation-alignment")[0],
      rotationAlignList,
      rotationAlign
    );
    
    var elems = MA.DOM.find(this._container, ".detail");
    for (var i = 0; i < elems.length; i++) {
      elems[i].style.display = 'none';
    }

    if (!this._drawStyle.hasTextField) {
      var elems = MA.DOM.find(this._container, ".edit-text");
      for (var i = 0; i < elems.length; i++) {
        elems[i].style.display = 'none';
      }
    } else {
      this._initializeTextEdit();
    }
    

  }

  _initializeTextEdit() {
    this._textDetailButton =MA.DOM.find(this._container, ".text-detail-button")[0];
    MA.DOM.on( this._textDetailButton, "click", MA.bind( function() {
      var elems = MA.DOM.find(this._container, ".edit-text.detail");
      if ( MA.DOM.hasClass( this._textDetailButton, "-ma-expand")) {
        MA.DOM.removeClass( this._textDetailButton, "-ma-expand");
        
        for (var i = 0; i < elems.length; i++) {
          elems[i].style.display = 'none';
        }
      } else {
        MA.DOM.addClass( this._textDetailButton, "-ma-expand");
        for (var i = 0; i < elems.length; i++) {
          elems[i].style.display = '';
        }
      }
    }, this ));

    // visible
    this._textVisibleCheck = MA.DOM.find(this._container, "input[name=text-visible]")[0];
    this._textVisibleCheck.checked = (this.drawStyle.getValue("text-visible") ? true : false );
    var textVisibleLabel = MA.DOM.find(this._container, ".text-visible")[0];
    var id= MA.getId( "-gsibv-edit-" );
    this._textVisibleCheck.setAttribute( "id", id );
    textVisibleLabel.setAttribute( "for", id );

    // color
    this._textColorInput = new GSIBV.UI.Input.Color(
      MA.DOM.find(this._container, "input[name=text-color]")[0]
    );
    this._textColorInput.value = this.drawStyle.getValue("text-color");

    //size
    this._textSizeInput = new GSIBV.UI.Input.Size(
      MA.DOM.find(this._container, ".text-size")[0],
      this._minzoom, this._maxzoom,
      this.drawStyle.getValue("text-size")
    );
    
    // halo-color
    this._textHaloColorInput = new GSIBV.UI.Input.Color(
      MA.DOM.find(this._container, "input[name=text-halo-color]")[0]
    );
    this._textHaloColorInput.value = this.drawStyle.getValue("text-halo-color");

    // halo-width
    this._textHaloWidthInput = new GSIBV.UI.Input.Size(
      MA.DOM.find(this._container, ".text-halo-width")[0],
      this._minzoom, this._maxzoom,
      this.drawStyle.getValue("text-halo-width")
    );


    // anchor
    this._textAnchor = new GSIBV.UI.Select.Anchor(
      MA.DOM.find(this._container, ".text-anchor")[0],
      this._drawStyle.hasTextAnchorField, // デフォルト設定があるかどうか
      this.drawStyle.getValue("text-anchor")
    );

    // offset
    this._textOffset = new GSIBV.UI.Input.Offset(
      MA.DOM.find(this._container, ".text-offset")[0],
      this._drawStyle.hasTextAnchorField, // デフォルト設定があるかどうか
      this.drawStyle.getValue("text-offset")
    );

    // vertical
    var verticalList = [];
    if ( this._drawStyle.hasTextVerticalField ) {
      verticalList.push({
        "value":"auto", 
        "title":GSIBV.CONFIG.LANG.JA.UI.EDITINPUT["auto"],
        "titleEng":GSIBV.CONFIG.LANG.EN.UI.EDITINPUT["auto"]
      });
    }
    verticalList.push({
      "value":"horz", 
      "title":GSIBV.CONFIG.LANG.JA.UI.EDITINPUT["horz"],
      "titleEng":GSIBV.CONFIG.LANG.EN.UI.EDITINPUT["horz"]
    });
    verticalList.push({
      "value":"vert", 
      "title":GSIBV.CONFIG.LANG.JA.UI.EDITINPUT["vert"],
      "titleEng":GSIBV.CONFIG.LANG.EN.UI.EDITINPUT["vert"]
    });
    var vertical = this.drawStyle.getValue("text-vertical");
    
    if ( vertical == undefined || vertical == "auto") vertical = "auto";
    else {
      if ( vertical == true ) vertical = "vert";
      else vertical = "horz";
    }
    this._textVertical = new GSIBV.UI.Select.Select(
      MA.DOM.find(this._container, ".text-vertical")[0],
      verticalList,
      vertical
    );

    // text-pitch-alignment
    var pitchAlignList = [];
    pitchAlignList.push({
      "value":"auto", 
      "title":GSIBV.CONFIG.LANG.JA.UI.EDITINPUT["auto2"],
      "titleEng":GSIBV.CONFIG.LANG.EN.UI.EDITINPUT["auto2"]
    });
    pitchAlignList.push({
      "value":"map", 
      "title":GSIBV.CONFIG.LANG.JA.UI.EDITINPUT["fitmap"],
      "titleEng":GSIBV.CONFIG.LANG.EN.UI.EDITINPUT["fitmap"]
    });
    pitchAlignList.push({
      "value":"viewport", 
      "title":GSIBV.CONFIG.LANG.JA.UI.EDITINPUT["fitviewport"],
      "titleEng":GSIBV.CONFIG.LANG.EN.UI.EDITINPUT["fitviewport"]
    });
    var pitchAlign = this.drawStyle.getValue("text-pitch-alignment");
    if ( pitchAlign == undefined) pitchAlign = "auto";
    this._textPitchAlignment = new GSIBV.UI.Select.Select(
      MA.DOM.find(this._container, ".text-pitch-alignment")[0],
      pitchAlignList,
      pitchAlign
    );

    // text-rotation-alignment
    var rotationAlignList = [];
    rotationAlignList.push({
      "value":"auto", 
      "title":"自動"
    });
    rotationAlignList.push({
      "value":"map", 
      "title":GSIBV.CONFIG.LANG.JA.UI.EDITINPUT["fitmap"],
      "titleEng":GSIBV.CONFIG.LANG.EN.UI.EDITINPUT["fitmap"]
    });
    rotationAlignList.push({
      "value":"viewport", 
      "title":GSIBV.CONFIG.LANG.JA.UI.EDITINPUT["fitviewport"],
      "titleEng":GSIBV.CONFIG.LANG.EN.UI.EDITINPUT["fitviewport"]
    });
    var rotationAlign = this.drawStyle.getValue("text-pitch-alignment");
    if ( rotationAlign == undefined) rotationAlign = "auto";
    this._textRotationAlignment = new GSIBV.UI.Select.Select(
      MA.DOM.find(this._container, ".text-rotation-alignment")[0],
      rotationAlignList,
      rotationAlign
    );

  }

  _setValue(elem, value) {
    if (value == undefined)
      elem.value = "";
    else
      elem.value = value;
  }
};
