GSIBV.UI.Select.Anchor = class extends MA.Class.Base {

  constructor(container, hasAuto, value) {
    super();
    this._container = container;
    this._hasAuto = hasAuto;
    this._initialize();

    if (hasAuto && (value == undefined || value == "")) value = "auto";
    this._select.value = value;


    this._langChangeHandler = MA.bind(this._onLangChange, this);
    GSIBV.application.on("langchange", this._langChangeHandler);
    this._onLangChange();

  }

  get value() {
    return this._select.value;
  }

  _onLangChange() {

    try {
      var lang = GSIBV.application.lang;
      
      var intputLang =GSIBV.CONFIG.LANG[lang.toUpperCase()].UI.EDITINPUT;
      
      var optionList = MA.DOM.find( this._select, "option");

      for( var i=0; i<optionList.length; i++ ) {
        var option = optionList[i];
        var title = intputLang[ option.value];
        option.innerHTML = title;
      }

    } catch(e) {}
  }

  _initialize() {
    this._container.innerHTML = '';

    this._select = MA.DOM.create("select");

    function makeOption(value, title) {
      var option = document.createElement('option');
      option.value = value;
      option.appendChild(document.createTextNode(title));

      return option;
    }
    if (this._hasAuto) {
      this._select.appendChild(makeOption("auto", "データの設定に従う"));
    }
    this._select.appendChild(makeOption("center", "中央"));
    this._select.appendChild(makeOption("left", "左"));
    this._select.appendChild(makeOption("right", "右"));
    this._select.appendChild(makeOption("top", "上"));
    this._select.appendChild(makeOption("bottom", "下"));
    this._select.appendChild(makeOption("top-left", "左上"));
    this._select.appendChild(makeOption("top-right", "右上"));
    this._select.appendChild(makeOption("bottom-left", "左下"));
    this._select.appendChild(makeOption("bottom-right", "右下"));

    this._container.appendChild(this._select);
  }
  destroy() {
  }


};
