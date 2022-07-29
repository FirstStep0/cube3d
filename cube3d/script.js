var canvas;
var context;
var timer;
var mousePos = {x:0,y:0};
var objects;
var playerPos;
var z0;
var wBuffer;
var map;
var mapContext;
var isPressed;
var buffer;
var myImageData;
var CC;

var sizeX;
var sizeY;

var YXbuffer;

//плоскость отсечения задается уравнением z = h;
//используется в рендере
var h;

var fi;
var ksi;

function color(r,g,b,a){
	this.R = r;
	this.G = g;
	this.B = b;
	this.A = a;
};

function p2(x,y){
	this.x = x;
	this.y = y;
};

function p3(x,y,z){
	this.x = x;
	this.y = y;
	this.z = z;
};

/*class object(){
	this.center;
	constructor(cent){
		this.center = cent;
	}
	this.points = [];
	this.facets = [];
}*/

function cube(p3_start, color){
	this.color = color;
	this.p3_center = {x: p3_start.x, y: p3_start.y, z: p3_start.z};
	
	this.p3_points = [ new p3( 0.5, -0.5,  0.5),
					new p3(-0.5, -0.5,  0.5),
					new p3(-0.5,  0.5,  0.5),
					new p3( 0.5,  0.5,  0.5),
					new p3( 0.5, -0.5, -0.5),
					new p3(-0.5, -0.5, -0.5),
					new p3(-0.5,  0.5, -0.5),
					new p3( 0.5,  0.5, -0.5)];
	//обход против часовой стрелки
	//указаны номера точек 
	//должно быть не менее трех точек для верного расчета нормали,
	//остальные точки одной грани должны лежать в той же плоскости
	this.facets = [ [3,2,1,0], //передняя
					[4,5,6,7], //задняя
					[0,1,5,4], //нижняя
					[2,3,7,6], //верхняя
					[1,2,6,5], //правая
					[3,0,4,7] //левая
					];
					
	this.normals = [];/*[new p3(0,0,0),
					new p3(0,0,0),
					new p3(0,0,0),
					new p3(0,0,0),
					new p3(0,0,0),
					new p3(0,0,0)
					];*/
};

function calcAllNormals(){
	for(var i = 0; i < objects.length; ++i){
		var obj = objects[i];
		var facets = obj.facets;
		var points = obj.p3_points;
		var normals = obj.normals;
		for(var j = 0; j < facets.length; ++j){
			var cur_facet = facets[j];
			var p0 = points[cur_facet[0]];
			var p1 = p3_sub(points[cur_facet[1]], p0);
			var p2 = p3_sub(points[cur_facet[2]], p0);
			normals[j] = vector_product2(p1, p2);
		}
	}
}

function getMousePos(canvas, evt) {
        // get canvas position
        var obj = canvas;
        var top = 0;
        var left = 0;
        while(obj.tagName != 'BODY') {
          top += obj.offsetTop;
          left += obj.offsetLeft;
          obj = obj.offsetParent;
        }

        // return relative mouse position
        var mouseX = evt.clientX - left + window.pageXOffset;
        var mouseY = evt.clientY - top + window.pageYOffset;
        return {
          x: mouseX,
          y: mouseY
        };
}

function canvasClick(evt){
	
};

function mat3d(){
	this.data = [0,0,0,0,
				 0,0,0,0,
				 0,0,0,0]
}

function make3d_S(sx,sy,sz){
	var mat3d_m1 = new mat3d();
	//sc 0  0  0
	//0  sc 0  0
	//0  0  sc 0
	mat3d_m1.data[0] = sx;
	mat3d_m1.data[5] = sy;
	mat3d_m1.data[10] = sz;
	return mat3d_m1;
}

function make3d_Rx(angle){
	var mat3d_m1 = new mat3d();
	//1  0    0   0
	//0  cos  sin 0
	//0 -sin  cos 0
	var cos = Math.cos(angle);
	var sin = Math.sin(angle); //возможно считать по формуле sin = +-sqrt(1-cos^2) !(что быстрее?)
	mat3d_m1.data[0] = 1;
	mat3d_m1.data[5] = cos; mat3d_m1.data[6] = sin;
	mat3d_m1.data[9] = -sin; mat3d_m1.data[10] = cos;
	return mat3d_m1;
}

function make3d_Ry(angle){
	var mat3d_m1 = new mat3d();
	// cos 0 sin 0
	// 0   1 0   0
	//-sin 0 cos 0
	var cos = Math.cos(angle);
	var sin = Math.sin(angle); //возможно считать по формуле sin = +-sqrt(1-cos^2) !(что быстрее?)
	mat3d_m1.data[0] = cos; mat3d_m1.data[2] = sin;
	mat3d_m1.data[5] = 1;
	mat3d_m1.data[8] = -sin; mat3d_m1.data[10] = cos;
	return mat3d_m1;
}

