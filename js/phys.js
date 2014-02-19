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
	controller.resetSimulation();

	view.addToScene(scene);		
}


function animate() {
	var newTime = getTimeInSeconds();
	var frameTime = newTime - currentTime;
	currentTime = newTime;

	accumulator += frameTime;
		
	var dt = controller.model.integrator.dt;

	while (accumulator >= dt) {
		
		if (controller.isSimulationRunning) {
			controller.update();
		}

		accumulator -= dt;                
	}	
		
	/* Will always point to the center of the frame */
	cameraControls.target = new THREE.Vector3(0, 0, 0);
	cameraControls.update();

	renderer.render(scene, camera);
    requestAnimationFrame(animate);	
}


function getTimeInSeconds() {
    return new Date().getTime() / 1000;
}


function Controller(model) {
	
	this.model = model;
	this.isSimulationRunning = false;

	var self = this;
	
	this.addDatGUI = function() {
		var gui = new dat.GUI({ autoPlace: false });
		var controlsContainer = document.getElementById('controls-container');
		controlsContainer.appendChild(gui.domElement);
		
		var particleGroup = gui.addFolder('Parametry cząstki');
		particleGroup.open();
		
		particleGroup.add(self.model, 'q', 0, 10, 0.01);
		particleGroup.add(self.model, 'm', 0, 10, 0.01);
		
		var vxControl = particleGroup.add(self.model, 'vx', 0, 10, 0.01);
		vxControl.listen();
		vxControl.onChange(function(value) {
			self.model.updateVelocity();
		});
		
		var vyControl = particleGroup.add(self.model, 'vy', 0, 10, 0.01);
		vyControl.listen();
		vyControl.onChange(function(value) {
			self.model.updateVelocity();
		});
		
		var vzControl = particleGroup.add(self.model, 'vz', 0, 10, 0.01);
		vzControl.listen();
		vzControl.onChange(function(value) {
			self.model.updateVelocity();
		});	
		
		var electricGroup = gui.addFolder('Pole elektryczne');
		electricGroup.open();
		
		var ExControl = electricGroup.add(self.model, 'Ex', -1, 1, 0.01);
		ExControl.listen();
		ExControl.onChange(function(value) {
			self.model.updateElectricField();
		});
		
		var EyControl = electricGroup.add(self.model, 'Ey', -1, 1, 0.01);
		EyControl.listen();
		EyControl.onChange(function(value) {
			self.model.updateElectricField();
		});
		
		var EzControl = electricGroup.add(self.model, 'Ez', -1, 1, 0.01);
		EzControl.listen();
		EzControl.onChange(function(value) {
			self.model.updateElectricField();
		});

		var magneticGroup = gui.addFolder('Pole magnetyczne');
		magneticGroup.open();
		
		var BxControl = magneticGroup.add(self.model, 'Bx', -1, 1, 0.01);
		BxControl.listen();
		BxControl.onChange(function(value) {
			self.model.updateMagneticField();
		});
		
		var ByControl = magneticGroup.add(self.model, 'By', -1, 1, 0.01);
		ByControl.listen();
		ByControl.onChange(function(value) {
			self.model.updateMagneticField();
		});
		
		var BzControl = magneticGroup.add(self.model, 'Bz', -1, 1, 0.01);
		BzControl.listen();
		BzControl.onChange(function(value) {
			self.model.updateMagneticField();
		});

		var controlsGroup = gui.addFolder('Symulacja');
		controlsGroup.add(self, 'resetSimulation').name('Restart');
		controlsGroup.add(self, 'toggleSimulationRunning').name('Start / Stop');
		controlsGroup.open();
	};
	
	this.toggleSimulationRunning = function() {
		this.isSimulationRunning = !this.isSimulationRunning;
	};
	
	this.resetSimulation = function() {
		this.model.restart();
		
		self.update();
	};
		
	this.update = function() {
		this.model.move();
	};
	
}


