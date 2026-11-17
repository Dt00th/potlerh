const input = document.getElementById("userinput");
const scaleelement = document.getElementById("scale");
const output = document.getElementById("output");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
var x = null,y = null,z = null;
var points = [];
var scale = 50;

render();
stream();

input.addEventListener("keydown", function (event) {
    if(event.key=="Enter") {
        const text = input.value;
        input.value = "";
        stream(text);
    }
})
var n = 0;
function stream(num) {
    if(n==0) {
        x = num;
        n = 1;
    } else if (n==1) {
        y = num;
        n = 0;
        submit([x, y]);
    }
}
function submit(point) {
    if(points[0]==null) {
        points[0] = point;
    } else {
        console.log(points[0]);
        points[points.length] = point;
    }
    x = null; y = null;
    render();
}

function outputrend() {
    if(n==0) {
        output.textContent = points[0];
    } else {
        output.textContent = points[0][0];
    }
}

function render() {
    ctx.beginPath();
    ctx.fillStyle = "red";
    if(points[0]!=null){
        outputrend();
        if(points[1]==null) {
            ctx.fillRect(scale*points[0][0], scale*points[0][1], 3, 3);
        } else {
            for(let i = 0; i < points.length-1; i++) {
                ctx.moveTo(scale*points[i][0], scale*points[i][1]);
                ctx.lineTo(scale*points[i+1][0], scale*points[i+1][1]);
            }
        }
    }
    //ctx.moveTo(30, 50);
    //ctx.lineTo(150, 100);
    ctx.stroke();
}
