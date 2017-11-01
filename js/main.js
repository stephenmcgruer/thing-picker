(function(window) {
  "use strict";

  const ThingPicker = {

    showNextPhoto: function() {
      // No-op for now.
    },

    markPhotoAs: function(description) {
      // No-op for now.
      window.alert("You " + description + " this photo!");

      this.showNextPhoto();
    },

  };

  // There is only one ThingPicker, to rule them all.
  window.ThingPicker = ThingPicker;

}(window));

window.addEventListener('load', function() {
  const love_it_button =  document.getElementById("love_it_button");
  love_it_button.addEventListener('click', function() {
    window.ThingPicker.markPhotoAs('loved');
  });
  const like_it_button =  document.getElementById("like_it_button");
  like_it_button.addEventListener('click', function() {
    window.ThingPicker.markPhotoAs('liked');
  });
  const hate_it_button =  document.getElementById("hate_it_button");
  hate_it_button.addEventListener('click', function() {
    window.ThingPicker.markPhotoAs('hated');
  });

  window.ThingPicker.showNextPhoto();
});
