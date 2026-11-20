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
var textlist = [];
var commands = [];
var commandhist = [];
var histpos = 0;

const writebutton = document.getElementById("writebutton");
const textinput = document.getElementById("textinput");

// Settings
let intmode = "normal";
let xangle = 0; let yangle = 0;
let xanglev = 0; let yanglev = 0;
let rotationspeed = .5;
let FOV = 60;
var drawv = 1;
// proj
let projd = 5;
const projscale = 600;

// init
function init() {
    canvas.focus();
    readfile("./assets/cube.obj");
    projd = 5;
    xangle = 0;yangle = 0;
    xanglev = 0; yanglev = 0;
}
init();

// Add mode
let addselect = [];

let moused = 0;
let mousebutton = 0;
let scroll = 0;
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
canvas.addEventListener("wheel", (event)=> {
    scroll = event.deltaY;
    textout = scroll;

    scrolltimeout = setTimeout(()=>{
        scroll = 0;
        textout = scroll;
    }, 80);
})
canvas.addEventListener("keydown", (event) => {
    if(intmode=="add") {
        addmode(event);
    } else {
        if(event.key=="Enter") {
            let a = submit();
            if(commandhist[commandhist.length-1]!=ctext) {
                commandhist.push(ctext);
                histpos = 0;
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
        } else if(event.key=="Alt") {
            mousebutton=1;
            moused=1;
        } else if(event.key=="ArrowDown") {
            if(histpos>0) {
                histpos--;
            }
            if(histpos==0) {
                ctext = "";
            } else {
                ctext = commandhist[commandhist.length-histpos];
            }
        } else if(intmode!="add") {
            if(event.key.length==1) {
                ctext+=event.key;
            }
        }
    }
})
textinput.addEventListener("keydown", function (event) {
    if(event.key=="Enter") {
        const text = textinput.value;
        textinput.value = "";
        read(text);
    }
})

function addmode(event) {
    if(event.key=="n") {
        intmode="normal";
        addselect[0] = null; addselect[1] = null;
    } else if(event.key=="m") {
        intmode="movev";
        addselect[0] = null; addselect[1] = null;
    } else if(event.key=="a") {
        if(addselect[0]!=null && addselect[1]!=null) {
            let p = [];
            p[0] = 1/2*(Number(vertices[addselect[0]][0]) + Number(vertices[addselect[1]][0]));
            p[1] = 1/2*(Number(vertices[addselect[0]][1]) + Number(vertices[addselect[1]][1]));
            p[2] = 1/2*(Number(vertices[addselect[0]][2]) + Number(vertices[addselect[1]][2]));
            let index = vertices.length;
            vertices[index] = structuredClone(p);
            edges[edges.length] = [addselect[0], index];
            edges[edges.length] = [addselect[1], index];
            addselect[0]=null; addselect[1]=null;
        }
    } else if(event.key=="c") {
        if(addselect[0]!=null && addselect[1]!=null) {
            edges[edges.length] = [addselect[0],addselect[1]];
            addselect[0]=null; addselect[1]=null;
        }
    } else if(event.key="x") {
        if(addselect[0]!=null && addselect[1]!=null) {
            for(let i = 0; i < edges.length; i++) {
                if(edges[i][0]==addselect[0] && edges[i][1]==addselect[1]) {
                    edges.splice(addselect, 1);
                    addselect[0]=null; addselect[1]=null;
                } else if(edges[i][0]==addselect[1]&&edges[i][1]==addselect[0]) {
                    edges.splice([addselect[1], addselect[0]], 1);
                    addselect[0]=null; addselect[1]=null;
                }
            }
        }
    } else if(event.key=="Escape") {
        addselect[0] = null; addselect[1] = null;
    } else if(event.key=="Backspace") {
        if(addselect[1]!=null) {
            addselect[1]=null;
        } else if(addselect[0]!=null) {
            addselect[0] = null; addselect[1] = null;
        }
    }
}

function project(point) {
    let zOffset = point[2] + projd;

    return [projscale*point[0]/FOV/zOffset, projscale*point[1]/FOV/zOffset, zOffset];
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
        fetch("src/commands.json").then((res) => res.text()).then((text) => {
            commands = JSON.parse(text);
        }).catch((e) => console.error(e));
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
            intmode = "normal";
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
            console.log(text);
            read(text);
        }).catch((e) => 
            console.error(e)
        );
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
    if(vertices!=structuredClone([]) && edges!=structuredClone([])){
        if(vertices[0]!=null && vertices[1]==null) {
            ctx.fillRect(scale*vertices[0][0], scale*vertices[0][1], 3, 3);
        } else {
            // Project
            projp = structuredClone([]);
            for(let i = 0; i < vertices.length; i++) {
                const rotated = rotate(vertices[i], xangle, yangle);
                let p = project(rotated);
                //if(p) {
                //    if((projd+p[2])>=0) {
                //        projp[i] = p;
                //    }
                //}
                projp[i]=p;
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
            if(drawv==1) {
                for(let i = 0; i < projp.length; i++) {
                    if(addselect) {
                        if(i==addselect[0] || i==addselect[1]) {
                            ctx.fillStyle="blue";
                        } else {
                            ctx.fillStyle="red";
                        }
                    }
                    
                    const p1 = projp[i];
                    ctx.fillRect(canvas.width/2+scale*p1[0] - vertexpsize/2, canvas.height/2+scale*p1[1] - vertexpsize/2, vertexpsize, vertexpsize);
                }
            }
            
            //caughtest
            let pt = project(caughtest);
            ctx.fillRect(canvas.width/2+scale*pt[0]-vertexpsize/2, canvas.height/2+scale*pt[1]-vertexpsize/2, vertexpsize, vertexpsize);
        }
    }

    // render text
    let fontsize1 = .03*canvas.height;
    let fontsize2 = .09*canvas.height;
    ctx.fillStyle="black"
    ctx.font=fontsize1+"px serif";
    ctx.fillText(intmode, canvas.width/2 - ctx.measureText(intmode).width/2, fontsize1);

    // render textlist
    ctx.fillStyle="black";
    ctx.font=fontsize1+"px serif";
    for(let i = 0; i < textlist.length; i++) {
        ctx.fillText(textlist, canvas.width-ctext.measureText(textlist), fontsize1*i);
    }

    // render textout
    ctx.fillStyle="black";
    ctx.font=fontsize1+"px serif";
    ctx.fillText(textout, canvas.width/2 - ctx.measureText(textout).width/2, canvas.height-fontsize1);
    // render ctext
    ctx.fillStyle="black";
    ctx.font = fontsize2+"px serif";
    ctx.fillText(ctext, canvas.width/2 - ctx.measureText(ctext).width/2, canvas.height/2);
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
    // update object rotation
    xangle += xanglev*deltaTime;
    yangle += yanglev*deltaTime;
    xangle%=Math.PI*2;
    yangle%=Math.PI*2;

    // rotate object
    if(mousebutton==1 && moused==1) {
        let deltamousef = .05;
        xangle+=deltamousey*deltamousef;
        if(xangle%2*Math.PI<Math.PI) {
            yangle+=deltamousex*deltamousef;
            //textout = "case 1: "+deltamousex+", "+deltamousey;
        } else if (xangle&2*Math.PI>=Math.PI) {
            yangle+=-deltamousex*deltamousef;
            //textout = "case 2:"+deltamousex+", "+deltamousey;
        }
    }

    // set distance
    projd += projd*scroll*.001;

    // Check for pointer-vertex collision and react accordingly
    if(moused==1 && mousebutton==0) {
        if(caught==null) {
            for(let i = 0; i < projp.length; i++) {
                p = {x:canvas.width/2+scale*projp[i][0],y:canvas.height/2+scale*projp[i][1]};
                if((mousex>p.x-vertexpsize/2 && mousex<p.x+vertexpsize/2) && (mousey>p.y-vertexpsize/2 && mousey<p.y+vertexpsize/2)) {
                    caught = i;
                    if(intmode!="normal") {
                        textout = "selected "+caught;
                    }
                }
            }
        } else if(caught!=null) {
            if(caughtx== null || caughty==null || caughtz==null) {
                caughtx = vertices[caught][0]; caughty= vertices[caught][1]; caughtz = vertices[caught][2];
            }
            if(caughtatx==null || caughtaty==null) {
                caughtatx = mousex;caughtaty= mousey;
            }
            if(intmode=="movev") {
                movepoint(caught);
            } else if(intmode=="add") {
                if(addselect[0]==null && addselect[1]==null) {
                    addselect[0] = caught;
                } else if(addselect[0]==null && addselect[1]==null) {

                } else if(addselect[0]==null && addselect[1]!=null) {

                } else if(addselect[0]!=null && addselect[1]==null) {
                    addselect[1] = caught;
                } else if(addselect[0]!=null && addselect[1]!=null) {
                    addselect[1] = caught;
                }
            }
        }
    } else {
        caught = null;
        caughtx = null; caughty = null; caughtz = null;
        caughtatx = null; caughtaty = null;
    }
}

