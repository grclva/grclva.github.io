var gl;

var canvas;

var shaderProgram;

var a_coords_loc;
var a_coords_buffer;
var a_normal_loc;
var a_normal_buffer;
var index_buffer;

var u_diffuseColor;
var u_specularColor;
var u_specularExponent;
var u_lightPosition;
var u_modelview;
var u_projection;
var u_normalMatrix;    

var projection = mat4.create();
var modelview;
var normalMatrix = mat3.create();

var rotator;

var lightPositions = [
    [0,0,0,1], [0,-1,0,0], [0,1,0,0], [-4,-6,2,0], [2,3,5,0]
];

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

/* Fungsi untuk membuat Bentuk Donat */
function uvDonut(outerRadius, innerRadius, slices, stacks) {
   outerRadius = outerRadius || 0.5;
   innerRadius = innerRadius || outerRadius/3;
   slices = slices || 32;
   stacks = stacks || 16;
   var vertexCount = (slices+1)*(stacks+1);
   var vertices = new Float32Array( 3*vertexCount );
   var normals = new Float32Array( 3* vertexCount );
   var texCoords = new Float32Array( 2*vertexCount );
   var indices = new Uint16Array( 2*slices*stacks*3 );
   var du = 2*Math.PI/slices;
   var dv = 2*Math.PI/stacks;
   var centerRadius = (innerRadius+outerRadius)/2;
   var tubeRadius = outerRadius - centerRadius;
   var i,j,u,v,cx,cy,sin,cos,x,y,z;
   var indexV = 0;
   var indexT = 0;
   for (j = 0; j <= stacks; j++) {
      v = -Math.PI + j*dv;
      cos = Math.cos(v);
      sin = Math.sin(v);
      for (i = 0; i <= slices; i++) {
         u = i*du;
         cx = Math.cos(u);
         cy = Math.sin(u);
         x = cx*(centerRadius + tubeRadius*cos);
         y = cy*(centerRadius + tubeRadius*cos);
         z = sin*tubeRadius;
         vertices[indexV] = x;
         normals[indexV++] = cx*cos;
         vertices[indexV] = y
         normals[indexV++] = cy*cos;
         vertices[indexV] = z
         normals[indexV++] = sin;
         texCoords[indexT++] = i/slices;
         texCoords[indexT++] = j/stacks;
      } 
   }
   var k = 0;
   for (j = 0; j < stacks; j++) {
      var row1 = j*(slices+1);
      var row2 = (j+1)*(slices+1);
      for (i = 0; i < slices; i++) {
          indices[k++] = row1 + i;
          indices[k++] = row2 + i + 1;
          indices[k++] = row2 + i;
          indices[k++] = row1 + i;
          indices[k++] = row1 + i + 1;
          indices[k++] = row2 + i + 1;
      }
   }
   return {
       vertexPositions: vertices,
       vertexNormals: normals,
       vertexTextureCoords: texCoords,
       indices: indices
   };
}

var objects = uvDonut(3,1,64,32);

