const scaleelement = document.getElementById("scale");
const output = document.getElementById("output");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const width = 500, height = 500;
var x = null,y = null,z = null;
var vertices = [];
var edges = [];
var scale = canvas.height/10;
var ctext = "";
var textout = "";
var commands = [];

const writebutton = document.getElementById("writebutton");
const textinput = document.getElementById("textinput");

// Settings
var whe = 0;
let intmode = "add";
let xangle = 0; let yangle = 0;
let xanglespeed = 0; let yanglespeed = 0;
let rotationspeed = 2.3;
let FOV = 60;

canvas.focus();

canvas.addEventListener("click", () => {
    canvas.focus();
})
canvas.addEventListener("keydown", (event) => {
    if(event.key=="Enter") {
        submit();
    } else if(event.key=="Backspace") {
        ctext= ctext.slice(0, -1);
    } else if(event.key=="Escape") {
        ctext="";
    } else if(event.key.length==1) {
        ctext+=event.key;
    }
})

textinput.addEventListener("keydown", function (event) {
    if(event.key=="Enter") {
        const text = textinput.value;
        textinput.value = "";
        read(text);
    }
})

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

setupcom();
function setupcom() {
    try {
        fetch("commands.json").then((res) => res.text()).then((text) => {
            commands = JSON.parse(text);
        }).catch((e) => console.error(e));   
        read();
    } catch(error) {
        console.error(error);
    }
}

function submit() {
    // word check
    if(ctext[0]==":") {
        if(ctext==":add") {
            intmode = "add";
            ctext = "";
        }
        if(ctext==":normal") {
            intmode = "";
            ctext = "";
        }
        if(ctext==":move") {
            intmode = "move";
            ctext = "";
        }
    }
    if(ctext[0]=="?") {
        if(ctext.slice(0,5)=="?vert") {
            textout = vertices[ctext.slice(5)];
            ctext="";
        }
    }
    
    if(ctext.slice(0, 2)=="y=") {
        genmatmesh(ctext);
    }
    for(let i = 0; i < commands.length; i++) {
        if(ctext==commands[i].name) {
            var F = new Function(commands[i].ex);
            return(F());
        }
    }
}

function genmatmesh(func) {
    let n = null;
    let res = .2;
    let amp = 1000;
    let limit1 = -amp/2;
    let limit2 = amp/2;
    for(let i = 0; i < func.length; i++) {
        if(func[i]=="x") {
            n = i;
            break;
        }
    }
    let coeff = ctext.slice(2, n);
    for(let i = 0; i < amp/res;i++) {
        let x1 = limit1 + res*i;
        vertices[i] = [x1, i, 0];
    }
    alert();
    ctext="";
}

function outputrend() {
    if(whe==0) {
        output.textContent = x;
    } else if (whe==1) {
        output.textContent = x+", "+y;
    } else if (whe==2) {
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
    element.setAttribute('download', "objectname.obj");

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

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

function readfile(path) {
    try {
        fetch(path).then((res) => res.text()).then((text) => {
            console.log(text);
            read(text);
        }).catch((e) => console.error(e));   
        read();
    } catch(error) {
        console.error(error);
    }
}

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

    // render text
    ctx.fillstyle="black";
    ctx.font="12px serif";
    ctx.fillText(intmode, canvas.width/2 - ctx.measureText(intmode).width/2, 12);


    // render textout
    ctx.fillstyle="black";
    ctx.font="12px serif";
    ctx.fillText(textout, canvas.width/2 - ctx.measureText(textout).width/2, canvas.height-12);
    // render ctext
    ctx.fillStyle="black";
    if(ctext!="") {
        ctx.font = "48px serif";
        ctx.fillText(ctext, canvas.width/2 - ctx.measureText(ctext).width/2, canvas.height/2);
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

function update(deltaTime) {
    xangle += xanglespeed*deltaTime;
    yangle += yanglespeed*deltaTime;
    //xangle = 3*Math.PI/6;
    //yangle = Math.PI/6;
}

requestAnimationFrame((timestamp) => {
    lastTime = timestamp;
    requestAnimationFrame(mainloop);
});