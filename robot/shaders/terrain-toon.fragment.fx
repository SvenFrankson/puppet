precision highp float;

// Lights
varying vec3 vPositionW;
varying vec3 vNormalW;
varying vec2 vUV;
varying vec4 vColor;

// Refs
uniform sampler2D colorTexture;
uniform vec3 lightInvDirW;

void main(void) {
    float ToonThresholds[5];
    ToonThresholds[0] = 0.8;
    ToonThresholds[1] = 0.6;
    ToonThresholds[2] = 0.4;
    ToonThresholds[3] = 0.1;
    ToonThresholds[4] = - 0.4;

    float ToonBrightnessLevels[6];
    ToonBrightnessLevels[0] = 1.0;
    ToonBrightnessLevels[1] = 0.84;
    ToonBrightnessLevels[2] = 0.68;
    ToonBrightnessLevels[3] = 0.52;
    ToonBrightnessLevels[4] = 0.36;
    ToonBrightnessLevels[5] = 0.2;

    // diffuse
    float ndl = dot(vNormalW, lightInvDirW);

    //vec4 color = vec4(mColor, 1.);
    float r = round(vColor.r * 2.) / 2.;
    float g = round(vColor.g * 2.) / 2.;
    float b = round(vColor.b * 1.) / 1.;
    vec4 color = texture2D(colorTexture, vUV) * vec4(r, g, b, 1.);

    if (ndl > ToonThresholds[0])
    {
        color *= ToonBrightnessLevels[0];
    }
    else if (ndl > ToonThresholds[1])
    {
        color *= ToonBrightnessLevels[1];
    }
    else if (ndl > ToonThresholds[2])
    {
        color *= ToonBrightnessLevels[2];
    }
    else if (ndl > ToonThresholds[3])
    {
        color *= ToonBrightnessLevels[3];
    }
    else if (ndl > ToonThresholds[4])
    {
        color *= ToonBrightnessLevels[4];
    }
    else
    {
        color *= ToonBrightnessLevels[5];
    }

    /*
    if (abs(vPositionW.x - round(vPositionW.x)) < 0.005) {
        color = vec3(0.);
    }
    if (abs(vPositionW.z - round(vPositionW.z)) < 0.005) {
        color = vec3(0.);
    }
    */
    
    gl_FragColor = vec4(color.rgb, 1.);
}