GSIBV.UI.Edit = {};

GSIBV.UI.Edit.Base = class extends MA.Class.Base {

  constructor(map, drawStyle, minzoom, maxzoom, defaultDrawStyle) {
    super();
    this._map = map;
    this._drawStyle = drawStyle.clone();

    this._minzoom = minzoom;
    this._maxzoom = maxzoom;
    this._defaultDrawStyle = defaultDrawStyle;
  }

  get drawStyle() { return this._drawStyle; }
  initialize(parentElement, template) {
    this._container = template.cloneNode(true);
    parentElement.appendChild(this._container);
  }

  reset() {
    if ( !this._defaultDrawStyle ) return;
    this._drawStyle = this._drawStyle.clone();
  }

  destroy() {
    if (this._container) this._container.parentNode.removeChild(this._container);
    delete this._container;
    this._container = undefined;
  }
};