function make3d_Rz(angle){
	var mat3d_m1 = new mat3d();
	// cos sin 0 0
	//-sin cos 0 0
	// 0   0   1 0
	var cos = Math.cos(angle);
	var sin = Math.sin(angle);
	mat3d_m1.data[0] = cos;  mat3d_m1.data[1] = sin;
	mat3d_m1.data[4] = -sin; mat3d_m1.data[5] = cos;
	mat3d_m1.data[10] = 1;
	return mat3d_m1;
}

function make3d_T(tx,ty,tz){
	var mat3d_m1 = new mat3d();
	// 1 0 0 tx
	// 0 1 0 ty
	// 0 0 1 tz
	mat3d_m1.data[0] = 1;  mat3d_m1.data[3] = tx;
	mat3d_m1.data[5] = 1;  mat3d_m1.data[7] = ty;
	mat3d_m1.data[10] = 1; mat3d_m1.data[11] = tz;
	return mat3d_m1;
}

function mat3d_mul_MatToMat(mat3d_m1, mat3d_m2){
	var _mat3d  = new mat3d();
	var data1 = mat3d_m1.data;
	var data2 = mat3d_m2.data;
	/*_mat3d.data[0]  = mat3d_m1.data[0]  * mat3d_m2.data[0] + mat3d_m1.data[1]  * mat3d_m2.data[4] + mat3d_m1.data[2]  * mat3d_m2.data[8] + mat3d_m1.data[3]  * mat3d_m2.data[12];
	_mat3d.data[4]  = mat3d_m1.data[4]  * mat3d_m2.data[0] + mat3d_m1.data[5]  * mat3d_m2.data[4] + mat3d_m1.data[6]  * mat3d_m2.data[8] + mat3d_m1.data[7]  * mat3d_m2.data[12];
	_mat3d.data[8]  = mat3d_m1.data[8]  * mat3d_m2.data[0] + mat3d_m1.data[9]  * mat3d_m2.data[4] + mat3d_m1.data[10] * mat3d_m2.data[8] + mat3d_m1.data[11] * mat3d_m2.data[12];
	_mat3d.data[12] = mat3d_m1.data[12] * mat3d_m2.data[0] + mat3d_m1.data[13] * mat3d_m2.data[4] + mat3d_m1.data[14] * mat3d_m2.data[8] + mat3d_m1.data[15] * mat3d_m2.data[12];
	
	_mat3d.data[1]  = mat3d_m1.data[0]  * mat3d_m2.data[1] + mat3d_m1.data[1]  * mat3d_m2.data[5] + mat3d_m1.data[2]  * mat3d_m2.data[9] + mat3d_m1.data[3]  * mat3d_m2.data[13];
	_mat3d.data[5]  = mat3d_m1.data[4]  * mat3d_m2.data[1] + mat3d_m1.data[5]  * mat3d_m2.data[5] + mat3d_m1.data[6]  * mat3d_m2.data[9] + mat3d_m1.data[7]  * mat3d_m2.data[13];
	_mat3d.data[9]  = mat3d_m1.data[8]  * mat3d_m2.data[1] + mat3d_m1.data[9]  * mat3d_m2.data[5] + mat3d_m1.data[10] * mat3d_m2.data[9] + mat3d_m1.data[11] * mat3d_m2.data[13];
	_mat3d.data[13] = mat3d_m1.data[12] * mat3d_m2.data[1] + mat3d_m1.data[13] * mat3d_m2.data[5] + mat3d_m1.data[14] * mat3d_m2.data[9] + mat3d_m1.data[15] * mat3d_m2.data[13];
	
	_mat3d.data[2]  = mat3d_m1.data[0]  * mat3d_m2.data[2] + mat3d_m1.data[1]  * mat3d_m2.data[6] + mat3d_m1.data[2]  * mat3d_m2.data[10] + mat3d_m1.data[3]  * mat3d_m2.data[14];
	_mat3d.data[6]  = mat3d_m1.data[4]  * mat3d_m2.data[2] + mat3d_m1.data[5]  * mat3d_m2.data[6] + mat3d_m1.data[6]  * mat3d_m2.data[10] + mat3d_m1.data[7]  * mat3d_m2.data[14];
	_mat3d.data[10] = mat3d_m1.data[8]  * mat3d_m2.data[2] + mat3d_m1.data[9]  * mat3d_m2.data[6] + mat3d_m1.data[10] * mat3d_m2.data[10] + mat3d_m1.data[11] * mat3d_m2.data[14];
	_mat3d.data[14] = mat3d_m1.data[12] * mat3d_m2.data[2] + mat3d_m1.data[13] * mat3d_m2.data[6] + mat3d_m1.data[14] * mat3d_m2.data[10] + mat3d_m1.data[15] * mat3d_m2.data[14];
	
	_mat3d.data[3]  = mat3d_m1.data[0]  * mat3d_m2.data[3] + mat3d_m1.data[1]  * mat3d_m2.data[7]  + mat3d_m1.data[2]  * mat3d_m2.data[11] + mat3d_m1.data[3]  * mat3d_m2.data[15];
	_mat3d.data[7]  = mat3d_m1.data[4]  * mat3d_m2.data[3] + mat3d_m1.data[5]  * mat3d_m2.data[7]  + mat3d_m1.data[6]  * mat3d_m2.data[11] + mat3d_m1.data[7]  * mat3d_m2.data[15];
	_mat3d.data[11] = mat3d_m1.data[8]  * mat3d_m2.data[3] + mat3d_m1.data[9]  * mat3d_m2.data[7]  + mat3d_m1.data[10] * mat3d_m2.data[11] + mat3d_m1.data[11] * mat3d_m2.data[15];
	_mat3d.data[15] = mat3d_m1.data[12] * mat3d_m2.data[3] + mat3d_m1.data[13] * mat3d_m2.data[7]  + mat3d_m1.data[14] * mat3d_m2.data[11] + mat3d_m1.data[15] * mat3d_m2.data[15];*/
	
	_mat3d.data[0]  = data1[0]  * data2[0] + data1[1]  * data2[4] + data1[2]  * data2[8];
	_mat3d.data[4]  = data1[4]  * data2[0] + data1[5]  * data2[4] + data1[6]  * data2[8];
	_mat3d.data[8]  = data1[8]  * data2[0] + data1[9]  * data2[4] + data1[10] * data2[8];
	
	_mat3d.data[1]  = data1[0]  * data2[1] + data1[1]  * data2[5] + data1[2]  * data2[9];
	_mat3d.data[5]  = data1[4]  * data2[1] + data1[5]  * data2[5] + data1[6]  * data2[9];
	_mat3d.data[9]  = data1[8]  * data2[1] + data1[9]  * data2[5] + data1[10] * data2[9];
	
	_mat3d.data[2]  = data1[0]  * data2[2] + data1[1]  * data2[6] + data1[2]  * data2[10];
	_mat3d.data[6]  = data1[4]  * data2[2] + data1[5]  * data2[6] + data1[6]  * data2[10];
	_mat3d.data[10] = data1[8]  * data2[2] + data1[9]  * data2[6] + data1[10] * data2[10];
	
	_mat3d.data[3]  = data1[0]  * data2[3] + data1[1]  * data2[7]  + data1[2]  * data2[11] + data1[3];
	_mat3d.data[7]  = data1[4]  * data2[3] + data1[5]  * data2[7]  + data1[6]  * data2[11] + data1[7];
	_mat3d.data[11] = data1[8]  * data2[3] + data1[9]  * data2[7]  + data1[10] * data2[11] + data1[11];
	
	return _mat3d;
}
function mat3d_mul_MatToVec(mat3d_m1, vec3_v){
	var vec3_res = new p3();
	var data1 = mat3d_m1.data;
	
	var x = vec3_v.x;
	var y = vec3_v.y;
	var z = vec3_v.z;
	vec3_res.x = data1[0]  * x + data1[1] * y + data1[2]  * z + data1[3];
	vec3_res.y = data1[4]  * x + data1[5] * y + data1[6]  * z + data1[7];
	vec3_res.z = data1[8]  * x + data1[9] * y + data1[10] * z + data1[11];
	return vec3_res;
};
//умножение без сдвига
function mat3d_mul_MatToVecWithoutShift(mat3d_m1, vec3_v){
	var vec3_res = new p3();
	var data1 = mat3d_m1.data;
	
	var x = vec3_v.x;
	var y = vec3_v.y;
	var z = vec3_v.z;
	vec3_res.x = data1[0]  * x + data1[1] * y + data1[2]  * z;
	vec3_res.y = data1[4]  * x + data1[5] * y + data1[6]  * z;
	vec3_res.z = data1[8]  * x + data1[9] * y + data1[10] * z;
	return vec3_res;
};

