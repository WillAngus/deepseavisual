let song_src;

document.getElementById('audio_file').onchange = function() {
  var file = document.querySelector('input[type=file]').files[0];
  var reader = new FileReader();

  reader.addEventListener("load", function () {
    song_src = reader.result;
  }, false);

  if (file) {
    reader.readAsDataURL(file);
  }
  
  song_src = file;
  console.log(file);
  addScript('sketch.js');
};

function addScript(src) {
  if (!document.getElementsByTagName || !document.createElement || !document.appendChild) {
    return false;
  } else {
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = src;
    document.getElementsByTagName("head")[0].appendChild(script);
    return true;
  }	
}