let t = 0;
let targetFramerate = 60;
let delta;
let canvas;

let loading = true;
let assets_called = 0;
let total_assets;
let assets_loaded = 0;

let started = false;
let debug = false;
let showFPS = false;

let g_smoke = false;
let g_disable_joints = false;
let g_show_eyes = true;
let g_paint_mode = false;

let entityManager;
let entities = [];
var filterSkeletons;

let png_playButton, png_missingTexture;

let SONGS, SELECTED_SONG, SONG_START;
let SMONK_7, PATIENCE, SOME_GIRLS;

let analyser, spectrum, rms, fft;

function loadAsset(type, url) {
	// Create output variable to be defined once asset has loaded
	var output;
	// +1 to assets called and log the type and url
	assets_called++;
	// Log asset to console once called
	console.log(type + ' called : ' + url);

	// Function called once called asset has successfully loaded
	function loaded(asset) {
		// +1 to assets successfully loaded
		assets_loaded++;
		console.log(type + ' loaded successfully : ' + url);
	}

	// Function called when asset fails to load
	function error(err) {
		assets_loaded++;
		console.error(err);
	}

	// Define output variable depending on the asset type
	type === 'image' ? output = loadImage(url, loaded, error) : (output = loadSound(url, loaded, error), output.playMode('restart'));

	return output;
}

function preload() {
	// Load images
	png_playButton = loadAsset('image', 'assets/img/play_button.png');

	// Load audio and select song
	SMONK_7        = loadAsset('audio', 'assets/sound/SMONK 7.mp3');
	PATIENCE       = loadAsset('audio', 'assets/sound/PATIENCE.mp3');
	SOME_GIRLS     = loadAsset('audio', 'assets/sound/SOME GIRLS [SUPERSONIC SUBMISSION].mp3');
	SONGS          = new Array(SMONK_7, PATIENCE, SOME_GIRLS);
	SELECTED_SONG  = SONGS.indexOf(SMONK_7);
	SONG_START     = 27;
}

function setup() {
	// Create screen for rendering onto
	canvas         = createCanvas(windowWidth, windowHeight);

	// Define total number of assets based on amount of assets called in preload()
	total_assets   = assets_called;
	console.log('total assets : ' + total_assets);

	// Initialise spectrum and amplitude analyser
	fft = new p5.FFT();
	analyser = new p5.Amplitude();
	
  // Set input of amplitude analyser to selected song
	analyser.setInput(SONGS[SELECTED_SONG]);

	// Create new entity manager and specify maximum entities allowed to be rendered
	entityManager  = new EntityManager(10);

	// Spawn Skeletons : spawnSkeleton(id, origin x, origin y, size, range, frequency focus, follow threshold, color mode, show eyes)
	entityManager.spawnSkeleton('skeleton' + entityManager.skeletons.length, width / 2, height / 2, 100, 0, 4000, 0, 100, HSB, true);
	entityManager.spawnSkeleton('skeleton' + entityManager.skeletons.length, width / 2, height / 2, 100, 0, 5000, 1, 100, RGB, true);
	entityManager.spawnSkeleton('skeleton' + entityManager.skeletons.length, width / 2, height / 2, 100, 0, 6000, 2, 100, RGB, true);
	entityManager.spawnSkeleton('skeleton' + entityManager.skeletons.length, width / 2, height / 2, 100, 0, 6400, 3, 100, RGB, true);

	// Set project refresh rate
	frameRate(targetFramerate);
}

// Function handling rendering
function draw() {
	drawBackground();

	// Set loading to false once all assets loaded
	assets_loaded == total_assets && (loading = false);

	// Run visualiser once loading is complete otherwise show start screen
	loading || (started ? run() : startScreen());
}

function drawBackground() {
	// Set background to translucent when paint mode enabled
	g_paint_mode ? background(10, 10, 10, 0.5) : background(10 + (fft.getEnergy(150)/10), 0, 10 + fft.getEnergy(50)/10);
	
	// Startscreen background
	started || background(2, 0, 6);
}

function startScreen() {
	image(png_playButton, (width/2) - 100, (height/2) - 100, 200, 200);
}

function run() {
	// Analyse amplitude and frequency spectrum 
	rms = analyser.getLevel();
	spectrum = fft.analyze();
	
	entityManager.run();

	if (debug) {
		fill(255);
		textAlign(LEFT);
		text('delta : ' + delta, 10, 10);
	}

	if (showFPS) {
		fill(0, 255, 0);
		textAlign(RIGHT);
		text('fps : ' + nf(frameRate(), 0, 2), width, 10);
	}
	
	// Time counter
	t = t + (0.01);
}

