//html
const scaleelement = document.getElementById("scale");
const textoutputelement = document.getElementById("textoutput");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const width = 500, height = 500;
const writebutton = document.getElementById("writebutton");
const textinput = document.getElementById("textinput");
const rect = canvas.getBoundingClientRect();
const scaleX = canvas.width/rect.width;
const scaleY = canvas.height/rect.height;
var commands = [];

// display
var ctext = "";
var textout = "";
var textoutput = "";
var textlist = [];


// World
var vertices = [];
var edges = [];
// Interact-variables
let addselect = [];
var commandhist = [];
var histpos = 0;
let caught = null;
let caughtx=null, caughty=null, caughtz=null;
let caughtatx = null, caughtaty = null;
let deltacaught = null;

// Settings
let theme = 0;
let intmode = "normal";
let showind = -1;
let xangle = 0; let yangle = 0;
let xanglev = 0; let yanglev = 0;
let rotationspeed = .5;
let FOV = 60;
var drawv = 1;
let projd = 5;
const projscale = 600;
let deltamousef = .04;
var scale = canvas.height/10;

// keys
var epressed = 0;
var mousex, mousey;
var deltamousex, deltamousey;
var control = 0;
let moused = 0;
let mousebutton = 0;
let scroll = 0;
let ArrowDown = 0, ArrowUp = 0, ArrowLeft = 0, ArrowRight = 0;

// init
function init() {
    if(theme==0) {
        document.body.style.backgroundColor = "black";
    } else if(theme==1) {
        document.body.style.backgroundColor = "white";
    }
    canvas.focus();
    addselect = [];
    vertices = []; edges = [];
    //readfile("./assets/cube.obj");
    readfile("./assets/tcube.obj")
    //ccld(30,30,0,1);
    //gensphere(1, 100, 24);
    projd = 5;
    xangle = 0;yangle = 0;
    xanglev = 0; yanglev = 0;
}
init();

// Event listeners
canvas.addEventListener("click", () => {
    canvas.focus();
})
canvas.addEventListener("mousedown", (event) => {
    mousebutton = event.button;
    moused = 1;
    mousex = scaleX*(event.clientX-rect.left); mousey = scaleY*(event.clientY-rect.top);
})
canvas.addEventListener("mouseup", (event) => {
    mousebutton = null;
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
    //textout = scroll;

    scrolltimeout = setTimeout(()=>{
        scroll = 0;
        //textout = scroll;
    }, 80);
})
canvas.addEventListener("keydown", (event) => {
    if(event.key=="Control") {
        control = 1;
    }
    if(event.key=="e" && intmode!="normal") {
        epressed = 1;
    }
    if(event.key=="ArrowUp") {
        ArrowUp = 1;
    }
    if(event.key=="ArrowDown") {
        ArrowDown = 1;
    }
    if(event.key=="ArrowLeft") {
        ArrowLeft = 1;
    }
    if(event.key=="ArrowRight") {
        ArrowRight = 1;
    }
    processinput(event);
})
canvas.addEventListener("keyup", (event) => {
    if(event.key="Control") {
        control = 0;
    }
    if(event.key=="e") {
        epressed = 0;
    }
    if(event.key=="ArrowUp") {
        ArrowUp = 0;
    }
    if(event.key=="ArrowDown") {
        ArrowDown = 0;
    }
    if(event.key=="ArrowLeft") {
        ArrowLeft = 0;
    }
    if(event.key=="ArrowRight") {
        ArrowRight = 0;
    }
})
textinput.addEventListener("keydown", function (event) {
    if(event.key=="Enter" && intmode=="normal") {
        const text = textinput.value;
        textinput.value = "";
        read(text);
    }
})
function sel(index) {
    if(index>=vertices.length) {
        return 0;
    }
    for(let i = 0; i <addselect.length;i++) {
        if(index==addselect[i]) {
            addselect.splice(i, 1);
            return 0;
        }
    }
    addselect.push(index);
}
function processinput(event) {
    if(event.key=="Escape") {
        addselect=structuredClone([]);
    }
    if(intmode=="normal") {
        normalmode(event);
    } else if(intmode=="interact") {
        interactmode(event);
    }
}

function normalmode(event) {
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
        // no mouse settings
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
    } else {
        if(event.key.length==1) {
            ctext+=event.key;
        }
    }
}