function transObject(object, mat3d_m){
	//matrix
	var data = mat3d_m.data;
	//object
	var points = object.p3_points;
	var normals = object.normals;

	var p3_shift = new p3(data[3], data[7], data[11]);
	object.p3_center = p3_sum(object.p3_center, p3_shift);
	
	for(let i = 0; i < points.length; ++i){
		points[i] = mat3d_mul_MatToVecWithoutShift(mat3d_m, points[i]);
	}
	for(let i = 0; i < normals.length; ++i){
		normals[i] = mat3d_mul_MatToVecWithoutShift(mat3d_m, normals[i]);
	}
}

function canvasMouseDown(evt){
	isPressed = true;
	var pos = getMousePos(canvas, evt);
	mousePos.x = pos.x;
	mousePos.y = pos.y;
}

function canvasMouseUp(evt){
	isPressed = false;
}

//вызывается слишком часто! нужно сократить до раза в dt (также с остальными функциями)
function canvasMouseMove(evt){
	if(isPressed){
		var pos = getMousePos(canvas, evt);
		var dx = pos.x - mousePos.x;
		var dy = pos.y - mousePos.y;
		fi += dx * 0.001;
		ksi += dy * 0.001
		mousePos.x = pos.x;
		mousePos.y = pos.y;	
	}
};

