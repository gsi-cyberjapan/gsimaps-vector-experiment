if ( !GSI ) GSI = {};
if ( !GSI.Utils ) GSI.Utils = {};

/*************************************************
 距離の計算
*************************************************/
GSI.Utils.DistanceCalculator = {};
GSI.Utils.DistanceCalculator.calc = function (from, to) {
  try {
    var PI = 3.14159265358979;
    var params = {};

    // ラジアンへ
    params.phi1 = from.lat * PI / 180;
    params.lamb1 = from.lng * PI / 180; if (params.lamb1 < 0) params.lamb1 += PI * 2;
    params.phi2 = to.lat * PI / 180;
    params.lamb2 = to.lng * PI / 180; if (params.lamb2 < 0) params.lamb2 += PI * 2;

    // 計算
    params.lamb = params.lamb2 - params.lamb1;
    if (params.lamb > PI) params.lamb -= PI * 2;
    else if (params.lamb < -PI) params.lamb += PI * 2;

    if (params.lamb >= 0) params.seihan = 0;
    else if (params.lamb < 0) {
      params.seihan = 1;
      params.lamb = Math.abs(params.lamb);
    }

    // 楕円体原子 GRS80
    var daen = 2;
    var a = 6378137;
    var rf = 298.257222101;
    params.f = 1. / rf;

    params.a = a;
    params.lambd = PI - params.lamb;
    if (params.seihan == 0) {
      params.delta = params.phi2 - params.phi1;
      params.sigma = params.phi1 + params.phi2;
      params.u1 = Math.atan((1 - params.f) * Math.tan(params.phi1));
      params.u2 = Math.atan((1 - params.f) * Math.tan(params.phi2));
    }
    else if (params.seihan == 1) {
      params.delta = params.phi1 - params.phi2;
      params.sigma = params.phi1 + params.phi2;
      params.u1 = Math.atan((1 - params.f) * Math.tan(params.phi2));
      params.u2 = Math.atan((1 - params.f) * Math.tan(params.phi1));
    }

    params.sigmad = params.u1 + params.u2;
    params.deltad = params.u2 - params.u1;
    params.xi = Math.cos(params.sigmad / 2.);
    params.xid = Math.sin(params.sigmad / 2.);
    params.eta = Math.sin(params.deltad / 2.);
    params.etad = Math.cos(params.deltad / 2.);
    params.x = Math.sin(params.u1) * Math.sin(params.u2);
    params.y = Math.cos(params.u1) * Math.cos(params.u2);
    params.c__ = params.y * Math.cos(params.lamb) + params.x;
    params.d__1 = 1 - params.f;
    params.ep = params.f * (2 - params.f) / (params.d__1 * params.d__1);
    var zoneInfo = {
      zone: 0,
      theta: null
    };

    var dms2r = GSI.Utils.DistanceCalculator._dms2r;

    // Zoneの判断
    if (params.c__ >= 0) {
      zoneInfo.zone = 1;
      zoneInfo.theta = params.lamb * (params.f * params.y + 1);
    }
    else if (params.c__ < 0 && params.c__ >= -Math.cos(dms2r(PI, 30000) * Math.cos(params.u1))) {
      zoneInfo.zone = 2;
      zoneInfo.theta = params.lambd;
    }
    else if (params.c__ < -Math.cos(dms2r(PI, 30000) * Math.cos(params.u1))) {
      zoneInfo.zone = 3;
      GSI.Utils.DistanceCalculator._zone3(PI, params, zoneInfo);
    }

    params.theta = zoneInfo.theta;


    var distance = 0;
    if (zoneInfo.zone >= 1 && zoneInfo.zone <= 321) {
      distance = GSI.Utils.DistanceCalculator._zone1(PI, params, zoneInfo);
    }
    else if (zoneInfo.zone == 322) {
      distance = GSI.Utils.DistanceCalculator._zone322(PI, params, zoneInfo);
    }
    else if (zoneInfo.zone == 323) {
      distance = GSI.Utils.DistanceCalculator._zone323(PI, params, zoneInfo);
    }
  }
  catch (ex) {
    console.log(ex);
  }

  return distance;
};

GSI.Utils.DistanceCalculator._dms2r = function (PI, dms) {
  var dd, mm, ss, deg, hugou;

  if (dms > 0) {
    hugou = 1.;
  } else if (dms < 0) {
    hugou = -1;
  }
  dd = parseFloat(parseInt(Math.abs(dms) / 10000));
  mm = parseFloat(parseInt((Math.abs(dms) - dd * 10000) / 100));
  ss = Math.abs(dms) - dd * 10000 - mm * 100;
  deg = hugou * (dd + mm / 60 + ss / 3600);
  return deg * PI / 180.;
};


