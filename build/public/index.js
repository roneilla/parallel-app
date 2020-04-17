(function () {
  /**
   * Obtains parameters from the hash of the URL
   * @return Object
   */
  function getHashParams() {
    var hashParams = {};
    var e,
      r = /([^&;=]+)=?([^&;]*)/g,
      q = window.location.hash.substring(1);
    while ((e = r.exec(q))) {
      hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
  }

  var userProfileSource = document.getElementById('user-profile-template')
      .innerHTML,
    userProfileTemplate = Handlebars.compile(userProfileSource),
    userProfilePlaceholder = document.getElementById('user-profile');

  var oauthSource = document.getElementById('oauth-template').innerHTML,
    oauthTemplate = Handlebars.compile(oauthSource),
    oauthPlaceholder = document.getElementById('oauth');

  var params = getHashParams();

  var access_token = params.access_token,
    refresh_token = params.refresh_token,
    error = params.error;

  if (error) {
    alert('There was an error during the authentication');
  } else {
    if (access_token) {
      // render oauth info
      oauthPlaceholder.innerHTML = oauthTemplate({
        access_token: access_token,
        refresh_token: refresh_token,
      });

      $.ajax({
        url: 'https://api.spotify.com/v1/me/player/currently-playing',
        headers: {
          Authorization: 'Bearer ' + access_token,
        },
        success: function (response) {
          userProfilePlaceholder.innerHTML = userProfileTemplate(response);

          $('#login').hide();
          $('#loggedin').show();
        },
      });
    } else {
      // render initial screen
      $('#login').show();
      $('#loggedin').hide();
    }

    function refreshData() {
      $.ajax({
        url: 'https://api.spotify.com/v1/me/player/currently-playing',
        headers: {
          Authorization: 'Bearer ' + access_token,
        },
        success: function (response) {
          userProfilePlaceholder.innerHTML = userProfileTemplate(response);
          $('#login').hide();
          $('#loggedin').show();
        },
      });
    }

    setInterval(function () {
      refreshData();
    }, 500);

    document.getElementById('obtain-new-token').addEventListener(
      'click',
      function () {
        $.ajax({
          url: '/refresh_token',
          data: {
            refresh_token: refresh_token,
          },
        }).done(function (data) {
          access_token = data.access_token;
          oauthPlaceholder.innerHTML = oauthTemplate({
            access_token: access_token,
            refresh_token: refresh_token,
          });
        });
      },
      false
    );

    document.getElementById('pause-button').addEventListener(
      'click',
      function () {
        var settings = {
          url: 'https://api.spotify.com/v1/me/player/pause',
          method: 'PUT',
          timeout: 0,
          headers: {
            Authorization: 'Bearer ' + access_token,
          },
        };

        $.ajax(settings).done(function (response) {
          console.log(response);
        });
      },
      false
    );

    document.getElementById('play-button').addEventListener(
      'click',
      function () {
        var settings = {
          url: 'https://api.spotify.com/v1/me/player/play',
          method: 'PUT',
          timeout: 0,
          headers: {
            Authorization: 'Bearer ' + access_token,
          },
        };

        $.ajax(settings).done(function (response) {
          console.log(response);
        });
      },
      false
    );

    var songName, position, duration;

    function getSongName() {
      var settings = {
        url: 'https://api.spotify.com/v1/me/player/currently-playing/',
        method: 'GET',
        timeout: 0,
        headers: {
          Authorization: 'Bearer ' + access_token,
        },
      };

      $.ajax(settings).done(function (response) {
        console.log(response.item.name);
        songName = String(response.item.name);
        position = response.progress_ms;
        duration = response.item.duration_ms;
      });
    }

    function refreshSongInfo() {
      getSongName();

      var settings = {
        url: '/partyRooms',
        method: 'PUT',
        timeout: 0,
        contentType: 'application/json',
        data: JSON.stringify({
          songName: songName,
          position: position,
          duration: duration,
        }),
      };

      $.ajax(settings).done(function (response) {
        console.log(response);
      });
    }

    setInterval(refreshSongInfo, 100);

    document.getElementById('sync-button').addEventListener(
      'click',
      function () {
        // var party_position = 50000;
        // var settings = {
        //   url:
        //     'https://api.spotify.com/v1/me/player/seek?position_ms=' +
        //     party_position,
        //   method: 'PUT',
        //   timeout: 0,
        //   contentType: 'application/json',
        // };
        // $.ajax(settings).done(function (response) {
        //   console.log(response);
        // });
        // console.log('hello world');
        // refreshSongInfo();
      },
      false
    );
  }
})();