//можно отлавливать только keydown and keyup
function canvasKeyPress(evt){
	var p3_vec = new p3(0,0,0);
	var a = 0.5;
	switch(evt.key){
		case 'w':{
			p3_vec.z += a;
			break;
		}
		case 's':{
			p3_vec.z -= a;
			break;
		}
		case 'a':{
			p3_vec.x += a;
			break;
		}
		case 'd':{
			p3_vec.x -= a;
			break;
		}
		case 'v':{
			p3_vec.y += a;
			break;
		}
		case 'c':{
			p3_vec.y -= a;
			break;
		}
	}
	var mat1 = make3d_Ry(-fi);
	p3_vec = mat3d_mul_MatToVec(mat1, p3_vec);
	playerPos = p3_sum (playerPos, p3_vec);
}

window.onload = function(){
	CC = new color(0, 255, 0, 255);
	canvas = document.getElementById('canvas');
	context = canvas.getContext('2d');
	outText = document.getElementById('outText');
	map = document.getElementById('map');
	mapContext = map.getContext('2d');
	
	sizeY = canvas.height;
	sizeX = canvas.width;
	
	
	YXbuffer = Array(sizeY);
	for(var i = 0; i < sizeY; ++i){
		YXbuffer[i] = [];
	}
	//YXbuffer[5].push(3);
	//alert(YXbuffer[5]);
	
	//const length = 12;
	//wBuffer = Array(12).fill(0);
	
	//alert(arr);
	
	myImageData = context.createImageData(canvas.width, canvas.height);
	buffer = myImageData.data;
	
	arr = [];
	arr.push(new p2(1,1));
	arr.push(new p2(150,100));
	arr.push(new p2(250,100));
	arr.push(new p2(345,125));
	arr.push(new p2(345,75));
	fillPoly(arr);
	
	
	//CC = new color(255,0,0,255);
	//arr.push(new p2(300,400));
	//fillPoly(arr);
	
	//context.fill();
	/*for(var i=canvas.height*12;i<canvas.height*12+canvas.width*4;i+=4){
		buffer[i] = 123;
		buffer[i+1] = 123;
		buffer[i+2] = 123;
		buffer[i+3] = 120;
	}*/
	
	//var point1 = new p2(350,350);
	//var point2 = new p2(900,-35);
	//line(point1.x, point1.y, point2.x, point2.y);
/*	var t1;
	var t2;
	var sum = 0;*/
	//for(var k = 0;k < 20; k++){
//		t1 = performance.now();
		/*for(var i = 0;i < 2000000; ++i){
			line(Math.random()*1200-300, Math.random()*1200-300, Math.random()*1200-300, Math.random()*1200-300);
		}*/
//		t2 = performance.now() - t1;
//		sum += t2;
	//}
	//alert(sum/20);
	context.putImageData(myImageData,0,0);
	
	//context.fillRect(point1.x, point1.y, 1, 1);
	//context.fillRect(point2.x, point2.y, 1, 1);
	for(var i = 0; i < arr.length; ++i){
		context.fillRect(arr[i].x, arr[i].y, 2, 2);
	}
	context.stroke();
	context.fill();
	/*canvas.onmousedown = canvasMouseDown;
	canvas.onmouseup = canvasMouseUp;
	canvas.onmousemove = canvasMouseMove;
	window.onkeydown = canvasKeyPress;
	
	playerPos = new p3(0,0,-7);
	
	fov = 30;
	z0 = 0;
	//alert(z0);
	fi = 0;
	ksi = 0;
	h = 1;
	
	objects = [];
	var c = new cube({x:0, y:0, z:0}, 'red');
	var k = new cube({x:0, y:10, z:45}, 'green');
	var mat = make3d_S(40,40,40);
	transObject(c, mat);
	mat = make3d_S(20,20,20);
	transObject(k, mat);
	objects.push(c);
	//objects.push(k);
	
	calcAllNormals();
    timer = setTimeout(function(){updateFrame(new Date());}, 10);*/
	
}

function PutPixel(addr, color){
	buffer[addr] = color.R;
	buffer[addr + 1] = color.G;
	buffer[addr + 2] = color.B;
	buffer[addr + 3] = color.A;
}

function fillBuffer(start, count, color) {
	start <<= 2; count <<= 2;
	var end = start + count;
	for (var i = start; i < end; i += 4) {
		PutPixel(i, color);
	}
}

function vLine(x1, y1, y2){
	if (y1 > y2) {
		let tmp = y2;
		y2 = y1;
		y1 = tmp;
	}
	//отсечение
	if ((x1 < 0)||(x1 >= sizeX)) return;
	y1 = (y1 > 0) ? y1 : 0; //max(y1, 0);
	y2 = (y2 < (sizeY - 1)) ? y2 : (sizeY - 1); //min(y2, (sizeY - 1));
	
	//!переменные уже упорядочены, 
	//!но внутри drawVLine находится 
	//!лишняя проверка на порядок переменных
	
	//можно продублировать код, но без проверки
	drawVLine(x1, y1, y2);
}