GSI.Utils.DistanceCalculator._zone1 = function (PI, params, zoneInfo) {
  var d__1, d__2, d__3, d__4, d__5;

  var zero_ = function (a) {
    if (Math.abs(a) < 1e-14) return 1e-14;
    else return a;
  };
  /* Local variables */
  var g, h__;
  var i__;
  var n0, aa, bb, dd, ee, ff, gg, jj, kk, zeta;
  //extern doublereal zero_(doublereal *);
  var dalp2, alpha, zetad, alpha2, sgamma, rgamma;
  //extern /* Subroutine */ int hanten_(void);
  var ssigma;
  //extern /* Subroutine */ int handan1_(void), handan2_(void);

  /*     θの計算 */
  for (i__ = 1; i__ <= 100; ++i__) {
    if (zoneInfo.zone == 1) {
      d__1 = params.eta;
      d__2 = Math.cos(params.theta / 2.);
      d__3 = params.xi;
      d__4 = Math.sin(params.theta / 2.);
      g = Math.sqrt(d__1 * d__1 * (d__2 * d__2) + d__3 * d__3 * (d__4 * d__4));
      d__1 = params.etad;
      d__2 = Math.cos(params.theta / 2.);
      d__3 = params.xid;
      d__4 = Math.sin(params.theta / 2.);
      h__ = Math.sqrt(d__1 * d__1 * (d__2 * d__2) + d__3 * d__3 * (d__4 * d__4));
    }
    else {
      d__1 = params.eta;
      d__2 = Math.sin(params.theta / 2.);
      d__3 = params.xi;
      d__4 = Math.cos(params.theta / 2.);
      g = Math.sqrt(d__1 * d__1 * (d__2 * d__2) + d__3 * d__3 * (d__4 * d__4));
      d__1 = params.etad;
      d__2 = Math.sin(params.theta / 2.);
      d__3 = params.xid;
      d__4 = Math.cos(params.theta / 2.);
      h__ = Math.sqrt(d__1 * d__1 * (d__2 * d__2) + d__3 * d__3 * (d__4 * d__4));
    }
    ssigma = Math.atan(g / zero_(h__)) * 2;
    jj = g * 2 * h__;
    d__1 = h__;
    d__2 = g;
    kk = d__1 * d__1 - d__2 * d__2;
    sgamma = params.y * Math.sin(params.theta) / zero_(jj);
    d__1 = sgamma;
    rgamma = 1 - d__1 * d__1;
    zeta = rgamma * kk - params.x * 2;
    zetad = zeta + params.x;
    d__1 = params.f;
    dd = params.f * 0.25 * (params.f + 1) - d__1 * d__1 * 0.1875 * rgamma;
    d__1 = zeta;
    d__2 = rgamma;
    ee = (1 - dd * rgamma) * params.f * sgamma * (ssigma + dd * jj * (
      zeta + dd * kk * (d__1 * d__1 * 2 - d__2 * d__2)));
    if (zoneInfo.zone == 1) {
      ff = params.theta - params.lamb - ee;
    }
    else {
      ff = params.theta - params.lambd + ee;
    }
    if (Math.abs(ff) < 1e-14) {
      break;
    }
    d__1 = sgamma;
    d__2 = sgamma;
    d__3 = params.f;
    gg = params.f * (d__1 * d__1) * (1 - dd * 2 * rgamma) + params.f *
      zetad * (ssigma / zero_(jj)) * (1 - dd * rgamma + params.f *
        0.5 * (d__2 * d__2)) + d__3 * d__3 * 0.25 * zeta * zetad;
    d__1 = 1 - gg;
    params.theta -= ff / zero_(d__1);
  }

  /*     方位角の計算(zone=[1],[2,31,321]) */

  if (zoneInfo.zone == 1) {
    alpha = Math.atan(params.xi * Math.tan(params.theta / 2.) / zero_(params.eta));
    dalp2 = Math.atan(params.xid * Math.tan(params.theta / 2.) / zero_(params.etad));
  }
  else {
    alpha = Math.atan(params.etad * Math.tan(params.theta / 2.) / zero_(params.xid));
    dalp2 = Math.atan(params.eta * Math.tan(params.theta / 2.) / zero_(params.xi));
  }
  if (alpha <= -1e-14 && params.lamb > 0.) {
    alpha += PI;
  }
  else if (alpha >= 1e-14 && params.lamb < 0.) {
    alpha += PI;
  }
  else if (alpha <= -1e-14 && params.lamb < 0.) {
    alpha += PI * 2;
  }

  var result = {};

  result.alpha1 = alpha - dalp2;
  if (zoneInfo.zone == 1) {
    alpha2 = alpha + dalp2;
  } else {
    alpha2 = PI - alpha - dalp2;
  }
  result.alp21 = PI + alpha2;
  if (result.alp21 < 0) {
    result.alp21 += PI * 2;
  } else if (result.alp21 >= PI * 2) {
    result.alp21 -= PI * 2;
  }

  if (Math.abs(params.lamb) < 1e-14) {
    GSI.Utils.DistanceCalculator._handan1(PI, params, zoneInfo, result);
  }
  if ((d__1 = Math.abs(params.lamb) - PI, Math.abs(d__1)) < 1e-14) {
    GSI.Utils.DistanceCalculator._handan2(PI, params, zoneInfo, result);
  }

  GSI.Utils.DistanceCalculator._hanten(PI, params, zoneInfo, result);


  /*     測地線長の計算(zone=[1],[2,31,321]) */
  d__1 = Math.sqrt(params.ep * rgamma + 1) + 1;
  n0 = params.ep * rgamma / (d__1 * d__1);
  d__1 = n0;
  aa = (n0 + 1) * (d__1 * d__1 * 1.25 + 1);
  d__1 = n0;
  d__2 = Math.sqrt(params.ep * rgamma + 1) + 1;
  bb = params.ep * (1 - d__1 * d__1 * .375) / (d__2 * d__2);
  d__1 = rgamma;
  d__2 = zeta;
  d__3 = kk;
  d__4 = rgamma;
  d__5 = zeta;
  result.s = (1 - params.f) * params.a * aa * (ssigma - bb * jj * (zeta -
    bb * .25 * (kk * (d__1 * d__1 - d__2 * d__2 * 2) - bb *
      0.16666666666666666 * zeta * (1 - d__3 * d__3 * 4) * (d__4 * d__4 *
        3 - d__5 * d__5 * 4))));
  return result.s;
};