function View() {
	
	var TRAJECTORY_BUFFER = 2000;

	var electricField;
	var magneticField;
	
	var particle;
	var trajectory;

	var self = this;

	init();
	
	function init() {		
		var sourcePosElec = new THREE.Vector3(0, 0, 0);
		var targetPosElec = new THREE.Vector3(0, 0, 0);

		electricField = new THREE.ArrowHelper(targetPosElec, sourcePosElec, targetPosElec.length(), "rgb(255, 0, 0)");

		var sourcePosMagn = new THREE.Vector3(0, 0, 0);
		var targetPosMagn = new THREE.Vector3(0, 0, 0);

		magneticField = new THREE.ArrowHelper(targetPosMagn, sourcePosMagn, targetPosMagn.length(), "rgb(0, 0, 255)");
	
        var particleGeometry = new THREE.SphereGeometry(0.05, 32, 32);
        var particleMaterial = new THREE.MeshPhongMaterial({color: "rgb(255, 0, 0)"});
        
        particle = new THREE.Mesh(particleGeometry, particleMaterial);
        
        var lineGeometry = new THREE.Geometry();
        var lineMaterial = new THREE.LineBasicMaterial({ color: "rgb(0, 0, 0)", lineWidth: 2 });
        
        for (var i = 0 ; i < TRAJECTORY_BUFFER + 1 ; i++) {
			lineGeometry.vertices.push(new THREE.Vector3(-10, 0, 0));
		}
                
        trajectory = new THREE.Line(lineGeometry, lineMaterial);
	};
	
	this.addToScene = function(scene) {
		scene.add(particle);
		scene.add(electricField);
		scene.add(magneticField);
		scene.add(trajectory);
	};
	
	this.setElectricField = function(Ex, Ey, Ez) {
		var targetPos = new THREE.Vector3(Ex, Ey, Ez);

		electricField.setDirection(targetPos);
		electricField.setLength(targetPos.length());		
	};
	
	this.setMagneticField = function(Bx, By, Bz) {
		var targetPos = new THREE.Vector3(Bx, By, Bz);

		magneticField.setDirection(targetPos);
		magneticField.setLength(targetPos.length());		
	};
	
	this.update = function(pos, traj) {	
		for (var i = 0 ; i < TRAJECTORY_BUFFER + 1 ; i++) {
			trajectory.geometry.vertices[i].x = traj[i][0];
			trajectory.geometry.vertices[i].y = traj[i][1];
			trajectory.geometry.vertices[i].z = traj[i][2];
		}

		trajectory.geometry.verticesNeedUpdate = true;
		
		particle.position.x = pos[0];
		particle.position.y = pos[1];
		particle.position.z = pos[2];
	};
	
}


