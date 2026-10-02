(() => {
  window.AditivoCamera = {
    layout(cards,width,height) {
      const step=Math.floor(Math.max(0,cards)/3);
      const growth=1+.08*step;
      return {zoom:1/(1+.08*Math.min(step,3)),left:width*(1-growth)/2,top:height*(1-growth)/2,width:width*growth,height:height*growth};
    },
    center(position,min,size,visible) {
      return Math.max(min+visible/2,Math.min(min+size-visible/2,position));
    },
    toWorld(x,y,camera,width,height) {
      return {x:camera.x+(x-width/2)/camera.zoom,y:camera.y+(y-height/2)/camera.zoom};
    },
  };
})();
