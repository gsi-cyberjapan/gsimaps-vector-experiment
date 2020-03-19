
GSIBV.UI.LayerTreeView = class extends GSIBV.UI.Popup {

  constructor() {
    super();
    this._current = null;
    this._tree = null;

  }

  get tree() { return this._tree; }

  set current(current) {
    if (!this.tree) return;
    if (current) this._current = current;
    else this._current = this._tree.find(current);

    this._initializeView();
    this.fire("currentchange", { "current": this.current });
  }

  initialize(tree, current) {
    this._tree = tree;
    this.current = current;

    if (tree) {
      //this._test( tree._entries );
    }
  }

  _test(entries) {
    for (var i = 0; i <= entries.length; i++) {
      var item = entries[i];
      if (!item) continue;
      if (item && item._entries)
        this._test(item._entries);
      else {
      }
    }
  }

  show(left, top) {
    super.show(left, top);
    if (this._listScrollBar) this._listScrollBar.update();
    else {
      try {
        this._listScrollBar = new PerfectScrollbar(this._listFrame);
      } catch (e) { }
    }
  }

  hide() {
    super.hide();
  }

  _create() {
    super._create();
  }

  _createContent(content) {
    super._createContent(content);

    this._headerElement = MA.DOM.create('div');
    this._listFrame = MA.DOM.create('div');
    this._listUL = MA.DOM.create('ul');

    MA.DOM.addClass(this._headerElement, "-header");
    MA.DOM.addClass(this._listFrame, "-list-frame");


    content.appendChild(this._headerElement);
    this._listFrame.appendChild(this._listUL);
    content.appendChild(this._listFrame);

    this._initializeView();

  }
  _initializeView() {

    if (!this._listFrame) return;

    this._initializeHeader();

    this._initializeList();

  }

  _initializeHeader() {
    this._headerElement.innerHTML = '';

    var _createA = function (title) {
      var a = MA.DOM.create('a');
      a.setAttribute('href', 'javascript:void(0);');

      a.innerHTML = title;
      return a;
    };

    var list = [];
    var item = this._current;

    if (this._current) {
      list.push(document.createTextNode(item.title));
      item = item.parent;
    } else item = null;

    while (item && item != this._tree) {
      var a = _createA(item.title, item);

      MA.DOM.on(a, "click", MA.bind(function (item) {
        this.current = item;
      }, this, item));
      list.push(a);
      item = item.parent;
    }

    if (this._current) {
      var a = _createA('TOP');

      MA.DOM.on(a, "click", MA.bind(function (item) {
        this.current = item;
      }, this, null));
      list.push(a);
    }
    else
      list.push(document.createTextNode('TOP'));

    for (var i = list.length - 1; i >= 0; i--) {
      this._headerElement.appendChild(list[i]);
      if (i > 0) {
        var span = MA.DOM.create("span");
        span.innerHTML = '&gt;';
        this._headerElement.appendChild(span);
      }
    }

  }

  _initializeList() {
    this._listUL.innerHTML = '';
    this._listFrame.scrollTop = 0;
    if (!this._tree) {
      return;
    }

    var current = (this._current ? this._current : this._tree);

    for (var i = 0; i < current.length; i++) {
      var layer = current.get(i);
      var item = null;
      if (layer.isDirectory) {
        item = new GSIBV.UI.LayerTreeView.DirectoryItem(layer, this);
      } else {
        item = new GSIBV.UI.LayerTreeView.LayerItem(layer, this);
      }

      item.on("select", MA.bind(this._onItemSelect, this));
      this._listUL.appendChild(item.element);

    }

    if (this._listScrollBar) this._listScrollBar.update();

  }

  _onItemSelect(e) {
    var item = e.from;
    if (item.layer.isDirectory) {
      this.current = item.layer;
    }
    else {
      this.fire("select", { "layerInfo": item.layer });
    }
  }

}


GSIBV.UI.LayerTreeView.LayerBase = class extends MA.Class.Base {

  constructor(layer, owner) {
    super();
    this._layer = layer;
    this._owner = owner;

    this._createElement();
  }

  get layer() { return this._layer; }
  get element() { return this._container; }

  _createElement() {
    this._container = MA.DOM.create('li');
    MA.DOM.addClass(this._container, "-list-item");
    this._a = MA.DOM.create('a');
    this._a.setAttribute('href', 'javascript:void(0);');
    this._a.style.position = 'relative';
    this._a.style.display = 'block';
    this._titleElement = MA.DOM.create('div');

    this._titleElement.innerHTML = this._layer.title;
    MA.DOM.addClass(this._titleElement, "-title");

    this._a.appendChild(this._titleElement);
    this._container.appendChild(this._a);
    MA.DOM.on(this._a, "click", MA.bind(this._onClick, this));

  }

  _onClick() {
    this.fire("select");
  }

}


GSIBV.UI.LayerTreeView.LayerItem = class extends GSIBV.UI.LayerTreeView.LayerBase {

  constructor(layer, owner) {
    super(layer, owner);
  }

  _createElement() {
    super._createElement();
    MA.DOM.addClass(this._container, "-layer");
    if (this._layer.iconUrl && this._layer.iconUrl != "") {
      this._a.style.backgroundImage = 'url("' + this._layer.iconUrl + '")';
    }
  }
}



GSIBV.UI.LayerTreeView.DirectoryItem = class extends GSIBV.UI.LayerTreeView.LayerBase {

  constructor(layer, owner) {
    super(layer, owner);
  }

  _createElement() {
    super._createElement();
    MA.DOM.addClass(this._container, "-directory");
    
    if (this._layer.iconUrl && this._layer.iconUrl != "") {
      this._a.style.backgroundImage = 'url("' + this._layer.iconUrl + '")';
    }

    this._numElement = MA.DOM.create('div');
    MA.DOM.addClass(this._numElement, "-num");
    this._numElement.innerHTML = this._layer.length;
    this._a.append(this._numElement);

  }
}

