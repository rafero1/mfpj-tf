class Vec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(vec) { return new Vec2(this.x + vec.x, this.y + vec.y); }
    sub(vec) { return new Vec2(this.x - vec.x, this.y - vec.y); }
    times(real) {return new Vec2(this.x*real, this.y*real); }
    div(real) { return new Vec2(this.x/real, this.y/real); }
    dot(vec) {return this.x*vec.x + this.y*vec.y; }
    mag() { return Math.sqrt(this.dot(this)); }
    distance(vec) { return Math.sqrt(Math.pow(this.x-vec.x, 2) + Math.pow(this.y-vec.y, 2)); }
    normalize() {return this.div(this.mag()); }
    projection(vec) { 
        let v2 = vec.normalize();
        let d = this.dot(v2)/v2.dot(v2);
        return new Vec2(d*v2.x, d*v2.y);
    }
}

let BoxType = {
    AABB: "AABB",
    CIRCLE: "CIRCLE",
    OBB: "OBB",
}

class AABB {
    constructor(points) {
        this.points = points;
        this.min = new Vec2(0, 0);
        this.max = new Vec2(0, 0);
        this.center = new Vec2(0, 0);
        this.fit();
    }

    fit() {
        var minx = this.points[0].x;
        var miny = this.points[0].y;
        var maxx = this.points[0].x;
        var maxy = this.points[0].y;
        this.points.forEach(function(p) {
            if (p.x < minx) minx = p.x;
            if (p.y > miny) miny = p.y;
            if (p.x > maxx) maxx = p.x;
            if (p.y < maxy) maxy = p.y;
        });
        this.min = new Vec2(minx, miny);
        this.max = new Vec2(maxx, maxy);
        this.center = new Vec2((maxx + minx)/2, (maxy + miny)/2);
    }
}

class Circle {
    constructor(points) {
        this.points = points;
        this.center = new Vec2(0, 0);
        this.radius = 0;
        this.fit();
    }

    fit() {
        var minx = this.points[0].x;
        var miny = this.points[0].y;
        var maxx = this.points[0].x;
        var maxy = this.points[0].y;
        this.points.forEach(function(p) {
            if (p.x < minx) minx = p.x;
            if (p.y < miny) miny = p.y;
            if (p.x > maxx) maxx = p.x;
            if (p.y > maxy) maxy = p.y;
        });
        this.center = new Vec2((maxx+minx)/2, (maxy+miny)/2);
        console.log(this.center.x, this.center.y);
        for (let i=0; i<this.points.length; i++) {
            if (this.center.distance(this.points[i]) > this.radius) 
            this.radius = this.center.distance(this.points[i]);
        }
    }
}

class OBB {
    constructor(points) {
        this.points = points;
        this.ang = 0;
        this.u = new Vec2(Math.cos(this.ang) - 0.5, Math.sin(this.ang) - 0.5).normalize();
	    this.v = new Vec2(-this.u.y, this.u.x);
	    this.center = new Vec2(0, 0);
        this.extents = new Vec2(0, 0);
        this.w = 0;
        this.h = 0;
        this.fit();
    }

    fit() {
        let u = this.u;
        let v = this.v;
        var minu = this.points[0].projection(u);
        var maxu = this.points[0].projection(u);
        var minv = this.points[0].projection(v);
        var maxv = this.points[0].projection(v);
        this.points.forEach(function(p) {
            let pu = p.projection(u);
			if(pu.y < minu.y) minu = pu;
            if(pu.y > maxu.y) maxu = pu;
            
            let pv = p.projection(v);
			if(pv.x < minv.x) minv = pv;
			if(pv.x > maxv.x) maxv = pv;
        });
        let e1 = (minu.add(maxu)).div(2);
        let e2 = (minv.add(maxv)).div(2);
        this.center = e1.add(e2);
		this.extents.x = ((maxv.sub(minv)).mag())/2;
        this.extents.y = ((maxu.sub(minu)).mag())/2;
        this.w = maxu.sub(minu);
        this.h = maxv.sub(minv);
        
        console.log(
            'u: x='+this.u.x+' y='+this.u.y+'\n'+
            'v: x='+this.v.x+' y='+this.v.y+'\n'+
            'center: x='+this.center.x+' y='+this.center.y+'\n'+
            'extents: x='+this.extents.x+' y='+this.extents.y+'\n'+
            'w: x='+this.w.x+' y='+this.w.y+'\n'+
            'h: x='+this.h.x+' y='+this.h.y
        );
    }
}