/* Fungsi untuk Menggerakkan Objek */
function TrackballRotator(canvas, callback, viewDistance, viewpointDirection, viewUp) {
    var unitx = new Array(3);
    var unity = new Array(3);
    var unitz = new Array(3);
    var viewZ;
    var center;
    this.setView = function(viewDistance, viewpointDirection, viewUp) {
        unitz = (viewpointDirection === undefined)? [0,0,10] : viewpointDirection;
        viewUp = (viewUp === undefined)? [0,1,0] : viewUp;
        viewZ = viewDistance;
        normalize(unitz, unitz);
        copy(unity,unitz);
        scale(unity, unity, dot(unitz,viewUp));
        subtract(unity,viewUp,unity);
        normalize(unity,unity);
        cross(unitx,unity,unitz);
    }
    this.getViewMatrix = function() {
        var mat = [ unitx[0], unity[0], unitz[0], 0,
                unitx[1], unity[1], unitz[1], 0, 
                unitx[2], unity[2], unitz[2], 0,
                0, 0, 0, 1 ];
        if (center !== undefined) {
            var t0 = center[0] - mat[0]*center[0] - mat[4]*center[1] - mat[8]*center[2];
            var t1 = center[1] - mat[1]*center[0] - mat[5]*center[1] - mat[9]*center[2];
            var t2 = center[2] - mat[2]*center[0] - mat[6]*center[1] - mat[10]*center[2];
            mat[12] = t0;
            mat[13] = t1;
            mat[14] = t2;
        }
        if (viewZ !== undefined) {
            mat[14] -= viewZ;
        }
        return mat;
    }
    this.getViewDistance = function() {
        return viewZ;
    }
    this.setViewDistance = function(viewDistance) {
        viewZ = viewDistance;
    }
    this.getRotationCenter = function() {
        return (center === undefined) ? [0,0,0] : center;
    }
    this.setRotationCenter = function(rotationCenter) {
        center = rotationCenter;
    }
    this.setView(viewDistance, viewpointDirection, viewUp);
    canvas.addEventListener("mousedown", doMouseDown, false);
    canvas.addEventListener("touchstart", doTouchStart, false);
    function applyTransvection(e1, e2) {
        function reflectInAxis(axis, source, destination) {
            var s = 2 * (axis[0] * source[0] + axis[1] * source[1] + axis[2] * source[2]);
            destination[0] = s*axis[0] - source[0];
            destination[1] = s*axis[1] - source[1];
            destination[2] = s*axis[2] - source[2];
        }
        normalize(e1,e1);
        normalize(e2,e2);
        var e = [0,0,0];
        add(e,e1,e2);
        normalize(e,e);
        var temp = [0,0,0];
        reflectInAxis(e,unitz,temp);
        reflectInAxis(e1,temp,unitz);
        reflectInAxis(e,unitx,temp);
        reflectInAxis(e1,temp,unitx);
        reflectInAxis(e,unity,temp);
        reflectInAxis(e1,temp,unity);
    }
    var centerX, centerY, radius2;
    var prevx,prevy;
    var prevRay = [0,0,0];
    var dragging = false;
    function doMouseDown(evt) {
        if (dragging)
           return;
        dragging = true;
        centerX = canvas.width/2;
        centerY = canvas.height/2;
        var radius = Math.min(centerX,centerY);
        radius2 = radius*radius;
        document.addEventListener("mousemove", doMouseDrag, false);
        document.addEventListener("mouseup", doMouseUp, false);
        var box = canvas.getBoundingClientRect();
        prevx = evt.clientX - box.left;
        prevy = evt.clientY - box.top;
    }
    function doMouseDrag(evt) {
        if (!dragging)
           return;
        var box = canvas.getBoundingClientRect();
        var x = evt.clientX - box.left;
        var y = evt.clientY - box.top;
        var ray1 = toRay(prevx,prevy);
        var ray2 = toRay(x,y);
        applyTransvection(ray1,ray2);
        prevx = x;
        prevy = y;
        if (callback) {
            callback();
        }
    }
    function doMouseUp(evt) {
        if (dragging) {
            document.removeEventListener("mousemove", doMouseDrag, false);
            document.removeEventListener("mouseup", doMouseUp, false);
            dragging = false;
        }
    }
    function doTouchStart(evt) {
        if (evt.touches.length != 1) {
           doTouchCancel();
           return;
        }
        evt.preventDefault();
        var r = canvas.getBoundingClientRect();
        prevx = evt.touches[0].clientX - r.left;
        prevy = evt.touches[0].clientY - r.top;
        canvas.addEventListener("touchmove", doTouchMove, false);
        canvas.addEventListener("touchend", doTouchEnd, false);
        canvas.addEventListener("touchcancel", doTouchCancel, false);
        touchStarted = true;
        centerX = canvas.width/2;
        centerY = canvas.height/2;
        var radius = Math.min(centerX,centerY);
        radius2 = radius*radius;
    }
    function doTouchMove(evt) {
        if (evt.touches.length != 1 || !touchStarted) {
           doTouchCancel();
           return;
        }
        evt.preventDefault();
        var r = canvas.getBoundingClientRect();
        var x = evt.touches[0].clientX - r.left;
        var y = evt.touches[0].clientY - r.top;
        var ray1 = toRay(prevx,prevy);
        var ray2 = toRay(x,y);
        applyTransvection(ray1,ray2);
        prevx = x;
        prevy = y;
        if (callback) {
            callback();
        }
    }
    function doTouchEnd(evt) {
        doTouchCancel();
    }
    function doTouchCancel() {
        if (touchStarted) {
           touchStarted = false;
           canvas.removeEventListener("touchmove", doTouchMove, false);
           canvas.removeEventListener("touchend", doTouchEnd, false);
           canvas.removeEventListener("touchcancel", doTouchCancel, false);
        }
    }
    function toRay(x,y) {
                           
       var dx = x - centerX;
       var dy = centerY - y;
       var vx = dx * unitx[0] + dy * unity[0];
       var vy = dx * unitx[1] + dy * unity[1];
       var vz = dx * unitx[2] + dy * unity[2];
       var dist2 = vx*vx + vy*vy + vz*vz;
       if (dist2 > radius2) {
          return [vx,vy,vz];
       }
       else {
          var z = Math.sqrt(radius2 - dist2);
          return  [vx+z*unitz[0], vy+z*unitz[1], vz+z*unitz[2]];
        }
    }
    function dot(v,w) {
        return v[0]*w[0] + v[1]*w[1] + v[2]*w[2];
    }
    function length(v) {
        return Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
    }
    function normalize(v,w) {
        var d = length(w);
        v[0] = w[0]/d;
        v[1] = w[1]/d;
        v[2] = w[2]/d;
    }
    function copy(v,w) {
        v[0] = w[0];
        v[1] = w[1];
        v[2] = w[2];
    }
    function add(sum,v,w) {
        sum[0] = v[0] + w[0];
        sum[1] = v[1] + w[1];
        sum[2] = v[2] + w[2];
    }
    function subtract(dif,v,w) {
        dif[0] = v[0] - w[0];
        dif[1] = v[1] - w[1];
        dif[2] = v[2] - w[2];
    }
    function scale(ans,v,num) {
        ans[0] = v[0] * num;
        ans[1] = v[1] * num;
        ans[2] = v[2] * num;
    }
    function cross(c,v,w) {
        var x = v[1]*w[2] - v[2]*w[1];
        var y = v[2]*w[0] - v[0]*w[2];
        var z = v[0]*w[1] - v[1]*w[0];
        c[0] = x;
        c[1] = y;
        c[2] = z;
    }
}

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

    a_coords_loc =  gl.getAttribLocation(shaderProgram, "a_coords");
    gl.enableVertexAttribArray(a_coords_loc);

    a_normal_loc =  gl.getAttribLocation(shaderProgram, "a_normal");
    gl.enableVertexAttribArray(a_normal_loc);

    u_modelview = gl.getUniformLocation(shaderProgram, "modelview");
    u_projection = gl.getUniformLocation(shaderProgram, "projection");
    u_normalMatrix =  gl.getUniformLocation(shaderProgram, "normalMatrix");
    u_lightPosition=  gl.getUniformLocation(shaderProgram, "lightPosition");
    u_diffuseColor =  gl.getUniformLocation(shaderProgram, "diffuseColor");
    u_specularColor =  gl.getUniformLocation(shaderProgram, "specularColor");
    u_specularExponent = gl.getUniformLocation(shaderProgram, "specularExponent");

    gl.enable(gl.DEPTH_TEST);
    gl.uniform3f(u_specularColor, 1, 1, 1);
    gl.uniform4f(u_diffuseColor, 0, 0, 1, 1);
    gl.uniform1f(u_specularExponent, 10);
    gl.uniform4f(u_lightPosition, 0, 0, 0, 1);
}

