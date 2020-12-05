var gl;

var canvas;

var shaderProgram;

var vertexPositionBuffer;

var vertexColorBuffer;

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

    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");

    shaderProgram.translation = gl.getUniformLocation(shaderProgram, "translation");
}

class AstrObject
{
    constructor(name, x, y, r, rotAngle, Red, Green, Blue, Alpha) {
        this.name = name;
        this.x = x;
        this.y = y;
        this.r = r;
        this.rotAngle = rotAngle;
        this.Red = Red;
        this.Green = Green;
        this.Blue = Blue;
        this.Alpha = Alpha;

        if(this.name == "Moon", "Phobos", "Deimos") {
            this.rotAngle2 = 0.0;
        }
    }

    setupBuffers() {
        vertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    
        /* Mengatur Posisi */
        const points = [
            this.x,  this.y
        ];

        /* Membuat Lingkaran Planet */
        for (var i = 0; i <= 100; i++){
            points.push(this.x + this.r * Math.cos(i * 2 * Math.PI/100));
            points.push(this.y + this.r * Math.sin(i * 2 * Math.PI/100));
        }
    
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
        vertexPositionBuffer.itemSize = 2;
        vertexPositionBuffer.numberOfItems = 102;
        
        /* Mengatur Pewarnaan */
        vertexColorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);

        var colors = [
            this.Red, this.Green, this.Blue, this.Alpha,
        ];
        
        for (i = 0; i <= 100; i++){
            colors.push(this.Red, this.Green, this.Blue, this.Alpha); 
        }
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
        vertexColorBuffer.itemSize = 4;
        vertexColorBuffer.numberOfItems = 102; 
    }
}

/* Input Posisi dan Warna */
var sun = new AstrObject("Sun", 0.0, 0.0, 0.1, 0.0, 1.000, 0.920, 0.001, 1.000);
var mercury = new AstrObject("Mercury", 0.4, 0.2, 0.04, 90.0, 0.716, 0.725, 0.563, 1.000);
var venus = new AstrObject("Venus", -0.6, 0.5, 0.06, 180.0, 0.725, 0.419, 0.015, 1.000);
var earth = new AstrObject("Earth", 0.05, -0.9, 0.08, 0.0, 0.009, 0.498, 0.835, 1.000);
var moon = new AstrObject("Moon", 0.1, -1.2, 0.03, 0.0, 0.579, 0.608, 0.640, 1.000);
var mars = new AstrObject("Mars", 1.2, 0.7, 0.07, 90.0, 1.000, 0.339, 0.243, 1.000);
var phobos = new AstrObject("Phobos", 1.25, 0.4, 0.03, 90.0, 0.865, 0.776, 0.725, 1.000);
var deimos = new AstrObject("Deimos", 1.30, 0.5, 0.02, 90.0, 0.865, 0.825, 0.469, 1.000);

/* Konversi Derajat ke Radian */
function degToRad(rotAngle)
{
  var pi = Math.PI;
  return rotAngle * (pi/180);
}

/* Fungsi Draw */
function draw() { 
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    mat4.identity(mvMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
    gl.uniform4f(shaderProgram.translation, 0.0, 0.0, 0.0, 0.6);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, vertexPositionBuffer.numberOfItems);
}

function animate() {
    var timeNow = new Date().getTime();
    if(lastTime != 0) {
        var elapsedTime = timeNow - lastTime;
        mercury.rotAngle = (mercury.rotAngle+0.1) % 360;
        venus.rotAngle = (venus.rotAngle+0.1) % 360;
        earth.rotAngle = (earth.rotAngle+0.1) % 360;
        moon.rotAngle = (moon.rotAngle+0.1) % 360;
        moon.rotAngle2 = (moon.rotAngle2+0.3) % 360;
        mars.rotAngle = (mars.rotAngle+0.1) % 360;
        phobos.rotAngle = (phobos.rotAngle+0.1) % 360;
        phobos.rotAngle2 = (phobos.rotAngle2+0.4) % 360;
        deimos.rotAngle = (deimos.rotAngle+0.1) % 360;
        deimos.rotAngle2 = (deimos.rotAngle2+0.5) % 360;
        
        mercury.x = mercury.x + 0.04 * Math.cos(mercury.rotAngle);
        mercury.y = mercury.y + 0.04 * Math.sin(mercury.rotAngle);

        venus.x = venus.x + 0.07 * Math.cos(venus.rotAngle);
        venus.y = venus.y + 0.07 * Math.sin(venus.rotAngle);

        earth.x = earth.x + 0.10 * Math.cos(earth.rotAngle);
        earth.y = earth.y + 0.10 * Math.sin(earth.rotAngle);

        moon.x = moon.x + 0.10 * Math.cos(moon.rotAngle);
        moon.y = moon.y + 0.10 * Math.sin(moon.rotAngle);

        moon.x = moon.x + 0.10 * Math.cos(moon.rotAngle2);
        moon.y = moon.y + 0.10 * Math.sin(moon.rotAngle2);

        mars.x = mars.x + 0.14 * Math.cos(mars.rotAngle);
        mars.y = mars.y + 0.14 * Math.sin(mars.rotAngle);
        
        phobos.x = phobos.x + 0.14 * Math.cos(phobos.rotAngle);
        phobos.y = phobos.y + 0.14 * Math.sin(phobos.rotAngle);

        phobos.x = phobos.x + 0.14 * Math.cos(phobos.rotAngle2);
        phobos.y = phobos.y + 0.14 * Math.sin(phobos.rotAngle2);

        deimos.x = deimos.x + 0.14 * Math.cos(deimos.rotAngle);
        deimos.y = deimos.y + 0.14 * Math.sin(deimos.rotAngle);

        deimos.x = deimos.x + 0.14 * Math.cos(deimos.rotAngle2);
        deimos.y = deimos.y + 0.14 * Math.sin(deimos.rotAngle2);
    }
    var lastTime = timeNow;
}

function tick() {
    setTimeout(() => { requestAnimFrame(tick) }, 100);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    sun.setupBuffers()
    draw();
    mercury.setupBuffers()
    draw();
    venus.setupBuffers()
    draw();
    earth.setupBuffers()
    draw();
    moon.setupBuffers()
    draw();
    mars.setupBuffers()
    draw();
    phobos.setupBuffers()
    draw();
    deimos.setupBuffers()
    draw();
    animate();
}

/* Fungsi yang dipanggil setelah page diload */
function startup() {
    canvas = document.getElementById("myCanvas");
    gl = createGLContext(canvas);
    setupShaders();
    gl.clearColor(0.154, 0.162, 0.170, 1.000);
    gl.enable(gl.DEPTH_TEST);
    tick();
}