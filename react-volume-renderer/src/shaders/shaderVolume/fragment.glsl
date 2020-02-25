varying vec2 vVec2TextureCoord;
uniform sampler2D meshRendererTex, meshRendererDepthTex, backgroundTex, foregroundTex, atlasTex, tfTex, silhouetteTex, silhouetteDepthTex, hologramTex, hologramDepthTex;
uniform float stepLength;
//uniform float alphaCorrection;
uniform int atlasColumns;
uniform int atlasRows;
uniform int atlasSliceNum;
uniform mat4 viewProjectionInverse; // restores view position from mesh renderer's depth texture
uniform vec3 volumeSize;
uniform vec3 backgroundColour;

uniform int channel0visible, channel1visible, channel2visible, channel3visible;


const int MAX_STEPS = 1024;

vec4 texture3D(sampler2D tex, vec3 pos) {
	pos = clamp(pos, 0.0, 1.0);

	float rslice = pos.z * float(atlasSliceNum-1);
	float slice = floor(rslice);
	float frac = rslice-slice;

	float col1 = mod(slice, float(atlasColumns));
	float row1 = floor(slice / float(atlasColumns));

	float offsetX1 = col1 / float(atlasColumns);
	float offsetY1 = row1 / float(atlasRows);

	vec2 atlasPos1 = vec2(
			offsetX1 + pos.x/float(atlasColumns),
			offsetY1 + pos.y/float(atlasRows)
			);

	vec4 s1 = texture2D(tex, atlasPos1);

	float col2 = mod(slice+1.0, float(atlasColumns));
	float row2 = floor((slice+1.0) / float(atlasColumns));

	float offsetX2 = col2 / float(atlasColumns);
	float offsetY2 = row2 / float(atlasRows);

	vec2 atlasPos2 = vec2(
			offsetX2 + pos.x/float(atlasColumns),
			offsetY2 + pos.y/float(atlasRows)
			);

	vec4 s2 = texture2D(tex, atlasPos2);
	return mix(s1, s2, frac);
}

vec4 shade(int channel, float value) {
	vec4 shaded = texture2D(tfTex, vec2(value, float(channel)/3.0));
	shaded.rgb *= shaded.a;
	return shaded;
}


