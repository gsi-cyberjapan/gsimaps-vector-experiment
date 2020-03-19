if (!GSIBV.Map) GSIBV.Map = {};
if (!GSIBV.Map.Control) GSIBV.Map.Control = {};


GSIBV.Map.Control.LeftPanelControl = class extends MA.Class.Base {
  
  constructor(options) {
    super(options);
    this._options = options;

  }

  onAdd() {
    
    this._container = document.createElement('div');
    this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
    this._button = document.createElement("button");
    this._button.className = 'mapboxgl-ctrl-icon -gsibv-mapboxctrl-leftpanelbutton';
    this._button.setAttribute("title", "地図を選択・編集");
    this._button.style.width="54px";
    this._button.style.height="54px";
    this._button.style.border="2px solid rgba(51,51,51,0.9)";
    
    this._label = document.createElement("div");
    this._label.className = '-gsibv-mapmenu-button-label';
    this._label.innerHTML = "地図選択"
    this._container.appendChild(this._button);
    this._button.appendChild(this._label);

    MA.DOM.on(this._button,"click", MA.bind(function(){
      this.fire("click");
    },this));

    return this._container;
  }
  onRemove() {
    this._container.parentNode.removeChild(this._container);
  }

};

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
      if (map.getPitch() == 0) {
        if( !GSIBV.CONFIG.MOBILE ) return;
        map.easeTo({ pitch: 60 }, { "exec": "resetpitch" });
      } else {
        map.easeTo({ pitch: 0 }, { "exec": "resetpitch" });
      }
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




GSIBV.Map.Control.CompassControl = class extends MA.Class.Base {
  
  constructor(map,options) {
    super(options);
    this._map = map;
    this._options = options;
    this._visible = true;
  }

  set visible (value) {
    this._visible = value;
    this._container.style.display = (value ? "block" : "none" );
  }
  

  get visible() {
    return this._visible;
  }

  
  
  _refresh() {
    var bearing = this._map.getBearing();
    var pitch = this._map.getPitch();
    
    this._img.style.transform = "rotateX(" + Math.floor(pitch) + "deg) rotateZ(" + -Math.floor(bearing) + "deg)";

  }
  _onMapRotate() {
    this._refresh();
  }

  _onMapPitch() {
    this._refresh();
    
  }


  onAdd() {
    
    this._container = document.createElement('div');
    this._container.style.paddingRight='8px';
    this._container.className = 'mapboxgl-ctrl';
    this._img = document.createElement("img");
    this._img.src = "image/print/compass.png"
    this._container.appendChild(this._img);

    if ( !this._rotateHandler  ) {
      this._rotateHandler = MA.bind(this._onMapRotate,this);
      this._pitchHandler = MA.bind(this._onMapPitch,this);
      this._map.on("rotate", this._rotateHandler );
      this._map.on("pitch", this._rotateHandler);
    }
    this._refresh();
    return this._container;
  }
  onRemove() {
    this._container.parentNode.removeChild(this._container);
    
    if ( this._rotateHandler  ) {
      this._map.off("rotate", this._rotateHandler );
      this._map.off("pitch", this._rotateHandler);
      this._rotateHandler = null;
      this._pitchHandler = null;
    }

  }

};
