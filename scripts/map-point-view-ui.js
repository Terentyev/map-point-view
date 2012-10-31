/**
 * Open file and read it.
 */
function MapPointViewUI_load_data(file_input, form) {
  if (/*@cc_on!@*/0) {
    // is MSIE
    var files = document.getElementById(file_input).files;
    if (files.length != 0) {
      alert('Should select one file');
      return;
    }

    try {
      var fso = new ActiveXObject("Scripting.FileSystemObject");
      var file = fso.OpenTextFile(files[0].file, 1);
      var fileContent = file.ReadAll();
       
      file.Close();
       
      return fileContent;
    } catch (e) {
      if (e.number == -2146827859) {
        alert('Unable to access local files due to browser security settings. ' +
        'To overcome this, go to Tools->Internet Options->Security->Custom Level. ' +
        'Find the setting for "Initialize and script ActiveX controls not marked as safe" and change it to "Enable" or "Prompt"');
      }
    }
  }
  else {
    var file = $('#' + file_input).prop('files')[0];
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

    var slice = null;
    if (jQuery.browser.mozilla) {
      slice = file.mozSlice(0, file.size);
    }
    else {
      slice = file.slice(0, file.size);
    }
    reader.readAsBinaryString(slice);
  }
}

/**
 * Show form to user for select fields.
 */
function MapPointViewUI_select_fields(data, form) {
  $('select.user-data', form).each(function (index) {
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
              $('select.user-data', form).each(function () {
                data.keys[$(this).attr('id')] = $(this).val();
              });
              map.MapPointView.LoadData(data, $('#proj_src', form).val());
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