function drawVLine(x1, y1, y2) {
	//в некоторых вызовах проверка лишняя
	if (y1 > y2) {
		let tmp = y2;
		y2 = y1;
		y1 = tmp;
	}
	
	var a = (y1 * sizeX + x1) << 2; //*4
	const aend = (y2 * sizeX + x1) << 2;
	
	//ставим точку в начальной позиции
	PutPixel(a, CC);
	
	const delta = sizeX << 2;
	while (a != aend) {
		a += delta;
		//можно развернуть и получить прирост (меньше процента),
		//в тестах кеша хватало для хранения всей функции line,
		//при реальном исполнении возможно кеш будет переполнен
		//!проверить в тестах в реальном исполнении!
		PutPixel(a, CC);
	}
}

function coding(x, y) {
	var code = 0;
	if (x < 0) code |= (1 << 3);
	else if (x >= sizeX) code |= (1 << 2);

	if (y < 0) code |= (1 << 1);
	else if (y >= sizeY) code |= (1 << 0);
	return code;
}

function cut(x1, y1, x2, y2) {
	var c1 = coding(x1, y1);
	var	c2 = coding(x2, y2);
	var inside = !(c1 | c2);
	//!возможно ли использование битов в с1 и с2?!
	while (!inside && (!(c1 & c2))) {
		if (c1 == 0) {
			let temp = x1;
			x1 = x2;
			x2 = temp;

			temp = y1;
			y1 = y2;
			y2 = temp;

			temp = c1;
			c1 = c2;
			c2 = temp;
		}
		if (x1 < 0/*c1 & (1 << 3)*/) {
			y1 = y1 + (y2 - y1) / (x2 - x1) * (-x1);
			y1 <<= 0;
			x1 = 0;
			//c1 &= ~(1 << 3);
		}
		else if (x1 > (sizeX - 1)/*c1 & (1 << 2)*/) {
			y1 = y1 + (y2 - y1) / (x2 - x1) * ((sizeX - 1) - x1);
			y1 <<= 0;
			x1 = (sizeX - 1);
			//c1 &= ~(1 << 2);
		}
		else if (y1 < (sizeY - 1)/*c1 & (1 << 1)*/) {
			x1 = x1 + (x2 - x1) / (y2 - y1) * ((sizeY - 1) - y1);
			x1 <<= 0;
			y1 = (sizeY - 1);
			//c1 &= ~(1 << 1);
		}
		else {
			x1 = x1 + (x2 - x1) / (y2 - y1) * (-y1);
			x1 <<= 0;
			y1 = 0;
			//c1 &= ~(1 << 0);
		}
		c1 = coding(x1, y1);
		inside = !(c1 | c2);
	}
	var result = {inside:true, x1:x1, y1:y1, x2:x2, y2:y2};
	if (inside)result.inside = true;
	else result.inside = false;
	
	return result;
}

function getParamsForBrezenhem(x1, y1, x2, y2){
	const t = y2 - y1;
	const dy = (t >= 0) ? t : -t; //dy=abs(dy);
	const dx = x2 - x1;

	//!возможно заменить тип на const!
	var d1, d2, d, z1, z2;
	if (dy <= dx) {
		d = (dy << 1) - dx; //2*dy-dx; просчитываем d1
		d1 = (dy - dx) << 1; //2*(dy - dx);
		d2 = dy << 1; // 2 * dy;
		if (t > 0) {
			z1 = (sizeX + 1);//y++, x++;
			z2 = 1;//x++;
		}
		else /*if (t < 0)*/ {
			z1 = (1 - sizeX); //y--, x++
			z2 = 1; //x++
		}
	}
	else {
		d = (dx << 1) - dy; //2*dy-dx;
		d1 = (dx - dy); //2*(dy - dx);
		d2 = dx; // 2 * dy;
		if (t > 0) {
			z1 = (sizeX + 1);//y++, x++;
			z2 = sizeX;//y++;
		}
		else /*if (t < 0)*/ {
			z1 = (1 - sizeX);//y--, x++;
			z2 = (-sizeX);//y--;
		}
	}
	return {d1:d1, d2:d2, d:d, z1:z1, z2:z2};
}

function line(x1, y1, x2, y2) {
	var res = cut(x1<<0, y1<<0, x2<<0, y2<<0);
	if(!res.inside)return;
	x1 = res.x1; y1 = res.y1;
	x2 = res.x2; y2 = res.y2;
	drawLine(x1, y1, x2, y2);
}

function drawLine(x1, y1, x2, y2){
	//Algorithm Brezenhem	
	if (x1 > x2) {
		let tmp;
		tmp = x1;
		x1 = x2;
		x2 = tmp;

		tmp = y1;
		y1 = y2;
		y2 = tmp;
	}
	else if (x1 == x2) {
		//т.к. clip уже был, то осталось отрисовать (не вызываем vLine)
		drawVLine(x1, y1, y2);
		return;
	}
	var a = (y1 * sizeX + x1) << 2;
	
	if(y1 == y2){
		fillBuffer(a, x2 - x1 + 1, CC);
		return;
	}
	const aend = (y2 * sizeX + x2) << 2;
	var params = getParamsForBrezenhem(x1, y1, x2, y2);
	
	var d = params.d;
	const d1 = params.d1; const d2 = params.d2;
	const z1 = params.z1 << 2; const z2 = params.z2 << 2;
	
	//ставим точку в начальной клетке d0
	PutPixel(a, CC);
	
	while (a != aend) {
		if (d > 0) {
			a += z1; //координата точки, которую поставим на текущей итерации
			d += d1; //расчет следующей итерации
		}
		else {
			a += z2;
			d += d2;
		}
		PutPixel(a, CC);
	}
}

