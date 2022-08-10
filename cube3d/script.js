var canvas;
var context;
var timer;
var mousePos = {x:0,y:0};
const objects = [];
var playerPos;
var z0;
var wBuffer;
var map;
var mapContext;
var isPressed;
var buffer;
var myImageData;

var CC;
var BC;
var black;
var temp_color;

const p3_player_dir = new p3(0,0,0);
var speed = 0.05;

const pressedKeys = new Array(3);

var dir_light;
var Ir;
var In;

var times;

var q;
var _w;
var e;

var sizeX;
var sizeY;
var hsizeX;//sizeX/2
var hsizeY;//sizeY/2


const YXbuffer = [];

//global - true -> масштабирование текстуры по глобальным координатам
//global - false -> масштабирование текстуры по локальным координатам
//size_texture = 1 << shift_size; Example shift_size = 5 -> texture is 32*32
//если глобал равно тру, то скейл есть размер в единичных векторах
//если глобал равно фолс, то скейл есть количество пикселов, убирающихся в длину одного ребра 
function texture(data, shift_size, global, scale){
	this.data = data;
	this.shift_size = shift_size;
	this.global = global;
	this.scale = scale;
};
//общий массив текстур
const textures = [];

//максимальное кол-во вершин на грань
const max_vertex = 6;
const p2Poly_array1 = [];
const p2Poly_array2 = [];
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

/*function facet{
	
	this.texture();
}*/

class object{
	constructor(p3_start, txt){
		this.p3_center = new p3(p3_start.x, p3_start.y, p3_start.z);
		this.txt = txt;
		this.p3_points = [];
		this.facets = [];
		this.normals = [];
	}
}

//должен быть унаследован от object
class cube extends object{
	constructor(p3_start, txt){
		super(p3_start, txt);
		this.p3_points = [  new p3( 0.5, -0.5,  0.5),
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
		this.facets = [ [2,1,0,3], //передняя
						[7,4,5,6], //задняя
						[0,1,5,4], //нижняя
						[2,3,7,6], //верхняя
						[6,5,1,2], //правая
						[3,0,4,7] //левая
						];
	}
};

function p3_norm(p3_point){
	return Math.sqrt(p3_point.x*p3_point.x+p3_point.y*p3_point.y+p3_point.z*p3_point.z);
}

function p3_normalize_self(p3_point){
	const k = Math.sqrt(p3_point.x*p3_point.x+p3_point.y*p3_point.y+p3_point.z*p3_point.z)
	p3_point.x *= k;
	p3_point.y *= k;
	p3_point.z *= k;
}

function calcAllNormals(){
	//вычисление нормалей объектов
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
			p3_mul_self(normals[j], 1/p3_norm(normals[j]));
		}
	}
	//нормировка вектора, отвечающего за свет
	p3_mul_self(dir_light, 1/p3_norm(dir_light));
	
}

/*function calcColorForStaticObjects(){
	for(var i = 0; i < objects.length; ++i){
		var obj = objects[i];
		var facets = obj.facets;
		const color_true = obj.color_true;
		for(var j = 0; j < facets.length; ++j){
			
		}
	}
}*/

//function calcColorForStaticObjects(){}

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
	var pos = getMousePos(canvas, evt);
	//alert(q+" "+_w+" "+e);
//	var x = ;
	//var y =;
	//alert()
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
		normals[i] = p3_mul(normals[i], 1/p3_norm(normals[i]));
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

//необходима нормировка player_dir
function canvasKeyDown(evt){
		//console.log(evt.key);
		//var flag = true;
		switch(evt.key){
			case 'w':{
				if(pressedKeys[0] != 'w'){
					pressedKeys[0] = 'w';
					p3_player_dir.z = 1;
				}
				break;
			}
			case 's':{
				if(pressedKeys[0] != 's'){
					pressedKeys[0] = 's';
					p3_player_dir.z = -1;
				}
				break;
			}
			case 'a':{
				if(pressedKeys[1] != 'a'){
					pressedKeys[1] = 'a';
					p3_player_dir.x = 1;
				}
				break;
			}
			case 'd':{
				if(pressedKeys[1] != 'd'){
					pressedKeys[1] = 'd';
					p3_player_dir.x = -1;
				}
				break;
			}
			case 'v':{
				if(pressedKeys[2] != 'v'){
					pressedKeys[2] = 'v';
					p3_player_dir.y = 1;
				}
				break;
			}
			case 'c':{
				if(pressedKeys[2] != 'c'){
					pressedKeys[2] = 'c';
					p3_player_dir.y = -1;
				}
				break;
			}
			default: flag = false;
		}
		//p3_norm(p3_player_dir)!=0
		//if(flag) p3_mul_self(p3_player_dir, 1/p3_norm(p3_player_dir));
}

