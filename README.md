# Deep Sea Visual
An early development music visualiser.

## Loading and selecting songs

Define variable with loadAsset function and add it to the songs array:
```
let song_name = loadAsset('audio', 'path/to/song');
SONGS.push(song_name);
```
To select a song use the following command:
```
selectSong(song_name, start_time);
```