/* Setup buffers dengan data */
function setupBuffers(modelData) {
    a_coords_buffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, a_coords_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexPositions, gl.STATIC_DRAW);

    a_normal_buffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, a_normal_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexNormals, gl.STATIC_DRAW);

    index_buffer = gl.createBuffer();
     
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,index_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, modelData.indices, gl.STATIC_DRAW);
}

/* Fungsi Draw */
function draw() {
    gl.clearColor(0.763,1.000,0.891,1.000);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, a_coords_buffer);
    gl.vertexAttribPointer(a_coords_loc, 3, gl.FLOAT, false, 0, 0);
     
    gl.bindBuffer(gl.ARRAY_BUFFER, a_normal_buffer);
    gl.vertexAttribPointer(a_normal_loc, 3, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,index_buffer);

    mat4.perspective(projection,Math.PI/5,1,10,20);
   
    modelview = rotator.getViewMatrix();
    
    mat3.normalFromMat4(normalMatrix, modelview);
    
    gl.uniformMatrix3fv(u_normalMatrix, false, normalMatrix);
    gl.uniformMatrix4fv(u_modelview, false, modelview );
    gl.uniformMatrix4fv(u_projection, false, projection );
   
    gl.drawElements(gl.TRIANGLES, objects.indices.length, gl.UNSIGNED_SHORT, 0);
}

/* Fungsi yang dipanggil setelah page diload */
function startup() {
    canvas = document.getElementById("mycanvas");
    gl = createGLContext(canvas);

    setupShaders();

    document.getElementById("light").value = "0";
    document.getElementById("light").onchange = function() {
        var val = Number(this.value);
        gl.uniform4fv(u_lightPosition, lightPositions[val]);
        draw();
    };
    document.getElementById("reset").onclick = function() {
        rotator.setView(15);
        draw();
    };
    setupBuffers(objects);
    rotator = new TrackballRotator(canvas, draw, 15);
    draw();
}