var renderer;
var scene;
var camera;
var cameraControls;
var controller;

var container = document.getElementById("threejs_container");
var width = container.offsetWidth;
var height = container.offsetHeight;

var accumulator = 0;
var currentTime = getTimeInSeconds();

var isRunning = true;


window.addEventListener('blur', function() {
   isRunning = false;
}, false);

window.addEventListener('focus', function() {
   isRunning = true;
}, false);


init();
animate();



function init() {
	initRenderer();
	initScene();
	initCamera();
	initLight();
	
	initReferenceView();
	
	initMVC();
}


function initRenderer() {
	renderer = new THREE.WebGLRenderer({precision: 'lowp', antialias: true, preserveDrawingBuffer: false});
    renderer.setSize(width, height);  
    renderer.setClearColor("rgb(255, 255, 255)", 1); 

	container.appendChild(renderer.domElement);
}


function initScene() {
    scene = new THREE.Scene();
}


function initCamera() {
    camera = new THREE.PerspectiveCamera(55, width / height, 1, 100);
    camera.position.set(0, 1, 4);   
    
    cameraControls = new THREE.OrbitControls(camera, renderer.domElement);    
    cameraControls.noPan = false;
    cameraControls.noKeys = true;
}


function initLight() {
    var light = new THREE.PointLight("rgb(255, 255, 255)");
    
    light.position.set(0, 50, 10);
    scene.add(light);        
}


function initReferenceView() {
	var lineGeometryX = new THREE.Geometry();	
	var lineMaterialX = new THREE.LineBasicMaterial({color: "rgb(255, 0, 0)", lineWidth: 1});

	lineGeometryX.vertices.push(new THREE.Vector3(-10, 0, 0));
	lineGeometryX.vertices.push(new THREE.Vector3(10, 0, 0));
	
	scene.add(new THREE.Line(lineGeometryX, lineMaterialX));
	
	var lineGeometryY = new THREE.Geometry();	
	var lineMaterialY = new THREE.LineBasicMaterial({color: "rgb(0, 255, 0)", lineWidth: 1});

	lineGeometryY.vertices.push(new THREE.Vector3(0, -10, 0));
	lineGeometryY.vertices.push(new THREE.Vector3(0, 10, 0));
	
	scene.add(new THREE.Line(lineGeometryY, lineMaterialY));
	
	var lineGeometryZ = new THREE.Geometry();	
	var lineMaterialZ = new THREE.LineBasicMaterial({color: "rgb(0, 0, 255)", lineWidth: 1});

	lineGeometryZ.vertices.push(new THREE.Vector3(0, 0, -10));
	lineGeometryZ.vertices.push(new THREE.Vector3(0, 0, 10));
	
	scene.add(new THREE.Line(lineGeometryZ, lineMaterialZ));	
}


function initMVC() {
	var dt = 0.01;
	
	var model = new Model();
	var view = new View();
	var integrator = new RK4Integrator(dt);

	model.view = view;
	model.integrator = integrator;
	
	controller = new Controller(model);
	controller.addDatGUI();

	view.addToScene(scene);		
}


function animate() {

	var newTime = getTimeInSeconds();
	var frameTime = newTime - currentTime;
	currentTime = newTime;

	accumulator += frameTime;
		
	var dt = controller.model.integrator.dt;

	while (accumulator >= dt) {
		if (isRunning && controller.isSimulationRunning) {
			controller.update();
		}

		accumulator -= dt;                
	}	
		
	/* Will always point to the center of the frame */
	cameraControls.target = new THREE.Vector3(0, 0.5, 0);
	 
	if (isRunning && controller.isSimulationRunning && controller.isCameraFollowing) {
		cameraControls.rotateRight(controller.model.omega * frameTime);  
	}

	if (isRunning && controller.isSimulationRunning) {
		controller.updatePlots();
	}

	cameraControls.update();

	renderer.render(scene, camera);
    requestAnimationFrame(animate);	
 
}