GSI.Utils.DistanceCalculator._zone3 = function (PI, params, zoneInfo) {
  var d__1, d__2, d__3, d__4;

  d__1 = Math.cos(params.u1);
  d__2 = Math.sin(params.u1);
  d__3 = params.f;
  d__4 = Math.sin(params.u1), d__4 *= d__4;
  zoneInfo.rr = params.f * PI * (d__1 * d__1) * (1 - params.f * 0.25
    * (params.f + 1) * (d__2 * d__2) + d__3 * d__3 * 0.1875 * (d__4 *
      d__4));
  zoneInfo.d1 = params.lambd * Math.cos(params.u1) - zoneInfo.rr;
  zoneInfo.d2 = Math.abs(params.sigmad) + zoneInfo.rr;
  zoneInfo.q = params.lambd / (params.f * PI);
  zoneInfo.f1 = params.f * .25 * (params.f * .5 + 1);

  d__1 = zoneInfo.q;
  zoneInfo.gamma0 = zoneInfo.q + zoneInfo.f1 * zoneInfo.q - zoneInfo.f1 * (d__1 * (d__1 * d__1));
  if (Math.abs(params.sigma) >= 1e-14) {
    zoneInfo.zone = 31;
    GSI.Utils.DistanceCalculator._zone31(PI, params, zoneInfo);
  }
  else if (Math.abs(params.sigma) < 1e-14) {
    zoneInfo.zone = 32;
    GSI.Utils.DistanceCalculator._zone32(PI, params, zoneInfo);
  }
  return 0;
}


GSI.Utils.DistanceCalculator._zone31 = function (PI, params, zoneInfo) {
  var d__1, d__2, d__3;

  var j, k, j1, aa0, bb0, psi, psid;
  var psidd;


  var zero_ = function (a) {
    if (Math.abs(a) < 1e-14) return 1e-14;
    else return a;
  };

  aa0 = Math.atan(zoneInfo.d1 / zero_(zoneInfo.d2));
  d__2 = zoneInfo.d1;
  d__3 = zoneInfo.d2;
  d__1 = Math.sqrt(d__2 * d__2 + d__3 * d__3);
  bb0 = Math.asin(zoneInfo.rr / zero_(d__1));
  psi = aa0 + bb0;
  d__1 = Math.cos(params.u1);
  j = zoneInfo.gamma0 / zero_(d__1);
  k = (zoneInfo.f1 + 1) * Math.abs(params.sigmad) * (1 - params.f * params.y) / (params.f * PI * zero_(params.y));
  d__1 = cos(psi);
  j1 = j / (k / zero_(d__1) + 1);
  psid = Math.asin(j1);
  d__1 = Math.cos(params.u2);
  psidd = Math.asin(Math.cos(params.u1) / zero_(d__1) * j1);
  d__1 = Math.cos(params.deltad / 2.0);
  params.theta = Math.atan(Math.tan((psid + psidd) / 2.0) * Math.sin(Math.abs(params.sigmad) / 2.0) / zero_(d__1)) * 2;
  return 0;
};