class Shape {
    constructor(shapeId, points, boxType) {
        this.points = points;
        this.boxType = boxType;
        this.box = new AABB(points);
        this.display;

        let group = new Konva.Group({
            draggable: false,
            name: "display",
            //draggable:true,
            id: "display"+shapeId
        });

        points.forEach(function (point) {
            group.add(new Konva.Circle({
                x: point.x, y: point.y,
                radius: 2,
                stroke: 'black', strokeWidth: 1, 
                fill: 'black',
                name: 'point'
            }));
        })

        if (boxType == BoxType.AABB) {
            this.box = new AABB(points);

            group.add(new Konva.Circle({
                x: this.box.center.x, y: this.box.center.y,
                radius: 2,
                stroke: shapeId == 0? 'red':'blue', strokeWidth: 1,
                fill: shapeId == 0? 'red':'blue', opacity: 0.2,
                name: 'box'
            }));

            group.add(new Konva.Rect({
                x: this.box.min.x, 
                y: this.box.max.y,
                width: this.box.max.x-this.box.min.x, 
                height: this.box.min.y-this.box.max.y,
                stroke: shapeId == 0? 'red':'blue', strokeWidth: 1,
                fill: shapeId == 0? 'red':'blue', opacity: 0.2,
                name: 'box'
            }));
        } else
        if (boxType == BoxType.CIRCLE) {
            this.box = new Circle(points);

            group.add(new Konva.Circle({
                x: this.box.center.x, y: this.box.center.y,
                radius: 2,
                stroke: shapeId == 0? 'red':'blue', strokeWidth: 1,
                fill: shapeId == 0? 'red':'blue', opacity: 0.2,
                name: 'box'
            }));

            group.add(new Konva.Circle({
                x: this.box.center.x,
                y: this.box.center.y,
                radius: this.box.radius,
                stroke: shapeId == 0? 'red':'blue', strokeWidth: 1,
                fill: shapeId == 0? 'red':'blue', opacity: 0.2,
                name: 'box'
            }));
        } else
        if (boxType == BoxType.OBB) {
            this.box = new OBB(points);

            group.add(new Konva.Circle({
                x: this.box.center.x, y: this.box.center.y,
                radius: 2,
                stroke: shapeId == 0? 'red':'blue', strokeWidth: 1,
                fill: shapeId == 0? 'red':'blue', opacity: 0.2,
                name: 'box'
            }));

            let p1 = this.box.center.add(
                this.box.u.times(this.box.extents.y*2).div(2)).add(
                    this.box.v.times(this.box.extents.x*2).div(2)
                );
            let p2 = this.box.center.add(
                this.box.u.times(this.box.extents.y*2).div(2)).sub(
                    this.box.v.times(this.box.extents.x*2).div(2)
                );
            let p3 = this.box.center.sub(
                this.box.u.times(this.box.extents.y*2).div(2)).sub(
                    this.box.v.times(this.box.extents.x*2).div(2)
                );
            let p4 = this.box.center.sub(
                this.box.u.times(this.box.extents.y*2).div(2)).add(
                    this.box.v.times(this.box.extents.x*2).div(2)
                );

            group.add(new Konva.Line({
                points: [p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, p4.x, p4.y],
                closed: true,
                stroke: shapeId == 0? 'red':'blue', strokeWidth: 1,
                fill: shapeId == 0? 'red':'blue', opacity: 0.2,
                name: 'box'
            }));
        }
        /*group.on('dragstart', function(){
            mousePos = stage.getPointerPosition();
        });
        group.on('dragend', move());*/
        this.display = group;
    }
}
/*
function move() {
    let offsetX = stage.getPointerPosition().x - mousePos.x;
    let offsetY = stage.getPointerPosition().y - mousePos.y;

    shapes[0].points.forEach(function(p){
        p.x += offsetX;
        p.y += offsetY;
    });

    shapes[0].box.fit();

    checkCollisions();
}*/

var mousePos = 0;

