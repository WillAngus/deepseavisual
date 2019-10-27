let t = 0;
let debug = false;
let canvas;

let skeleton, skeleton2, skeleton3, skeleton4;

let song, analyser, spectrum, rms, fft;

function preload() {
	//song = loadSound('https://willangus.github.io/musicshare/sound/Peepee%20Session%20Demo%202018-11-02.wav');
	song = loadSound('https://willangus.github.io/musicshare/sound/Uni/SMONK 7.mp3');
	//song = loadSound('https://willangus.github.io/musicshare/sound/Uni/01 Patience.mp3');
}

function setup() {
  canvas = createCanvas(windowWidth, windowHeight);
	
	// Initialise Skeletons : new Skeleton(origin x, origin y, size, range, frequency focus)
	skeleton = new Skeleton(width / 2, height / 2, 1000, 0, 4000);
	skeleton2 = new Skeleton(100, 50, 1000, 0, 5000);
	skeleton3 = new Skeleton(width / 1.25, height / 1.25, 1000, 0, 6000);
	skeleton4 = new Skeleton(width / 2, height / 1.5, 1000, 0, 6200);
	
	// Play song and skip to (seconds)
	song.play();
	song.jump(65);

	// Initialise spectrum and amplitude analyser
	fft = new p5.FFT();
  analyser = new p5.Amplitude();

  // Input the audio track into the amplitude analyser
  analyser.setInput(song);
	
	// Change playback speed
	song.rate(1);
	
	randomSeed(99);
	
  frameRate(60);
}

function draw() {
  background(0, 0, fft.getEnergy(70)/5);
	
	// Analyse amplitude and frequency spectrum 
	rms = analyser.getLevel();
	spectrum = fft.analyze();
	
	// Run Skeletons : addBone(bone colour, bone health)
	skeleton.run();
	skeleton.addBone(color(fft.getEnergy(5000)*2, fft.getEnergy(500), fft.getEnergy(100)/2), 1000, true);
	
	skeleton2.run();
	skeleton2.addBone(color(fft.getEnergy(500)/2, fft.getEnergy(100), fft.getEnergy(5000)*2), 1000, true);
	
	skeleton3.run();
	skeleton3.addBone(color(fft.getEnergy(500)/2, fft.getEnergy(5000)*1.5, fft.getEnergy(100)/1.5), 1000, true);
	
	skeleton4.run();
	skeleton4.addBone(color(fft.getEnergy(700), fft.getEnergy(10000)*2, fft.getEnergy(100)/1.5), 1000, true);
	
	if (debug) {
		fill(255);
		text('rms: ' + rms, 10, 10);
	}
	
	if (!canvas.touchStarted) {
		fill(255);
		textAlign(CENTER);
		text('Click to begin.', width/2, height/2);
	}
	
	// Time counter
	t = t + (0.01);
}

// Bone class : new Bone(new x pos, new y pos, previous x pos, previous y pos, colour, health, toggle joints)
class Bone {
	constructor(x, y, px, py, colour, health, showJoint) {
		this.x = x;
		this.y = y;
		this.px = px;
		this.py = py;
		this.colour = colour || 'rgb(255, 255, 255)';
		this.health = 100;
		this.showJoint = showJoint || false;
		if (this.health < 100) this.health = 100;
		this.alive = true;
	}
	run() {
		this.update();
		this.display();
	}
	display() {
		stroke(this.colour);
		strokeWeight(this.health/10);
		line(this.x, this.y, this.px, this.py);
		if (this.showJoint) {
			noStroke();
			fill(this.colour);
			circle(this.x, this.y, this.health/5);
		}
	}
	update() {
		this.health-=1;
	}
	isDead() {
		return this.health < 0;
	}
}

// Skeleton class : new Skeleton(origin x, origin y, size, range, frequency focus)
//									(objName).addBone(bone colour, bone health)
class Skeleton {
	constructor(x, y, size, range, focus) {
		this.location = createVector(x, y);
		this.target = createVector(x, y);
		this.ax = [];
		this.ay = [];
		this.size = size;
		this.range = range;
		this.step = range;
		this.focus = focus;
		this.follow = true;
		this.energy;
		for ( let i = 0; i < this.size; i++ ) {
			this.ax[i] = x;
			this.ay[i] = y;
		}
		this.bones = [];
	}
	run() {

		// Assign location to skeleton current position
		this.location.x = this.ax[this.size - 1];
		this.location.y = this.ay[this.size - 1];

		// Assign location to target destination
		this.target.x = (width * sin(t)) + width/2;
		this.target.y = (height * cos(t) + height/2);

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

		if (this.energy < 100) {
			this.follow = true;
		} else {
			this.follow = false;
		}
		
		// Add new position to array
		if (this.follow) {
			// Wander towards the taget
			this.ax.push(this.ax[this.size - 1] += random(-this.step / 5 - rms, this.step / 5 + rms) + this.target.x);
			this.ay.push(this.ay[this.size - 1] += random(-this.step / 5 - rms, this.step / 5 + rms) + this.target.y);
		} else {
			// Move around aimlessly
			this.ax.push(this.ax[this.size - 1] += random(-this.step + sin(t) - rms, this.step + sin(t) + rms));
		  this.ay.push(this.ay[this.size - 1] += random(-this.step + cos(t) - rms, this.step + cos(t) + rms));
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
			if (b.health < 0 || this.bones.length >= this.size) {
				this.bones.splice(i, 1);
			}
		}

		if (debug) {
			fill(255);
			text('energy: ' + this.energy, this.location.x, this.location.y);
		}

	}
	addBone(bc, bh, tj) {
		this.bones.push(new Bone(this.ax[this.size-1], this.ay[this.size-1], this.ax[this.size-5], this.ay[this.size-5], bc, bh, tj));
	}
}

// Allow audio after initiating touch
function touchStarted() {
  getAudioContext().resume();
}
