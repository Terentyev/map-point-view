/**
 * Open file and read it.
 */
function MapPointViewUI_load_data(file, form) {
  if (!file) {
    return;
  }

  var reader = new FileReader();

  reader.onload = function(e) {
    if (e.target.readyState == FileReader.DONE) {
      var data = MapPointViewLoadData(file, e.target.result);
      MapPointViewUI_select_fields(data, form);
    }
  };

  reader.readAsBinaryString(file.slice(0, file.size));
}

/**
 * Show form to user for select fields.
 */
function MapPointViewUI_select_fields(data, form) {
  $('select', form).each(function (index) {
      $(this).find('option').remove();
      for (var j in data.headers) {
        var option = $('<option></option>')
          .attr('value', j)
          .text(data.headers[j]);
        if (j == index) {
          option.attr('selected', 'selected');
        }

        $(this).append(option);
      }
  });

  form.dialog({
      buttons: {
          'Confirm': function() {
              data.keys = {};
              $('select', form).each(function () {
                data.keys[$(this).attr('id')] = $(this).val();
              });
              map.MapPointView.LoadData(data);
              $(this).dialog('close');
          },
          Cancel: function() {
              alert('User canceled');
              $( this ).dialog('close');
          }
      },
      close: function() {
          $( this ).dialog('close');
      }
  }).dialog('open');
}
