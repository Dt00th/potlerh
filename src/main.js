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
var debugtext = "";
var ctext = "";
var textout = "";
var textoutput = "";
var textlist = [];


// World
var vertices = [];
var edges = [];
var normalv = [];
let edgemiddvert = [];
let rotationspeed = .5;
let xlangle = 0, ylangle = 0;
let xlanglev = .7, ylanglev = 0;
let xangle = 0, yangle = 0;
let xanglev = 0,  yanglev = 0;
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
let rendernormalv = -1;
let renderfaces = 1;
let renderlight = -1;
var drawv = 1;
let renderedges = -1;
let renderlightvector = -1;
let showind = -1;
let FOV = 60;
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
    vertices = []; edges = []; normalv=[]; edgemiddvert=[];
    //readfile("./assets/cube.obj",0);
    readfile("./assets/tcube.obj",1);
    //readfile("./assets/cilinder.obj",1);
    //gcld(2, 20, 2, 1);
    //gensphere(1, 100, 24);
    projd = 5;
    xangle = 0;yangle = 0;
    xanglev = 0; yanglev = rotationspeed;
    makenormalv();
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
        if(event.key!=" ") {
            normalmode(event);
        }
    } else if(intmode=="manip") {
        manipmode(event);
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

function manipmode(event) {
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
        } else if(event.key=="a") { // add
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
        } else if(event.key=="c") { // connect
            // connect addselected
            if(addselect[0]!=null && addselect[1]!=null) {
                edges.push(addselect);
                addselect=[];
            }
        } else if(event.key=="x") { // cut
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
        }  else if(event.key=="r") { // remove
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
            for(let i = 0; i< edges.length; i++) {
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
        } else if(event.key=="3") {
            // back
            xangle=0;
            yangle=Math.PI;
        } else if(event.key=="4") {
            // bottom
            xangle=-Math.PI/2;
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
            intmode = "manip";
            ctext = "";
            return "manip";
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
        textoutput += "\nl ";
        for(let j = 0; j < edges[i].length; j++) {
            textoutput += edges[i][j]+" ";
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

function read(text, makenormal) {
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
    // not drawv
    if(vertices.length>30) {
        drawv=-1;
    }
    if(makenormal==1) {
        makenormalv();
    }
}
function setfile(path) {
    clear();
    readfile(path,1);
}
function readfile(path, makenormal) {
    try {
        fetch(path).then((res) => res.text()).then((text) => {
            //console.log(text);
            read(text,makenormal);
        }).catch((e) => 
            console.error(e)
        );
    } catch(error) {
        console.error(error);
    }
}
function clear() {
    ctext = '';vertices = [];edges = [];normalv=[];edgemiddvert=[];
}

var projp = [];
let vertexpsize = scale*.3;
let lightv = [1, 0, 0];
let bhedge = [];
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha=1;
    ctx.globalCompositeOperation="source-over";
    ctx.beginPath();
    ctx.fillStyle = "red";
    let rendertheme;
    if(theme==0) {
        rendertheme="white";
    } else if(theme==1) {
        rendertheme="black";
    }
    if(vertices!=structuredClone([]) && edges!=structuredClone([])){
        if(vertices[0]!=null && vertices[1]==null) {
            ctx.fillRect(scale*vertices[0][0], scale*vertices[0][1], 3, 3);
        } else {
            // Project
            projp = structuredClone([]);
            bhedge = structuredClone([]);
            for(let i = 0; i < vertices.length; i++) {
                const rotated = rotate(vertices[i], xangle, yangle);
                let p = project(rotated);
                // check if behind camera
                if(p[2]<0) {
                    projp[i]=null
                } else {
                    projp[i]=p;
                }
            }
            // collision check(test)
            for(let j =0; j<1;j++) { // test 0
                if(edges[j]!=null&&!projp.includes(null) && normalv[j]!=null) {
                    //det maxx and minxx
                    let mousepx = (mousex-canvas.width/2)/scale;
                    let mousepy = (mousey-canvas.height/2)/scale;
                    let xminindex = 0, xmaxindex= 0;
                    let x0=projp[edges[j][0]][0];
                    let x1=projp[edges[j][0]][0];
                    for(let k = 1; k< edges[j].length; k++) {
                        if(projp[edges[j][k]][0]<x0) {
                            xminindex=k;
                            x0=projp[edges[j][k]][0];
                        }
                        if(projp[edges[j][k]][0]>x1) {
                            xmaxindex = k;
                            x1=projp[edges[j][k]][0];
                        }
                    }
                    let xotherindex;
                    for(let k = 0; k<edges[j].length;k++) {
                        if(xmaxindex!=k&&xminindex!=k) {
                            xotherindex = k;
                        }
                    }
                    let ymaxindex=xotherindex; let ymax=projp[edges[j][xotherindex]][1];
                    let yminindex=xotherindex; let ymin=projp[edges[j][xotherindex]][1];
                    for(let k = 0; k<edges[j].length;k++) {
                        if(k!=xminindex&&projp[edges[j][k]][1]>ymax) {
                            ymax=projp[edges[j][k]][1];
                            ymaxindex=k;
                        } else if(k!=xminindex&&projp[edges[j][k]][1]<ymin) {
                            ymin=projp[edges[j][k]][1];
                            yminindex=k;
                        }
                    }
                    let p0 = projp[edges[j][xminindex]];
                    let p1 = projp[edges[j][ymaxindex]];
                    let p2 = projp[edges[j][yminindex]];
                    //det y0, y1, y2
                    let y0 = (mousepx-p1[0])*(p1[1]-p2[1])/(p1[0]-p2[0])+p2[1];
                    let y1 = (mousepx-p2[0])*(p2[1]-p0[1])/(p2[0]-p0[0])+p0[1];
                    let y2 = (mousepx-p1[0])*(p1[1]-p0[1])/(p1[0]-p0[0])+p0[1];
                    if(mousepx>x0&&mousepx<x1) {
                        if(mousepy<y2&&mousepy>y1&&mousepy>y0) {
                            console.log("inside");
                            break;
                        }
                    }
                }
            }
            // behind check TODO
            if(renderfaces==1) {
                for(let i = 0; i < edges.length; i++) {
                    let projmidd = project(rotate(edgemiddvert[i],xangle,yangle));
                    let a = [projmidd[0]/projscale/FOV, projmidd[1]/projscale/FOV, projmidd[2]];
                    let alen=a[0]*a[0]+a[1]*a[1]+a[2]*a[2];
                    let rotnv = rotate(normalv[i],xangle,yangle);
                    let rotnvlen = rotnv[0]*rotnv[0]+rotnv[1]*rotnv[1]+rotnv[2]*rotnv[2];
                    anproduct = (a[0]*rotnv[0]+a[1]*rotnv[1]+a[2]*rotnv[2])/(rotnvlen*alen);
                    if(Math.acos(anproduct)<=(Math.PI/2)) {
                        bhedge.push(i);
                    }
                }
            }
            // Render with faces
            if(renderfaces==1&&normalv.length!=0) {
                // Render faces
                for(let i = 0; i< edges.length; i++) {
                    if(normalv[i]!=null && !bhedge.includes(i)) {
                        let op = 1;
                        if(renderlight==1) {
                            let opx = lightv[0]*normalv[i][0];
                            let opy = lightv[1]*normalv[i][1];
                            let opz = lightv[2]*normalv[i][2];
                            let theta = Math.acos(opx+opy+opz);
                            op = theta/Math.PI;
                        }

                        // Render face
                        var path = new Path2D();
                        ctx.beginPath();
                        ctx.lineWidth=1;
                        ctx.fillStyle="rgb("+255*op+", 0, 0)"; // 255, 100, 100
                        for(let j = 0; j < edges[i].length;j++) {
                            if(j==0&&projp[edges[i][j]]!=null) {
                                path.moveTo(canvas.width/2+scale*projp[edges[i][j]][0], canvas.height/2+scale*projp[edges[i][j]][1]);
                            } else if(projp[edges[i][j]]!=null) {
                                path.lineTo(canvas.width/2+scale*projp[edges[i][j]][0], canvas.height/2+scale*projp[edges[i][j]][1]);
                            }
                        }
                        ctx.fill(path);
                    }
                }
            }
            // render lnv
            if(renderlightvector==1) {
                let projlnv = project(rotate([lightv[0], lightv[1], lightv[2]], xangle, yangle));
                let projlnvf = project([0,0,0]);
                ctx.beginPath();
                ctx.strokeStyle="rgb(255, 200, 100)";
                ctx.lineWidth=6;
                ctx.moveTo(canvas.width/2+scale*projlnvf[0], canvas.height/2+scale*projlnvf[1]);
                ctx.lineTo(canvas.width/2+scale*projlnv[0], canvas.height/2+scale*projlnv[1]);
                ctx.stroke();
            }
            ctx.lineWidth=1;

            // Draw edges
            for(let i = 0; i < edges.length; i++) {
                if(!bhedge.includes(i)) {
                    for(let j = 0; j <edges[i].length;j++) {
                        // draw edges
                        if(renderedges==1) {
                            if(j+1<edges[i].length) {
                                const p1 = projp[edges[i][j]];
                                const p2 = projp[edges[i][j+1]];
                                if(p1!=null && p2!=null) {
                                    ctx.beginPath();
                                    ctx.strokeStyle = rendertheme;
                                    ctx.moveTo(canvas.width/2+scale*p1[0], canvas.height/2+scale*p1[1]);
                                    ctx.lineTo(canvas.width/2+scale*p2[0], canvas.height/2+scale*p2[1]);
                                    ctx.stroke();
                                }
                            } else if(j+1==edges[i].length){
                                const p1 = projp[edges[i][j]];
                                const p2 = projp[edges[i][0]];
                                if(p1!=null && p2!=null) {
                                    ctx.beginPath();
                                    ctx.strokeStyle = rendertheme;
                                    ctx.moveTo(canvas.width/2+scale*p1[0], canvas.height/2+scale*p1[1]);
                                    ctx.lineTo(canvas.width/2+scale*p2[0], canvas.height/2+scale*p2[1]);
                                    ctx.stroke();
                                }
                            }
                        }
                        // render normal vector
                        if(rendernormalv==1&&normalv!=null) {
                            if(normalv[i]!=null) {
                                let pf=[];
                                let projmidd=project(rotate(edgemiddvert[i],xangle,yangle));
                                for(let j = 0; j < normalv[i].length;j++){
                                    pf[j] = (Number(edgemiddvert[i][j])+Number(normalv[i][j]));
                                }
                                // check if behind camera
                                let projf = project(rotate(pf, xangle, yangle));
                                if(pf!=null && projmidd[2]>0 && projf[2]>0) {
                                    // draw line
                                    ctx.beginPath();
                                    ctx.strokeStyle = "blue";
                                    ctx.moveTo(canvas.width/2+scale*projmidd[0], canvas.height/2+scale*projmidd[1]);
                                    ctx.lineTo(canvas.width/2+scale*projf[0], canvas.height/2+scale*projf[1]);
                                    ctx.lineWidth=1;
                                    ctx.stroke();


                                    // draw line end
                                    let jod = vertexpsize/3;
                                    ctx.fillStyle="blue";
                                    ctx.fillRect(canvas.width/2+scale*projf[0]-jod/2, canvas.height/2+scale*projf[1]-jod/2, jod, jod);
                                }
                            }
                        }
                    }
                }
            }
            // Draw vertices
            for(let i = 0; i < projp.length; i++) {
                let iscaught=0;
                for(let j = 0; j < addselect.length; j++) {
                    if(addselect[j]==i) {
                        iscaught=1;
                    }
                }
                if(iscaught==1||renderfaces==1) {
                    ctx.fillStyle="blue";
                } else if(iscaught==0) {
                    ctx.fillStyle = "red";
                } 
                
                const p1 = projp[i];
                if(p1!=null) {
                    if((drawv==1 && renderfaces==-1)||iscaught==1) {
                        ctx.fillRect(canvas.width/2+scale*p1[0] - vertexpsize/2, canvas.height/2+scale*p1[1] - vertexpsize/2, vertexpsize, vertexpsize);
                    }
                    // render text displaying the index of a vertex above said vertex
                    if(showind==1 || caught==i) {
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
    //render mode
    ctx.font=fontsize1+"px serif";
    ctx.fillText(intmode, canvas.width/2 - ctx.measureText(intmode).width/2, fontsize1);

    //render debug
    ctx.font=fontsize1+"px serif";
    ctx.fillText(debugtext, canvas.width-ctx.measureText(debugtext).width, fontsize1);

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
    const deltaTime = (currentTime - lastTime)/1000;
    lastTime = currentTime;
    
    
    debug(currentTime, deltaTime);
    update(deltaTime);
    render();
    //try {
    //    render();
    //} catch(error) {
    //    console.log(error);
    //}

    requestAnimationFrame(mainloop);
}

function debug(currentTime, deltaTime) {
    debugtext=Math.round(1/deltaTime*100)/100;
}

function update(deltaTime) {
    // update object rotation
    xangle += xanglev*deltaTime;
    yangle += yanglev*deltaTime;
    xangle%=Math.PI*2;
    yangle%=Math.PI*2;
    textout = "";

    xlangle+=xlanglev*deltaTime;
    ylangle+=ylanglev*deltaTime;
    lightv = rotate([0,0,-1],xlangle,ylangle);

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
    }
    // check if on specific view angle
    if(xangle==0&&yangle==0) {
        textout="front";
    } else if(xangle==Math.PI/2) {
        textout="top";
    } else if(yangle==Math.PI&&xangle==0) {
        textout="back";
    } else if(xangle==Math.PI/2) {
        textout="back";
    }

    // set distance
    projd += projd*scroll*.001;

    // Check for pointer-vertex collision and react accordingly
    if(moused==1 && mousebutton==0) {
        if(caught==null) {
            // determine caught
            for(let i = 0; i < projp.length; i++) {
                if(projp[i]!=null) {
                    p = {x:canvas.width/2+scale*projp[i][0],y:canvas.height/2+scale*projp[i][1]};
                    if((mousex>p.x-vertexpsize/2 && mousex<p.x+vertexpsize/2) && (mousey>p.y-vertexpsize/2 && mousey<p.y+vertexpsize/2)) {
                        caught = i;
                        if(intmode!="normal") {
                            //textout = "selected "+caught;
                        }
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
            if(intmode=="manip" && epressed==1) {
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
        // move relative to deltacaught
        if(deltacaught!=null) {
            vertices[caught]=[caughtx, caughty, caughtz];
            //console.log(deltacaught);
            //console.log(vertices[addselect[0]]);
            textout=addselect[0];
            for(let i = 0; i<addselect.length; i++) {
                if(vertices[addselect[i]]&&deltacaught.length==3) {
                    vertices[addselect[i]][0] = Number(vertices[addselect[i]][0])+Number(deltacaught[0]);
                    vertices[addselect[i]][1] = Number(vertices[addselect[i]][1])+Number(deltacaught[1]);
                    vertices[addselect[i]][2] = Number(vertices[addselect[i]][2])+Number(deltacaught[2]);
                }
                makenormalv();
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

//genobject
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
function gcld(vres, cres, height, r) { // 30, 30, 2, 2/3
    // edges[i][j%3]
    drawv=-1;
    vertices=structuredClone([]);
    edges = structuredClone([]);
    let center = (vres)*(cres);
    vertices[center] = [0, -height/2, 0];
    vertices[center+1] = [0, height/2, 0];
    for(let i = 0; i < vres; i++) {
        let y = i/(vres-1)*height-height/2;
        for(let j = 0; j < cres; j++) {
            let theta = j/cres*2*Math.PI;
            let x = Math.cos(theta)*r;
            let z = Math.sin(theta)*r;
            vertices[i*cres+j] = [x, y, z];
            //side
            if(i+1<vres) {
                edges[(cres)*2+i*cres+j] = [i*cres+j, (i+1)*cres+(j+1)%cres, (i*cres+(j+1)%cres)];
                edges[(cres)*2+(vres-1)*cres+i*cres+j] = [i*cres+j, (i+1)*cres+(j)%cres, ((i+1)*cres+(j+1)%cres)];
            }
            if(i==0){// bottom circle
                edges[j]=[center, j, (j+1)%cres];
            }
            if(i==1) {// top circle
                edges[cres+j]=[center+1, (vres-1)*cres+(j+1)%cres, (vres-1)*cres+j];
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
function addv(v1, v2) {
    let v3=[];
    if(v1.length==v2.length) {
        for(let i = 0; i < v1.length; i++) {
            v3[i]=Number(v1[i])+Number(v2[i]);
        }
    }
    return v3;
}
function makenormalv() { //ccw is frontfaced
    // p0- edges[0] p1- edges[1] p2- edges[2]
    normalv=[];
    edgemiddvert=[];
    for(let i = 0; i< edges.length; i++) {
        if(edges[i]==null) {
            edgemiddvert.push(null);
        } else {
            let p = [0, 0, 0];
            for(let j = 0; j< edges[i].length;j++) {
                p[0]+=Number(vertices[edges[i][j]][0]);
                p[1]+=Number(vertices[edges[i][j]][1]);
                p[2]+=Number(vertices[edges[i][j]][2]);
            }
            for(let j = 0; j< p.length;j++) {
                p[j] = p[j]/edges[i].length;
            }
            edgemiddvert.push(p);
        }
    }
    for(let i = 0; i< edges.length;i++) {
        let x0 = vertices[edges[i][0]][0];
        let y0 = vertices[edges[i][0]][1];
        let z0 = vertices[edges[i][0]][2];
        let x1 = vertices[edges[i][1]][0];
        let y1 = vertices[edges[i][1]][1];
        let z1 = vertices[edges[i][1]][2];
        let x2 = vertices[edges[i][2]][0];
        let y2 = vertices[edges[i][2]][1];
        let z2 = vertices[edges[i][2]][2];
        let xf = ((y1-y0)*(z2-z0))-((z1-z0)*(y2-y0));
        let yf = ((z1-z0)*(x2-x0))-((x1-x0)*(z2-z0));
        let zf = ((x1-x0)*(y2-y0))-((y1-y0)*(x2-x0));
        let length = Math.sqrt(xf*xf + yf*yf+ zf*zf);
        normalv[i] = [xf/length, yf/length, zf/length];
    }
    console.log("normalv: ",normalv)
}

requestAnimationFrame((timestamp) => {
    lastTime = timestamp;
    requestAnimationFrame(mainloop);
});