/*function vLineYXBuffer(x1, y1, y2){
	
}*/

//помещает в YXbuffer крайнюю левую точку для каждого y,
//кроме точки с минимальным y
function fillYXBuffer(x1, y1, x2, y2){
		//Algorithm Brezenhem
	if(y1 == y2){
		return;
	}
	if (x1 > x2) {
		let tmp;
		tmp = x1;
		x1 = x2;
		x2 = tmp;

		tmp = y1;
		y1 = y2;
		y2 = tmp;
	}
	/*else if (x1 == x2) {
		vLineYXBuffer(x1, y1, y2);
		return;
	}*/
	
	const t = y2 - y1;
	const dy = (t >= 0) ? t : -t; //dy=abs(dy);
	const dx = x2 - x1;

	if (dy <= dx) {
		var d = (dy << 1) - dx; //2*dy-dx;
		const d1 = (dy - dx) << 1; //2*(dy - dx);
		const d2 = dy << 1; // 2 * dy;
		if (t > 0) {
			YXbuffer[y1].push(x1);
			while (y1 < y2 - 1) {
				if (d > 0) {
					x1++; y1++;
					YXbuffer[y1].push(x1);
					d += d1; //расчет следующей итерации
				}
				else {
					x1++;
					d += d2;
				}
			}
			
		}
		else /*if (t < 0)*/ {
			while (y1 > y2) {
				if (d > 0) {
					y1--;
					x1++;
					YXbuffer[y1].push(x1);
					d += d1; //расчет следующей итерации
				}
				else {
					x1++;
					d += d2;
				}
			}
		}
	}
	else {
		var d = (dx << 1) - dy; //2*dy-dx;
		const d1 = (dx - dy) << 1; //2*(dy - dx);
		const d2 = dx << 1; // 2 * dy;
		if (t > 0) {
			YXbuffer[y1].push(x1);
			while (y1 < y2 - 1) {
				if (d > 0) {
					x1++; y1++;
					d += d1; //расчет следующей итерации
				}
				else {
					y1++;
					d += d2;
				}
				YXbuffer[y1].push(x1);
			}
		}
		else /*if (t < 0)*/ {		
			while (y1 > y2) {
				if (d > 0) {
					x1++; y1--;
					d += d1; //расчет следующей итерации
				}
				else {
					y1--;
					d += d2;
				}
				YXbuffer[y1].push(x1);
			}
		}
	}
}
//по возрастанию
function sort(array){
	var flag;
	for(var i = 0; i < array.length; ++i){
		flag = true;
		for(var j = 1; j < array.length - i; ++j){
			if(array[j - 1] > array[j]){
				var tmp = array[j - 1];
				array[j - 1] = array[j];
				array[j] = tmp;
				flag = false;
			}
		}
		if(flag)break;
	}
}

//!перед использованием обрезать полигон по экрану!
//закрашивает внутреннюю область и контур с левой и верхней стороны
//(правую и нижнюю сторону отрисовывают другие полигоны)
function fillPoly(p2Poly_array){
	//YX algorithm
	var p2_point1 = p2Poly_array[p2Poly_array.length - 1];
	var ymin, ymax;
	ymax = ymin = p2_point1.y;
	for(var i = 0; i < p2Poly_array.length; ++i){
		p2_point2 = p2Poly_array[i];
		if(p2_point2.y < ymin)ymin = p2_point2.y;
		if(ymax < p2_point2.y)ymax = p2_point2.y;
		fillYXBuffer(p2_point1.x, p2_point1.y, p2_point2.x, p2_point2.y);
		p2_point1 = p2_point2;
	}
	
	for(var y = ymin; y < ymax; y++){
		var arr = YXbuffer[y];
		sort(YXbuffer[y]);
		//alert("y: " + y + " x: " + YXbuffer[y]);
		for(var j = 0; j <= arr.length; j += 2){
			fillBuffer(y*sizeX + arr[j], arr[j + 1] - arr[j], CC);
		}
	}
	
	for(var y = ymin; y <= ymax; ++y){
		YXbuffer[y].length = 0;
	}
}

function parseToScreen(p3_point){
	var znam = 1 / p3_point.z;
	var rx = -(p3_point.x * znam + 1) * (sizeX >> 1);
	var ry = -p3_point.y * znam * (sizeX >> 1) + sy;
	return new p2(rx, ry);
}

function p3_sub(p3_point1, p3_point2){
	return new p3(p3_point1.x - p3_point2.x,
				  p3_point1.y - p3_point2.y,
				  p3_point1.z - p3_point2.z);
}