// Bone class : new Bone(new x pos, new y pos, previous x pos, previous y pos, colour, health, damage-per-tick, toggle joints)
class Bone {
	constructor(x, y, px, py, colour, health, dpt, showJoint) {
		this.x = x;
		this.y = y;
		this.px = px;
		this.py = py;
		this.colour = colour || 'rgb(255, 255, 255)';
		health < 50 ? this.health = 50 : this.health = health;
		this.dpt = dpt;
		this.showJoint = showJoint || false;
		this.alive = true;
	}
	run() {
		this.update();
		this.display();
	}
	update() {
		this.health -= this.dpt;
	}
	display() {
		if (!g_smoke) {
			stroke(this.colour);
			strokeWeight(this.health/10);
			line(this.x, this.y, this.px, this.py);
		}
		if (this.showJoint && !g_disable_joints) {
			noStroke();
			fill(this.colour);
			circle(this.x, this.y, this.health/5);
			circle(this.px, this.py, this.health/5);
		}
		if (debug) text(this.health, this.x, this.y)
	}
	isDead() {
		return this.health < 0;
	}
}

// Skeleton class : new Skeleton(id, origin x, origin y, size, range, frequency focus, follow threshold, color mode, show eyes)
//                  (objName).addBone(bone colour, bone health, show joints)
class Skeleton {
	constructor(id, x, y, size, range, focus, type, threshold, colorMode, showEyes) {
		this.id = id;
		this.showId = false;
		this.location = createVector(x, y);
		this.target = createVector(x, y);
		this.ax = [];
		this.ay = [];
		this.size = size;
		for (let i = 0; i < this.size; i++) this.ax[i] = x, this.ay[i] = y;
		this.range = range;
		this.step = range;
		this.focus = focus;
		this.type = type;
		this.threshold = threshold;
		this.colorMode = colorMode;
		this.showEyes = showEyes || false;
		this.follow = true;
		this.energy = 0;
		this.bones = [];
		this.entityType = 'skeleton';
		this.kill = false;	
	}
	run() {
		this.update();
		this.display();
	}
	update() {
		// Assign location to skeleton current position
		this.location.set(this.ax[this.size - 1], this.ay[this.size - 1]);

		// Calculate distance between the two points
		this.distance = this.target.dist(this.location);
		if (!mouseIsPressed) this.mappedDistance = map(this.distance, 100, 0, 1, 0.75);

		// Calculate direction of target towards skeleton
		this.target.sub(this.location);

		// Normalise length of vector to 1
		this.target.normalize();

		this.target.mult(this.mappedDistance);
		this.location.add(this.target);

		// Calculate step size based on current amplitude of given audio and frequency focus
		this.energy = fft.getEnergy(this.focus)
		this.step = rms * (this.range + this.energy);

		if (this.energy < this.threshold) {
			this.follow = true;
		} else if (!mouseIsPressed) {
			this.follow = false;
		}

		// Add new position to array
		if (this.follow) {
			// Wander towards the target
			this.ax.push(this.ax[this.size - 1] += random(-this.step / 2 - rms, this.step / 2 + rms) + this.target.x);
			this.ay.push(this.ay[this.size - 1] += random(-this.step / 2 - rms, this.step / 2 + rms) + this.target.y);
		} else {
			// Move around aimlessly
			this.ax.push(this.ax[this.size - 1] += random(-this.step + sin(t) - rms, this.step + sin(t) + rms)) * delta;
		  this.ay.push(this.ay[this.size - 1] += random(-this.step + cos(t) - rms, this.step + cos(t) + rms)) * delta;
		}
		
		// Set target to the mouse when pressed down
		if (mouseIsPressed) this.followMouse(true);

		// Remove points once the size limit is reached
		if (this.ax.length > this.size) this.ax.splice(1, 1);
		if (this.ay.length > this.size) this.ay.splice(1, 1);

		// Constrain all points to the screen
		this.ax[this.size - 1] = constrain(this.ax[this.size - 1], 0, width);
		this.ay[this.size - 1] = constrain(this.ay[this.size - 1], 0, height);

		// Run Skeletons : addBone(bone colour, bone health, damage-per-tick, show joints)
		colorMode(this.colorMode);
		if (this.type == 0) {
			this.addBone(color(fft.getEnergy(5000)*2, fft.getEnergy(500), fft.getEnergy(100)/2), this.energy, 3, true);
			if (!mouseIsPressed) this.target.set((height * sin(t)) + width/2, (height * cos(t) + height/2));
		}

		if (this.type == 1) {
			this.addBone(color(fft.getEnergy(500)/2, fft.getEnergy(100), fft.getEnergy(5000)*2), this.energy, 3, true);
			if (!mouseIsPressed) this.target.set((height * sin(t)) + width/2, (height * cos(t) + height/2));
		}

		if (this.type == 2) {
			this.addBone(color(fft.getEnergy(500)/2, fft.getEnergy(5000)*1.5, fft.getEnergy(100)/1.5), this.energy, 3, true);
			if (!mouseIsPressed) this.target.set((height * cos(t)) + width/2, (height * sin(t) + height/2));
		}

		if (this.type == 3) {
			this.addBone(color(fft.getEnergy(700)*2, fft.getEnergy(10000)/2, fft.getEnergy(100)/2), this.energy, 3, true);
			if (!mouseIsPressed) this.target.set((height * cos(t)) + width/2, (height * sin(t) + height/2));
		}
		colorMode(RGB);
	}
	display() {
		// Cycle through bones to render and/or remove when health is 0 or size limit reached
		for (let i = this.bones.length-1; i >= 0; i--) {
			let b = this.bones[i];
			b.run();
			if (b.health <= 2) {
				this.bones.splice(i, 1);
			}
			if (this.bones.length >= this.size) {
				this.bones.splice(0, 1);
			}
		}

		// Render eyes		
		if (this.showEyes && g_show_eyes) {
			fill(255);
			ellipse(this.ax[this.size - 2], this.ay[this.size - 2], 10);
			fill(0);
			ellipse(this.ax[this.size - 2], this.ay[this.size - 2], 5);
		}

		if (this.showId) {
			fill(255);
			text('id: ' + this.id, this.ax[this.size - 2], this.ay[this.size - 2]);
		}
	}
	followMouse(boolean) {
		if (boolean) {
			this.follow = true;
			this.mappedDistance = map(this.distance, 100, 0, 3, 1);
			this.target.set(mouseX, mouseY);
		}
	}
	addBone(bc, bh, dpt, sj) {
		this.bones.push(new Bone(this.ax[this.size-1], this.ay[this.size-1], this.ax[this.size-5], this.ay[this.size-5], bc, bh, dpt, sj));
	}
	delete() {
		this.bones = [];
		this.kill = true;
	}
}

