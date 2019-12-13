# Deep Sea Visual
Music visualiser powered by [p5.js.](https://p5js.org/)

## Spawning and managing creatures

```javascript
entityManager.spawnSkeleton(id, x, y, size, range, focus, type, threshold, colorMode, showEyes);
```
- **Size** : the amount of bones in the creature.
- **Range** : how far the creature jumps with each step.
- **Focus** : the frequency the creature will react to.
- **Threshold** : the minimum amplitude required for the creature to wander randomly (0 - 255).
- **Type** : choose between four different defined colour types (0 - 3).
- **Colour Mode** : pick whether the colours are calculated with HSB or RGB.
- **Toggle Eyes** : boolean choosing whether the eyes render or not.

**Editing values or behaviours of specific creatues**

An entity can be searched for using the EntityManager object. For example, here's how to change a creatures colour mode:
```javascript
entityManager.getEntityById('skeleton0').colorMode = HSB;
```
This can be used to change values of multiple creatures at once:
```javascript
for (let i = entityManager.skeletons.length-1; i>=0; i--) {
  entityManager.getEntityById('skeleton' + i).colorMode = RGB;
}
```
Despawning a creature can also be done using the EntityManager object:
```javascript
entityManager.getEntityById('skeleton0').delete();
```
## Loading and selecting songs

Define variable with loadAsset function and add it to the songs array:
```javascript
let song_name = loadAsset('audio', '.../path/to/song');
SONGS.push(song_name);
```
To select a song use the following command:
```javascript
selectSong(song_name, start_time);
```

## Global Variables
Change these with the console for different rendering modes:
```javascript
let g_smoke = false;
let g_disable_joints = false;
let g_show_eyes = true;
let g_paint_mode = false;
```
