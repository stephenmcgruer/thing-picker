// Copyright 2017 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

(function(window) {
  "use strict";

  // HACK(smcgruer): This is SUPER INSECURE. One should always proxy requests
  // via a known server instead of exposing a key to js like this.
  const FLICKR_API_KEY = "YOUR KEY HERE";

  const ThingPicker = {

    photos: [],

    current_page: 1,

    numerator: 0,

    denominator: 0,

    allow_interaction: true,

    flickr: new Flickr({ api_key: FLICKR_API_KEY }),

    showNextPhoto: function() {
      if (this.photos.length == 0) {
        this.allow_interaction = false;
        document.getElementById("pictureBox").classList.add("hidden");
        document.getElementById("no-image-spinner").classList.remove("hidden");

        this.getMorePhotos();
        return;
      }
      this.showPhoto(this.photos[0]);
    },

    showPhoto: function(photo) {
      this.allow_interaction = true;
      document.getElementById("pictureBox").classList.remove("hidden");
      document.getElementById("no-image-spinner").classList.add("hidden");

      // TODO(smcgruer): Call getSizes API to determine allowable sizes, use the
      // biggest.
      const url = "https://farm" + photo.farm + ".staticflickr.com/" + photo.server + "/" + photo.id + "_" + photo.secret + ".jpg";
      document.getElementById("pictureBox").src = url;

      this.numerator += 1;
      this.refreshXOverYText();
    },

    getMorePhotos: function() {
      const result_cb = function(err, result) {
        this.handlePhotosSearchResponse(err, result);
      }.bind(this);

      this.flickr.photos.search({
        text: 'YOUR TOPIC HERE',
        sort: 'relevance',
        media: 'photos',
        page: this.current_page,
        per_page: '25'
      }, result_cb);
    },

    handlePhotosSearchResponse: function (err, result) {
      if (err) {
        console.log(err);
        return;
      }

      const ref = firebase.database().ref(this.firebase_user.uid + '/photos');
      const firebasePromises = Promise.map(result.photos.photo, photo => {
        return ref.child(photo.id).once('value').then(s => {
          if (s.val() === null) {
            this.photos.push(photo);
            if (this.photos.length == 1) {
              this.showPhoto(photo);
            }
          }
        }).reflect();
      });

      Promise.all(firebasePromises).then(values => {
        this.denominator += this.photos.length;
        this.refreshXOverYText();

        if (this.photos.length == 0) {
          console.log('Already seen all, calling back into getMorePhotos');
          this.getMorePhotos();
        }
      });

      this.current_page += 1;
    },

    markPhotoAs: function(description) {
      if (!this.allow_interaction) {
        return;
      }
      if (!this.firebase_user) {
        window.alert('Error: Unable to save result; firebase user not set.');
        return;
      }
      if (this.photos.length == 0) {
        window.alert('Error: no photo shown?');
        this.showNextPhoto();
        return;
      }

      const current_photo = this.photos[0];
      const path = this.firebase_user.uid + '/photos/' + current_photo.id;
      firebase.database().ref(path).set({
        id: current_photo.id,
        farm: current_photo.farm,
        server: current_photo.server,
        secret: current_photo.secret,
        decision: description
      });

      this.photos.shift();
      this.showNextPhoto();
    },

    refreshXOverYText: function() {
      const text = this.numerator + "/" + this.denominator;
      document.getElementById("x-over-y-text").innerText = text;
    }

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

firebase.auth().onAuthStateChanged (function(user) {
  if (user) {
    window.ThingPicker.firebase_user = user;
  } else {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider).then(function(result) {
      window.ThingPicker.firebase_user = user;
    }, function(error) {
      // TODO(smcgruer): Handle errors: https://firebase.google.com/docs/reference/js/firebase.auth.Auth#signInWithPopup
      console.log(error);
      window.alert(
        "Unable to sign you in; please allow popups if disabled and refresh.");
    });
  }
});
