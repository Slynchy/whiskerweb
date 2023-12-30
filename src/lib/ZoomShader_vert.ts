export const ZoomShader_vert: string = `attribute vec4 a_position;   
attribute vec2 a_tex_coord0;
varying vec2 v_tex_coord0;

uniform float uf_time;          
uniform mat4 um4_matrix;
uniform mat4 um4_pmatrix;
           
void main(void) {

  vec2 tex_coord = a_tex_coord0;

  // Adjust the amount
  // of zoom per frame.
  float f_time = uf_time * 0.75;

  if (tex_coord.s == 1.0){
   tex_coord.s -= f_time;
  }
  else {
   tex_coord.s += f_time;
  }

  if (tex_coord.t == 1.0){
   tex_coord.t -= f_time;
  }
  else {
   tex_coord.t += f_time;
  } 

  gl_Position = um4_pmatrix * um4_matrix * a_position;
  v_tex_coord0 =  tex_coord; 
}`;
