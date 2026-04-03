const canvas = document.querySelector("canvas"),
toolBtns = document.querySelectorAll(".tool"),
fillColor = document.querySelector("#fill-color"),
sizeSlider = document.querySelector("#size-slider"),
colorBtns = document.querySelectorAll(".colors .option"),
colorPicker = document.querySelector("#color-picker"),
clearCanvas = document.querySelector(".clear-canvas"),
saveImg= document.querySelector(".save-img"),
savingTitle = document.querySelector("#saving-title").value,
ctx = canvas.getContext("2d");
let prevMouseX,prevMouseY,snapshot,
isDrawing = false,
selectedTool = "brush" ,
brushWidth = 4,
selectedColor = "black";
const setCanvasBackground = () =>{
  ctx.fillStyle= "#fff";
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = selectedColor;
}

window.addEventListener("load" , () =>{
  //setting canvas width
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  setCanvasBackground();

});
// draw  a rectangle 
const drawRect = (e) =>{
  if(!fillColor.checked){
    return ctx.strokeRect(e.offsetX,e.offsetY,prevMouseX-e.offsetX ,prevMouseY-e.offsetY);
  }
  ctx.fillRect(e.offsetX,e.offsetY,prevMouseX-e.offsetX ,prevMouseY-e.offsetY);
}
// draw the circle
const drawCircle= (e) =>{
  ctx.beginPath();
  //getting radius according to pointer
  let radius = Math.sqrt(Math.pow((prevMouseX-e.offsetX),2) *Math.pow((prevMouseY-e.offsetY),2) );
  ctx.arc(prevMouseX,prevMouseY,radius, 0 , 2 * Math.PI  );
  fillColor.checked ?ctx.fill() :ctx.stroke();
}
// draw thw triangle
const drawTriangle = (e) =>{
  ctx.beginPath();
  ctx.moveTo(prevMouseX,prevMouseY);//moving triangle according to mouse pointer
  ctx.lineTo(e.offsetX,e.offsetY);//creating first line 
  ctx.lineTo(prevMouseX*2-e.offsetX,e.offsetY);//creating bottom line
  ctx.closePath();//close the path to complete the circle
  fillColor.checked ? ctx.fill():ctx.stroke();
}
const startdraw = (e) =>{
  isDrawing = true;
  prevMouseX =e.offsetX;
  prevMouseY = e.offsetY;
  ctx.beginPath();//create new path
  ctx.lineWidth = brushWidth;
  ctx.strokeStyle = selectedColor;
  ctx.fillStyle= selectedColor;
  snapshot = ctx.getImageData(0,0,canvas.width,canvas.height);
}
const drawing = (e) =>{
  if(!isDrawing) return;
  ctx.putImageData(snapshot,0,0);

  if(selectedTool === "brush" || selectedTool === "eraser"){
    ctx.strokeStyle = selectedTool === "eraser" ? "#fff" : selectedColor;
    ctx.lineTo(e.offsetX , e.offsetY);//create line according to mouse pointer
  ctx.stroke();//drawing fiillling with the color

  }else if(selectedTool === "rectangle"){
    drawRect(e);
  }
  else if(selectedTool === "triangle"){
    drawTriangle(e);
  }
  else if(selectedTool === "circle"){
    drawCircle(e);
  }
  
}

toolBtns.forEach(btn => {
  btn.addEventListener("click" ,() =>{
    document.querySelector(".options .active").classList.remove("active");
    btn.classList.add("active");
    selectedTool = btn.id;
    console.log(btn.id);

  });
  
});
// setting the value of size slider
sizeSlider.addEventListener("change" ,() =>{
  brushWidth = sizeSlider.value;
});
// changing the color
colorBtns.forEach(btn =>{
  btn.addEventListener("click" ,() =>{
    btn.addEventListener("click" ,() =>{
      document.querySelector(".options .selected").classList.remove("selected");
      btn.classList.add("selected");
      
       selectedColor = window.getComputedStyle(btn).getPropertyValue("background-color");
  
    });
    
  });
});

// choosing colour from colourpicker
colorPicker.addEventListener("change", () =>{
  colorPicker.parentElement.style.background = colorPicker.value;
  colorPicker.parentElement.click();
});
// clearing the whole canvas
clearCanvas.addEventListener("click" , () =>{
  ctx.clearRect(0,0,canvas.width,canvas.height);
  setCanvasBackground();
});
/// saving the image in the system
saveImg.addEventListener('click' , () =>{
  const link = document.createElement("a");//creating an element 
  link.download = savingTitle;
  link.href = canvas.toDataURL();
  link.click();

});
canvas.addEventListener("mousedown",startdraw);
canvas.addEventListener("mousemove",drawing);

canvas.addEventListener("mouseup",() =>{
  isDrawing = false;
});