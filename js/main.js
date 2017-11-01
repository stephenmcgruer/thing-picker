(function(window) {
  "use strict";

  // HACK(smcgruer): This is SUPER INSECURE. One should always proxy requests
  // via a known server instead of exposing a key to js like this.
  const FLICKR_API_KEY = "YOUR KEY HERE";

  const ThingPicker = {

    photos: [],

    current_page: 1,

    flickr: new Flickr({ api_key: FLICKR_API_KEY }),

    showNextPhoto: function() {
      // TODO(smcgruer): Grey-out the current photo and show a loading spinner.
      if (this.photos.length == 0) {
        this.getMorePhotos(this.showNextPhoto.bind(this));
        return;
      }

      const photo = this.photos.shift();
      this.showPhoto(photo);
    },

    showPhoto: function(photo) {
      const url = "https://farm" + photo.farm + ".staticflickr.com/" + photo.server + "/" + photo.id + "_" + photo.secret + ".jpg";
      document.getElementById("pictureBox").src = url;
    },

    getMorePhotos: function(next_photo_cb) {
      const result_cb = function(err, result) {
        this.handleFlickrPhotosResponse(next_photo_cb, err, result);
      }.bind(this);

      this.flickr.photos.search({
        text: 'YOUR TOPIC HERE',
        sort: 'relevance',
        media: 'photos',
        page: this.current_page,
        per_page: '25'
      }, result_cb);
    },

    handleFlickrPhotosResponse: function (next_photo_cb, err, result) {
      if (err) {
        console.log(err);
        return;
      }
      for (const photo of result.photos.photo) {
        this.photos.push(photo);
      }
      this.current_page += 1;
      next_photo_cb();
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