function Model() {
	
	this.Ex = 0;
	this.Ey = 0;
	this.Ez = 0;
	
	this.Bx = 0;
	this.By = 0;
	this.Bz = 0;

	this.q = 1;
	this.m = 0.1;
	
	this.vx = 0;
	this.vy = 0;
	this.vz = 0;

	this.view;
	this.integrator;

	this.pos = [-10, 0, 0];
	this.vel = [this.vx, this.vy, this.vz];
	this.trajectory = [];

	var self = this;
	var TRAJECTORY_BUFFER = 2000;
	
	initTrajectory();

	function initTrajectory() {		
		for (var i = 0 ; i < TRAJECTORY_BUFFER + 1 ; i++) {
			self.trajectory.push(self.pos);
		}		
	};

    this.accel = function(vel) { 
		var qm = this.q / this.m;
		
		var vx = vel[0];
		var vy = vel[1];
		var vz = vel[2];
		
		var ax = qm * (this.Ex + vy * this.Bz - vz * this.By);
		var ay = qm * (this.Ey + vz * this.Bx - vx * this.Bz);
		var az = qm * (this.Ez + vx * this.By - vy * this.Bx);

		return [ax, ay, az];
    };
        
	this.updateVelocity = function() {
		this.vel = [this.vx, this.vy, this.vz];
	};
        
    this.updateElectricField = function() {
		this.view.setElectricField(this.Ex, this.Ey, this.Ez);
	};
	
	this.updateMagneticField = function() {
		this.view.setMagneticField(this.Bx, this.By, this.Bz);
	};
	
	this.restart = function() {
		this.Ex = 0;
		this.Ey = 0;
		this.Ez = 0;
	
		this.Bx = 0;
		this.By = 0;
		this.Bz = 0;
		
		this.vx = 0; 
		this.vy = 0;
		this.vz = 0;
		
	    this.pos = [-10, 0, 0];
		this.vel = [this.vx, this.vy, this.vz];
		
		for (var i = 0 ; i < TRAJECTORY_BUFFER + 1 ; i++) {
			this.trajectory[i] = this.pos;
		}

		this.view.update(this.pos, this.trajectory);
	};

    this.move = function() {
        this.stateVector = this.integrator.integrate(this);

        this.pos = this.stateVector[0];
        this.vel = this.stateVector[1];
        
        this.vx = this.vel[0];
        this.vy = this.vel[1];
        this.vz = this.vel[2];

		for (var i = 0 ; i < TRAJECTORY_BUFFER ; i++) {
			this.trajectory[i] = this.trajectory[i + 1];
		}
			
		this.trajectory[TRAJECTORY_BUFFER] = this.pos;
		
		this.view.update(this.pos, this.trajectory);
    };
    
}


function RK4Integrator(dt) {
	
	this.dt = dt;

    this.integrate = function(model) {
        var x1 = [], x2 = [], x3 = [], x4 = [];
        var v1 = [], v2 = [], v3 = [], v4 = [];
        var a1 = [], a2 = [], a3 = [], a4 = [];

        x1 = model.pos;        
        v1 = model.vel;
        a1 = model.accel(v1);

        x2 = [x1[0] + 0.5 * v1[0] * dt, 
			  x1[1] + 0.5 * v1[1] * dt, 
              x1[2] + 0.5 * v1[2] * dt];
              
        v2 = [v1[0] + 0.5 * a1[0] * dt, 
              v1[1] + 0.5 * a1[1] * dt,
              v1[2] + 0.5 * a1[2] * dt];
              
        a2 = model.accel(v2);
    
        x3= [x1[0] + 0.5 * v2[0] * dt,
             x1[1] + 0.5 * v2[1] * dt,
             x1[2] + 0.5 * v2[2] * dt];
             
        v3= [v1[0] + 0.5 * a2[0] * dt,
			 v1[1] + 0.5 * a2[1] * dt,
			 v1[2] + 0.5 * a2[2] * dt];
			 
        a3 = model.accel(v3);
    
        x4 = [x1[0] + v3[0] * dt,
              x1[1] + v3[1] * dt,
              x1[2] + v3[2] * dt];
              
        v4 = [v1[0] + a3[0] * dt,
              v1[1] + a3[1] * dt,
              v1[2] + a3[2] * dt];
              
        a4 = model.accel(v4);
              
        var pos = [x1[0] + (dt / 6.0) * (v1[0] + 2 * v2[0] + 2 * v3[0] + v4[0]),
                   x1[1] + (dt / 6.0) * (v1[1] + 2 * v2[1] + 2 * v3[1] + v4[1]),
                   x1[2] + (dt / 6.0) * (v1[2] + 2 * v2[2] + 2 * v3[2] + v4[2])];
                   
        var vel = [v1[0] + (dt / 6.0) * (a1[0] + 2 * a2[0] + 2 * a3[0] + a4[0]),
                   v1[1] + (dt / 6.0) * (a1[1] + 2 * a2[1] + 2 * a3[1] + a4[1]),
                   v1[2] + (dt / 6.0) * (a1[2] + 2 * a2[2] + 2 * a3[2] + a4[2])];                
                
        return [pos, vel];
    };
        
}



