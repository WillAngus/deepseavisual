let t = 0;
let targetFramerate = 60;
let delta;
let canvas;

let MISSING_TEXTURE;

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

let png_playButton;

let SONGS, SELECTED_SONG, SONG_START;
let SMONK_7, PATIENCE;

let skeleton, skeleton2, skeleton3, skeleton4;

let analyser, spectrum, rms, fft;

function preload() {
	// Optional loading of assets
	MISSING_TEXTURE = loadImage('https://willangus.github.io/deepseavisual/assets/img/missing_texture.png');
}

function loadAsset(type, url) {

	assets_called++;
	console.log(type + ' called : ' + url)
	
	if (type == 'image') {
		var output = loadImage(url, function(image) {
			assets_loaded++;
			console.log(type + ' loaded successfully : ' + url);
			return image;
		}, error);

		return output;
	}

	if (type == 'audio') {
		var output = loadSound(url, function(audio) {
			assets_loaded++;
			console.log(type + ' loaded successfully : ' + url);
			return audio;
		}, error);

		output.playMode('restart');

		return output;
	}

	function error(err) {
		assets_loaded++;
		console.error(err + ' File not found.');
	}
}

function setup() {
	// Create screen for rendering onto
	canvas         = createCanvas(windowWidth, windowHeight);

	// Load images
	png_playButton = loadAsset('image', 'https://willangus.github.io/deepseavisual/assets/img/play_button.png');

	// Load audio and select song
	SMONK_7        = loadAsset('audio', 'https://willangus.github.io/deepseavisual/assets/sound/SMONK 7.mp3');
	PATIENCE       = loadAsset('audio', 'https://willangus.github.io/deepseavisual/assets/sound/PATIENCE.mp3');
	SONGS          = new Array(SMONK_7, PATIENCE);
	SELECTED_SONG  = SONGS.indexOf(SMONK_7);
	SONG_START     = 27;

	total_assets   = assets_called;

	console.log('total assets : ' + total_assets);

	// Initialise spectrum and amplitude analyser
	fft = new p5.FFT();
	analyser = new p5.Amplitude();
	
  // Set input of amplitude analyser to selected song
	analyser.setInput(SONGS[SELECTED_SONG]);

	// Initialise Skeletons : new Skeleton(origin x, origin y, size, range, frequency focus, follow threshold, show eyes)
	skeleton       = new Skeleton(width / 2, height / 2, 100, 0, 4000, 200, true);
	skeleton2      = new Skeleton(width / 2, height / 2, 100, 0, 5000, 100, true);
	skeleton3      = new Skeleton(width / 2, height / 2, 100, 0, 6000, 100, true);
	skeleton4      = new Skeleton(width / 2, height / 2, 100, 0, 6200, 100, true);

	// Set target frames per second
	frameRate(targetFramerate);
}

function loadingScreen() {
	background(0, 0, 255);
}

function draw() {
	if (assets_loaded == total_assets) loading = false;

	if (loading) {
		loadingScreen();
	} else {
		if (!started) {
			background(2, 0, 6);
			image(png_playButton, (width/2) - 100, (height/2) - 100, 200, 200);
		} else {
			background(10 + (fft.getEnergy(150)/10), 0, 10 + fft.getEnergy(50)/10);
			run();
		}
	}
}

function run() {
	// Analyse amplitude and frequency spectrum 
	rms = analyser.getLevel();
	spectrum = fft.analyze();
	
	// Run Skeletons : addBone(bone colour, bone health, damage-per-tick, show joints)
	skeleton.run();
	skeleton.addBone(color(fft.getEnergy(5000)*2, fft.getEnergy(500), fft.getEnergy(100)/2), skeleton.energy, 3, true);
	skeleton.target.set((height * sin(t)) + width/2, (height * cos(t) + height/2));
	
	skeleton2.run();
	skeleton2.addBone(color(fft.getEnergy(500)/2, fft.getEnergy(100), fft.getEnergy(5000)*2), skeleton2.energy, 3, true);
	skeleton2.target.set((height * sin(t)) + width/2, (height * cos(t) + height/2));
	
	skeleton3.run();
	skeleton3.addBone(color(fft.getEnergy(500)/2, fft.getEnergy(5000)*1.5, fft.getEnergy(100)/1.5), skeleton3.energy, 3, true);
	skeleton3.target.set((height * cos(t)) + width/2, (height * sin(t) + height/2));
	
	skeleton4.run();
	colorMode(HSB);
	// skeleton4.addBone(color(fft.getEnergy(700), fft.getEnergy(10000)*2, fft.getEnergy(100)/1.5), skeleton4.energy, 3, true);
	skeleton4.addBone(color(fft.getEnergy(700)*2, fft.getEnergy(10000)/2, fft.getEnergy(100)/2), skeleton4.energy, 3, true);
	skeleton4.target.set((height * cos(t)) + width/2, (height * sin(t) + height/2));
	colorMode(RGB);
	
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

	delta = deltaTime / targetFramerate;
}

