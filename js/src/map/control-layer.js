
GSIBV.Map.ControlLayer = {};



GSIBV.Map.ControlLayer = class extends GSIBV.Map.Layer {
  constructor(options) {
    super(options);
  }


  add(map) {
    map.addControlLayer(this);

  }

  remove() {
    if (this._map) this._map.removeControlLayer(this);
  }

}

