import { useEffect, useRef, useState } from "react";

// Add a lightweight liquid pass over the existing transparent orange artwork.
const vertexSource = `
  attribute vec2 position;
  varying vec2 uv;
  void main() { uv = position * .5 + .5; gl_Position = vec4(position, 0., 1.); }
`;
const fragmentSource = `
  precision mediump float;
  uniform sampler2D artwork;
  uniform float seconds;
  varying vec2 uv;
  float circle(vec2 p, vec2 center, float radius) {
    return 1. - smoothstep(radius * .55, radius, length(p - center));
  }
  float fruit(vec2 p, vec2 center, vec2 radius) {
    return 1. - smoothstep(.85, 1.15, length((p - center) / radius));
  }
  void main() {
    vec4 original = texture2D(artwork, uv);
    vec2 p = vec2(uv.x, 1. - uv.y);
    float keepFruit = max(
      max(fruit(p, vec2(.55,.175), vec2(.155,.10)),
          fruit(p, vec2(.55,.38), vec2(.16,.095))),
      max(fruit(p, vec2(.54,.55), vec2(.15,.095)),
          fruit(p, vec2(.55,.75), vec2(.15,.105))));
    float gold = smoothstep(.72,.95,original.r)
      * smoothstep(.48,.76,original.g)
      * (1. - smoothstep(.55,.85,original.b))
      * smoothstep(.02,.35,original.r - original.g * .8);
    float liquid = gold * (1. - keepFruit) * original.a;
    // Positive phase velocity moves the refraction and glints DOWN the image.
    float phase = p.y * 67. - seconds * 1.9;
    float ripple = sin(phase + sin(p.x * 39.) * .65);
    vec2 offset = vec2(sin(phase * .7 + p.x * 42.) * .003,
                      ripple * .007) * liquid;
    vec4 flowing = texture2D(artwork, uv + offset);
    vec4 color = mix(original, flowing, liquid * .9);
    float glint = pow(max(0.,sin(phase + p.x * 23.)), 10.) * liquid;
    color.rgb += vec3(.10,.075,.025) * glint;

    float drops = 0.;
    drops += circle(p, vec2(.40 + sin(seconds * 1.7) * .025,
      fract(seconds * .12) * .72 + .15), .012);
    drops += circle(p, vec2(.62 + sin(seconds * 1.35 + 2.) * .035,
      fract(seconds * .16 + .28) * .7 + .12), .009);
    drops += circle(p, vec2(.53 + sin(seconds * 1.1 + 4.) * .04,
      fract(seconds * .2 + .58) * .62 + .2), .006);
    float splash = max(
      circle(p, vec2(.47, .86 + sin(seconds * 2.) * .015), .035),
      circle(p, vec2(.58, .72 + sin(seconds * 1.7 + 1.) * .02), .025)
    );
    float liquidAlpha = max(drops * .85, splash * .48);
    vec3 juice = vec3(1., .42, .035);
    float shine = max(circle(p, vec2(.40 + sin(seconds * 1.7) * .025,
      fract(seconds * .12) * .72 + .15), .003),
      circle(p, vec2(.62 + sin(seconds * 1.35 + 2.) * .035,
        fract(seconds * .16 + .28) * .7 + .12), .002));
    color.rgb = mix(color.rgb, juice, liquidAlpha);
    color.rgb += vec3(1., .78, .35) * shine * .8;
    color.a = max(color.a, liquidAlpha);
    gl_FragColor = color;
  }
`;

export default function CitrusCascade() {
  const canvasRef = useRef(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const canvas = canvasRef.current;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const gl = canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: false,
    });
    if (!gl) return;
    let disposed = false;
    let frame = 0;
    let visible = true;
    let loaded = false;
    let rendered = false;
    const shaders = [];
    function compile(type, source) {
      const shader = gl.createShader(type);
      if (!shader) return null;
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
    }
    const vertex = compile(gl.VERTEX_SHADER, vertexSource);
    const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) {
      shaders.forEach((shader) => gl.deleteShader(shader));
      if (program) gl.deleteProgram(program);
      return;
    }
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      shaders.forEach((shader) => gl.deleteShader(shader));
      gl.deleteProgram(program);
      return;
    }
    gl.useProgram(program);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const texture = gl.createTexture();
    const time = gl.getUniformLocation(program, "seconds");
    const origin = performance.now();
    function draw(now) {
      frame = 0;
      if (disposed || !loaded || motion.matches || !visible || document.hidden)
        return;
      gl.uniform1f(time, (now - origin) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (!rendered) {
        rendered = true;
        setReady(true);
      }
      frame = requestAnimationFrame(draw);
    }
    function resume() {
      cancelAnimationFrame(frame);
      frame = 0;
      rendered = false;
      setReady(false);
      if (loaded && !motion.matches && visible && !document.hidden)
        frame = requestAnimationFrame(draw);
    }
    const image = new Image();
    image.onload = () => {
      if (disposed) return;
      canvas.width = 512;
      canvas.height = 768;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image,
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      loaded = true;
      resume();
    };
    image.src = "/images/orange-cascade.png";
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      resume();
    });
    observer.observe(canvas);
    motion.addEventListener("change", resume);
    document.addEventListener("visibilitychange", resume);
    const lost = (event) => {
      event.preventDefault();
      cancelAnimationFrame(frame);
      setReady(false);
    };
    canvas.addEventListener("webglcontextlost", lost);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      image.onload = null;
      observer.disconnect();
      motion.removeEventListener("change", resume);
      document.removeEventListener("visibilitychange", resume);
      canvas.removeEventListener("webglcontextlost", lost);
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      shaders.forEach((shader) => gl.deleteShader(shader));
    };
  }, []);
  return (
    <div className={`citrus-chain ${ready ? "liquid-ready" : ""}`}>
      <img
        src="/images/orange-cascade.png"
        alt="Fresh orange halves with glossy juice streams, droplets, and sparkling splashes"
        width="1024"
        height="1536"
        fetchPriority="high"
      />
      <canvas ref={canvasRef} aria-hidden="true" />
    </div>
  );
}