function interactmode(event) {
    let deltarotf = 2*deltamousef;
    if(ArrowUp==1) {
        xangle+=deltarotf;
    }
    if(ArrowDown==1) {
        xangle-=deltarotf;
    }
    if(ArrowLeft==1) {
        if(xangle%2*Math.PI<Math.PI) {
            yangle+=deltarotf;
            //textout = "case 1: "+deltamousex+", "+deltamousey;
        } else if (xangle&2*Math.PI>=Math.PI) {
            yangle+=-deltarotf;
            //textout = "case 2:"+deltamousex+", "+deltamousey;
        }
    }
    if(ArrowRight==1) {
        if(xangle%2*Math.PI<Math.PI) {
            yangle+=-deltarotf;
            //textout = "case 1: "+deltamousex+", "+deltamousey;
        } else if (xangle&2*Math.PI>=Math.PI) {
            yangle+=deltarotf;
            //textout = "case 2:"+deltamousex+", "+deltamousey;
        }
    }
    
    textout = "";
    if(control==0) {
        if(event.key==" ") {
            intmode="normal";
            addselect[0] = null; addselect[1] = null;
        } else if(event.key=="a") {
            // add point in the middle of the addselected
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
            // connect addselected
            if(addselect[0]!=null && addselect[1]!=null) {
                edges.push(addselect);
                addselect=[];
            }
        } else if(event.key=="x") {
            // cut addselected
            if(addselect.length==2) {
                if(addselect[0]!=null && addselect[1]!=null) {
                    for(let i = 0; i < edges.length; i++) {
                        if(edges[i][0]==addselect[0] && edges[i][1]==addselect[1]) {
                            edges.splice(i, 1);
                            addselect = [];
                        } else if(edges[i][0]==addselect[1]&&edges[i][1]==addselect[0]) {
                            edges.splice(i, 1);
                            addselect=[];
                        }
                    }
                }
            } else {
                addselect= [];
            }
        }  else if(event.key=="r") {
            // remove addselected
            for(let i = 0; i < addselect.length; i++) {
                for(let j = 0; j < addselect.length; j++) {
                    if(edges[j][0]==addselect[i]) {
                        edges[j] = [];
                    } else if(edges[j][1]==addselect[i]) {
                        edges[j] = [];
                    }
                }
            }
            console.log(edges);
            let f= 0;
            for(let i = 0; i< 1000; i++) {
                if(edges[i]===undefined || edges[i].length==0) {
                    edges.splice(f,1);
                    f+=1;
                }
                if(f==edges.length) {
                    break;
                }
            }
            console.log(edges);

            for(let i = 0; i < addselect.length; i++) {
                vertices[addselect[i]]=[];
            }
            let n = 0;
            for(let i = 0; i < 1000; i++) {
                if(vertices[n].length==0) {
                    vertices.splice(n,1);
                } else {
                    n+=1;
                }
                if(n==vertices.length) {
                    break;
                }
            }
            addselect=[];
        } else if(event.key=="1") {
            // top
            xangle=0;
            yangle=0;
        } else if(event.key=="2") {
            // front
            xangle=Math.PI/2;
            yangle=0;
        } else if(event.key=="Backspace") {
            addselect.splice(addselect.length-1,1);
        }
    } else if(control==1) {
        if(key.event=="a") {
            alert("foif");
        }
        if(moused == 1) {
            textout = "1";
        }
    }
}

setupcom();
function setupcom() {
    try {
        fetch("./src/commands.json").then((res) => res.text()).then((text) => {
            commands = JSON.parse(text);
        }).catch((e) => console.error(e));
    } catch(error) {
        console.error(error);
    }
}

