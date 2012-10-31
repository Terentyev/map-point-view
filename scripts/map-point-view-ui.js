/**
 * Open file and read it.
 */
function MapPointViewUI_load_data(file_input, form) {
  var file_input = $('#' + file_input);
  if (/*@cc_on!@*/0) {
    // is MSIE
    var file_name = file_input.val();

    if (!file_name) {
      return;
    }

    try {
      var fso = new ActiveXObject("Scripting.FileSystemObject");
      var file = fso.OpenTextFile(file_name, 1);
      var file_content = file.ReadAll();
       
      file.Close();
       
      MapPointViewUI_process_file_data(file_name, file_content, form);;
    } catch (e) {
      if (e.number == -2146827859) {
        alert('Unable to access local files due to browser security settings. ' +
        'To overcome this, go to Tools->Internet Options->Security->Custom Level. ' +
        'Find the setting for "Initialize and script ActiveX controls not marked as safe" and change it to "Enable" or "Prompt"');
      }
    }
  }
  else {
    var file = file_input.prop('files')[0];
    if (!file) {
      return;
    }

    var file_name;
    var slice;
    var reader = new FileReader();

    if (jQuery.browser.mozilla) {
      slice = file.mozSlice(0, file.size);
      file_name = file.name;
    }
    else {
      slice = file.slice(0, file.size);
      file_name = file.fileName;
    }

    reader.onload = function(e) {
      if (e.target.readyState == FileReader.DONE) {
        MapPointViewUI_process_file_data(file_name, e.target.result, form);
      }
    };

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

/**
 * Process read data.
 */
function MapPointViewUI_process_file_data(file_name, file_content, form) {
  var data = MapPointViewLoadData(file_name, file_content);
  if (data.headers.length) {
    MapPointViewUI_select_fields(data, form);
  }
}
