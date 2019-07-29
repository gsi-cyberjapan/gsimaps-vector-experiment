if (!GSIBV.Map) GSIBV.Map = {};
if (!GSIBV.Map.Control) GSIBV.Map.Control = {};

GSIBV.Map.Control.ResetPitchRotateControl = class {
  onAdd(map) {
    this._map = map;
    this._container = document.createElement('div');
    this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';

    this._resetPitchButton = document.createElement("button");
    this._resetPitchButton.setAttribute("title", "真上から見下ろす");
    this._resetPitchButton.className = 'mapboxgl-ctrl-icon -gsibv-mapboxctrl-reset-pitch';
    this._container.appendChild(this._resetPitchButton);

    this._resetRotateButton = document.createElement("button");
    this._resetRotateButton.setAttribute("title", "北を向く");
    this._resetRotateButton.className = 'mapboxgl-ctrl-icon -gsibv-mapboxctrl-reset-rotate';
    this._container.appendChild(this._resetRotateButton);


    var map = this._map;


    this._mapMoveHandler = MA.bind(this._onMapMove, this);
    this._map.on("move", this._mapMoveHandler);

    this._resetPitchButton.onclick = function () {
      if (map.getPitch() == 0) return;
      map.easeTo({ pitch: 0 }, { "exec": "resetpitch" });
    };
    this._resetRotateButton.onclick = function () {
      if (map.getBearing() == 0) return;
      map.resetNorth({}, { "exec": "resetrotate" });
    };
    this._onMapMove();
    return this._container;
  }
  _onMapMove() {
    if (this._map.getPitch() == 0) {
      MA.DOM.addClass(this._resetPitchButton, "disabled");
    } else {
      MA.DOM.removeClass(this._resetPitchButton, "disabled");
    }
    if (this._map.getBearing() == 0) {
      MA.DOM.addClass(this._resetRotateButton, "disabled");
    } else {
      MA.DOM.removeClass(this._resetRotateButton, "disabled");
    }
  }
  onRemove() {
    this._container.parentNode.removeChild(this._container);
    if (this._mapMoveHandler) {
      this._map.off("move", this._mapMoveHandler);
      this._mapMoveHandler = null;
    }

    this._map = undefined;
  }
}