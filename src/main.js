const scaleelement = document.getElementById("scale");
const output = document.getElementById("output");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const width = 500, height = 500;
var mousex, mousey;
var deltamousex, deltamousey;
var vertices = [];
var edges = [];
var scale = canvas.height/10;
var ctext = "";
var textout = "";
var commands = [];
var commandhist = [];
var histpos = 0;

const writebutton = document.getElementById("writebutton");
const textinput = document.getElementById("textinput");

// Settings
let intmode = "";
let xangle = 0; let yangle = 0;
let xanglev = 0; let yanglev = 0;
let rotationspeed = .5;
let FOV = 60;

canvas.focus();
readfile("../assets/cube.obj");

let moused = 0;
let mousebutton = 0;
const rect = canvas.getBoundingClientRect();
const scaleX = canvas.width/rect.width;
const scaleY = canvas.height/rect.height;
canvas.addEventListener("click", () => {
    canvas.focus();
})
canvas.addEventListener("mousedown", (event) => {
    mousebutton = event.button;
    moused = 1;
    mousex = scaleX*(event.clientX-rect.left); mousey = scaleY*(event.clientY-rect.top);
})
canvas.addEventListener("mouseup", (event) => {
    mousebutton = event.button;
    moused = 0;
    mousex = scaleX*(event.clientX-rect.left); mousey = scaleY*(event.clientY-rect.top);
})
canvas.addEventListener("mousemove", (event) => {
    mousex = scaleX*(event.clientX-rect.left); mousey = scaleY*(event.clientY-rect.top);
    deltamousex = event.movementX; deltamousey = event.movementY;
})
canvas.addEventListener("mousestop", ()=> {
    deltamousex = 0; deltamouseY = 0;
})
canvas.addEventListener("keydown", (event) => {
    if(event.key=="Enter") {
        if(intmode!="add") {
            let a = submit();
            if(commandhist[commandhist.length-1]!=ctext) {
                commandhist.push(ctext);
                histpos = 0;
            }
        }
    } else if(event.key=="Backspace") {
        ctext= ctext.slice(0, -1);
    } else if(event.key=="Escape") {
        ctext="";
    } else if(event.key=="ArrowUp") {
        if(commandhist.length>1) {
            if(histpos<commandhist.length) {
                histpos++;
            }
            ctext = commandhist[commandhist.length-histpos];
        }
    } else if(event.key=="ArrowDown") {
        if(histpos>0) {
            histpos--;
        }
        if(histpos==0) {
            ctext = "";
        } else {
            ctext = commandhist[commandhist.length-histpos];
        }
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

const projd = 5;
const projscale = 600;

function project(point) {
    let zOffset = point[2] + projd;

    return [projscale*point[0]/FOV/zOffset, projscale*point[1]/FOV/zOffset];
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
            return "add";
        }
        if(ctext==":normal") {
            intmode = "";
            ctext = "";
            return "normal";
        }
        if(ctext==":movev") {
            intmode = "movev";
            ctext = "";
            return "movev";
        }
    }
    if(ctext[0]=="?") {
        if(ctext.slice(0,5)=="?vert") {
            textout = vertices[ctext.slice(5)];
            ctext="";
            return "?vert";
        }
    }
    
    if(ctext.slice(0, 2)=="y=") {
        genmatmesh(ctext);
    }
    for(let i = 0; i < commands.length; i++) {
        var F;
        let expr = commands[i].cond;
        let cond = new Function(`return Boolean(${expr});`);
        if(commands[i].cond) {
            if(cond()) {
                F = new Function(commands[i].ex);
                F();
                return(commands[i].name);
            }
        } else if(ctext==commands[i].name) {
            F = new Function(commands[i].ex);
            F();
            return(commands[i].name);
        }
    }
    //return null;
    // lazy
    //var F = new Function(ctext);
    //ctext = "";
    //return(F());
}

//function genmatmesh(func) {
//    let n = null;
//    let res = .2;
//    let amp = 1000;
//    let limit1 = -amp/2;
//    let limit2 = amp/2;
//    for(let i = 0; i < func.length; i++) {
//        if(func[i]=="x") {
//            n = i;
//            break;
//        }
//    }
//    let coeff = ctext.slice(2, n);
//    for(let i = 0; i < amp/res;i++) {
//        let x1 = limit1 + res*i;
//        vertices[i] = [x1, i, 0];
//    }
//    alert();
//    ctext="";
//}

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
    vertices = structuredClone([]);
    edges = structuredClone([]);
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
                //console.log(text[i-1]);
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
            //console.log(text);
            read(text);
        }).catch((e) => 
            console.error(e)
        );   
        read();
    } catch(error) {
        console.error(error);
    }
}

