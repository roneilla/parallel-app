Handlebars.registerHelper('convertToSeconds', function (a) {
  var minutes = Math.floor(a / 60000);
  var seconds = ((a % 60000) / 1000).toFixed(0);
  return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
});

Handlebars.registerHelper('checkPlayer', function (a) {
  if (a == true) {
    return 'Playing!';
  } else {
    return 'Nothing playing!';
  }
});
