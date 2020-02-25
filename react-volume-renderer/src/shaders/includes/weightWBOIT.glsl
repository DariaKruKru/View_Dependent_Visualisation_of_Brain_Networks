/** Cosgrove and Stoops */

varying float vfDepth;

float w(in float a) {
  float colorResistance = 1.0; // 1.0
  float rangeAdjustmentsClampBounds = 10.0; // 10.0
  float depth = abs( vfDepth );
  float orderingDiscrimination = 200.0; // 200.0;
  float orderingStrength = 5.0; // 5.0;
  float minValue = 1e-2; // 1e-2
  float maxValue = 3e3; // 3e3

  return pow( a, colorResistance ) *
    clamp(
      rangeAdjustmentsClampBounds /
      ( 1e-5 + (depth/orderingStrength) + (depth/orderingDiscrimination) ),
      minValue,
      maxValue
    );
}

// http://casual-effects.blogspot.co.at/2015/03/implemented-weighted-blended-order.html
// general purpose weight
// w = clamp(pow(min(1.0, premultipliedReflect.a * 10.0) + 0.01, 3.0) * 1e8 * pow(1.0 - gl_FragCoord.z * 0.9, 3.0), 1e-2, 3e3);