// Bone class : new Bone(new x pos, new y pos, previous x pos, previous y pos, colour, health, damage-per-tick, toggle joints)
class Bone {
	constructor(x, y, px, py, colour, health, dpt, showJoint) {
		this.x = x;
		this.y = y;
		this.px = px;
		this.py = py;
		this.colour = colour || 'rgb(255, 255, 255)';
		this.health = health;
		if (this.health < 50) this.health = 50;
		this.dpt = dpt;
		this.showJoint = showJoint || false;
		this.alive = true;
	}
	run() {
		this.update();
		this.display();
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
	update() {
		this.health -= this.dpt;
	}
	isDead() {
		return this.health < 0;
	}
}

// Skeleton class : new Skeleton(origin x, origin y, size, range, frequency focus)
//                  (objName).addBone(bone colour, bone health, show joints)
class Skeleton {
	constructor(x, y, size, range, focus, threshold, showEyes) {
		this.location = createVector(x, y);
		this.target = createVector(x, y);
		this.ax = [];
		this.ay = [];
		this.size = size;
		this.range = range;
		this.step = range;
		this.focus = focus;
		this.threshold = threshold;
		this.showEyes = showEyes || false;
		this.follow = true;
		this.energy = 0;
		for ( let i = 0; i < this.size; i++ ) {
			this.ax[i] = x;
			this.ay[i] = y;
		}
		this.bones = [];
	}
	run() {

		// Assign location to skeleton current position
		this.location.set(this.ax[this.size - 1], this.ay[this.size - 1]);

		// Assign location to target destination
		//this.target.set((width * sin(t)) + width/2, (height * cos(t) + height/2));

		// Calculate distance between the two points
		this.distance = this.target.dist(this.location);
		this.mappedDistance = map(this.distance, 100, 0, 1, 0.75);

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
		} else {
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
		
		// Remove bones once the size limit is reached
		if (this.ax.length > this.size) this.ax.splice(1, 1);
		if (this.ay.length > this.size) this.ay.splice(1, 1);

		// Constrain all points to the screen
		this.ax[this.size - 1] = constrain(this.ax[this.size - 1], 0, width);
		this.ay[this.size - 1] = constrain(this.ay[this.size - 1], 0, height);
		
		// Cycle through bones array to render and splice
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

		if (this.showEyes && g_show_eyes) {
			fill(255);
			ellipse(this.ax[this.size - 2], this.ay[this.size - 2], 10);
			fill(0);
			ellipse(this.ax[this.size - 2], this.ay[this.size - 2], 5);
		}

	}
	addBone(bc, bh, dpt, sj) {
		this.bones.push(new Bone(this.ax[this.size-1], this.ay[this.size-1], this.ax[this.size-5], this.ay[this.size-5], bc, bh, dpt, sj));
	}
}

/*class Entity {
	constructor() {

	}
	run {

	}
	addSkeleton(x, y, size, range, focus, threshold, showEyes) {
		entities.push(new Skeleton(x, y, s, r, f, t, se));
	}
}*/

function selectSong(s, t) {
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
	getAudioContext().resume();
	if (!started && !loading) {
		selectSong(SONGS[SELECTED_SONG], SONG_START);
	}
	started = true;
}

// Resize the canvas when viewport adjusted
function windowResized() {
	canvas.resize(windowWidth, windowHeight);
}