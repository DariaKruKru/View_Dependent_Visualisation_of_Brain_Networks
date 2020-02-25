/** helper functions to change colour spaces */

// RGB to HueSaturationValue
vec3 rgb2hsv(vec3 c)
{
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    //vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    //vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
	vec4 p = c.g < c.b ? vec4(c.bg, K.wz) : vec4(c.gb, K.xy);
    vec4 q = c.r < p.x ? vec4(p.xyw, c.r) : vec4(c.r, p.yzx);

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}
// HueSaturationValue to RGB
vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

/***
* next some transforms from RGB to HueSaturationLightness and back
***/

// http://stackoverflow.com/questions/5919663/how-does-photoshop-blend-two-images-together
float ColorTransform_HUE_to_RGB(float m1, float m2, float hue){
	if (hue<0.0)
		hue+=1.0;
	else if (hue>1.0)
		hue-=1.0;

	float c; // single color channel (R G or B)
	if (6.0*hue<1.0)
		c = m1+(m2-m1)*hue*6.0;
	else if (2.0*hue<1.0)
		c = m2;
	else if (3.0*hue<2.0)
		c = m1+(m2-m1)*(2.0/3.0-hue)*6.0;
	else
		c = m1;

	return c;
}

// http://stackoverflow.com/questions/5919663/how-does-photoshop-blend-two-images-together
vec3 ColorTransform_RGB_to_HSL(vec3 c){
	float max = max(max(c.r,c.g),c.b);
	float min =  min(min(c.r,c.g),c.b);
	float delta = max-min;

	// set Luminance (hsl.g)
	vec3 hsl = vec3(0.0, 0.0, (max+min)/2.0); // Hue, Saturation, Luminance
	if (delta==0.0){ // gray, no chroma at all
		return hsl;
	}

	// set Saturation (hsl.b)
	if (hsl.z<0.5){ // luminance < 0.5
		hsl.y = delta / (max+min);
	} else {
		hsl.y = delta / (2.0-max-min);
	}

	// set Hue (hsl.r)
	if (c.r==max){
		hsl.x = (c.g-c.b)/delta;
	} else if (c.g==max){
		hsl.x = 2.0 + (c.b-c.r)/delta;
	} else {
		hsl.x = 4.0 + (c.r-c.g)/delta;
	}
	hsl.x /= 6.0;

	if (hsl.x<0.0) {hsl.x+=1.0;}
	else if (hsl.x>1.0) {hsl.x-=1.0;} // not needed?

	return hsl;
}

// http://stackoverflow.com/questions/5919663/how-does-photoshop-blend-two-images-together
vec3 ColorTransform_HSL_to_RGB(vec3 hsl){


	if (hsl.y==0.0) // if no saturation, return luminance as rgb
		return vec3(hsl.z);

	float m1,m2;

	if (hsl.z<=0.5){ // luminance low
		m2 = hsl.z*(1.0+hsl.y);//Lumination * (1.0 + Saturation);
	} else { // luminance high
		m2 = hsl.z+hsl.y - hsl.z*hsl.y;//Lumination + Saturation - Lumination * Saturation;
	}
	m1 = 2.0*hsl.z-m2;//(2.0 * Lumination - M2);

	return vec3(
		ColorTransform_HUE_to_RGB(m1,m2,hsl.x+1.0/3.0),
		ColorTransform_HUE_to_RGB(m1,m2,hsl.x),
		ColorTransform_HUE_to_RGB(m1,m2,hsl.x-1.0/3.0)
	);
}
