GSIBV.UI = {};

GSIBV.UI.Base = class extends MA.Class.Base {

  constructor(options) {
    super();
    this._effectSpeed = 200;
    if (options) {
      this._effectSpeed = options.effectSpeed ? options.effectSpeed : 200;
    }
  }

  get effectSpeed() { return this._effectSpeed; }
}





