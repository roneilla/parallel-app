var form = document.querySelector('form#create-form');
var hostName = document.getElementById('hostName');
var serverName = document.getElementById('serverName');
var serverId = document.getElementById('serverId');

var hostbutton = document.getElementById('host-button');

function createRoom(in_id, in_name, in_host) {
  var settings = {
    url: '/partyRooms',
    method: 'POST',
    timeout: 0,
    contentType: 'application/json',
    data: JSON.stringify({
      serverId: in_id,
      serverName: in_name,
      hostName: in_host,
    }),
  };

  $.ajax(settings).done(function (response) {
    console.log(response);
  });
}

form.addEventListener('submit', function (e) {
  e.preventDefault();
  createRoom(
    String(serverId.value),
    String(serverName.value),
    String(hostName.value)
  );
});

hostbutton.addEventListener('click', function () {
  if (form.style.display == 'none') {
    form.style.display = 'block';
  } else {
    form.style.display = 'none';
  }
});