function p3_sum(p3_point1, p3_point2){
	return new p3(p3_point1.x + p3_point2.x,
				  p3_point1.y + p3_point2.y,
				  p3_point1.z + p3_point2.z);
}

function p3_mul(p3_point, value){
	return new p3(p3_point.x * value,
				  p3_point.y * value,
				  p3_point.z * value);
}

function vector_product2(p1, p2){
	//return new p3(y1*z2-y2*z1,x2*z1-x1*z2,x1*y2-x2*y1);
	return new p3(p1.y*p2.z - p2.y*p1.z, p2.x*p1.z - p1.x*p2.z, p1.x*p2.y - p2.x*p1.y);
}

function scalar_product2(p1, p2){
	return p1.x * p2.x + p1.y * p2.y + p1.z * p2.z;
}

function p3_assign(p3_point1, p3_point2){
	p3_point1.x = p3_point2.x;
	p3_point1.y = p3_point2.y;
	p3_point1.z = p3_point2.z;
}

/*function сlipPolyOnFaceSide(p3Poly_array, p3_normal, d){
	
}*/

//можно передавать не индекс а сам обьект, экономия двух переменных
function renderObject(index, mat3d_pre_trans){
	//right version
	/*var obj = objects[index];
	var points = obj.p3_points;
	var facets = obj.facets;
	
	//массив на points.length элементов
	//храним координаты точек на картинной плоскости 
	//и в пространстве
	var transCoord2d = [];
	var transCoord3d = [];
	for(var j = 0; j < facets.length; j++){
		//возможно ли совместить mat3d_pre_trans с матрицей проецирования?
		var cur_facet = facets[j];
		var pointFacet = p3_sum(points[cur_facet[0]], obj.p3_center);
		var l = p3_sub(playerPos, pointFacet);
		var n = obj.normals[j];
		//проверка на лицевую грань
		if(scalar_product2(n,l) > 0){
			var p2_point1; var p2_point2;
			
			var number_point1 = cur_facet[cur_facet.length - 1];
			if(transCoord2d[number_point1] == undefined){
				var p3_point1 = p3_sum(points[number_point1], obj.p3_center);
				p3_point1 = mat3d_mul_MatToVec(mat3d_pre_trans, p3_point1);
				p2_point1 = parseToScreen(p3_point1);
				
				transCoord2d[number_point1] = p2_point1;
			}
			else{
				p2_point1 = transCoord2d[number_point1];
			}
			
			for(var k = 0; k < cur_facet.length; k++){
				var number_point2 = cur_facet[k];
				if(transCoord2d[number_point2] == undefined){
					var p3_point2 = p3_sum(points[number_point2], obj.p3_center);
					p3_point2 = mat3d_mul_MatToVec(mat3d_pre_trans, p3_point2);
					p2_point2 = parseToScreen(p3_point2);
				
					transCoord2d[number_point2] = p2_point2;
				}
				else{
					p2_point2 = transCoord2d[number_point2];
				}
		
				//outText.textContent = "delta: " + p3_delta1.x + " " + p3_delta1.y + " " + p3_delta1.z+"\n"+"playerPos: " + playerPos.x + " " + playerPos.y + " " + playerPos.z;
				//необходимо заменить массивом, содержащим проекции граней
				context.moveTo(p2_point1.x, p2_point1.y);
				context.lineTo(p2_point2.x, p2_point2.y);
				
				p2_point1 = p2_point2;
			}
		}
	}*/
	/*..............................................*/
	var obj = objects[index];
	var points = obj.p3_points;
	var facets = obj.facets;
	
	//массив на points.length элементов
	//храним координаты точек на картинной плоскости 
	var transCoord2d = [];
	//и в пространстве
	var transCoord3d = [];
	//!выше возможно образование дыр!
	
	for(var j = 0; j < facets.length; ++j){
		//возможно ли совместить mat3d_pre_trans с матрицей проецирования?
		//!!!возможно ли использование одного number_point?
		var cur_facet = facets[j];
		
		var pointFacet = p3_sum(points[cur_facet[0]], obj.p3_center);
		var l = p3_sub(playerPos, pointFacet);
		var n = obj.normals[j];
		//проверка на лицевую грань
		if(scalar_product2(n,l) > 0){
			//координаты точек на картинной плоскости
			//нужен для отрисовки
			var poly2d = [];
			
			var p2_point1; var p2_point2;
			var p3_point1; var p3_point2;
			
			var number_point1 = cur_facet[cur_facet.length - 1];
			if(transCoord3d[number_point1] == undefined){
				p3_point1 = p3_sum(points[number_point1], obj.p3_center);
				p3_point1 = mat3d_mul_MatToVec(mat3d_pre_trans, p3_point1);
				transCoord3d[number_point1] = p3_point1;
			}
			else{
				p3_point1 = transCoord3d[number_point1];
			}
			
			if(p3_point1.z > h){
				if(transCoord2d[number_point1] == undefined){
					p2_point1 = parseToScreen(p3_point1);
					transCoord2d[number_point1] = p2_point1;
				}
				else{
					p2_point1 = transCoord2d[number_point1];
				}
				poly2d.push(p2_point1);
			}
			
			for(var k = 0; k < cur_facet.length; ++k){
				var number_point2 = cur_facet[k];
				if(transCoord3d[number_point2] == undefined){
					p3_point2 = p3_sum(points[number_point2], obj.p3_center);
					p3_point2 = mat3d_mul_MatToVec(mat3d_pre_trans, p3_point2);
					transCoord3d[number_point2] = p3_point2;
				}
				else{
					p3_point2 = transCoord3d[number_point2];
				}
				
				//возможен случай, когда одна из точек лежит на плоскости, то есть она будет дважды добавлена в poly2d
				//вроде бы исправлено
				if((p3_point2.z > h)^(p3_point1.z > h)){
					var t = (h - p3_point1.z)/(p3_point2.z - p3_point1.z);
					var delta = p3_sub(p3_point2, p3_point1);
					
					//p3_cross = p1 + delta*t;
					var p3_cross = p3_mul(delta,t);
					p3_cross = p3_sum(p3_point1, p3_cross);
					
					p2_cross = parseToScreen(p3_cross);
					poly2d.push(p2_cross);
				}
				
				if(p3_point2.z > h){
					if(transCoord2d[number_point2] == undefined){
						p2_point2 = parseToScreen(p3_point2);
						transCoord2d[number_point2] = p2_point2;
					}
					else{
						p2_point2 = transCoord2d[number_point2];
					}
					poly2d.push(p2_point2);
				}
				p3_point1 = p3_point2;
			}
			//вывод poly2d
			if(poly2d.length > 0){
				var p1 = poly2d[poly2d.length - 1];
				context.beginPath();
				context.fillStyle = obj.color;
				context.moveTo(p1.x, p1.y);
				for(var i = 0; i < poly2d.length; i++){
					var p2 = poly2d[i];
					context.lineTo(p2.x, p2.y);
					context.fill();
					p1 = p2;
				}
				context.stroke();
			}
		}
	}
}


