GSIBV.UI.Edit.Fill = class extends GSIBV.UI.Edit.Base {

  constructor(map, drawStyle, minzoom, maxzoom) {
    super(map, drawStyle);
    this._minzoom = minzoom;
    this._maxzoom = maxzoom;
  }


  get changed() {

    var drawStyle = this._getDrawStyle();



    return !drawStyle.equals(this._drawStyle);


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

    function n$( value ) {
      return ( value == "" || value == undefined);
    }

    setValue(data, "fill-visible", this._fillVisibleCheck.checked);
    setValue(data, "fill-style", n$( this._fillStyleSelect.value ) ? undefined : this._fillStyleSelect.value );
    setValue(data, "fill-color", n$( this._fillColorInput.value ) ? undefined : this._fillColorInput.value );
    setValue(data, "fill-hatch-bgcolor", n$( this._fillHatchBGColorInput.value ) ? undefined : this._fillHatchBGColorInput.value );
    
    setValue(data, "outline-visible", this._outlineVisibleCheck.checked);
    setValue(data, "outline-color", n$( this._outlineColorInput.value ) ? undefined : this._outlineColorInput.value );
    setValue(data, "outline-width", n$( this._outlineWidthInput.value ) ? undefined : this._outlineWidthInput.value );
    setValue(data, "outline-dasharray", n$( this._outlineDasharrayInput.value ) ? undefined : this._outlineDasharrayInput.value );
    
    return drawStyle;
  }

  destroy() {
    if (this._fillStyleSelect) this._fillStyleSelect.destroy();
    if (this._fillColorInput) this._fillColorInput.destroy();
    if (this._fillHatchBGColorInput) this._fillHatchBGColorInput.destroy();

    if (this._outlineColorInput) this._outlineColorInput.destroy();
    if (this._outlineWidthInput) this._outlineWidthInput.destroy();
    if (this._outlineDasharrayInput) this._outlineDasharrayInput.destroy();

  }


  flush() {
    this._drawStyle = this._getDrawStyle();
  }

  onContainerScroll() {
    if (this._fillStyleSelect) this._fillStyleSelect.rePositionPopup();
  }

  initialize(parentElement, template, scrollFrame) {
    super.initialize(parentElement, template);

    
    // visible
    this._fillVisibleCheck = MA.DOM.find(this._container, "input[name=fill-visible]")[0];
    this._fillVisibleCheck.checked = (this.drawStyle.getValue("fill-visible") ? true : false );
    var fillVisibleLabel = MA.DOM.find(this._container, ".fill-visible")[0];
    var id= MA.getId( "-gsibv-edit-" );
    this._fillVisibleCheck.setAttribute( "id", id );
    fillVisibleLabel.setAttribute( "for", id );

    
    // fill-color
    this._fillColorInput = new GSIBV.UI.Input.Color(
      MA.DOM.find(this._container, "input[name=fill-color]")[0]
    );
    this._fillColorInput.value = this.drawStyle.getValue("fill-color");

    // fill-style
    function img(type, color, bgColor) {
      if ( type == "fill") {
        var canvas = MA.DOM.create("canvas");
        canvas.width = 2;
        canvas.height = 2;
        var ctx = canvas.getContext("2d");
        ctx.fillStyle = "rgba("+color.r+","+color.g+","+color.b+","+color.a+")";
        ctx.fillRect( 0,0,2,2);

        return canvas;
      }
      var size = GSIBV.Map.HatchImageManager.getSize(type);
      
      var canvas = MA.DOM.create("canvas");
      canvas.width = size;
      canvas.height = size;
      var ctx = canvas.getContext("2d");
      var data = ctx.createImageData(canvas.width, canvas.height);
  
      GSIBV.Map.HatchImageManager.drawHatch(data.data, type, size, color, bgColor);
    
      ctx.putImageData(data, 0, 0);
      
      return canvas;
    }
    var fillColor = {r:255,g:255,b:255,a:1};

    this._fillStyleSelect = new GSIBV.UI.Select.SelectEx(
      MA.DOM.find(this._container,".fill-style")[0],
      [
        {
          "img":img( "fill", fillColor),
          "value":"fill", 
          "title":GSIBV.CONFIG.LANG.JA.UI.EDITINPUT["normal"], 
          "titleEng":GSIBV.CONFIG.LANG.EN.UI.EDITINPUT["normal"]
        },
        {
          "img":img( "ltrb", fillColor),
          "value":"ltrb", 
          "title":GSIBV.CONFIG.LANG.JA.UI.EDITINPUT["ltrb"], 
          "titleEng":GSIBV.CONFIG.LANG.EN.UI.EDITINPUT["ltrb"]
        },
        {
          "img":img( "rtlb", fillColor),
          "value":"rtlb", 
          "title":GSIBV.CONFIG.LANG.JA.UI.EDITINPUT["rtlb"], 
          "titleEng":GSIBV.CONFIG.LANG.EN.UI.EDITINPUT["rtlb"]
        },
        {
          "img":img( "cross", fillColor),
          "value":"cross", 
          "title":GSIBV.CONFIG.LANG.JA.UI.EDITINPUT["cross"], 
          "titleEng":GSIBV.CONFIG.LANG.EN.UI.EDITINPUT["cross"]
        },
        {
          "img":img( "dot", fillColor),
          "value":"dot", 
          "title":GSIBV.CONFIG.LANG.JA.UI.EDITINPUT["dot"], 
          "titleEng":GSIBV.CONFIG.LANG.EN.UI.EDITINPUT["dot"]
        },
                {
          "img":img( "minus", fillColor),
          "value":"minus", 
          "title":GSIBV.CONFIG.LANG.JA.UI.EDITINPUT["minus"], 
          "titleEng":GSIBV.CONFIG.LANG.EN.UI.EDITINPUT["minus"]
        }
      ],
      this.drawStyle.getValue("fill-style")

    );


    // fill-hatch-bgcolor
    this._fillHatchBGColorInput = new GSIBV.UI.Input.Color(
      MA.DOM.find(this._container, "input[name=fill-hatch-bgcolor]")[0]
    );
    this._fillHatchBGColorInput.value = this.drawStyle.getValue("fill-hatch-bgcolor");


    this._onFillStyleChange();
    this._fillStyleSelect.on("change", MA.bind(this._onFillStyleChange,this));
    //MA.DOM.on( scrollFrame, "",  MA.bind( this._onFrameScroll, this ));


    // outline-visible
    this._outlineVisibleCheck = MA.DOM.find(this._container, "input[name=outline-visible]")[0];
    this._outlineVisibleCheck.checked = (this.drawStyle.getValue("outline-visible") ? true : false );
    var outlineVisibleLabel = MA.DOM.find(this._container, ".outline-visible")[0];
    var id= MA.getId( "-gsibv-edit-" );
    this._outlineVisibleCheck.setAttribute( "id", id );
    outlineVisibleLabel.setAttribute( "for", id );

    
    // outline-color
    this._outlineColorInput = new GSIBV.UI.Input.Color(
      MA.DOM.find(this._container, "input[name=outline-color]")[0]
    );
    this._outlineColorInput.value = this.drawStyle.getValue("outline-color");

    // outline-width
    this._outlineWidthInput = new GSIBV.UI.Input.Number(
      MA.DOM.find(this._container, "input[name=outline-width]")[0], {
        "type" :"float", "min" : 0.000001
      }
      );
    this._outlineWidthInput .value = this.drawStyle.getValue("outline-width");

    // outline-dasharray
    this._outlineDasharrayInput =  new GSIBV.UI.Input.Array(
      MA.DOM.find(this._container, "input[name=outline-dasharray]")[0] );
    this._outlineDasharrayInput.value = this.drawStyle.getValue("outline-dasharray");
  }

  _onFillStyleChange() {
    var fillStyle = this._fillStyleSelect.value;
    if ( fillStyle == undefined || fillStyle=="fill" ) {
      MA.DOM.find( this._container, ".edit-fill-hatch-bgcolor")[0].style.display = 'none';
    } else {
      MA.DOM.find( this._container, ".edit-fill-hatch-bgcolor")[0].style.display = '';
    }
  }

  _setValue(elem, value) {
    if (value == undefined)
      elem.value = "";
    else
      elem.value = value;
  }
};
