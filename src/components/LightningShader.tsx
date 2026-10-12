import React, { useRef, useEffect } from 'react';

const vertexShaderSource = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision highp float;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform float u_strike_time;

  // 2D Random
  float random(in vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  // 2D Noise
  float noise(in vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);

      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));

      vec2 u = f*f*(3.0-2.0*f);
      return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  float fbm(in vec2 st) {
      float value = 0.0;
      float amplitude = 0.5;
      for (int i = 0; i < 5; i++) {
          value += amplitude * noise(st);
          st *= 2.0;
          amplitude *= 0.5;
      }
      return value;
  }

  void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution.xy;
      uv = uv * 2.0 - 1.0;
      uv.x *= u_resolution.x / u_resolution.y;

      float time = u_time * 2.0; // speed up time for erratic lightning
      
      // Control strikes based on explicit trigger time
      float flash = 0.0;
      if (u_strike_time > 0.0 && u_strike_time < 0.8) {
          // Envelope: sharp attack, quick erratic decay
          float envelope = smoothstep(0.0, 0.05, u_strike_time) * smoothstep(0.8, 0.1, u_strike_time);
          // High frequency flicker to strobe
          float flicker = noise(vec2(u_time * 30.0, 0.0));
          flash = envelope * smoothstep(0.2, 0.8, flicker);
      }
      
      vec3 finalColor = vec3(0.0);
      
      if (flash > 0.0) {
          // Generate 3 main bolts
          for (int i = 0; i < 3; i++) {
              float offset = float(i) * 2.33;
              vec2 p = uv;
              
              // Angle the bolts a bit (originating mostly from top/sides)
              p.x += sin(time + offset) * 0.3;
              
              // Apply FBM to deform the bolt sharply
              float n = fbm(vec2(p.y * 4.0, time * 1.5 + offset));
              p.x += (n - 0.5) * 2.0;
              
              // Base distance
              float d = abs(p.x);
              
              // Pikachu electric yellow colors
              vec3 core = vec3(1.0, 1.0, 0.9);
              vec3 glow = vec3(1.0, 0.8, 0.0);
              
              // Intensity math for sharp core and soft glow
              float intensity = 0.005 / max(d, 0.001);
              float glowIntensity = 0.02 / max(d, 0.005);
              
              vec3 boltColor = (core * intensity + glow * glowIntensity) * flash;
              
              // Fade out at bottom
              boltColor *= smoothstep(-1.2, 1.0, p.y + 0.5);
              
              finalColor += boltColor;
          }
          
          // Ambient background flash to illuminate the screen
          finalColor += vec3(0.8, 0.7, 0.0) * flash * 0.15;
      }
      
      // Output color. Background is solid black (0,0,0,1) for mix-blend-screen
      gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export default function LightningShader({ lastStrikeTime }: { lastStrikeTime: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl');
    if (!gl) return;

    // Compile shader helper
    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fs = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Setup full screen quad (two triangles)
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const timeLocation = gl.getUniformLocation(program, 'u_time');
    const strikeTimeLocation = gl.getUniformLocation(program, 'u_strike_time');

    let animationFrameId: number;
    let startTime = Date.now();

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    window.addEventListener('resize', resize);
    resize();

    const render = () => {
      const currentTime = (Date.now() - startTime) / 1000.0;
      const strikeTime = lastStrikeTime > 0 ? (Date.now() - lastStrikeTime) / 1000.0 : -1.0;
      
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(timeLocation, currentTime);
      gl.uniform1f(strikeTimeLocation, strikeTime);

      // Disable alpha blending since we output black background
      // and use CSS mix-blend-screen on the canvas element.
      gl.disable(gl.BLEND);
      
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
      gl.deleteProgram(program);
    };
  }, [lastStrikeTime]);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 w-full h-full pointer-events-none mix-blend-screen opacity-80 z-[2]"
    />
  );
}
