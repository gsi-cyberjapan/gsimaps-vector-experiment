GSIBV.UI.Input.Size = class extends MA.Class.Base {

  constructor(container, minzoom, maxzoom, value, canMinus) {
    super();


    this._canMinus = canMinus;
    
    this._minzoom = minzoom;
    this._maxzoom = maxzoom;

    this._valueStops = {};
    for (var z = this._minzoom; z <= this._maxzoom + 1; z++) {
      this._valueStops[z] = {};
    }

    this._parseValue(value);
    this._container = container;
    this._initialize();
  
    this._langChangeHandler = MA.bind( this._onLangChange, this );
    GSIBV.application.on("langchange", this._langChangeHandler );
  }

  destroy() {

    if ( this._langChangeHandler ) {
      GSIBV.application.on("langchange", this._langChangeHandler );
      this._langChangeHandler = null;
    }

  }

  _onLangChange() {

    try {
      var lang = GSIBV.application.lang;
      
      var intpuLant =GSIBV.CONFIG.LANG[lang.toUpperCase()].UI.EDITINPUT;
      this._typeNumberRadio.nextSibling.innerHTML = intpuLant["fix"];
      this._typeStopsRadio.nextSibling.innerHTML = intpuLant["perzoom"];

      
      MA.DOM.find( this._stopsFrame, ".-gsi-size-stops-table .zoom-title" )[0].innerHTML = intpuLant["zoom"];
      MA.DOM.find( this._stopsFrame, ".-gsi-size-stops-table .size-title" )[0].innerHTML = intpuLant["size"];

    } catch(e) {}
  }

  get value() {
    if (this._type == "stops") {
      return this._getStopsValue();
    } else {

      var value = this._numberInput.value;
      if (value == undefined || value == "") return undefined;
      value = parseFloat(value);
      if (isNaN(value)) return undefined;

      return value;
    }
  }

  _getStopsValue() {
    if (this._valueStops == undefined) return undefined;
    var result = undefined;

    for (var z = this._minzoom; z <= this._maxzoom + 1; z++) {

      if (!this._valueStops[z].input) continue;
      var value = this._valueStops[z].input.value;
      if (value == undefined || value == "") continue;

      value = parseFloat(value);
      if (isNaN(value)) continue;
      if (!result) {
        result = { "stops": [] };
      }

      result.stops.push([parseInt(z), value]);

    }

    if (result != undefined && result.stops) {
      result.stops.sort(function (a, b) {
        return a[0] - b[0];
      });
    }
    return result;
  }

  _parseValue(value) {
    if (value == undefined) {
      this._type = "number";
      this._value = undefined;
      return;
    }

    if (Object.prototype.toString.call(value) === '[object Object]' &&
      Object.prototype.toString.call(value["stops"]) === '[object Array]') {
      var arr = value["stops"];
      this._type = "stops";

      for (var i = 0; i < arr.length; i++) {
        var value = parseFloat(arr[i][1]);
        if (isNaN(value)) value = undefined;
        if (this._valueStops[arr[i][0]])
          this._valueStops[arr[i][0]]["value"] = value;

      }
    } else {
      this._type = "number";
      this._value = parseFloat(value);
      if (isNaN(this._value)) this._value = undefined;
    }
  }

  _initialize() {
    if (this._frame) return;

    this._frame = MA.DOM.create("div");

    this._createSelect(this._frame);
    this._createNumber(this._frame);
    this._createStops(this._frame);

    this._valueToInput();

    this._container.appendChild(this._frame);

    if (this._type == "stops") {
      this._numberFrame.style.display = 'none';
      this._stopsFrame.style.display = '';
    } else {
      this._numberFrame.style.display = '';
      this._stopsFrame.style.display = 'none';
    }

    this._onLangChange();
  }


  _createSelect(container) {
    this._selectFrame = MA.DOM.create("div");

    var from = MA.DOM.create("form");

    function createRadio(container, name, caption) {
      if (!GSIBV.UI.Input.Size._idInc) GSIBV.UI.Input.Size._idInc = 0;
      GSIBV.UI.Input.Size._idInc++;
      var id = "-gsi-sizeinput-selectradio-" + GSIBV.UI.Input.Size._idInc;

      var radio = MA.DOM.create("input");
      MA.DOM.addClass(radio, "normalcheck");
      radio.setAttribute("id", id);
      radio.setAttribute("type", "radio");
      radio.setAttribute("name", name);

      var label = MA.DOM.create("label");
      label.setAttribute("for", id);
      label.innerHTML = caption;

      container.appendChild(radio);
      container.appendChild(label);

      return radio;
    }


    this._typeNumberRadio = createRadio(from, "-gsi-size", "固定値");
    this._typeStopsRadio = createRadio(from, "-gsi-size", "ズーム毎");

    this._selectFrame.appendChild(from);
    container.appendChild(this._selectFrame);

    if (this._type == "stops") {
      this._typeStopsRadio.checked = true;
    } else {
      this._typeNumberRadio.checked = true;
    }


    MA.DOM.on(this._typeNumberRadio, "click", MA.bind(this._onModeClick, this));
    MA.DOM.on(this._typeStopsRadio, "click", MA.bind(this._onModeClick, this));
  }

  _valueToInput() {

    if (this._value != undefined) {
      this._numberInput.value = this._value;
    } else {
      this._numberInput.value = "";
    }

    for (var z in this._valueStops) {
      var input = this._valueStops[z].input;
      if (input) {
        var value = this._valueStops[z].value;
        if (value != undefined)
          input.value = value;
        else
          input.value = "";

      }
    }
  }
  _getNumberInputToValue() {
    this._value = this._getInputValue(this._numberInput);
  }
  _getStopsInputToValue() {
    if (!this._valueStops) return;

    for (var z in this._valueStops) {
      var input = this._valueStops[z].input;
      if (input) {
        this._valueStops[z].value = this._getInputValue(input);
      }
    }
  }

  _getInputValue(input) {
    return input.value;
    /*
    value = value.replace(/[．。、，]/g, ".");
    value = value.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (s) {
      return String.fromCharCode(s.charCodeAt(0) - 65248);
    });

    if (!value.match(/^[-+]?[0-9]+(\.[0-9]+)?$/)) {
      return undefined;
    }
    var result = parseFloat(value);
    */
    if (isNaN(result) || result <= 0) return undefined;

    return result;
  }

  _onModeClick() {
    if (this._typeStopsRadio.checked) {
      if (this._type != "stops") {
        this._getNumberInputToValue();
      }
      this._type = 'stops';
      this._numberFrame.style.display = 'none';
      this._stopsFrame.style.display = '';
    } else {
      if (this._type != "number") {
        this._getStopsInputToValue();
      }
      this._type = 'number';
      this._numberFrame.style.display = '';
      this._stopsFrame.style.display = 'none';
    }
    this._valueToInput();
  }

  _createNumber(container) {

    this._numberFrame = MA.DOM.create("div");
    this._numberFrame.style.marginTop = '3px';
    var input = MA.DOM.create("input");

    input.setAttribute("type", "text");
    MA.DOM.addClass(input, "width");
    this._numberFrame.appendChild(input);
    this._numberInput = new GSIBV.UI.Input.Number(input, ( this._canMinus ? undefined : { "min": 0.00000000001 } ) );
    container.appendChild(this._numberFrame);

  }
  _createStops(container) {
    this._stopsFrame = MA.DOM.create("div");
    this._stopsFrame.style.marginTop = '3px';

    var table = MA.DOM.create("table");
    MA.DOM.addClass(table, "-gsi-size-stops-table");

    var td = null;
    var tr = MA.DOM.create("tr");
    var th = MA.DOM.create("th");
    MA.DOM.addClass( th, "zoom-title");
    th.innerHTML = 'ズーム';
    tr.appendChild(th);
    th = MA.DOM.create("th");
    MA.DOM.addClass( th, "size-title");
    th.innerHTML = 'サイズ';
    tr.appendChild(th);
    table.appendChild(tr);
    for (var z = this._minzoom; z <= this._maxzoom + 1; z++) {

      tr = MA.DOM.create("tr");
      td = MA.DOM.create("td");
      td.innerHTML = z;
      tr.appendChild(td);

      td = MA.DOM.create("td");
      var input = MA.DOM.create("input");
      input.setAttribute("type", "text");
      MA.DOM.addClass(input, "width");

      td.appendChild(input);
      tr.appendChild(td);

      table.appendChild(tr);
      this._valueStops[z].input = new GSIBV.UI.Input.Number(input, ( this._canMinus ? undefined: { "min": 0.00000000001 } ) );
    }

    this._stopsFrame.appendChild(table);
    container.appendChild(this._stopsFrame);
  }
};