GSI.Utils.DistanceCalculator._zone32 = function (PI, params, zoneInfo) {
  if (zoneInfo.d1 >= 1e-14) {
    zoneInfo.zone = 321;
    GSI.Utils.DistanceCalculator._zone321(PI, params, zoneInfo);
  } else if (abs(zoneInfo.d1) < 1e-14) {
    zoneInfo.zone = 322;
  } else if (zoneInfo.d1 <= -1e-14) {
    zoneInfo.zone = 323;
  }
  return 0;
};


GSI.Utils.DistanceCalculator._zone321 = function (PI, params, zoneInfo) {
  params.theta = params.lambd;
  return 0;
};


/*************************************************
 Zone3(b2)における方位角，距離の計算
*************************************************/
GSI.Utils.DistanceCalculator._zone322 = function (PI, params, zoneInfo) {
  var d__1;
  var n0, aa, alpha2, rgamma;
  var result = {};

  result.alpha1 = PI / 2.;
  alpha2 = PI / 2.;
  result.alp21 = PI * 1.5;
  GSI.Utils.DistanceCalculator._hanten(PI, params, zoneInfo, result);
  d__1 = Math.sin(params.u1);
  rgamma = d__1 * d__1;
  d__1 = Math.sqrt(params.ep * rgamma + 1) + 1;
  n0 = params.ep * rgamma / (d__1 * d__1);
  d__1 = n0;
  aa = (n0 + 1) * (d__1 * d__1 * 1.25 + 1);
  result.s = (1 - params.f) * params.a * aa * PI;
  return result.s;
};


/*************************************************
 Zone3(b3)における方位角，距離の計算
*************************************************/
GSI.Utils.DistanceCalculator._zone323 = function (PI, params, zoneInfo) {
  var d__1;
  var i__;
  var m, n, w, n0, aa, dd, alpha2, rgamma, sgamma;
  for (i__ = 1; i__ <= 100; ++i__) {
    d__1 = zoneInfo.gamma0;
    rgamma = 1 - d__1 * d__1;
    d__1 = params.f;
    dd = params.f * .25 * (params.f + 1) - d__1 * d__1 * 0.1875 * rgamma;
    sgamma = zoneInfo.q / (1 - dd * rgamma);
    if ((d__1 = zoneInfo.gamma0 - sgamma, Math.abs(d__1)) < 1e-14) {
      break;
    }
    zoneInfo.gamma0 = sgamma;
  }
  m = 1 - zoneInfo.q / cos(params.u1);
  n = dd * rgamma / (1 - dd * rgamma);
  w = m - n + m * n;
  var result = {};

  if (w <= 0.) {
    result.alpha1 = PI / 2.0;
  } else {
    result.alpha1 = PI / 2.0 - Math.asin(Math.sqrt(w / 2.0)) * 2;
  }
  alpha2 = PI - result.alpha1;
  result.alp21 = PI + alpha2;
  GSI.Utils.DistanceCalculator._hanten(PI, params, zoneInfo, result);
  d__1 = Math.sqrt(params.ep * rgamma + 1) + 1;
  n0 = params.ep * rgamma / (d__1 * d__1);
  d__1 = n0;
  aa = (n0 + 1) * (d__1 * d__1 * 1.25 + 1);
  result.s = (1 - params.f) * params.a * aa * PI;
  return result.s;
};


/*************************************************
 経度差0度の方位角の判断
*************************************************/
GSI.Utils.DistanceCalculator._handan1 = function (PI, params, zoneInfo, result) {
  if (params.delta >= 0.) {
    result.alpha1 = 0.;
    result.alp21 = PI;
  } else if (params.delta < 0.) {
    result.alpha1 = PI;
    result.alp21 = 0.;
  }
  return 0;
};


/*************************************************
 経度差180度の方位角の判断
*************************************************/
GSI.Utils.DistanceCalculator._handan2 = function (PI, params, zoneInfo, result) {
  if (params.sigma >= 0) {
    result.alpha1 = 0;
    result.alp21 = 0;
  } else if (params.sigma < 0) {
    result.alpha1 = PI;
    result.alp21 = PI;
  }
  return 0;
};




/*************************************************
 方位角の反転
*************************************************/
GSI.Utils.DistanceCalculator._hanten = function (PI, params, zoneInfo, result) {
  if (params.seihan == 1) {
    var alphax = result.alpha1;
    result.alpha1 = result.alp21;
    result.alp21 = alphax;
  }
  return 0;
} /* hanten_ */