// Entity Mangager : new EntityManager(maximum entities)
class EntityManager {
	constructor(max) {
		this.maximum = max;
		this.entities = [];
		this.skeletons = [];
		this.showId = false;
	}
	run() {
		for (let i = this.entities.length-1; i >= 0; i--) {
			let e = this.entities[i];
			//if (e.kill) {
			//	this.entities.splice(i, 1);
			//	this.filterSkeletons();
			//}

			!e.kill || (this.entities.splice(i, 1), this.filterSkeletons()); 

			this.showId ? e.showId = true : e.showId = false;

			e.run();
		}
	}
	spawnSkeleton(id, x, y, size, range, focus, type, threshold, colorMode, showEyes) {
		// Check maximum number of entities and spawn if within limit
		if (this.entities.length < this.maximum) {
			// Add new skeleton to array of entities
			this.entities.push(new Skeleton(id, x, y, size, range, focus, type, threshold, colorMode, showEyes));
			// Update array of skeletons
			this.filterSkeletons();
		} else {
			// Log warning if entity limit reached or exceeded
			console.warn('Could not spawn skeleton. Maximum number of entities reached: ' + this.maximum);
		}
	}
	filterSkeletons() {
		// Find skeletons within the main entity array and index them
		this.skeletons = this.entities.filter(function(element) {
			return element.entityType = 'skeleton';
		});
	}
	getEntityById(id) {
		// Return entity with specified id
		return this.entities.find(x => x.id === id);
	}
}

// Function to call when changing the current song playing
function selectSong(s, t) {
	// Declare song starting time
	var time = t || 0;

	// Stop playing current song
	SONGS[SELECTED_SONG].stop();

	// Set selected song
	SELECTED_SONG = SONGS.indexOf(s);

	// Set analyser input to selected song
	analyser.setInput(SONGS[SELECTED_SONG]);

	// Play new selected song at specified time (seconds)
	SONGS[SELECTED_SONG].play();
	SONGS[SELECTED_SONG].jump(t);
}

// Allow audio after initiating touch
function touchStarted() {
	if (!started && !loading) {
		getAudioContext().resume();
		selectSong(SONGS[SELECTED_SONG], SONG_START);
		started = true;
	}
}

// Resize the canvas when viewport adjusted
function windowResized() {
	canvas.resize(windowWidth, windowHeight);
}