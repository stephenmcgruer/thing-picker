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

    flickr: new Flickr({ api_key: FLICKR_API_KEY }),

    showNextPhoto: function() {
      // TODO(smcgruer): Grey-out the current photo and show a loading spinner.
      if (this.photos.length == 0) {
        this.getMorePhotos(this.showNextPhoto.bind(this));
        return;
      }

      const photo = this.photos.shift();

      // Check whether we have already seen this photo before.
      // TODO(smcgruer): This is quite hacky as it tries to handle the case
      // where no-one is logged in. We should just only ever call
      // |showNextPhoto| when there is a Firebase user.
      if (this.firebase_user) {
        const read_value_cb = function(snapshot) {
          if (snapshot.val() !== null) {
            console.log('Already seen photo, skipping: ' + snapshot);
            this.showNextPhoto();
          } else {
            this.showPhoto(photo);
          }
        }.bind(this);
        const ref = firebase.database().ref(this.firebase_user.uid + '/photos');
        ref.child(photo.id).once('value', read_value_cb);
      } else {
        this.showPhoto(photo);
      }
    },

    showPhoto: function(photo) {
      const url = "https://farm" + photo.farm + ".staticflickr.com/" + photo.server + "/" + photo.id + "_" + photo.secret + ".jpg";
      document.getElementById("pictureBox").src = url;
      this.current_photo = photo;
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
      if (!this.firebase_user) {
        window.alert('Error: Unable to save result; firebase user not set.');
        return;
      }
      if (!this.current_photo) {
        window.alert('Error: no photo currently?');
        this.showNextPhoto();
        return;
      }

      const current_photo = this.current_photo;
      const path = this.firebase_user.uid + '/photos/' + current_photo.id;
      firebase.database().ref(path).set({
        id: current_photo.id,
        farm: current_photo.farm,
        server: current_photo.server,
        secret: current_photo.secret,
        decision: description
      });

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
    });
  }
});
