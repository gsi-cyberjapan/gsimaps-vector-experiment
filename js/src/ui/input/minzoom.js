GSIBV.UI.Input.MinZoom = class extends MA.Class.Base {
    constructor(container, minzoomRange, maxzoomRange, minzoom) {
      super();

      if(!container) this.destroy();

      this._container = container;
      this._maxzoomRange = maxzoomRange;
      this._minzoomRange = minzoomRange;
      this._minzoom = minzoom || minzoomRange;

      this._titleNode = null;
      this._prefixNode = null;
      this._zoomNode = null;
      this._postfixNode = null;
      this._initialize();
      
      this._langChangeHandler = MA.bind(this._onLangChange, this);
      GSIBV.application.on("langchange", this._langChangeHandler);
    }
  
    destroy() {
      if (this._langChangeHandler) {
        GSIBV.application.off("langchange", this._langChangeHandler);
        this._langChangeHandler = null;
      }
      if(this._changeHandler) {
        this._zoomNode.off("change", this._changeHandler);
        this._changeHandler = null;
      }
      if ( !this._container || !this._frame) return;
      this._container.removeChild(this._frame);
      this._container.style.display = "none";
      this._frame = null;
    }
  
    _onLangChange() {
      try {
        var lang = GSIBV.application.lang;
        var intpuLant =GSIBV.CONFIG.LANG[lang.toUpperCase()].UI.EDITINPUT;
        if(intpuLant){
          this._prefixNode.innerHTML = intpuLant["minzoom-prefix"];
          this._postfixNode.innerHTML = intpuLant["minzoom-postfix"];
        }
      } catch(e) {}
    }

    get container(){
      return this._container;
    }
  
    get value() {
      if (this._zoomNode) {
        var value = parseInt(this._zoomNode.value);
        this._minzoom = isNaN(value)? this._minzoom: value;
      }
      return this._minzoom;
    }

    get zoomNode(){
      return this._zoomNode;
    }
  
    _initialize() {
      if (this._frame) return;

      this._frame = MA.DOM.create("div");
      this._frame.style.marginTop = '3px';
      this._createContent(this._frame);
      this._container.appendChild(this._frame);
    }

    _valueChanged(e){
      if(e.params && e.params.value) this.fire("change", e.params);
    }

    _createContent(container) {
      MA.DOM.addClass(container, "-gsi-minzoom-input");

      var table = MA.DOM.create("table");

      var td = MA.DOM.create("td");
      this._prefixNode = MA.DOM.create("span");
      this._prefixNode.innerHTML = "prefix";
      td.appendChild(this._prefixNode);
      table.appendChild(td);

      td = MA.DOM.create("td");
      var input = MA.DOM.create("input");
      input.setAttribute("type", "text");
      MA.DOM.addClass(input, "width");
      input.style["max-width"] = "70px";
      input.disabled = true;
      td.appendChild(input);
      table.appendChild(td);
      
      td = MA.DOM.create("td");
      this._postfixNode = MA.DOM.create("span");
      this._postfixNode.innerHTML = "postfix";
      td.appendChild(this._postfixNode);
      table.appendChild(td);

      this._onLangChange();

      this._zoomNode = new GSIBV.UI.Input.Number(input, {"type": "int", "min": this._minzoomRange, "max": this._maxzoomRange});
      this._zoomNode.value = this._minzoom;

      if(this._changeHandler) {
        this._zoomNode.off("change", this._changeHandler);
        this._changeHandler = null;
      }
      this._changeHandler = MA.bind(this._valueChanged, this);
      this._zoomNode.on("change", this._changeHandler);
      
      container.appendChild(table);
    }
  };