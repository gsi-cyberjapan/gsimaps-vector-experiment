GSIBV.UI.Input.Offset = class extends MA.Class.Base {

  constructor(container, hasAuto, value) {
    super();

    if (value == undefined) value = "auto";
    this._value = value;
    this._hasAuto = hasAuto;
    this._container = container;
    this._initialize();

    this._onLangChange();
    this._langChangeHandler = MA.bind(this._onLangChange, this);
    GSIBV.application.on("langchange", this._langChangeHandler);


  }

  _onLangChange() {
    var lang = GSIBV.application.lang;

    try {
      var title = GSIBV.CONFIG.LANG[lang.toUpperCase()].UI.EDITINPUT["auto"];

      MA.DOM.find( this._container, "label.auto-label")[0].innerHTML = title;
    } catch(e) {}
  }

  _initialize() {
    this._container.innerHTML = '';
    if (this._hasAuto) {
      var checkFrame = MA.DOM.create("div");

      var id = MA.getId("-gisbv-control-");
      this._check = MA.DOM.create("input");
      MA.DOM.addClass(this._check, "normalcheck")
      this._check.setAttribute("type", "checkbox");
      this._check.setAttribute("id", id);

      var label = MA.DOM.create("label");
      MA.DOM.addClass(label, "auto-label");

      label.setAttribute("for", id);
      label.innerHTML = 'データの設定に従う';

      checkFrame.appendChild(this._check);
      checkFrame.appendChild(label);

      this._container.appendChild(checkFrame);

      MA.DOM.on(this._check, "click", MA.bind(this._onAutoCheckClick, this));
      checkFrame.style.marginBottom = '4px';
    }

    var inputFrame = MA.DOM.create("div");
    var input = null;

    var xFrame = MA.DOM.create("div");
    xFrame.style.display = 'inline-block';
    inputFrame.appendChild(document.createTextNode("x:"));
    input = MA.DOM.create("input");
    input.setAttribute("type", "text");
    MA.DOM.addClass(input, "offset-parts");
    xFrame.appendChild(input);
    inputFrame.appendChild(xFrame);
    inputFrame.appendChild(document.createTextNode("　"));

    this._xInput = new GSIBV.UI.Input.Number(input);


    var yFrame = MA.DOM.create("div");
    yFrame.style.display = 'inline-block';
    inputFrame.appendChild(document.createTextNode("y:"));
    input = MA.DOM.create("input");
    input.setAttribute("type", "text");
    MA.DOM.addClass(input, "offset-parts");
    yFrame.appendChild(input);
    inputFrame.appendChild(yFrame);
    this._yInput = new GSIBV.UI.Input.Number(input);

    this._inputFrame = inputFrame;
    if (this._value == "auto") {
      if (this._check) this._check.checked = true;
      MA.DOM.addClass(this._inputFrame, "-gsibv-disable");
    } else {
      if (this._check) this._check.checked = false;
      MA.DOM.removeClass(this._inputFrame, "-gsibv-disable");
      if (this._value.length == 2) {
        var x = parseFloat(this._value[0]);
        var y = parseFloat(this._value[1]);
        if (!isNaN(x)) this._xInput.value = x;
        if (!isNaN(y)) this._yInput.value = y;
      }
    }


    this._container.appendChild(inputFrame);

  }

  _onAutoCheckClick() {
    if (this._check && this._check.checked) {
      // this._inputFrame .style.display = 'none';
      MA.DOM.addClass(this._inputFrame, "-gsibv-disable");

    } else {
      MA.DOM.removeClass(this._inputFrame, "-gsibv-disable");
      // this._inputFrame .style.display = '';
    }
  }
  destroy() {
    if ( this._langChangeHandler ) {
      GSIBV.application.on("langchange", this._langChangeHandler );
      this._langChangeHandler = null;
    }
  }

  get value() {
    if (this._check && this._check.checked) {
      return "auto";
    } else {
      var x = this._xInput.value;
      var y = this._yInput.value;
      if (x != undefined && y != undefined) {
        return [x, y];
      }
    }
  }
}
