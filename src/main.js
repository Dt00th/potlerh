const input = document.getElementById("userinput");
const scaleelement = document.getElementById("scale");
const output = document.getElementById("output");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const width = 500, height = 500;
var x = null,y = null,z = null;
var vertices = [];
var edges = [];
var scale = 50;

// Cube
//var vertices=[[-1,-1,-1], [1,-1,-1], [1,1,-1], [-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
//var edges=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];

const writebutton = document.getElementById("writebutton");
const textinput = document.getElementById("textinput");

const FOV = 60;
function project(point) {
    const distance = 5;
    const zOffset = point[2] + distance;
    const stika = 600;

    return [stika*point[0]/FOV/zOffset, stika*point[1]/FOV/zOffset];
}
function rotate(p, anglex, angley) {
    var rotated = structuredClone(p);
    
    const cosy = Math.cos(angley);
    const siny = Math.sin(angley);
    const x1 = rotated[0]*cosy - rotated[2]*siny;
    const z1 = rotated[0]*siny + rotated[2]*cosy;
    rotated[0] = x1;
    rotated[2] = z1;

    const cosx = Math.cos(anglex);
    const sinx = Math.sin(anglex);
    const y2 = rotated[1]*cosx - rotated[2]*sinx;
    const z2 = rotated[1]*sinx + rotated[2]*cosx;
    rotated[1] = y2;
    rotated[2] = z2;
    return rotated;
}

input.addEventListener("keydown", function (event) {
    if(event.key=="Enter") {
        const text = input.value;
        input.value = "";
        stream(text);
    }
})

textinput.addEventListener("keydown", function (event) {
    if(event.key=="Enter") {
        const text = textinput.value;
        textinput.value = "";
        read(text);
    }
})

var n = 0;
function stream(num) {
    if(n==0) {
        x = num;
        n = 1;
        //output.value = x;
        render();
    } else if (n==1) {
        y = num;
        n = 2;
        //output.value = x+", "+y;
        render();
    } else if(n==2) {
        z = num;
        n = 0;
        submit([x, y, z]);
    }
}
function submit(point) {
    if(vertices[0]==null) {
        vertices[0] = point;
    } else {
        console.log(vertices[0]);
        vertices[vertices.length] = point;
    }
    x = null; y = null, z = null;
    render();
}

function outputrend() {
    if(n==0) {
        output.textContent = x;
    } else if (n==1) {
        output.textContent = x+", "+y;
    } else if (n==2) {
        output.textContent = x+", "+y+", "+z;
    }
}

function download() {
    var text="";
    var element = document.createElement('a');

    for(let i = 0; i < vertices.length; i++) {
        text += "v ";
        for(let j = 0; j < 3; j++) {
            text += vertices[i][j]+" ";
        }
        if(i != vertices.length-1) {
            text+="\n";
        }
    }
    for(let i = 0; i < edges.length; i++) {
        text += "\nl " + edges[i][0] + " " + edges[i][1]+" ";
    }
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', "cube.obj");

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

//read("ola eu sou gay");
function read(text) {
    let mode = null;
    let j = -1;
    let k = 0;
    let value = "";
    vertices = [];
    edges = [];
    for(let i = 0; i < text.length; i++) {
        if(text[i]=="v") {
            mode = "v";
        } else if (text[i]=="l") {
            if(mode=="v") {
                k = 0;
            }
            mode = "l";
        }
        if(text[i]==" ") {
            if(j>=0) {
                if(mode=="v"){
                    if(!vertices[k]) {
                        vertices[k] = [];
                    }
                    vertices[k][j] = value;
                } else if(mode=="l") {
                    if(!edges[k]) {
                        edges[k] = [];
                    }
                    edges[k][j] = value;
                }
            }
            value = "";
            j++;
        } else if(text[i] == "\n") {
            if(mode=="l") {
                console.log(text[i-1]);
            }
            j = -1;
            k++;
        } else {
            value += text[i];
        }
    }
}

let xangle = 0; yangle = 0;
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    outputrend();
    ctx.beginPath();
    ctx.fillStyle = "red";
    if(vertices[0]!=null){
        if(vertices[1]==null) {
            ctx.fillRect(scale*vertices[0][0], scale*vertices[0][1], 3, 3);
        } else {
            // Project
            var projp = [];
            for(let i = 0; i < vertices.length; i++) {
                const rotated = rotate(vertices[i], xangle, yangle);
                projp[i] = project(rotated);
            }

            // Draw edges
            for(let i = 0; i < edges.length; i++) {
                const p1 = projp[edges[i][0]];
                const p2 = projp[edges[i][1]];
                //console.log("i="+i+" p1: "+p1+"; p2: "+p2);
                ctx.moveTo(canvas.width/2+scale*p1[0], canvas.height/2+scale*p1[1]);
                ctx.lineTo(canvas.width/2+scale*p2[0], canvas.height/2+scale*p2[1]);
            }

            // Draw vertices
            for(let i = 0; i < projp.length; i++) {
                const p1 = projp[i];
                let psize = scale*.3;
                ctx.fillRect(canvas.width/2+scale*p1[0] - psize/2, canvas.height/2+scale*p1[1] - psize/2, psize, psize);
            }
        }
    }
    //ctx.moveTo(30, 50);
    //ctx.lineTo(150, 100);
    ctx.stroke();
}

let lastTime = 0;

function mainloop(currentTime) {
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    
    update(deltaTime);
    render();

    requestAnimationFrame(mainloop);
}

const sti = 2.3;
function update(deltaTime) {
    //xangle += sti*1*deltaTime;
    yangle += sti*.9*deltaTime;
    //xangle = 3*Math.PI/6;
    //yangle = Math.PI/6;
}

requestAnimationFrame((timestamp) => {
    lastTime = timestamp;
    requestAnimationFrame(mainloop);
});