void main( void ) {

	vec2 texc = vVec2TextureCoord; // range [0,1]

	vec3 v3_meshColour = texture2D(meshRendererTex, texc).rgb;
	float f_meshDepth = texture2D(meshRendererDepthTex, texc).r;
	vec2 v2_silhouette = texture2D(silhouetteTex, texc).rg; // x = sil grey value, y = depth
	float f_silhouetteDepth = texture2D(silhouetteDepthTex, texc).r;
	vec3 backPos = texture2D(backgroundTex, texc).xyz; // world space
	vec3 frontPos = texture2D(foregroundTex, texc).xyz; // world space

	vec3 v3_hologramColour = texture2D(hologramTex, texc).rgb;
	
	// TODO: use matVolume for scaling+transformation instead of volumeSize
	backPos /= volumeSize; // volume space [0,1]
	frontPos /= volumeSize; // volume space [0,1]

	/* gl_FragColor = vec4(
		frontPos,// * 0.01,
		1.0
	);
	return; */

	vec4 meshPosProjSpace = vec4(2.0*vec3(texc.x, texc.y, f_meshDepth)-1.0, 1.0); // ProjSpace is NDC
	vec4 meshPosWorldSpace = viewProjectionInverse * meshPosProjSpace; // project back into world pos
	meshPosWorldSpace /= meshPosWorldSpace.w; // homogenize
	meshPosWorldSpace.xyz = meshPosWorldSpace.xyz / volumeSize; // go from world pos to volume pos [0,1]

	vec4 silPosProjSpace = vec4(2.0*vec3(texc.x, texc.y, f_silhouetteDepth)-1.0, 1.0); // ProjSpace is NDC
	vec4 silPosWorldSpace = viewProjectionInverse * silPosProjSpace; // project back into world pos
	silPosWorldSpace /= silPosWorldSpace.w; // homogenize
	silPosWorldSpace.xyz = silPosWorldSpace.xyz / volumeSize; // go from world pos to volume pos [0,1]

	vec3 ray = backPos - frontPos;
	float rayLength = length(ray);

	vec3 rayToMesh = meshPosWorldSpace.xyz - frontPos;
	float f_rayToMeshLength = length(rayToMesh);
	vec3 rayToSilhouette = silPosWorldSpace.xyz - frontPos;
	float f_rayToSilhouetteLength = length(rayToSilhouette);

	vec3 step = (ray / rayLength) * stepLength;
	vec3 pos = frontPos;

	vec3 accumColor = vec3(0.0,0.0,0.0);
	float dist = 0.0;
	float accumAlpha = 0.0;
	float maxIntensity = 0.0;

	vec3 v3_opaqueMaterial = vec3(0.0); // this can be an opaque mesh or a silhouette

	for(int i=0; i<MAX_STEPS; i++) {
		vec4 sample = texture3D(atlasTex, pos);
		vec4 shaded = vec4(0.0, 0.0, 0.0, 0.0);
		float intensity = 0.0;

		if(channel0visible == 1) {
			vec4 shadeVal = shade(0, sample.x);
			shaded += shadeVal;
			intensity += (sample.x * sample.x * float(shadeVal.a > 0.0));
		}
		if(channel1visible == 1) {
			vec4 shadeVal = shade(1, sample.y);
			shaded += shadeVal;
			intensity += (sample.y * sample.y * float(shadeVal.a > 0.0));
		}
		if(channel2visible == 1) {
			vec4 shadeVal = shade(2, sample.z);
			shaded += shadeVal;
			intensity += (sample.z * sample.z * float(shadeVal.a > 0.0));
		}
		if(channel3visible == 1) {
			vec4 shadeVal = shade(3, sample.w);
			shaded += shadeVal;
			intensity += (sample.w * sample.w * float(shadeVal.a > 0.0));
		}


		vec3 color = shaded.rgb;
		float alpha = shaded.a;

		intensity = sqrt(intensity);

		float delta = 0.0;
		if(intensity > maxIntensity) {
			delta = intensity - maxIntensity;
			maxIntensity = intensity;
		}


		float beta = 1.0 - delta;

		accumColor = beta * accumColor + (1.0 - beta * accumAlpha) * color;
		accumAlpha = beta * accumAlpha + (1.0 - beta * accumAlpha) * alpha;


		if(accumAlpha > 0.99) {
			break;
		}

		
		if(dist >= rayLength) {
			// the ray accumulation has hit the background: mix with background colour
			accumColor = accumColor + (1.0-accumAlpha) * backgroundColour;
			accumAlpha = 1.0;
			break;
		}

		if(dist >= f_rayToSilhouetteLength && v2_silhouette.g == 1.0) {
			// NO early ray termination when we hit a silhouette -> we want it transparent -> put it on top with a lot of alpha!
			v2_silhouette.g = 0.5; // only do this once
			
			float s = v2_silhouette.r; // change to 1.0 - s iff background is dark
			float t = 1.0 - v2_silhouette.r; // transparency of the silhouette
			
			// assume bright background colour
			accumColor = vec3(s*0.01); // strong lines should be black, fade out to grey at the edges
			accumAlpha = 0.99*t; // We could change the overall transparency of the silhouette with a uniform!

			// super basic way to decide between black and white silhouette
			float averageRGB = (backgroundColour.r + backgroundColour.g + backgroundColour.b) / 3.0;
			//change silhouette colour based on background colour
			if (averageRGB < 0.5) {
				// dark background (only tested with black)
				s = 1.0 - s; // invert silhouette lines (strong=white, fades out to grey)
				accumColor = vec3(s*1.3); // just a bit more white
			}
		}
		if(dist >= f_rayToMeshLength) {
			// early ray termination when we hit an opaque mesh
			v3_opaqueMaterial = v3_meshColour;
			break;
		}

		pos += step;
		dist += stepLength;
	}

	vec4 volRendererCol = vec4(accumColor, accumAlpha);
	
	// composite volume and meshColour
	vec4 v4_volmesh = vec4(
		volRendererCol.rgb * volRendererCol.w + v3_opaqueMaterial * (1.0-volRendererCol.w) + v3_hologramColour,
		1.0
	);

	gl_FragColor = v4_volmesh;
}