// Checa as colisões de todas as shapes
function checkCollisions() {

    let shape1 = shapes[0];
    let shape2 = shapes[1];

    if (shape1|shape2 == null) return;

    graphLayer.destroyChildren();
    
    if (shape1.boxType == BoxType.AABB) {
        if (shape2.boxType == BoxType.AABB)
            doAABBxAABB(shape1, shape2);
        else if (shape2.boxType == BoxType.CIRCLE)
            doAABBxCircle(shape1, shape2);
        else if (shape2.boxType == BoxType.OBB) // extra
            doAABBxOBB(shape1, shape2);
    } else 
    if (shape1.boxType == BoxType.CIRCLE) {
        if (shape2.boxType == BoxType.AABB)
            doAABBxCircle(shape2, shape1);
        else if (shape2.boxType == BoxType.CIRCLE)
            doCirclexCircle(shape1, shape2);
        else if (shape2.boxType == BoxType.OBB)
            doCirclexOBB(shape1, shape2);
    } else
    if (shape1.boxType == BoxType.OBB) {
        if (shape2.boxType == BoxType.AABB) // extra
            doAABBxOBB(shape2, shape1);
        else if (shape2.boxType == BoxType.CIRCLE)
            doCirclexOBB(shape2, shape1);
        else if (shape2.boxType == BoxType.OBB) // extra
            doOBBxOBB(shape1, shape2);
    }

    stage.add(graphLayer);
}

function doAABBxAABB(shape1, shape2) {
    console.clear();
    console.log("starting aabb x aabb collision check...");
    let box1 = shape1.box;
    let box2 = shape2.box;

    console.log("min1: x="+box1.min.x+" y="+box1.min.y+" max1: x="+box1.max.x+" y="+box1.max.y)
    console.log("min2: x="+box2.min.x+" y="+box2.min.y+" max2: x="+box2.max.x+" y="+box2.max.y)

    if (box1.max.x > box2.min.x && 
        box1.min.x < box2.max.x &&
        box1.max.y < box2.min.y && 
        box1.min.y > box2.max.y) {
        console.log(
            "collision detected:\n"+
            " -> "+shape1.display.id()+": "+shape1.boxType+"\n"+
            " -> "+shape2.display.id()+": "+shape2.boxType
        );

        graphLayer.add(new Konva.Text({
            x: 10, y: 10,
            text: "hit",
            fill: 'red'
        }));
    } else {
        console.log("no collision detected");

        graphLayer.add(new Konva.Text({
            x: 10, y: 10,
            text: "no hit",
            fill: 'grey'
        }));
    }
}

function doCirclexCircle(circle1, circle2) {
    console.clear();
    console.log("starting circle x circle collision check...");
    let box1 = circle1.box;
    let box2 = circle2.box;

    let x1 = box1.center.x;
    let y1 = box1.center.y;
    let r1 = box1.radius;

    let x2 = box2.center.x;
    let y2 = box2.center.y;
    let r2 = box2.radius;

    if (((x2-x1)*(x2-x1)) + ((y1-y2)*(y1-y2)) <= (r1+r2)*(r1+r2)) {
        console.log(
            "collision detected:\n"+
            " -> "+circle1.display.id()+": "+circle1.boxType+"\n"+
            " -> "+circle2.display.id()+": "+circle2.boxType
        );

        graphLayer.add(new Konva.Text({
            x: 10, y: 10,
            text: "hit",
            fill: 'red'
        }));
    } else {
        console.log("no collision detected");

        graphLayer.add(new Konva.Text({
            x: 10, y: 10,
            text: "no hit",
            fill: 'grey'
        }));
    }
}

function doAABBxCircle(shape, circle) {
    console.clear();
    console.log("starting aabb x circle collision check...");
    let box = shape.box;
    let cbox = circle.box;

    var p = new Vec2(cbox.center.x, cbox.center.y);
    if (p.x > box.max.x) p.x = box.max.x;
    if (p.x < box.min.x) p.x = box.min.x;
    if (p.y > box.min.y) p.y = box.min.y;
    if (p.y < box.max.y) p.y = box.max.y;

    console.log("circle center: x="+cbox.center.x+" y="+cbox.center.y);
    console.log("anchor: x="+p.x+" y="+p.y);
    console.log("distance: "+p.distance(cbox.center));
    if (p.distance(cbox.center) <= cbox.radius) {
        console.log(
            "collision detected:\n"+
            " -> "+shape.display.id()+": "+shape.boxType+"\n"+
            " -> "+circle.display.id()+": "+circle.boxType
        );

        graphLayer.add(new Konva.Text({
            x: 10, y: 10,
            text: "hit",
            fill: 'red'
        }));

    } else {
        console.log("no collision detected");

        graphLayer.add(new Konva.Text({
            x: 10, y: 10,
            text: "no hit",
            fill: 'grey'
        }));
    }

    // Desenha linha e ancora
    let circleAnchor = new Konva.Circle({
        x: p.x,
        y: p.y,
        radius: 2,
        fill: "blue",
        name: 'graph'
    });
    let toCenterCircleLine = new Konva.Line({
        points: [p.x, p.y, cbox.center.x, cbox.center.y],
        stroke: 'blue',
        name: 'graph'
    });
    graphLayer.add(toCenterCircleLine);
    graphLayer.add(circleAnchor);
}

