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

  const AdminPicker = {

    showUserList: function() {
      firebase.database().ref().once('value').then(s => {
        const user_list = document.getElementById("user_list");
        s.forEach(function(user) {
          const entry = document.createElement("li");
          const link = document.createElement("a");
          link.href = "#";
          link.addEventListener("click", this.userSelected);
          link.innerText = user.key;
          entry.appendChild(link);
          user_list.appendChild(entry);
        }.bind(this));
      });
    },

    userSelected: function(event) {
      const user = event.target.innerText;
      const ref = firebase.database().ref(user + '/photos');
      ref.once('value').then(s => {
        const loved_photo_list = document.getElementById("loved_photo_list");
        const liked_photo_list = document.getElementById("liked_photo_list");
        const hated_photo_list = document.getElementById("hated_photo_list");
        loved_photo_list.innerHTML = "";
        liked_photo_list.innerHTML = "";
        hated_photo_list.innerHTML = "";
        s.forEach(function(photo_snapshot) {
          const photo = photo_snapshot.val();
          const entry = document.createElement("li");
          const link = document.createElement("a");
          const url = "https://farm" + photo.farm + ".staticflickr.com/" + photo.server + "/" + photo.id + "_" + photo.secret + ".jpg";
          link.href = url;
          link.innerText = url;
          entry.appendChild(link);
          if (photo.decision === "loved") {
            loved_photo_list.appendChild(entry);
          } else if (photo.decision === "liked") {
            liked_photo_list.appendChild(entry);
          } else if (photo.decision === "hated") {
            hated_photo_list.appendChild(entry);
          }
        });
      });
    }

  };

  // There is only one AdminPicker, to rule them all.
  window.AdminPicker = AdminPicker;

}(window));

firebase.auth().onAuthStateChanged (function(user) {
  if (user) {
    window.AdminPicker.firebase_user = user;
    window.AdminPicker.showUserList();
  } else {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider).then(function(result) {
      window.AdminPicker.firebase_user = user;
      window.AdminPicker.showUserList();
    }, function(error) {
      // TODO(smcgruer): Handle errors: https://firebase.google.com/docs/reference/js/firebase.auth.Auth#signInWithPopup
      console.log(error);
      window.alert(
        "Unable to sign you in; please allow popups if disabled and refresh.");
    });
  }
});
