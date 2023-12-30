export const ZoomShader_frag: string = `precision mediump float;
uniform sampler2D u_sampler0;
varying vec2 v_tex_coord0;

void main(void) {
  gl_FragColor = texture2D(u_sampler0, v_tex_coord0); 
}`;