function doCirclexOBB(circle, shape) {
    console.clear();
    let box = shape.box;
    let cbox = circle.box;

    console.log(
        'box: '+'\n'+
        'u: x='+box.u.x+' y='+box.u.y+'\n'+
        'v: x='+box.v.x+' y='+box.v.y+'\n'+
        'center: x='+box.center.x+' y='+box.center.y+'\n'+
        'extents: x='+box.extents.x+' y='+box.extents.y+'\n'+
        'w: x='+box.w.x+' y='+box.w.y+'\n'+
        'h: x='+box.h.x+' y='+box.h.y
    );

    console.log(
        "cbox center: x="+cbox.center.x+" y="+cbox.center.y+"\n"+
        "cbox radius: "+cbox.radius
    );

    let cc = new Vec2(
        (cbox.center.sub(box.center)).dot(box.v),
        (cbox.center.sub(box.center)).dot(box.u)
    );

    console.log(
        "cc: x="+cc.x+" y="+cc.y
    );
    
    var ref = new Vec2(cc.x, cc.y);

    if(cc.x < -box.extents.x ) ref.x = -box.extents.x;
	else if(cc.x > box.extents.x ) ref.x = box.extents.x;

	if(cc.y < -box.extents.y ) ref.y = -box.extents.y;
	else if(cc.y > box.extents.y ) ref.y = box.extents.y;

    ref.x -= cc.x;
    ref.y -= cc.y;
    let dist = ref.dot(ref);
    
    console.log(
        "ref: x="+ref.x+" y="+ref.y+"\n"+
        "dist: "+dist+"\n"
    );

	if (dist <= cbox.radius*cbox.radius) {
        console.log(
            "collision detected:\n"+
            " -> "+shape.display.id()+": "+shape.boxType+"\n"+
            " -> "+circle.display.id()+": "+circle.boxType
        );

        graphLayer.add(new Konva.Text({
            x: 10, y: 10,
            text: "hit",
            fill: 'red'
        }));
    } else {
        console.log("no collision detected");

        graphLayer.add(new Konva.Text({
            x: 10, y: 10,
            text: "no hit",
            fill: 'grey'
        }));
    }
}

function doOBBxOBB(shape1, shape2) {
    console.clear();
    console.log("obb x obb not implemented");
}

function doAABBxOBB(shape1, shape2) {
    console.clear();
    console.log("aabb x obb not implemented");
}

// Pega array de coordenadas e transforma num array de vec2
function coordsToVecs(coords) {
    let vcoords = [];
    coords.forEach(function() {
        for (let i=1; i <= coords.length; i+=2)
            vcoords.push(new Vec2(coords[i-1], coords[i]));
    });
    return vcoords;
}

// Muda a shape
function setShape(shapeId, BBType, coords) {
    var shape = new Shape(shapeId, coordsToVecs(coords), BBType);
    shapes[shapeId] = shape;
    stage.find('#display'+shapeId).destroy();
    mainLayer.add(shape.display);
    stage.add(mainLayer);
    checkCollisions();
}

// Pega coordenadas, separa as strings e transforma cada elemento em numero
function getCoordsFrom(coordsId) {
    return $("#"+coordsId).val().trim().split(', ').map(Number);
}

// Pega valor do radio
function getBBTypeFrom(BBTypeId) {
    return $('input[type=radio][name='+BBTypeId+']:checked').val();
}

var shapes = [2];
var stage;
var mainLayer;
var graphLayer;

$(function () {
    // Konva init
    stage = new Konva.Stage({container: 'stage', width: 400, height: 400 });
    mainLayer = new Konva.Layer();
    graphLayer = new Konva.Layer();

    // BB padrão
    $('input[type=radio][name=bb1][value=AABB]').prop("checked", true);
    $('input[type=radio][name=bb2][value=AABB]').prop("checked", true);

    // Botão para a shape 1
    $('#set-shape-1').on('click', function () {
        setShape(0, getBBTypeFrom('bb1'), getCoordsFrom("coords1"));
    });

    // Botão para a shape 2
    $('#set-shape-2').on('click', function () {
        setShape(1, getBBTypeFrom('bb2'), getCoordsFrom("coords2"));
    });
});
