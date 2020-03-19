GSIBV.UI.Edit = {};

GSIBV.UI.Edit.Base = class extends MA.Class.Base {

  constructor(map, drawStyle) {
    super();
    this._map = map;
    this._drawStyle = drawStyle.clone();

  }

  get drawStyle() { return this._drawStyle; }
  initialize(parentElement, template) {

    this._container = template.cloneNode(true);

    parentElement.appendChild(this._container);

  }

  destroy() {
    if (this._container)
      this._container.parentNode.removeChild(this._container);
    delete this._container;
    this._container = undefined;

  }

};