var projp = [];
let vertexpsize = scale*.3;
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.fillStyle = "red";
    if(vertices[0]!=null){
        if(vertices[1]==null) {
            ctx.fillRect(scale*vertices[0][0], scale*vertices[0][1], 3, 3);
        } else {
            // Project
            projp = structuredClone([]);
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
                ctx.fillRect(canvas.width/2+scale*p1[0] - vertexpsize/2, canvas.height/2+scale*p1[1] - vertexpsize/2, vertexpsize, vertexpsize);
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

let caught = null;
let caughtatx = null, caughtaty = null;
function update(deltaTime) {
    xangle += xanglev*deltaTime;
    yangle += yanglev*deltaTime;
    //xangle = 3*Math.PI/6;
    //yangle = Math.PI/6;
    if(mousebutton==1 && moused==1) {
        let deltamousef = .05;
        xangle+=deltamousey*deltamousef;
        yangle+=deltamousex*deltamousef;
    }

    // Check for pointer-vertex collision and move accordingly
    if(moused==1 && intmode=="movev" && mousebutton==0) {
        if(caught==null) {
            for(let i = 0; i < projp.length; i++) {
                p = {x:canvas.width/2+scale*projp[i][0],y:canvas.height/2+scale*projp[i][1]};
                if((mousex>p.x-vertexpsize/2 && mousex<p.x+vertexpsize/2) && (mousey>p.y-vertexpsize/2 && mousey<p.y+vertexpsize/2)) {
                    textout = "caught "+i;
                    caught = i;
                }
            }
        } else if(caught!=null) {
            if(caughtx== null || caughty==null || caughtz==null) {
                caughtx = vertices[caught][0]; caughty= vertices[caught][1]; caughtz = vertices[caught][2];
            }
            if(caughtatx==null || caughtaty==null) {
                caughtatx = mousex;caughtaty= mousey;
            }
            movepoint(caught);
            console.log("running");
        }
    } else {
        caught = null;
        caughtx = null; caughty = null; caughtz = null;
        caughtatx = null; caughtaty = null;
    }
    //textout = caught;
}

let caughtx=null, caughty=null, caughtz=null;
function movepoint(index) {
    //vertices[index][0] = (mousex-canvas.width/2)/scale;
    //vertices[index][1] = (mousey-canvas.height/2)/scale;

    let pg = [caughtx, caughty, caughtz];
    let pr = {x:rotate(pg, xangle, yangle)[0], y:rotate(pg, xangle, yangle)[1], z:rotate(pg, xangle, yangle)[2]};
    let xr = pr.x;
    let xv = caughtatx-canvas.width/2;
    let yv = caughtaty-canvas.height/2;
    let xvr = mousex-canvas.width/2;
    let yvr = mousey-canvas.height/2;
    let zoffset = projscale*xr/FOV/xv;
    let xrf = xvr*FOV*zoffset/projscale;
    let yrf = yvr*FOV*zoffset/projscale;
    let zrf = pr.z;

    //simplif
    xrf = xvr*xr/xv;
    yrf = yvr*xr/xv;
    let pgf = rotate([xrf, yrf, zrf], -xangle, -yangle);
    vertices[index] = structuredClone(pgf);
}

//createsphere();
function createsphere() {
    let res = 1000;
    let r = 1;
    let rot = 30.1;
    for(let i = 0; i < res; i++) {
        let x, y, z;
        z = i/res -r/2; //Math.cos(i/res*Math.PI)*
        x =r/2*Math.sin(i/res*Math.PI)*Math.cos(i/res*Math.PI*rot); y = r/2*Math.sin(i/res*Math.PI)*Math.sin(i/res*Math.PI*rot);
        vertices[i] = [x, y, z];
        if(i+1!=res) {
            edges[i]= [i, i+1];
        }
    }
}

requestAnimationFrame((timestamp) => {
    lastTime = timestamp;
    requestAnimationFrame(mainloop);
});