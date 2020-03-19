GSIBV.UI.Edit.Line = class extends GSIBV.UI.Edit.Base {

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

    function n$(value) {
      return (value == "" || value == undefined);
    }

    setValue(data, "line-visible", this._lineVisibleCheck.checked);
    setValue(data, "line-color", n$(this._lineColorInput.value) ? undefined : this._lineColorInput.value);
    setValue(data, "line-width", n$(this._lineWidthInput.value) ? undefined : this._lineWidthInput.value);
    setValue(data, "line-dasharray", n$(this._lineDasharrayInput.value) ? undefined : this._lineDasharrayInput.value);
    setValue(data, "line-offset", n$(this._lineOffsetInput.value) ? undefined : this._lineOffsetInput.value);
    setValue(data, "line-cap", n$(this._lineCapSelect.value) ? undefined : this._lineCapSelect.value);
    setValue(data, "line-role", n$(this._lineRoleSelect.value) ? undefined : this._lineRoleSelect.value);

    return drawStyle;
  }

  destroy() {
    if (this._lineColorInput) this._lineColorInput.destroy();
    if (this._lineWidthInput) this._lineWidthInput.destroy();
    if (this._lineDasharrayInput) this._lineDasharrayInput.destroy();
    if (this._lineOffsetInput) this._lineOffsetInput.destroy();
    if (this._lineCapSelect) this._lineCapSelect.destroy();
    if (this._lineRoleSelect) this._lineRoleSelect.destroy();
    

  }

  flush() {
    this._drawStyle = this._getDrawStyle();
  }

  onContainerScroll() {
    //if (this._fillStyleSelect) this._fillStyleSelect.rePositionPopup();
  }
  
  initialize(parentElement, template, scrollFrame) {
    super.initialize(parentElement, template);

    
    // line-visible
    this._lineVisibleCheck = MA.DOM.find(this._container, "input[name=line-visible]")[0];
    this._lineVisibleCheck.checked = (this.drawStyle.getValue("line-visible") ? true : false );
    var lineVisibleLabel = MA.DOM.find(this._container, ".line-visible")[0];
    var id= MA.getId( "-gsibv-edit-" );
    this._lineVisibleCheck.setAttribute( "id", id );
    lineVisibleLabel.setAttribute( "for", id );

    
    // line-color
    this._lineColorInput = new GSIBV.UI.Input.Color(
      MA.DOM.find(this._container, "input[name=line-color]")[0]
    );
    this._lineColorInput.value = this.drawStyle.getValue("line-color");

    // line-width
    /*
    this._lineWidthInput = new GSIBV.UI.Input.Number(
      MA.DOM.find(this._container, "input[name=line-width]")[0], {
        "type" :"float", "min" : 0.000001
      }
      );
    this._lineWidthInput .value = this.drawStyle.getValue("line-width");
    */

    this._lineWidthInput = new GSIBV.UI.Input.Size(
      MA.DOM.find(this._container, ".line-width")[0],
      this._minzoom, this._maxzoom,
      this.drawStyle.getValue("line-width")
    );

    // line-dasharray
    this._lineDasharrayInput =  new GSIBV.UI.Input.Array(
      MA.DOM.find(this._container, "input[name=line-dasharray]")[0] );
    this._lineDasharrayInput.value = this.drawStyle.getValue("line-dasharray");
    // line-offset
    /*
    this._lineOffsetInput = new GSIBV.UI.Input.Number(
      MA.DOM.find(this._container, "input[name=line-offset]")[0], {
        "type" :"float"
      }
      );
    
    this._lineOffsetInput .value = this.drawStyle.getValue("line-offset");
      */
    this._lineOffsetInput = new GSIBV.UI.Input.Size(
      MA.DOM.find(this._container, ".line-offset")[0],
      this._minzoom, this._maxzoom,
      this.drawStyle.getValue("line-offset"),
      true
    );

    // line-cap
    
    this._lineCapSelect = new GSIBV.UI.Select.SelectEx(
      MA.DOM.find(this._container,".line-cap")[0],
      [
        {
          "value":"butt", 
          "title":GSIBV.CONFIG.LANG.JA.UI.EDITINPUT["butt"],
          "titleEng":GSIBV.CONFIG.LANG.EN.UI.EDITINPUT["butt"]
        },
        {
          "value":"round", 
          "title":GSIBV.CONFIG.LANG.JA.UI.EDITINPUT["round"],
          "titleEng":GSIBV.CONFIG.LANG.EN.UI.EDITINPUT["round"]
        },
        {
          "value":"square", 
          "title":GSIBV.CONFIG.LANG.JA.UI.EDITINPUT["square"],
          "titleEng":GSIBV.CONFIG.LANG.EN.UI.EDITINPUT["square"]
        },
      ],
      this.drawStyle.getValue("line-cap")

    );


    // line-role
    
    this._lineRoleSelect = new GSIBV.UI.Select.SelectEx(
      MA.DOM.find(this._container,".line-role")[0],
      [
        {
          "value":"", 
          "title":GSIBV.CONFIG.LANG.JA.UI.EDITINPUT["normal"],
          "titleEng":GSIBV.CONFIG.LANG.EN.UI.EDITINPUT["normal"]
        },
        {
          "value":"outline", 
          "title":GSIBV.CONFIG.LANG.JA.UI.EDITINPUT["foroutline"],
          "titleEng":GSIBV.CONFIG.LANG.EN.UI.EDITINPUT["foroutline"]
        }
      ],
      this.drawStyle.getValue("line-role")

    );

  }

  
  _setValue(elem, value) {
    if (value == undefined)
      elem.value = "";
    else
      elem.value = value;
  }

};