function getTimeInSeconds() {
    return new Date().getTime() / 1000;
}


function Controller(model) {
	
	this.model = model;
	this.isCameraFollowing = true; 
	this.isSimulationRunning = false;

	var self = this;
	
	this.addDatGUI = function() {
		var gui = new dat.GUI({ autoPlace: false });
		var controlsContainer = document.getElementById('controls-container');
		controlsContainer.appendChild(gui.domElement);
		
		gui.add(self.model, 'q', 0, 10, 0.1).listen();
		gui.add(self.model, 'm', 0, 10, 0.1).listen();
		gui.add(self.model, 'vx', 0, 10, 0.1).listen();
		gui.add(self.model, 'Ex', 0, 10, 0.1).listen();
		gui.add(self.model, 'Ey', 0, 10, 0.1).listen();
		gui.add(self.model, 'Ez', 0, 10, 0.1).listen();
		gui.add(self.model, 'Bx', 0, 10, 0.1).listen();
		gui.add(self.model, 'By', 0, 10, 0.1).listen();
		gui.add(self.model, 'Bz', 0, 10, 0.1).listen();
	}
	
	this.toggleSimulationRunning = function() {
		this.isSimulationRunning = !this.isSimulationRunning;
	}
	
	this.resetSimulation = function() {
		self.setPlots();
		phaseSpacePlotData.clearData();

		self.loadSimParameters();
		self.update();
	}
		
	this.update = function() {
		this.model.move();
	}
	
}


function View() {
	
	var particle;
	
	init();
	
	function init() {		
        var particleGeometry = new THREE.SphereGeometry(0.05, 32, 32);
        var particleMaterial = new THREE.MeshPhongMaterial({color: "rgb(255, 0, 0)"});
        
        particle = new THREE.Mesh(particleGeometry, particleMaterial);
	}
	
	function addToScene(scene) {
		scene.add(particle);
	}
	
	function rotate(phi, theta) {

	}
	
	return {
        addToScene: addToScene,
        rotate: rotate,
    }
	
}


function Model() {
	
	this.Ex = 0;
	this.Ey = 0;
	this.Ez = 0;
	this.Bx = 0;
	this.By = 0;
	this.Bz = 0;

	this.q = 1;
	this.m = 1;
	this.vx = 1;

	this.view;
	this.integrator;

	this.posVel;
	
	var self = this;

    this.accel = function(x, v) { 
		return Math.sin(x) * (this.omega * this.omega * Math.cos(x) + this.g / this.R) - this.gamma / this.m * v;
    };
        
    this.move =  function() {
        this.posVel = this.integrator.integrate(this);

        this.theta = this.posVel[0];
        this.thetaDot = this.posVel[1];

        this.phi = this.phi + this.omega * this.integrator.dt;

        this.view.rotate(this.phi, this.theta);
    };
    
}


function RK4Integrator(dt) {
	
	this.dt = dt;

    this.integrate = function(model) {
        var x1, x2, x3, x4;
        var v1, v2, v3, v4;
        var a1, a2, a3, a4;

        x1 = model.theta;        
        v1 = model.thetaDot;
        a1 = model.accel(x1, v1);

        x2 = x1 + 0.5 * v1 * dt;
        v2 = v1 + 0.5 * a1 * dt;
        a2 = model.accel(x2, v2);
    
        x3= x1 + 0.5 * v2 * dt;
        v3= v1 + 0.5 * a2 * dt;
        a3 = model.accel(x3, v3);
    
        x4 = x1 + v3 * dt;
        v4 = v1 + a3 * dt;
        a4 = model.accel(x4, v4);
              
        var x = x1 + (dt / 6.0) * (v1 + 2 * v2 + 2 * v3 + v4);
        var v = v1 + (dt / 6.0) * (a1 + 2 * a2 + 2 * a3 + a4);                
                
        return [x, v]
    };
        
}