function canvasKeyUp(evt){
	var flag = true;
	switch(evt.key){
		case 'w':
			if(pressedKeys[0] == 'w'){
				pressedKeys[0] = undefined;
				p3_player_dir.z = 0;
			}
			break;
		case 's':
			if(pressedKeys[0] == 's'){
				pressedKeys[0] = undefined;
				p3_player_dir.z = 0;
			}
			break;
		case 'a':
			if(pressedKeys[1] == 'a'){
				pressedKeys[1] = undefined;
				p3_player_dir.x = 0;
			}
			break;
		case 'd':
			if(pressedKeys[1] == 'd'){
				pressedKeys[1] = undefined;
				p3_player_dir.x = 0;	
			}
			break;
		case 'v':
			if(pressedKeys[2] == 'v'){
				pressedKeys[2] = undefined;
				p3_player_dir.y = 0;
			}
			break;
		case 'c':
			if(pressedKeys[2] == 'c'){
				pressedKeys[2] = undefined;
				p3_player_dir.y = 0;
			}
			break;
		default: flag = false;
	}
	//нужно вызывать, если нажата одна из кнопок выше
	/*if(flag){
		let n = p3_norm(p3_player_dir);
		if(n > 0) p3_mul_self(p3_player_dir, speed/n);
	}*/
};

var _myImg;


/*function qwe(a, b, c, d, xmin, xmax){
	if(xmin > xmax){
		let tmp = xmin;
		xmin = xmax;
		xmax = tmp;
	}
	var arr = [];
	if((a*d-b*c) > 0){
		x = xmax;
		arr.push(x);
		while(x > xmin){
			var v1 = Math.abs((4*eps*Math.pow(c*x+d, 3))/(c*(a*d-b*c)));
			var val = x - Math.ceil(Math.sqrt(v1));
			val = Math.min(val, x - 1);
			x = Math.max(val, xmin);
			arr.push(x);
		}
		arr.reverse();
	}
	else if ((a*d-b*c) < 0){
		x = xmin;
		arr.push(x);
		while(x < xmax){
			var v1 = Math.abs((4*eps*Math.pow(c*x+d, 3))/(c*(a*d-b*c)));
			var val = x + Math.floor(Math.sqrt(v1));
			val = Math.max(val, x + 1);
			x = Math.min(val, xmax);
			arr.push(x);
		}
		alert(3);
	}
	else{
		arr.push(xmin);
		arr.push(xmax);
	}
	return arr;
}*/

const eps = 0.04;

var zxc = -1;
var speedText;

function fast_sqrt(a/*, x1*/){
	var x = 127;
	//a = a << 10;
	/*for(var i = 0; i < 6; ++i){
		x = (x + a/x) / 2;
	}*/
	x = (x + a/x)<<1;
	return x;
}
window.onload = function(){
	/*var a = 56;
	var t1,t2,t3;
	var delta1, delta2;
	var i;
	t1 = performance.now();
	for(i = 0; i < 20000; ++i){
		var k = Math.sqrt(a);
		//alert(k);
	}
	t2 = performance.now();
	delta1 = t2-t1;
	
	t2 = performance.now();
	for(i = 0; i < 20000; ++i){
		var k = (127 + a/127)<<1;
	}
	t3 = performance.now();
	delta2 = t3-t2;
	alert(delta1+" "+delta2);*/
	/*var index = 0;
	var common_error = 1000000;
	for(var x1 = 1; x1 < 3000; ++x1){
		var error = -1;
		for(var k = 1; k < 2000; ++k){
			var a = k*k;
			var res = fast_sqrt(a, x1);
			error = Math.max(error, Math.abs(res - k));
			//alert(a+" "+res);
			//if(Math.abs(k - res) > 1)alert(k+" "+res);
		}
		if(error < common_error){
			common_error = error;
			index = x1;
		}
	}
	alert(index+" "+common_error);*/
	
	/*canvas = document.getElementById('canvas');
	context = canvas.getContext('2d');*/
	
	/*var a, b, c, d, xmin, xmax;
	a = -2.3;
	b = 3;
	c = 2;
	d = 4;
	xmin = 0;
	xmax = 20;
	var arr = qwe(a,b,c,d,xmin,xmax);
	alert(arr);*/
	
	/*context.strokeStyle = "black";
	context.moveTo(xmin*10, 300-30*f(xmin));
	for(var x = xmin; x <= xmax; ++x){
		context.lineTo(x*10, 300-30*f(x));
	}
	context.stroke();
	
	context.beginPath();
	context.strokeStyle = "red";
	context.moveTo(arr[0]*10, 300-30*f(arr[0]));
	for(var i = 0; i < arr.length; ++i){
		context.lineTo(arr[i]*10, 300-30*f(arr[i]));
	}
	context.stroke();*/
	
	
	/*var i;
	var p1 = 0;
	var p2 = {value:0};
	var t1 ,t2;
	var delta1, delta2;
	for(i = 0; i < 100; ++i){
		++p1;
	}
	t1 = performance.now();
	for(i = 0; i < 10000000; ++i){
		++p1;
	}
	t2 = performance.now();
	delta1 = t2 - t1;
	for(i = 0; i < 100; ++i){
		++p2.value;
	}
	t1 = performance.now();
	for(i = 0; i < 10000000; ++i){
		++p2.value;
	}
	t2 = performance.now();
	delta2 = t2 - t1;
	alert(delta1 + " " + delta2);*/
	
	const size = (max_vertex << 1) + 1;
	for(var i = 0; i < size; ++i) p2Poly_array1.push(new p2());
	for(var i = 0; i < size; ++i) p2Poly_array2.push(new p2());
	
	temp_color = new color(0, 0, 0, 255);
	
	var data = [];
	data.push(255);
	data.push(0);
	data.push(0);
	data.push(255);
	data.push(0);
	data.push(255);
	data.push(0);
	data.push(255);
	data.push(0);
	data.push(0);
	data.push(255);
	data.push(255);
	data.push(255);
	data.push(255);
	data.push(0);
	data.push(255);
	//data, shift_size, global, scale
	textures.push(new texture(data, 1, false, 1 << 1));
		
	dir_light = new p3(1,2,1);
	Ir = 170;
	In = 85;
	
	times = [];

	CC = new color(20, 200, 20, 255);
	BC = new color(255,255,255,255);
	black = new color(0,0,0,255);
	
	canvas = document.getElementById('canvas');
	context = canvas.getContext('2d');
	outText = document.getElementById('outText');
	map = document.getElementById('map');
	mapContext = map.getContext('2d');
	speedText = document.getElementById("speedText");
	
	sizeY = canvas.height;
	sizeX = canvas.width;
	hsizeX = sizeX/2;
	hsizeY = sizeY/2;
	
	//возможны другие способы заполнения
	for(var i = 0; i < sizeY; ++i){
		YXbuffer.push(new Array());
	}
	
	myImageData = context.createImageData(canvas.width, canvas.height);
	buffer = myImageData.data;
	
	wBuffer = Array(sizeX * sizeY);
	
	canvas.onmousedown = canvasMouseDown;
	canvas.onmouseup = canvasMouseUp;
	canvas.onmousemove = canvasMouseMove;
	window.onkeydown = canvasKeyDown;
	window.onkeyup = canvasKeyUp;
	canvas.onclick = canvasClick;
	
	playerPos = new p3(-30, 16, -25);
	
	fov = 30;
	z0 = 0;
	fi = -1.3;
	ksi = 0;
	h = 1;
	
	var c = new cube({x:0, y:0, z:0}, texture[0]);
	var k = new cube({x:0, y:10, z:25}, texture[0]);
	var y = new cube({x:0, y:15, z:50}, texture[0]);
	var f = new cube({x:5, y:20, z:75}, texture[0]);
	var mat = make3d_S(40,40,40);
	var Rx = make3d_Rx(1.2);
	transObject(c, mat);
	mat = make3d_S(20,20,20);
	//mat = mat3d_mul_MatToMat(Rx,mat);
	transObject(k, mat);
	transObject(y, mat);
	transObject(f, mat);
	objects.push(c);
	objects.push(k);
	objects.push(y);
	objects.push(f);
	
	calcAllNormals();
    timer = setTimeout(function(){updateFrame(new Date());}, 10);
	
}