let caughtx=null, caughty=null, caughtz=null;
let caughtest = [];
// TODO angles dont work correctly
function movepoint(index) {
    xanglev = 0; yanglev= 0;

    let pg = [caughtx, caughty, caughtz];
    let pr = {x:rotate(pg, xangle, yangle)[0], y:rotate(pg, xangle, yangle)[1], z:rotate(pg, xangle, yangle)[2]};
    let xr = pr.x;
    let yr = pr.y;
    let zr = pr.z;
    let xv = (caughtatx-canvas.width/2);
    let yv = (caughtaty-canvas.height/2);
    let xvf = (mousex-canvas.width/2);
    let yvf = (mousey-canvas.height/2);

    xrf = xvf*xr/xv;
    yrf = yvf*yr/yv;
    zrf = zr;
    
    let pgf = rotate([xrf, yrf, zrf], -xangle, -yangle);
    //caughtest = [xrf, yrf, zrf];
    //console.log("xgf:"+pgf[0]+", ygf:"+pgf[1]+", zgf:"+pgf[2]+"; xrf:"+xrf+", yrf:"+yrf+", zrf:"+zrf);
    vertices[index] = structuredClone(pgf);
}

//createsphere();
function createsphere() {
    let res = 1000;
    let r = 1;
    let rot = 30.1;
    edges = structuredClone([]);
    vertices = structuredClone([]);
    for(let i = 0; i < res; i++) {
        let beta = i*2*Math.PI/res;
        let x,y,z;
        x = Math.sin(beta)*Math.cos(2*Math.PI*beta)*r;
        y = Math.sin(beta)*Math.sin(2*Math.PI*beta)*r;
        z = Math.cos(beta)*r;
        vertices[i] = [x, y, z];
        console.log(vertices[i]);
    }
    for(let i = 0; i < res-1; i++) {
        edges[i] = [vertices[i], vertices[i+1]];
    }
}

function ccld(vres, cres, height, r) {
    vertices=structuredClone([]);
    edges = structuredClone([]);
    vertices[cres*cres] = [0, -height/2, 0];
    vertices[cres*cres+1] = [0, height/2, 0];
    for(let i = 0; i < vres; i++) {
        let y = i/vres*height-height/2;
        for(let j = 0; j < cres; j++) {
            let theta = j/cres*2*Math.PI;
            let x = Math.cos(theta)*r;
            let z = Math.sin(theta)*r;
            vertices[i*cres+j] = [x, y, z];
            edges[i*cres+j] = [i*cres+j, (i*cres+(j+1)%cres)];
            if(i+1<vres) {
                edges[vres*cres+i*cres+j] = [i*cres+j, (i+1)*cres+j];
            }
            if(i==0){
                edges[vres*cres*2-vres+j]=[j, cres*cres];
            }
            if(i==1) {
                edges[vres*cres*2-vres+cres*i+j]=[(vres-1)*cres+j, cres*cres+i];
            }
        }
    }
}

requestAnimationFrame((timestamp) => {
    lastTime = timestamp;
    requestAnimationFrame(mainloop);
});