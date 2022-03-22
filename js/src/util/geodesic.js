if (!GSI) GSI = {};
if (!GSI.Utils) GSI.Utils = {};
// GSI.Utils.Geodesic = class extends MA.Class.Base {
//     constructor() {

//     }
// };
GSI.Utils.Geodesic = {};
GSI.Utils.Geodesic.vincentyDirect = function (p1, initialBearing, distance, wrap) {
    var datum = {}
    datum.ellipsoid = {
        a: 6378137,
        b: 6356752.3142,
        f: 1 / 298.257223563
      }
    var φ1 = p1.lat * Math.PI / 180,
        λ1 = p1.lng * Math.PI / 180;
    var α1 = initialBearing * Math.PI / 180;
    var s = distance;

    var a = datum.ellipsoid.a,
        b = datum.ellipsoid.b,
        f = datum.ellipsoid.f;

    var sinα1 = Math.sin(α1);
    var cosα1 = Math.cos(α1);

    var tanU1 = (1 - f) * Math.tan(φ1),
        cosU1 = 1 / Math.sqrt((1 + tanU1 * tanU1)),
        sinU1 = tanU1 * cosU1;
    var σ1 = Math.atan2(tanU1, cosα1);
    var sinα = cosU1 * sinα1;
    var cosSqα = 1 - sinα * sinα;
    var uSq = cosSqα * (a * a - b * b) / (b * b);
    var A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 *
        uSq)));
    var B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));

    var σ = s / (b * A),
        σʹ, iterations = 0;
    do {
        var cos2σM = Math.cos(2 * σ1 + σ);
        var sinσ = Math.sin(σ);
        var cosσ = Math.cos(σ);
        var Δσ = B * sinσ * (cos2σM + B / 4 * (cosσ * (-1 + 2 * cos2σM *
            cos2σM) -
            B / 6 * cos2σM * (-3 + 4 * sinσ * sinσ) * (-3 + 4 * cos2σM *
                cos2σM)));
        σʹ = σ;
        σ = s / (b * A) + Δσ;
    } while (Math.abs(σ - σʹ) > 1e-12 && ++iterations);

    var x = sinU1 * sinσ - cosU1 * cosσ * cosα1;
    var φ2 = Math.atan2(sinU1 * cosσ + cosU1 * sinσ * cosα1, (1 - f) *
        Math.sqrt(sinα * sinα + x * x));
    var λ = Math.atan2(sinσ * sinα1, cosU1 * cosσ - sinU1 * sinσ * cosα1);
    var C = f / 16 * cosSqα * (4 + f * (4 - 3 * cosSqα));
    var L = λ - (1 - C) * f * sinα *
        (σ + C * sinσ * (cos2σM + C * cosσ * (-1 + 2 * cos2σM * cos2σM)));

    if (wrap)
        var λ2 = (λ1 + L + 3 * Math.PI) % (2 * Math.PI) - Math.PI; // normalise to -180...+180
    else
        var λ2 = (λ1 + L); // do not normalize

    var revAz = Math.atan2(sinα, -x);

    return {
        lat: φ2 * 180 / Math.PI,
        lng: λ2 * 180 / Math.PI,
        finalBearing: revAz * 180 / Math.PI
    };
};
GSI.Utils.Geodesic.vincentyInverse = function (p1, p2) {
    var datum = {}
    datum.ellipsoid = {
        a: 6378137,
        b: 6356752.3142,
        f: 1 / 298.257223563
      }
    var φ1 = p1.lat * Math.PI / 180,
        λ1 = p1.lng * Math.PI / 180;
    var φ2 = p2.lat * Math.PI / 180,
        λ2 = p2.lng * Math.PI / 180;

    var a = datum.ellipsoid.a,
        b = datum.ellipsoid.b,
        f = datum.ellipsoid.f;

    var L = λ2 - λ1;
    var tanU1 = (1 - f) * Math.tan(φ1),
        cosU1 = 1 / Math.sqrt((1 + tanU1 * tanU1)),
        sinU1 = tanU1 * cosU1;
    var tanU2 = (1 - f) * Math.tan(φ2),
        cosU2 = 1 / Math.sqrt((1 + tanU2 * tanU2)),
        sinU2 = tanU2 * cosU2;

    var λ = L,
        λʹ, iterations = 0;
    do {
        var sinλ = Math.sin(λ),
            cosλ = Math.cos(λ);
        var sinSqσ = (cosU2 * sinλ) * (cosU2 * sinλ) + (cosU1 * sinU2 -
            sinU1 * cosU2 * cosλ) * (cosU1 * sinU2 - sinU1 * cosU2 * cosλ);
        var sinσ = Math.sqrt(sinSqσ);
        if (sinσ == 0) return 0; // co-incident points
        var cosσ = sinU1 * sinU2 + cosU1 * cosU2 * cosλ;
        var σ = Math.atan2(sinσ, cosσ);
        var sinα = cosU1 * cosU2 * sinλ / sinσ;
        var cosSqα = 1 - sinα * sinα;
        var cos2σM = cosσ - 2 * sinU1 * sinU2 / cosSqα;
        if (isNaN(cos2σM)) cos2σM = 0; // equatorial line: cosSqα=0 (§6)
        var C = f / 16 * cosSqα * (4 + f * (4 - 3 * cosSqα));
        λʹ = λ;
        λ = L + (1 - C) * f * sinα * (σ + C * sinσ * (cos2σM + C * cosσ * (-
            1 + 2 * cos2σM * cos2σM)));
    } while (Math.abs(λ - λʹ) > 1e-12 && ++iterations < 100);
    if (iterations >= 100) {
        console.log("Formula failed to converge. Altering target position.")
        return GSI.Utils.Geodesic.vincentyInverse(p1, {
            lat: p2.lat,
            lng: p2.lng - 0.01
        })
        //  throw new Error('Formula failed to converge');
    }

    var uSq = cosSqα * (a * a - b * b) / (b * b);
    var A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 *
        uSq)));
    var B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
    var Δσ = B * sinσ * (cos2σM + B / 4 * (cosσ * (-1 + 2 * cos2σM *
        cos2σM) -
        B / 6 * cos2σM * (-3 + 4 * sinσ * sinσ) * (-3 + 4 * cos2σM *
            cos2σM)));

    var s = b * A * (σ - Δσ);

    var fwdAz = Math.atan2(cosU2 * sinλ, cosU1 * sinU2 - sinU1 * cosU2 *
        cosλ);
    var revAz = Math.atan2(cosU1 * sinλ, -sinU1 * cosU2 + cosU1 * sinU2 *
        cosλ);

    s = Number(s.toFixed(3)); // round to 1mm precision
    return {
        distance: s,
        initialBearing: fwdAz * 180 / Math.PI,
        finalBearing: revAz * 180 / Math.PI
    };
}