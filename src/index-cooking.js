import {createCanvas} from './utils/canvas.js';
import Haze from './haze.js';

// immediately-invoked async function to fetch the .frag file and then run your code
(async () => {
  // 1) fetch your fragment shader as text
  const resp   = await fetch('https://jackzhucu.github.io/HeatDistortionEffect/src/shaders/haze-cooking.frag');
  const shader = await resp.text();
  
  let canvas=document.querySelector('.background-canvas');
  
  let textureAlign={x:0.5,y:0.9};
  let textures=[
    {
      file:'https://cdn.jsdelivr.net/gh/JackZhuCU/HeatDistortionEffect/demo/img/cooking.jpg',
      name:'image',
      align:textureAlign,
      scale:{x:1,y:1}
    },
    {
      file:'https://cdn.jsdelivr.net/gh/JackZhuCU/HeatDistortionEffect/demo/img/cooking-blur.jpg',
      name:'blur',
      align:textureAlign,
      scale:{x:0.8,y:0.8}
    },
    {
      file:'https://cdn.jsdelivr.net/gh/JackZhuCU/HeatDistortionEffect/demo/img/cooking-maps.jpg',
      name:'maps',
      align:textureAlign,
      scale:{x:0.05,y:0.05},
    },
    {
      file:'https://cdn.jsdelivr.net/gh/JackZhuCU/HeatDistortionEffect/demo/img/noise.png',
      name:'noise',
      repeat:true,
      fill:false,
    },
  ];
  
  const haze = new Haze({
    canvas,
    shader,    // use the fetched text
    textures,
  });
  
  haze.gl.createUniform('1i','noiseSize',256);
  
  haze.addEventListener('predraw',function(){
    haze.gl.createUniform("2f","noiseR",Math.round(Math.random()*256),Math.round(Math.random()*256));
    haze.gl.createUniform("2f","noiseG",Math.round(Math.random()*256),Math.round(Math.random()*256));
    haze.gl.createUniform("2f","noiseB",Math.round(Math.random()*256),Math.round(Math.random()*256));
  })
  
  haze.gl.createUniform('2f','mouse',0.5,0.5);
  
  const smooth=(n=6)=>{
    let samples=[];
    return (v)=>{
      samples=samples.concat(v);
      if(samples.length>n){
        samples=samples.slice(samples.length-n,samples.length);
      }
      return samples.reduce((l,cur)=>(l+cur))/samples.length;
    }
  }
  
  const curve=(v,p=0.8)=>v==0?0:Math.pow(Math.abs(v),p)*(v/Math.abs(v));
  
  let smoothX=smooth();
  let smoothY=smooth();
  
  let isTouchDevice = 'ontouchstart' in document.documentElement;
  
  window.addEventListener('mousemove',function(event){
    if(!isTouchDevice){
      haze.gl.createUniform('2f','mouse',
        -curve(-1+((event.pageX/window.innerWidth)*2)),
        -curve(-1+((event.pageY/window.innerHeight)*2))
      );
    }
  });
  
  window.addEventListener('devicemotion',function(event){
    if(isTouchDevice){
      haze.gl.createUniform('2f','mouse',
        curve(smoothX(-event.accelerationIncludingGravity.x/10))*12,
        curve(smoothY(-event.accelerationIncludingGravity.y/10))*3
      );
    }
  });
  
  window.addEventListener('resize',updateSize);
  function updateSize(){
    let container=document.querySelector('.Background');
    let dimensions=container.getBoundingClientRect();
    haze.width=dimensions.width;
    haze.height=dimensions.height
    // haze.dpi=window.devicePixelRatio;
    haze.dpi=1;
    haze.gl.createUniform('1f','dpi',haze.dpi);
    haze.gl.createUniform('2f','resolution',haze.width*haze.dpi,haze.height*haze.dpi);
  }
  updateSize();
})();
