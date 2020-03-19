if (!GSIBV.Map.Control) GSIBV.Map.Control = {};


GSIBV.Map.Control.GPSControl = class extends MA.Class.Base {
  
  constructor(map, options) {
    super(options);
    this._map = map;
    this._options = options;

  }

  onAdd() {
    
    this._container = document.createElement('div');
    this._container.className = 'mapboxgl-ctrl';
    this._button = document.createElement("button");
    this._button.className = '-gsibv-mapboxctrl-gps';
    this._button.setAttribute("title", "GPS");
    
    
    this._container.appendChild(this._button);
    MA.DOM.on(this._button,"click", MA.bind(function(){
      
      if ( !this._locationWatcher) {
        this._start();
      }else {
        this._stop();
      }
    },this));

    return this._container;
  }
  onRemove() {
    
    if ( this._mark ) {
      this._mark.parentNode.removeChild(this._mark);
      this._mark = undefined;
    }
    
    this._container.parentNode.removeChild(this._container);
  }
  _start() {
    if ( !this._locationWatcher) {
      this._locationWatcher = new GSIBV.LocationWatcher();
      this._locationWatcher.on("change", MA.bind(this._onWatcherChange,this ));
      this._locationWatcher.on("stop", MA.bind(this._onWatcherStop,this ));
    }

    if ( !this._mapMoveHandler ) {
      this._mapMoveHandler = MA.bind( this._onMapMove,this);
      this._mapDoubleClickHandler = MA.bind( this._onMapDoubleClick,this);
      this._map.on("move", this._mapMoveHandler);
      this._map.on("dblclick", this._mapDoubleClickHandler);
    }

    this._map.doubleClickZoom.disable();
    this._locationWatcher.start();
    MA.DOM.addClass( this._button,"on");
  }

  _stop() {
    
    if ( this._mark ) {
      this._mark.parentNode.removeChild(this._mark);
      this._mark = undefined;
    }

    this._map.doubleClickZoom.enable();
    if ( this._mapMoveHandler ) {
      this._map.off("move", this._mapMoveHandler);
      this._map.off("dblclick", this._mapDoubleClickHandler);
      this._mapMoveHandler = null;
      this._mapDoubleClickHandler = null;
    }

    MA.DOM.removeClass( this._button,"on");
    if ( this._locationWatcher) {
      this._locationWatcher.destroy();
      this._locationWatcher = null;
    }
  }

  _onMapDoubleClick() {
    this._map.zoomIn({}, {"from":"gps"});
  }

  _onMapMove( e) {
    if ( e.from == "gps") return;
    if ( MA.DOM.hasClass(e.originalEvent.target,"mapboxgl-ctrl-icon"))return;
    this._stop();

  }
  _setLocation(coords) {
    this._map.flyTo({center:[coords.longitude,coords.latitude], zoom:GSIBV.CONFIG.GPS_FLYTO_ZOOM}, {"from":"gps"});
    if ( !this._mark) {
      this._mark = MA.DOM.create("div");
      MA.DOM.addClass(this._mark, "-gsibv-mapboxctrl-gps-mark" );
      this._map.getCanvasContainer().appendChild( this._mark);
    }
  }

  _onWatcherChange(evt) {
    var coords = evt.params.coords;
    this._setLocation(coords);
  }
  _onWatcherStop() {
    this._stop();
  }
  
};



/************************************************************************
 - GSI.LocationWatcher（位置情報監視）
 ************************************************************************/

GSIBV.LocationWatcher = class extends MA.Class.Base {

  constructor() {
    super();
    this._watchInterval = 3000;
  }

  start() {
    if (this._getLocationId) return;

    this._getLocationId = navigator.geolocation.watchPosition(
      MA.bind(function (loc) {
        if ( !this._watchTimerId) {
          this.fire("change", {"coords": loc.coords, "original":loc});
          this._watchTimerId = setInterval( MA.bind(this._onWatch,this), this._watchInterval);
        } else {
          this._lastLocation = loc;
        }
      }, this),
      MA.bind(function (error) {
        if ( error.code == 1 ) {
          this.fire("stop");
        }
        alert(GSI.TEXT.GEOLOCATION.ERROR[error.code] + "\n\n(message)\n" + error.message);
      }, this),
      { enableHighAccuracy: true, timeout: 60000, maximumAge: 3000 }
    );
  }

  _onWatch() {
    if ( !this._lastLocation ) return;
    this.fire("change", {"coords": this._lastLocation.coords, "original":this._lastLocation});
    this._lastLocation = null;
  }

  destroy() {
    this.off();
    if (!this._getLocationId) return;
    // クリア
    navigator.geolocation.clearWatch(this._getLocationId);
    this._getLocationId = null;
    if ( this._watchTimerId ) {
      clearTimeout( this._watchTimerId);
      this._watchTimerId = null;
    }
  }

};