function clearWBuffer(){
	const n = wBuffer.length;
	for(var i = 0; i < n; ++i){
		wBuffer[i] = 0;
	}
}

function PutPixel(addr, color){
	buffer[addr] = color.R;
	buffer[addr + 1] = color.G;
	buffer[addr + 2] = color.B;
	buffer[addr + 3] = color.A;
}

function fillBuffer(start, count, color) {
	const end = start + count;
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
	//var inside = !(c1 | c2);
	while ((c1 | c2) && !(c1 & c2)) {
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
		if (x1 < 0) {
			y1 = (y1 + (y2 - y1) / (x2 - x1) * (-x1)) << 0;
			x1 = 0;
		}
		else if (x1 > sizeX - 1) {
			y1 = (y1 + (y2 - y1) / (x2 - x1) * (sizeX - 1 - x1)) << 0;
			x1 = sizeX - 1;
		}
		else if (y1 < 0) {
			x1 = (x1 + (x2 - x1) / (y2 - y1) * (-y1)) << 0;
			y1 = 0;
		}
		else {
			x1 = (x1 + (x2 - x1) / (y2 - y1) * (sizeY - 1 - y1)) << 0;
			y1 = sizeY - 1;
		}
		c1 = coding(x1, y1);
	}
	if (c1 | c2)return {inside: false};
	else return {inside:true, x1:x1, y1:y1, x2:x2, y2:y2};
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
		fillBuffer(a, (x2 - x1 + 1) << 2, CC);
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

function fillYXBuffer_vLine(x1, y1, y2){
	if (y1 < y2) {
		let tmp = y2;
		y2 = y1;
		y1 = tmp;
	}
	
	while (y1 > y2) {
		y1--;
		YXbuffer[y1].push(x1);
	}
}

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
	else if (x1 == x2) {
		fillYXBuffer_vLine(x1, y1, y2);
		return;
	}
	
	const t = y2 - y1;
	const dy = (t >= 0) ? t : -t; //dy=abs(dy);
	const dx = x2 - x1;

	if (dy <= dx) {
		var d = (dy << 1) - dx; //2*dy-dx;
		const d1 = (dy - dx) << 1; //2*(dy - dx);
		const d2 = dy << 1; // 2 * dy;
		if (t > 0) {
			//alert(YXbuffer[y1]);
			YXbuffer[y1].push(x1);
			while (y1 < y2 - 1) {
				if (d > 0) {
					//x1++; y1++;
					++x1; ++y1;
					YXbuffer[y1].push(x1);
					d += d1; //расчет следующей итерации
				}
				else {
					//x1++;
					++x1;
					d += d2;
				}
			}
			
		}
		else /*if (t < 0)*/ {
			while (y1 > y2) {
				if (d > 0) {
					//y1--; x1++;
					--y1; ++x1;
					YXbuffer[y1].push(x1);
					d += d1; //расчет следующей итерации
				}
				else {
					//x1++;
					++x1;
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
					//x1++; y1++;
					++x1; ++y1;
					d += d1; //расчет следующей итерации
				}
				else {
					//y1++;
					++y1;
					d += d2;
				}
				YXbuffer[y1].push(x1);
			}
		}
		else /*if (t < 0)*/ {		
			while (y1 > y2) {
				if (d > 0) {
					//x1++; y1--;
					++x1; --y1;
					d += d1; //расчет следующей итерации
				}
				else {
					//y1--;
					--y1;
					d += d2;
				}
				YXbuffer[y1].push(x1);
			}
		}
	}
}
//по возрастанию
function sort(array){
	//сортировка пузырьком
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

//!Код нуждается в оптимизации!
//inside можно не хранить, а считать
function clipPoly_left(p2Poly_array){
	const n = p2Poly_array.length;
	var p2Poly_array2 = [];
	var p2_point1 = p2Poly_array[n - 1];
	var inside1, inside2;
	inside1 = (p2_point1.x >= 0);
	for(var i = 0; i < n; ++i){
		p2_point2 = p2Poly_array[i];
		inside2 = (p2_point2.x >= 0);
		if(inside1^inside2){
			const x1 = p2_point1.x; const y1 = p2_point1.y;
			const x2 = p2_point2.x; const y2 = p2_point2.y;
			var cross_y = (y1 + (y2 - y1) / (x1 - x2) * x1) << 0;
			var cross_x = 0;
			p2Poly_array2.push(new p2(cross_x,cross_y));
		}
		if(inside2){p2Poly_array2.push(p2_point2)};
		p2_point1 = p2_point2;
		inside1 = inside2;
	}
	return p2Poly_array2;
};

function clipPoly_right(p2Poly_array){
	const n = p2Poly_array.length;
	var p2Poly_array2 = [];
	var p2_point1 = p2Poly_array[n - 1];
	var inside1, inside2;
	inside1 = (p2_point2.x < sizeX);
	for(var i = 0; i < n; ++i){
		p2_point2 = p2Poly_array[i];
		inside2 = (p2_point2.x < sizeX);
		if(inside1^inside2){
			const x1 = p2_point1.x;
			const y1 = p2_point1.y;
			const x2 = p2_point2.x;
			const y2 = p2_point2.y;
			var cross_y = (y1 + (y2 - y1) / (x2 - x1) * (sizeX - 1 - x1)) << 0;
			var cross_x = sizeX - 1;
			p2Poly_array2.push(new p2(cross_x,cross_y));
		}
		if(inside2){p2Poly_array2.push(p2_point2)};
		p2_point1 = p2_point2;
		inside1 = inside2;
	}
	return p2Poly_array2;
}

function clipPoly_up(p2Poly_array){
	const n = p2Poly_array.length;
	var p2Poly_array2 = [];
	var p2_point1 = p2Poly_array[n - 1];
	var inside1, inside2;
	inside1 = (p2_point1.y >= 0);
	for(var i = 0; i < n; ++i){
		p2_point2 = p2Poly_array[i];
		inside2 = (p2_point2.y >= 0);
		if(inside1^inside2){
			const x1 = p2_point1.x;
			const y1 = p2_point1.y;
			const x2 = p2_point2.x;
			const y2 = p2_point2.y;
			var cross_x = (x1 + (x2 - x1) / (y2 - y1) * (-y1)) << 0;
			var cross_y = 0;
			p2Poly_array2.push(new p2(cross_x,cross_y));
		}
		if(inside2){p2Poly_array2.push(p2_point2)};
		p2_point1 = p2_point2;
		inside1 = inside2;
	}
	return p2Poly_array2;
}

function clipPoly_down(p2Poly_array){
	const n = p2Poly_array.length;
	var p2Poly_array2 = [];
	var p2_point1 = p2Poly_array[n - 1];
	var inside1, inside2;
	inside1 = (p2_point1.y < sizeY);
	for(var i = 0; i < n; ++i){
		p2_point2 = p2Poly_array[i];
		inside2 = (p2_point2.y < sizeY);
		if(inside1^inside2){
			const x1 = p2_point1.x;
			const y1 = p2_point1.y;
			const x2 = p2_point2.x;
			const y2 = p2_point2.y;
			var cross_x = (x1 + (x2 - x1) / (y2 - y1) * (sizeY - 1 - y1)) << 0;
			var cross_y = sizeY - 1;
			p2Poly_array2.push(new p2(cross_x,cross_y));
		}
		if(inside2){p2Poly_array2.push(p2_point2)};
		p2_point1 = p2_point2;
		inside1 = inside2;
	}
	return p2Poly_array2;
}

//лучше использовать списки вместо массива
function clipPoly(p2Poly_array){
	//left и right отсекают весь многоугольник гораздо чаще, чем up и down
	if(p2Poly_array.length > 0){
		p2Poly_array = clipPoly_left(p2Poly_array);
		if(p2Poly_array.length > 0){
			p2Poly_array = clipPoly_right(p2Poly_array);
			if(p2Poly_array.length > 0){
				p2Poly_array = clipPoly_up(p2Poly_array);
				if(p2Poly_array.length > 0){
					p2Poly_array = clipPoly_down(p2Poly_array);
				}	
			}	
		}
	}
	return p2Poly_array;
}

function fillYXBufferPoly(p2Poly_array){
	const n = p2Poly_array.length;
	var p2_point1 = p2Poly_array[n - 1];
	var p2_point2;
	var res = {ymin: p2_point1.y, ymax: p2_point1.y};
	for(var i = 0; i < n; ++i){
		p2_point2 = p2Poly_array[i];
		if(p2_point2.y < res.ymin)res.ymin = p2_point2.y;
		if(res.ymax < p2_point2.y)res.ymax = p2_point2.y;
		fillYXBuffer(p2_point1.x, p2_point1.y, p2_point2.x, p2_point2.y);
		p2_point1 = p2_point2;
	}
	return res;
}



//!перед использованием обрезать полигон по экрану!
//закрашивает внутреннюю область и контур с левой и верхней стороны
//(правую и нижнюю сторону отрисовывают другие полигоны)
//передавать точки с целыми координатами!
function fillPoly(p2Poly_array, color){
	//YX algorithm
	p2Poly_array = clipPoly(p2Poly_array);
	if(p2Poly_array.length == 0)return;
	
	var res = fillYXBufferPoly(p2Poly_array);
	const ymin = res.ymin;
	const ymax = res.ymax;
	
	const delta = sizeX;
	var addrY = ymin * delta;
	//YXbuffer[ymax] не содержит точек в связи с особенностями
	//работы fillYXBuffer
	for(var i = ymin; i <= ymax; ++i){
		var arr = YXbuffer[i];
		sort(YXbuffer[i]);
		for(var j = 0; j < arr.length; j += 2){
			//if(arr[j]==undefined)alert('find undefined');
			fillBuffer((addrY + arr[j]) << 2, (arr[j + 1] - arr[j]) << 2, color);
			PutPixel((addrY + arr[j]) << 2, black);
		}
		addrY += delta;
	}
	
	clearYXBuffer(ymin, ymax);
}

/*function fillPoly(p2Poly_array, color){
	//YX algorithm
	p2Poly_array = clipPoly(p2Poly_array);
	if(p2Poly_array.length == 0)return;
	
	var res = fillYXBufferPoly(p2Poly_array);
	const ymin = res.ymin;
	const ymax = res.ymax;
	
	const delta = sizeX;
	var addrY = ymin * delta;
	//YXbuffer[ymax] не содержит точек в связи с особенностями
	//работы fillYXBuffer
	for(var i = ymin; i <= ymax; ++i){
		var arr = YXbuffer[i];
		sort(YXbuffer[i]);
		for(var j = 0; j < arr.length; j += 2){
			//if(arr[j]==undefined)alert('find undefined');
			fillBuffer((addrY + arr[j]) << 2, (arr[j + 1] - arr[j]) << 2, color);
			PutPixel((addrY + arr[j]) << 2, black);
		}
		addrY += delta;
	}
	
	for(var i = ymin; i <= ymax; ++i){
		YXbuffer[i].length = 0;
	}
}*/

function qwe(a, b, c, d, xmin, xmax){
	if(xmin > xmax){
		let tmp = xmin;
		xmin = xmax;
		xmax = tmp;
	}
	var arr = [];
	//if(/*(a*d-b*c) > 0*/){
		/*x = xmax;
		arr.push(x);
		while(x > xmin){
			var v1 = Math.abs((4*eps*Math.pow(c*x+d, 3))/(c*(a*d-b*c)));
			var val = x - Math.ceil(Math.sqrt(v1));
			val = Math.min(val, x - 1);
			x = Math.max(val, xmin);
			arr.push(x);
		}
		arr.reverse();*/
	/*}
	else /* if ((a*d-b*c) < 0)*/
		const k1 = Math.sqrt(Math.abs((eps*c*c)/(a*d-b*c)));
		const k2 = Math.abs(d/c);
		x = xmin;
		arr.push(x);
		while(x < xmax){
			//var val = x + Math.floor(k1*(x + k2));
			//val = Math.max(val, x + 1);
			x = Math.min(Math.max(x + Math.floor(k1*(x + k2)), x + 1), xmax);
			arr.push(x);
		}
	//}
	/*else{
		arr.push(xmin);
		arr.push(xmax);
	}*/
	return arr;
}

function fillPolyTexture(p2Poly_array, O, M, N, texture){
	p2Poly_array = clipPoly(p2Poly_array);
	if(p2Poly_array.length == 0)return;
	
	if(texture.global){
		let scale = texture.scale;
		p3_mul_self(M, scale/p3_norm(M));
		p3_mul_self(N, scale/p3_norm(N));
	}
	else{
		let scale = 1 << texture.scale;
		p3_mul_self(M, 1/scale);
		p3_mul_self(N, 1/scale);
	}
	
	var res = fillYXBufferPoly(p2Poly_array);
	const ymin = res.ymin;
	const ymax = res.ymax;
	
	const f = -(sizeX >> 1);
	const k1 = sizeX >> 1;
	const k2 = sizeY >> 1;
	
	var normal = vector_product2(M,N);
	var d = scalar_product2(normal, O);
	
	//const Ad = f*(M.y*N.z-M.z*N.y);
	//const Bd = f*(M.z*N.x-M.x*N.z);
	//const Cd = f*f*(M.x*N.y-M.y*N.x);
	
	//u
	var vector_u = vector_product2(N, O);
	p3_mul_self(vector_u, 1/(f*d));
	vector_u.z *= f;
	
	const Au = vector_u.x;//(O.z*N.y-O.y*N.z)/(f*d);
	const Bu = vector_u.y;//(O.x*N.z-O.z*N.x)/(f*d);
	const Cu = vector_u.z;//(N.x*O.y-N.y*O.x)/d;
	
	//v
	var vector_v = vector_product2(O, M);
	p3_mul_self(vector_v, 1/(f*d));
	vector_v.z *= f;
	
	const Av = vector_v.x;//(M.z*O.y-M.y*O.z)/(f*d);
	const Bv = vector_v.y;//(M.x*O.z-M.z*O.x)/(f*d);
	const Cv = vector_v.z;//(M.y*O.x-M.x*O.y)/d;
	//
	var wParams = getParamsForWBuffer(normal, d);
	const Aw = wParams.As;
	const Bw = wParams.Bs;
	const Cw = wParams.Cs;
	
	const deltaY = sizeX;
	var addrY = ymin * deltaY;
	
	var u = Bu*(ymin - k2) + Cu - Au*k1;
	var v = Bv*(ymin - k2) + Cv - Av*k1;
	var params = {xleft:0, xright:0, w:0, u:0, v:0, dw:0, du:0, dv:0, texture:0, addr:0}; 
	params.du = Au;
	params.dv = Av;
	params.dw = Aw;
	params.texture = texture;
	for(var y = ymin; y < ymax; ++y){
		sort(YXbuffer[y]);
		var arr = YXbuffer[y]; 
		var w = Bw*y + Cw;
		for(var j = 0; j < arr.length; j += 2){
			const left = arr[j];
			const right = arr[j + 1];
			//var arr_points = qwe(Av, v, Aw, w, left, right);
			//alert("Au: "+Au+" u: "+u+" Aw: "+Aw+" w: "+w);
			//alert(arr_points);
			//zxc = Math.max(zxc, arr_points.length);
			//var arr_points = Array(left, right);
			//for(var k = 0; k < arr_points.length - 1; ++k){
				params.xleft = left//arr_points[k];
				params.xright = right//arr_points[k+1];
				params.u = u + Au * params.xleft;
				params.v = v + Av * params.xleft;
				params.w = w + Aw * params.xleft;
				params.addr = addrY + params.xleft;
				hLine_exactTexture(params);
				//hLine_linearTexture(params);
				//hLine_squareTexture(params);
			//}
		}
		u += Bu;
		v += Bv;
		addrY += deltaY;
	}
	
	clearYXBuffer(ymin, ymax);
}

function min(v1, v2){
	return (v1 < v2)? v1: v2;
};

function hLine_exactTexture(params){
	const right = params.xright;
	const du = params.du;
	const dv = params.dv;
	const dw = params.dw;
	const texture = params.texture;
	
	const shift = texture.shift_size;
	const mask = (1 << shift) - 1;
	const data = texture.data;
	
	var u = params.u;
	var v = params.v;
	var w = params.w;
	var addr = params.addr;
	for(var x = params.xleft; x < right; ++x){
		if(w > wBuffer[addr]){
			wBuffer[addr] = w;
			//if(((v/w)>>0)&&((u/w)>>0))alert(((u/w)>>0)+" "+((v/w)<<0));
			addr_txt = (((((u/w)&mask) << shift) + ((v/w)&mask))) << 2;
			PutPixelTexture(addr << 2, data, addr_txt);
				/*buffer[addr<<2] = data[addr_txt];
				buffer[(addr<<2) + 1] = data[addr_txt + 1];
				buffer[(addr<<2) + 2] = data[addr_txt + 2];
				buffer[(addr<<2) + 3] = data[addr_txt + 3];*/
		}
		u += du;
		v += dv;
		w += dw;
		++addr;
	}
}

function hLine_linearTexture(params){
	const right = params.xright;
	const left = params.xleft;
	const du = params.du;
	const dv = params.dv;
	const dw = params.dw;
	const texture = params.texture;
	
	const shift = texture.shift_size;
	const mask = (1 << shift) - 1;
	const data = texture.data;
	
	var u = params.u;
	var v = params.v;
	var w = params.w;
	var addr = params.addr;
	
	const delta = right - left;
	const u1 = (u/w);
	const u2 = ((u+du*delta)/(w+dw*delta))
	const au1 = (u2-u1)/delta;
	const au0 = u1 - au1*left;
	
	const v1 = (v/w);
	const v2 = ((v+dv*delta)/(w+dw*delta))
	const av1 = (v2-v1)/delta;
	const av0 = v1 - av1*left;
	
	u = u1;
	v = v1;
	for(var x = left; x < right; ++x){
		if(w > wBuffer[addr]){
			wBuffer[addr] = w;
			addr_txt = (((((u)&mask) << shift) + ((v)&mask))) << 2;
			PutPixelTexture(addr << 2, data, addr_txt);
		}
		u += au1;
		v += av1;
		w += dw;
		++addr;
	}
};

function getReccurFormulsForSquarePoly(v1, v2, v3, h){
	//const a0 = v1;
	const a1 = -3*v1-v2+4*v3;
	const a2 = 2*(v1+v2-2*v3);
	//d_u = a1*h;//+a2*h*left
	return {d_v: a1*h, delta_dv: 2*a2*h*h};
}

function getParamsForSquareInterpolation(delta, u, du, v, dv, w, dw){
	const c = delta/2;
	const h = 1/delta;
	
	const _w = dw*c;
	const _u = du*c;
	const _v = dv*c;
	
	//1
	const u1 = u/w;
	const v1 = v/w;
	//3
	u += _u; v += _v; w += _w;
	const u3 = u/w;
	const v3 = v/w;
	//2
	u += _u; v += _v; w += _w;
	const u2 = u/w;
	const v2 = v/w;
	
	var answer = {d_u:0, delta_du:0, d_v:0, delta_dv:0, u1:u1, v1:v1};
	var res = getReccurFormulsForSquarePoly(u1, u2, u3, h);
	answer.d_u = res.d_v;
	answer.delta_du = res.delta_dv;
	
	res = getReccurFormulsForSquarePoly(v1, v2, v3, h);
	answer.d_v = res.d_v;
	answer.delta_dv = res.delta_dv;
	
	return answer;
}

function hLine_squareTexture(params){
	const right = params.xright;
	const left = params.xleft;
	const du = params.du;
	const dv = params.dv;
	const dw = params.dw;
	const texture = params.texture;
	
	const shift = texture.shift_size;
	const mask = (1 << shift) - 1;
	const data = texture.data;
	
	var u = params.u;
	var v = params.v;
	var w = params.w;
	var addr = params.addr;
	
	
	//const delta = (right - left);
	
	var ans = getParamsForSquareInterpolation((right - left), u, du, v, dv, w, dw);
	u = ans.u1;
	v = ans.v1;
	var d_u = ans.d_u;
	var d_v = ans.d_v;
	const delta_du = ans.delta_du;
	const delta_dv = ans.delta_dv;
	
	for(var x = params.xleft; x < right; ++x){
		if(w > wBuffer[addr]){
			wBuffer[addr] = w;
			addr_txt = (((((u)&mask) << shift) + ((v)&mask))) << 2;
			PutPixelTexture(addr << 2, data, addr_txt);
		}
		d_u += delta_du;
		u += d_u;
		
		d_v += delta_dv;
		v += d_v;
		
		w += dw;
		
		++addr;
	}
}

function PutPixelTexture(addr, texture, addr_txt){
	buffer[addr] = texture[addr_txt];
	buffer[addr + 1] = texture[addr_txt + 1];
	buffer[addr + 2] = texture[addr_txt + 2];
	buffer[addr + 3] = texture[addr_txt + 3];
}

function getParamsForWBuffer(normal, d){
	const As = -normal.x /(hsizeX * d);
	const Bs = -normal.y /(hsizeX * d);
	const Cs = (normal.z + normal.x + (normal.y*sizeY/sizeX))/d;
	return {As:As, Bs:Bs, Cs:Cs};
}

function clearYXBuffer(ymin, ymax){
	for(var y = ymin; y < ymax; ++y){
		YXbuffer[y].length = 0;
	}
}
/*function mat3d_det(mat3d_m){
	const a1 = mat3d_m.data[0]; const b1 = mat3d_m.data[1]; const c1 = mat3d_m.data[2];
	const a2 = mat3d_m.data[4]; const b2 = mat3d_m.data[5]; const c2 = mat3d_m.data[6];
	const a3 = mat3d_m.data[8]; const b3 = mat3d_m.data[9]; const c3 = mat3d_m.data[10];
	
	const res = a1*(b2*c3-b3*c2)-b1*(a2*c3-a3*c2)+c1*(a2*b3-a3*b2);
	return res;
}

function mat3d_assign(mat3d_m1, mat3d_m2){
	for(var i = 0; i < 12; ++i){
		mat3d_m1.data[i] = mat3d_m2.data[i];
	}
}*/

/*function mat3d_solve(mat3d_m, vec3d_v){
	var res = new p3();
	const znam = mat3d_det(mat3d_m);
	mat3d_m2 = new mat3d();
	mat3d_assign(mat3d_m2, mat3d_m);
	
	//A
	mat3d_m2.data[0] = vec3d_v.x;
	mat3d_m2.data[4] = vec3d_v.y;
	mat3d_m2.data[8] = vec3d_v.z;
	res.x = mat3d_det(mat3d_m2)/znam;
	//много лишнего
	mat3d_assign(mat3d_m2, mat3d_m);
	
	//B
	mat3d_m2.data[1] = vec3d_v.x;
	mat3d_m2.data[5] = vec3d_v.y;
	mat3d_m2.data[9] = vec3d_v.z;
	res.y = mat3d_det(mat3d_m2)/znam;
	mat3d_assign(mat3d_m2, mat3d_m);

	//C
	mat3d_m2.data[2] = vec3d_v.x;
	mat3d_m2.data[6] = vec3d_v.y;
	mat3d_m2.data[10] = vec3d_v.z;
	res.z = mat3d_det(mat3d_m2)/znam;

	return res;
}*/

function parseToScreen(p3_point){
	var r = new p2();
	//можно не делить sizeX на 2, а умножить знаменатель 
	//на два операцией битового сдвига, !но получим целое число!
	const znam = (sizeX >> 1) / p3_point.z;
	r.x = (-(p3_point.x * znam) + (sizeX >> 1));
	r.y = (-p3_point.y * znam + (sizeY >> 1));
	return r;
}

function p3_sub(p3_point1, p3_point2){
	return new p3(p3_point1.x - p3_point2.x,
				  p3_point1.y - p3_point2.y,
				  p3_point1.z - p3_point2.z);
}

function p2_sum(p2_point1, p2_point2){
	return new p2(p2_point1.x + p2_point2.x,
				  p2_point1.y + p2_point2.y);
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
function p3_mul_self(p3_point, value){
	p3_point.x *= value;
	p3_point.y *= value;
	p3_point.z *= value;
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
function renderObject(obj, mat3d_pre_trans){
	var points = obj.p3_points;
	var facets = obj.facets;
	
	//массив на points.length элементов
	//храним координаты точек на картинной плоскости 
	var transCoord2d = Array(points.length);
	//и в пространстве
	var transCoord3d = Array(points.length);
	
	for(var j = 0; j < facets.length; ++j){
		//!!!возможно ли использование одного number_point?
		var cur_facet = facets[j];
		var pointFacet = p3_sum(points[cur_facet[0]], obj.p3_center);
		var l = p3_sub(playerPos, pointFacet);
		var n = obj.normals[j];
		//проверка на лицевую грань
		//n = mat3d_mul_MatToVecWithoutShift(mat3d_pre_trans, n);
		if(scalar_product2(n,l) > 0){
			//координаты точек на картинной плоскости
			//нужен для отрисовки
			
			//очень часто перевыделяется память
			//можно ли переиспользовать старые участки памяти?
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
					
					//p3_cross = p1 + delta*t; delta = p2 - p1
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
			
			var cos_light = scalar_product2(n, dir_light);  
			if(cos_light < 0)cos_light = 0;
			var I = Ir + In*cos_light;
			
			for(var m = 0; m < poly2d.length; ++m){
				var point_ = poly2d[m];
				point_.x <<= 0;
				point_.y <<= 0;
			}
			var O = transCoord3d[cur_facet[0]];
			var M = p3_sub(transCoord3d[cur_facet[1]], O);
			var N = p3_sub(transCoord3d[cur_facet[cur_facet.length - 1]], O);
			var t = textures[0];
			fillPolyTexture(poly2d, O, M, N, t);
		}
	}
}

function render(){
	//alert(123);
	context.clearRect(0, 0, canvas.width, canvas.height);
	context.beginPath();
	
	//clearWBuffer(); 
	
	var T = make3d_T(-playerPos.x, -playerPos.y, -playerPos.z);
	var Ry = make3d_Ry(fi);
	var Rx = make3d_Rx(ksi);
	var transMatrix = mat3d_mul_MatToMat(Ry,T);
	transMatrix = mat3d_mul_MatToMat(Rx, transMatrix);
	
	for(var i = 0; i < objects.length; ++i){
		renderObject(objects[i], transMatrix);
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
	//zxc = -1;
	//alert(zxc);
	var data = context.getImageData(0,0,20,20);
	var ctime = new Date();
	var timediff = ctime.getTime() - last_time.getTime();
	
	var mat1 = make3d_Ry(-fi);
	playerPos = p3_sum(playerPos, p3_mul(mat3d_mul_MatToVec(mat1, p3_player_dir), timediff * speed));
	
	var sum = 0;
	times[0] = times[1];
	times[1] = times[2];
	times[2] = 1000 / timediff;
	for(var l = 0; l < 3; l++){
		sum += times[l];
	}
	sum /= 3;
	//alert(sum);
	if(times[0]!=undefined)
	zxc = Math.max(zxc, sum);
	outText.textContent = "FPS: " + sum;
	speedText.textContent = zxc;
	fillBuffer(0,sizeX*sizeY << 2, BC);
	clearWBuffer();
	render();
	context.putImageData(myImageData,0,0);
	renderMap();
	timer = setTimeout(function(){ updateFrame(ctime); }, 10);
}



