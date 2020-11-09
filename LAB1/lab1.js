var gl;

var canvas;

var shaderProgram;

var vertexPositionBuffer;

var vertexColorBuffer;

var rotAngle = 90.0;

/* Fungsi untuk membuat WebGL Context */
function createGLContext(canvas) {
  var names = ["webgl", "experimental-webgl"];
  var context = null;
  for (var i=0; i < names.length; i++) {
    try {
      context = canvas.getContext(names[i]);
    } catch(e) {}
    if (context) {
      break;
    }
  }
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}


function loadShaderFromDOM(id) {
    var shaderScript = document.getElementById(id);
    
    if (!shaderScript) {
        return null;
    }
    
    var shaderSource = "";
    var currentChild = shaderScript.firstChild;
    while (currentChild) {
        if (currentChild.nodeType == 3) { 
            shaderSource += currentChild.textContent;
        }
        currentChild = currentChild.nextSibling;
    }
    
    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }
    
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }
    
    return shader;
}

var mvMatrix = mat4.create();

/* Setup untuk fragment and vertex shaders */
function setupShaders() {
    vertexShader = loadShaderFromDOM("vs-src");
    fragmentShader = loadShaderFromDOM("fs-src");
    
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Failed to setup shaders");
    }
    
    gl.useProgram(shaderProgram);
    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    
    shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix")
}

/* Setup buffers dengan data */
function setupBuffers() {
    vertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    var triangleVertices = [
          // Huruf C

          -0.35,  0.50,  0.0,
          -0.60,  0.50,  0.0,
          -0.85, -0.50, 0.0,
       
          -0.35,  0.50,  0.0,
          -0.55, -0.30,  0.0,
          -0.85, -0.50, 0.0,
        
          -0.55, -0.30, 0.0,
          0.01,  -0.50,  0.0,
          -0.85, -0.50, 0.0,

          -0.55, -0.30, 0.0,
           0.01, -0.50, 0.0,
          -0.10, -0.30, 0.0,

          -0.35, 0.50, 0.0,
          -0.42, 0.30, 0.0,
          -0.20, 0.30, 0.0,

          -0.35, 0.50, 0.0,
          -0.20, 0.30, 0.0,
          -0.10, 0.50, 0.0,

          // Huruf E

          0.10, -0.50, 0.0,
          0.20, -0.30, 0.0,
          0.40, -0.50, 0.0,

          0.20, -0.30, 0.0,
          0.40, -0.50, 0.0,
          0.45, -0.30, 0.0,

          0.10, -0.50, 0.0,
          0.20, -0.30, 0.0,
         -0.13, -0.10, 0.0,

          0.20, -0.30, 0.0,
         -0.13, -0.10, 0.0,
          0.08, -0.10, 0.0,

         -0.35,  0.10, 0.0,
         -0.40, -0.10, 0.0,
          0.70, -0.10, 0.0,

          0.75,  0.10, 0.0,
         -0.35,  0.10, 0.0,
          0.70, -0.10, 0.0,

         -0.20,  0.10, 0.0,
         -0.01,  0.50, 0.0,
          0.01,  0.10, 0.0,

          0.01, 0.10, 0.0,
          0.11, 0.30, 0.0,
         -0.01, 0.50, 0.0,

         -0.01, 0.50, 0.0,
          0.11, 0.30, 0.0,
          0.58, 0.30, 0.0,

          -0.01, 0.50, 0.0,
          0.63, 0.50, 0.0,
          0.58, 0.30, 0.0,

    ];
    
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW);
    vertexPositionBuffer.itemSize = 3;
    vertexPositionBuffer.numberOfItems = 48;
    
    vertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    var colors = [

        0.000, 0.000, 0.000, 1.000,
        0.000, 0.000, 0.000, 1.000,
        0.000, 0.000, 0.000, 1.000,

        0.000, 0.000, 0.000, 1.000,
        0.000, 0.000, 0.000, 1.000,
        0.000, 0.000, 0.000, 1.000,

        0.000, 0.000, 0.000, 1.000,
        0.000, 0.000, 0.000, 1.000,
        0.000, 0.000, 0.000, 1.000,

        0.000, 0.000, 0.000, 1.000,
        0.000, 0.000, 0.000, 1.000,
        0.000, 0.000, 0.000, 1.000,

        0.000, 0.000, 0.000, 1.000,
        0.000, 0.000, 0.000, 1.000,
        0.000, 0.000, 0.000, 1.000,

        0.000, 0.000, 0.000, 1.000,
        0.000, 0.000, 0.000, 1.000,
        0.000, 0.000, 0.000, 1.000,

        1.000,0.963,0.007,1.000,
        1.000,0.963,0.007,1.000,
        1.000,0.963,0.007,1.000,

        1.000,0.963,0.007,1.000,
        1.000,0.963,0.007,1.000,
        1.000,0.963,0.007,1.000,

        1.000,0.963,0.007,1.000,
        1.000,0.963,0.007,1.000,
        1.000,0.963,0.007,1.000,

        1.000,0.963,0.007,1.000,
        1.000,0.963,0.007,1.000,
        1.000,0.963,0.007,1.000,

        1.000,0.963,0.007,1.000,
        1.000,0.963,0.007,1.000,
        1.000,0.963,0.007,1.000,

        1.000,0.963,0.007,1.000,
        1.000,0.963,0.007,1.000,
        1.000,0.963,0.007,1.000,

        1.000,0.963,0.007,1.000,
        1.000,0.963,0.007,1.000,
        1.000,0.963,0.007,1.000,

        1.000,0.963,0.007,1.000,
        1.000,0.963,0.007,1.000,
        1.000,0.963,0.007,1.000,

        1.000,0.963,0.007,1.000,
        1.000,0.963,0.007,1.000,
        1.000,0.963,0.007,1.000,

        1.000,0.963,0.007,1.000,
        1.000,0.963,0.007,1.000,
        1.000,0.963,0.007,1.000,

    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    vertexColorBuffer.itemSize = 4;
    vertexColorBuffer.numItems = 48;  
}

function degToRad(rotAngle)
{
  var pi = Math.PI;
  return rotAngle * (pi/180);
}

/* Fungsi Draw */
function draw() { 
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  
    
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    mat4.identity(mvMatrix);
    mat4.rotateX(mvMatrix, mvMatrix, degToRad(rotAngle));
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
    
    gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBuffer.numberOfItems);
}

function animate() {
    var timeNow = new Date().getTime();
    if (lastTime != 0) {
        var elapsedTime = timeNow - lastTime;
        rotAngle = (rotAngle+1.0) % 360;
    }
    
    var lastTime = timeNow;
}

function tick() {
    requestAnimFrame(tick);
    draw();
    animate();
}

/* Fungsi yang dipanggil setelah page diload */
function startup() {
    canvas = document.getElementById("myCanvas");
    gl = createGLContext(canvas);
    setupShaders(); 
    setupBuffers();
    gl.clearColor(0.819,0.858,0.875,1.000);
    gl.enable(gl.DEPTH_TEST);
    tick();
}
