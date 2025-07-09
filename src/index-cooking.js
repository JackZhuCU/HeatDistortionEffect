import {createCanvas} from './utils/canvas.js';
import Haze from './haze.js';

(async () => {
  // 1) fetch both shaders in parallel
  const [fragResp, vertResp] = await Promise.all([
    fetch('https://jackzhucu.github.io/HeatDistortionEffect/src/shaders/haze-cooking.frag'),
    fetch('https://jackzhucu.github.io/HeatDistortionEffect/src/shaders/simple.vert')
  ]);
  const [shader, vertexShader] = await Promise.all([fragResp.text(), vertResp.text()]);

  const canvas = document.querySelector('.background-canvas');

  const textureAlign = { x: 0.5, y: 0.9 };
  const textures = [
    {
      file: 'https://cdn.jsdelivr.net/gh/JackZhuCU/HeatDistortionEffect/demo/img/cooking.jpg',
      name: 'image',
      align: textureAlign,
      scale: { x: 1, y: 1 }
    },
    {
      file: 'https://cdn.jsdelivr.net/gh/JackZhuCU/HeatDistortionEffect/demo/img/cooking-blur.jpg',
      name: 'blur',
      align: textureAlign,
      scale: { x: 0.8, y: 0.8 }
    },
    {
      file: 'https://cdn.jsdelivr.net/gh/JackZhuCU/HeatDistortionEffect/demo/img/cooking-maps.jpg',
      name: 'maps',
      align: textureAlign,
      scale: { x: 0.05, y: 0.05 }
    },
    {
      file: 'https://cdn.jsdelivr.net/gh/JackZhuCU/HeatDistortionEffect/demo/img/noise.png',
      name: 'noise',
      repeat: true,
      fill: false
    }
  ];

  // 2) create Haze with both shaders
  const haze = new Haze({
    canvas,
    shader,         // your fragment shader text
    vertexShader,   // your vertex shader text
    textures
  });

  haze.gl.createUniform('1i', 'noiseSize', 256);

  haze.addEventListener('predraw', () => {
    haze.gl.createUniform(
      '2f', 'noiseR',
      Math.round(Math.random() * 256),
      Math.round(Math.random() * 256)
    );
    haze.gl.createUniform(
      '2f', 'noiseG',
      Math.round(Math.random() * 256),
      Math.round(Math.random() * 256)
    );
    haze.gl.createUniform(
      '2f', 'noiseB',
      Math.round(Math.random() * 256),
      Math.round(Math.random() * 256)
    );
  });

  haze.gl.createUniform('2f', 'mouse', 0.5, 0.5);

  const smooth = (n = 6) => {
    let samples = [];
    return (v) => {
      samples = samples.concat(v);
      if (samples.length > n) {
        samples = samples.slice(samples.length - n);
      }
      return samples.reduce((a, b) => a + b) / samples.length;
    };
  };

  const curve = (v, p = 0.8) =>
    v === 0 ? 0 : Math.pow(Math.abs(v), p) * (v / Math.abs(v));

  const smoothX = smooth();
  const smoothY = smooth();
  const isTouchDevice = 'ontouchstart' in document.documentElement;

  window.addEventListener('mousemove', (e) => {
    if (!isTouchDevice) {
      haze.gl.createUniform(
        '2f',
        'mouse',
        -curve(-1 + (e.pageX / window.innerWidth) * 2),
        -curve(-1 + (e.pageY / window.innerHeight) * 2)
      );
    }
  });

  window.addEventListener('devicemotion', (e) => {
    if (isTouchDevice) {
      haze.gl.createUniform(
        '2f',
        'mouse',
        curve(smoothX(-e.accelerationIncludingGravity.x / 10)) * 12,
        curve(smoothY(-e.accelerationIncludingGravity.y / 10)) * 3
      );
    }
  });

  window.addEventListener('resize', updateSize);
  function updateSize() {
    const container = document.querySelector('.Background');
    const { width, height } = container.getBoundingClientRect();
    haze.width = width;
    haze.height = height;
    haze.dpi = 1; // or window.devicePixelRatio
    haze.gl.createUniform('1f', 'dpi', haze.dpi);
    haze.gl.createUniform('2f', 'resolution', width * haze.dpi, height * haze.dpi);
  }
  updateSize();
})();