/*function clearWBuffer(){
	for(var i = 0; i < wBuffer.length; ++i){
		//можно обращаться не поэлементно, а поадресно
		wBuffer.length[i] = 0;
		//var addr = wBuffer;
		//var end = addr+WBuffer.length*4;
		//while(addr!=end){
			//addr
		//}
	}
}*/

function render(){
	context.clearRect(0, 0, canvas.width, canvas.height);
	context.beginPath();
	context.strokeStyle = "black";
	
	//clearWBuffer(); 
	
	var T = make3d_T(-playerPos.x, -playerPos.y, -playerPos.z);
	var Ry = make3d_Ry(fi);
	var Rx = make3d_Rx(ksi);
	var transMatrix = mat3d_mul_MatToMat(Ry,T);
	transMatrix = mat3d_mul_MatToMat(Rx, transMatrix);
	
	for(var i = 0; i < objects.length; ++i){
		renderObject(i, transMatrix);
	}
	context.stroke();
}

function renderMap(){
	mapContext.clearRect(0, 0, canvas.width, canvas.height);
	mapContext.beginPath();
	mapContext.strokeStyle = "black";
	var mat1 = make3d_Ry(fi);
	for(var i = 0; i < objects.length; ++i){
		var obj = objects[i];
		var p3_vec = p3_sub(obj.p3_center, playerPos);
		p3_vec = mat3d_mul_MatToVec(mat1, p3_vec);
		var p2_pos = new p2(-p3_vec.x, -p3_vec.z);
		p2_pos.x += map.width/2;
		p2_pos.y += map.height/2;
		mapContext.fillRect(p2_pos.x, p2_pos.y, 2, 2);
	}
	mapContext.fillRect(map.width/2, map.height/2, 2, 2);
	mapContext.stroke();
};



//изменить...........
document.addEventListener('pointerlockchange', lockStatusChange, false);

function lockStatusChange(){
  if(document.pointerLockElement === canvas){
    canvas.addEventListener("mousemove", updateCirclePosition, false);
  }
  else{
    canvas.removeEventListener("mousemove", updateCirclePosition, false);
  }
}

function updateCirclePosition(e){
  fi += e.movementX*0.001;
  ksi += e.movementY*0.001;
}
//.............

function Play(){
	canvas.requestPointerLock();
}


function updateFrame(last_time){
	var data = context.getImageData(0,0,20,20);
	var ctime = new Date();
	var timediff = ctime.getTime() - last_time.getTime();
	var T = 5;
	var w = 2*Math.PI/T;
	var T = make3d_T(0,0,timediff/100);
	var R = make3d_Rx(w*timediff/1000);
	var m = mat3d_mul_MatToMat(R,T);
	//transObject(objects[0], m);
	//render
	//var value = (fi * 180 / Math.PI)
	//outText.textContent = "fi: " + value;
	render();
	renderMap();
	var ct = new Date();
	var t = ct.getTime() - ctime.getTime();
	timer = setTimeout(function(){ updateFrame(ctime); }, 10);
}