function submit() {
    // word check
    if(ctext[0]==":") {
        if(ctext==":interact") {
            intmode = "interact";
            ctext = "";
            return "interact";
        }
        if(ctext==":normal") {
            intmode = "normal";
            ctext = "";
            return "normal";
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

function submitdownload() {
    textoutput = "";
    for(let i = 0; i < vertices.length; i++) {
        textoutput += "v ";
        for(let j = 0; j < 3; j++) {
            textoutput += vertices[i][j]+" ";
        }
        if(i != vertices.length-1) {
            textoutput+="\n";
        }
    }
    for(let i = 0; i < edges.length; i++) {
        for(let j = 0; j < edges[i].length; j++) {
            textoutput += "\nl " + edges[i][0] + " " + edges[i][1]+" ";
        }
    }
}

function download() {
    var element = document.createElement('a');

    
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(textoutput));
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
    
    let vertlen=0, edlen=0;
    if(vertices) {
        vertlen= vertices.length;
    }
    if(edges) {
        edlen = edges.length;
    }
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
                    if(!vertices[vertlen+k]) {
                        vertices[vertlen+k] = [];
                    }
                    vertices[vertlen+k][j] = value;
                } else if(mode=="l") {
                    if(!edges[edlen+k]) {
                        edges[edlen+k] = [];
                    }
                    edges[edlen+k][j] = Number(value)+Number(vertlen);
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
                if(p[2]>=0) {
                    projp[i]=p;
                } else {
                    projp[i] = null;
                }
            }

            // Draw edges
            if(theme==0) {
                ctx.strokeStyle="white";
            } else if(theme==1) {
                ctx.strokeStyle="black";
            }
            for(let i = 0; i < edges.length; i++) {
                for(let j = 0; j <edges[i].length;j++) {
                    if(j+1<edges[i].length) {
                        const p1 = projp[edges[i][j]];
                        const p2 = projp[edges[i][j+1]];
                        if(p1!=null && p2!=null) {
                            ctx.moveTo(canvas.width/2+scale*p1[0], canvas.height/2+scale*p1[1]);
                            ctx.lineTo(canvas.width/2+scale*p2[0], canvas.height/2+scale*p2[1]);
                        }
                    } else if(j+1==edges[i].length){
                        const p1 = projp[edges[i][j]];
                        const p2 = projp[edges[i][0]];
                        if(p1!=null && p2!=null) {
                            ctx.moveTo(canvas.width/2+scale*p1[0], canvas.height/2+scale*p1[1]);
                            ctx.lineTo(canvas.width/2+scale*p2[0], canvas.height/2+scale*p2[1]);
                        }
                    }
                }
                //console.log("i="+i+" p1: "+p1+"; p2: "+p2);
            }

            // Draw vertices
            for(let i = 0; i < projp.length; i++) {
                let iscaught=0;
                for(let j = 0; j < addselect.length; j++) {
                    if(addselect[j]==i) {
                        iscaught=1;
                    }
                }
                if(iscaught==0) {
                    ctx.fillStyle = "red";
                } else if(iscaught==1) {
                    ctx.fillStyle="blue";
                }
                
                const p1 = projp[i];
                if(p1!=null) {
                    if(drawv==1) {
                        ctx.fillRect(canvas.width/2+scale*p1[0] - vertexpsize/2, canvas.height/2+scale*p1[1] - vertexpsize/2, vertexpsize, vertexpsize);
                    }
                    // render text displaying the index of a vertex above said vertex
                    if(showind==1) {
                        ctx.fillText(i, canvas.width/2+scale*p1[0], canvas.height/2+scale*p1[1], vertexpsize, vertexpsize);
                    }
                }
            }
        }
    }

    // render text
    if(theme==0) {
        ctx.fillStyle="white";
    } else if(theme==1) {
        ctx.fillStyle="black";
    }
    let fontsize1 = .03*canvas.height;
    let fontsize2 = .09*canvas.height;
    ctx.font=fontsize1+"px serif";
    ctx.fillText(intmode, canvas.width/2 - ctx.measureText(intmode).width/2, fontsize1);

    // render textlist
    ctx.font=fontsize1+"px serif";
    for(let i = 0; i < textlist.length; i++) {
        ctx.fillText(textlist, canvas.width-ctext.measureText(textlist), fontsize1*i);
    }

    // render textout
    ctx.font=fontsize1+"px serif";
    ctx.fillText(textout, canvas.width/2 - ctx.measureText(textout).width/2, canvas.height-fontsize1);
    // render ctext
    ctx.font = fontsize2+"px serif";
    ctx.fillText(ctext, canvas.width/2 - ctx.measureText(ctext).width/2, canvas.height/2);
    ctx.stroke();

    //update textoutput
    textoutputelement.value = textoutput;
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
    // update object rotation
    xangle += xanglev*deltaTime;
    yangle += yanglev*deltaTime;
    xangle%=Math.PI*2;
    yangle%=Math.PI*2;

    // manually rotate object
    if(mousebutton==1 && moused==1) {
        xangle+=deltamousey*deltamousef;
        if(xangle%2*Math.PI<Math.PI) {
            yangle+=deltamousex*deltamousef;
            //textout = "case 1: "+deltamousex+", "+deltamousey;
        } else if (xangle&2*Math.PI>=Math.PI) {
            yangle+=-deltamousex*deltamousef;
            //textout = "case 2:"+deltamousex+", "+deltamousey;
        }
        textout = "";
    }
    // check if on specific view angle
    if(xangle==0&&yangle==0) {
        textout="front";
    } else if(xangle==Math.PI/2&&yangle==0) {
        textout="top";
    }

    // set distance
    projd += projd*scroll*.001;

    // Check for pointer-vertex collision and react accordingly
    if(moused==1 && mousebutton==0) {
        if(caught==null) {
            // determine caught
            for(let i = 0; i < projp.length; i++) {
                p = {x:canvas.width/2+scale*projp[i][0],y:canvas.height/2+scale*projp[i][1]};
                if((mousex>p.x-vertexpsize/2 && mousex<p.x+vertexpsize/2) && (mousey>p.y-vertexpsize/2 && mousey<p.y+vertexpsize/2)) {
                    caught = i;
                    if(intmode!="normal") {
                        //textout = "selected "+caught;
                    }
                }
            }
        } else if(caught!=null) {
            if(caughtx== null || caughty==null || caughtz==null) {
                caughtx = vertices[caught][0]; caughty= vertices[caught][1]; caughtz = vertices[caught][2];
            }
            if(caughtatx==null||caughtaty==null) {
                caughtatx = mousex;caughtaty= mousey;
            }
            // movepoint
            if(intmode=="interact" && epressed==1) {
                movepoint(caught);
            }
        }
    } else if(control==1 && moused==0) {
        //add to addselect
        if(caught!=null) {
            let iscaught = 0;
            for(let i = 0; i < addselect.length; i++) {
                if(addselect[i]==caught) {
                    iscaught=1;
                }
            }
            if(iscaught==1) {
                addselect.splice(caught, 1);
            } else {
                addselect.push(caught);
            }
            caught=null;
            caughtx=null;caughty=null;caughtz=null;
            caughtatx=null;caughtaty=null;
        }
    } else if(moused==0) {
        // move relatice to deltacaught
        if(deltacaught!=null) {
            vertices[caught]=[caughtx, caughty, caughtz];
            console.log(deltacaught);
            console.log(vertices[addselect[0]]);
            textout=addselect[0];
            for(let i = 0; i<addselect.length; i++) {
                if(vertices[addselect[i]]&&deltacaught.length==3) {
                    vertices[addselect[i]][0] = Number(vertices[addselect[i]][0])+Number(deltacaught[0]);
                    vertices[addselect[i]][1] = Number(vertices[addselect[i]][1])+Number(deltacaught[1]);
                    vertices[addselect[i]][2] = Number(vertices[addselect[i]][2])+Number(deltacaught[2]);
                }
            }
        }
        deltacaught=null;
        caught=null;
        caughtx=null;caughty=null;caughtz=null;
        caughtatx=null;caughtaty=null;
    }
    if(caught!=null) {
        
    }
    //textout = caught;
}

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
    //console.log("xgf:"+pgf[0]+", ygf:"+pgf[1]+", zgf:"+pgf[2]+"; xrf:"+xrf+", yrf:"+yrf+", zrf:"+zrf);
    vertices[index] = structuredClone(pgf);
    // move other points
    deltacaught = [];
    for(let i = 0; i< 3;i++) {
        deltacaught[i] = pgf[i]-pg[i];
    }
    //console.log("caught:"+caught+"; caughtpos:"+[caughtx, caughty, caughtz]+"; prf:"+[xrf,yrf,zrf]+"; caughtat:"+[caughtatx, caughtaty]);
}

function gensphere(r, res, res2) { //res2 = 20
    vertices = structuredClone([]);
    edges = structuredClone([]);

    for(let i = 0; i < res; i++) {
        let theta = i/res*Math.PI;
        let theta2 = i/res*Math.PI*res2;
        let y = r*Math.cos(theta);
        let x = r*Math.sin(theta)*Math.cos(theta2);
        let z = r*Math.sin(theta)*Math.sin(theta2);
        vertices[i] = [x, y, z];
        if(i+1<res) {
            if(i+res2<res) {
                edges[i] = [i, i+1, i+res2];
                console.log(edges[i]);
            }
        }
    }
}

function ccld(vres, cres, height, r) { // 30, 30, 2, 2/3
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

// Project
function project(point) {
    let zOffset = point[2] + projd;

    return [projscale*point[0]/FOV/zOffset, projscale*point[1]/FOV/zOffset, zOffset];
}
// Rotate
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

requestAnimationFrame((timestamp) => {
    lastTime = timestamp;
    requestAnimationFrame(mainloop);
});