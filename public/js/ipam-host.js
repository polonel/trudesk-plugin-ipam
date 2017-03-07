window.truRequire(['jquery', 'helpers', 'datatables', 'dt_ipaddress', 'uikit', 'underscore'], function(loadedModules) {
    var $ = loadedModules[0];
    var helpers = loadedModules[1];
    var UIKit = loadedModules[4];
    var _ = loadedModules[5];

    $(document).ready(function() {
        helpers.init();

        var $map = $('#map');
        if ($map.length > 0) {
            var map = new GMaps({
                el: '#map',
                lat: 0,
                lng: 0,
                zoom: 18,
                panControl: false,
                mapTypeControl: false,
                scrollwheel: false
            });

            var address = $('#map').attr('data-location').trim();

            GMaps.geocode({
                address: address,
                callback: function(results, status){
                    if(status=='OK'){
                        var latlng = results[0].geometry.location;
                        map.setCenter(latlng.lat(), latlng.lng());
                        map.addMarker({
                            lat: latlng.lat(),
                            lng: latlng.lng()
                        });
                    }
                }
            });
        }

        var $addExtraForm = $('#addExtraForm');
        $addExtraForm.off('submit');
        $addExtraForm.on('submit', function(event) {
            var data = {};
            if (!$addExtraForm.isValid(null, null, false)) return true;
            event.preventDefault();
            $addExtraForm.serializeArray().map(function(x){data[x.name] = x.value;});

            $.ajax({
                url: '/plugins/ipam/api/addextra/' + data["host_id"],
                method: 'POST',
                headers: { 'Content-Type': 'application/json'},
                data: JSON.stringify(data),
                success: function(response) {
                    if (response.success) {
                        helpers.UI.showSnackbar({
                            text: 'Successfully Added Extra'
                        });

                        History.pushState(null, null, window.location.pathname + '?r=' + Math.random());
                    } else {
                        helpers.UI.showSnackbar('Error: Unable to add extra', true);
                    }
                },
                error: function(response) {
                    helpers.UI.showSnackbar('Error: ' + response.responseJSON.error, true);
                    console.log('ERROR:', response);
                }
            });
        });

        $('.extra-edit-btn').click(function(event) {
            event.preventDefault();
            var form = $(this).parents('form');
            form.find('input[disabled]').attr('disabled', false);
            $(this).addClass('hide');
            form.find('button.extra-save-btn').removeClass('hide');
        });

        $('.extra-save-btn').click(function(event) {
            event.preventDefault();
            var form = $(this).parents('form');

            var data = {};
            if (!form.isValid(null, null, false)) return true;
            form.serializeArray().map(function(x){data[x.name] = x.value; });

            data.extraId = $(this).attr('data-extra-id');

            $.ajax({
                url: '/plugins/ipam/api/updateextra/' + data["host_id"],
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                data: JSON.stringify(data),
                success: function(response) {
                    if (response.success) {
                        helpers.UI.showSnackbar({
                            text: 'Successfully Updated Extra'
                        });

                        History.pushState(null, null, window.location.pathname + '?r=' + Math.random());
                    } else {
                        helpers.UI.showSnackbar('Error: Unable to add extra', true);
                    }
                },
                error: function(response) {
                    helpers.UI.showSnackbar('Error: ' + response.responseJSON.error, true);
                    console.log('ERROR:', response);
                }
            });
        });

        $('.extra-delete-btn').click(function(event) {
            event.preventDefault();

            var form = $(this).parents('form');

            var data = {};
            if (!form.isValid(null, null, false)) return true;
            form.serializeArray().map(function(x){data[x.name] = x.value; });

            data.extraId = $(this).attr('data-extra-id');

            $.ajax({
                url: '/plugins/ipam/api/deleteextra/' + data["host_id"],
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                data: JSON.stringify(data),
                success: function(response) {
                    if (response.success) {
                        helpers.UI.showSnackbar({
                            text: 'Successfully Deleted Extra'
                        });

                        History.pushState(null, null, window.location.pathname + '?r=' + Math.random());
                    } else {
                        helpers.UI.showSnackbar('Error: Unable to delete extra', true);
                    }
                },
                error: function(response) {
                    helpers.UI.showSnackbar('Error: ' + response.responseJSON.error, true);
                    console.log('ERROR:', response);
                }
            });
        });
    });
});