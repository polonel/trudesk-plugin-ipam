window.truRequire(['jquery', 'helpers', 'datatables', 'dt_ipaddress', 'uikit', 'underscore'], function(loadedModules) {
    var $ = loadedModules[0];
    var helpers = loadedModules[1];
    var UIKit = loadedModules[4];
    var _ = loadedModules[5];

    var createHostModal = undefined;

    $(document).ready(function() {
        helpers.init();

        var table = $('#plugin-ipam-hostTable');
        if (! $.fn.dataTable.isDataTable(table)) {
            table.dataTable({
                searching: false,
                bLengthChange: false,
                paging: false,
                iDisplayLength: 99999,
                bInfo: false,
                scrollY: '100%',
                columnDefs: [
                    {"width": "50px",   "targets": 0},
                    {"width": "200px",  "targets": 1},
                    {"type": "ip-address", "width": "200px",   "targets": 2}
                ],
                order: [[2, "asc"]],
                "oLanguage": {
                    "sEmptyTable": "No hosts have been configured for this subnet"
                }
            });
        }

        var layout = onWindowResize();
        layout();
        $(window).resize(layout);

        table.find('tbody').on('click', 'td', function () {
            var i = $(this).parents('tr').attr('data-ipam-ipObjOid');
            if (i.length < 1) return true;
            var j = $(this).find('input[type=checkbox]');
            if ($(j).length !== 0)
                return true;

            //handle ticket link here
            History.pushState(null, 'IPAM - ' + i, '/plugins/ipam/host/' + i);
        });

        $('*[data-open-modal]').click(function(event) {
            event.preventDefault();

            var modal = $(this).attr('data-open-modal');
            if (modal.length < 1) return true;

            createHostModal =  UIKit.modal('#' + modal);
            createHostModal.show();
        });

        var $createHostForm = $('form#createHostForm');
        $createHostForm.off('submit');
        $createHostForm.on('submit', function(event) {
            var data = {};
            if (!$createHostForm.isValid(null, null, false)) return true;
            event.preventDefault();
            $createHostForm.serializeArray().map(function(x){data[x.name] = x.value;});

            $.ajax({
                url: '/plugins/ipam/api/addhost',
                method: 'POST',
                headers: { 'Content-Type': 'application/json'},
                data: JSON.stringify(data),
                success: function(response) {
                    if (response.success) {
                        helpers.UI.showSnackbar({
                            text: 'Successfully Added Host'
                        });

                        if (createHostModal) createHostModal.hide();
                        History.pushState(null, null, window.location.pathname + '?r=' + Math.random());
                    } else {
                        helpers.UI.showSnackbar('Error: Unable to add host', true);
                    }
                },
                error: function(response) {
                    helpers.UI.showSnackbar('Error: ' + response.responseJSON.error, true);
                    console.log('ERROR:', response);
                }
            });
        });

        // var $uploadImportForm = $('form#uploadImportForm');
        // $uploadImportForm.off('submit');
        // $uploadImportForm.on('submit', function(event) {
        //
        // });


        $('*[data-refresh-page]').click(function(event) {
            event.preventDefault();
            History.pushState(null, null, window.location.pathname + '?r=' + Math.random());
        });

        $('*[data-delete-host]').click(function(event) {
            event.preventDefault();

            var checkHosts = getChecked();
            _.each(checkHosts, function(i) {
                $.ajax({
                    url: '/plugins/ipam/api/removehost/' + i,
                    method: 'DELETE',
                    success: function(response) {
                        if (response.success) {
                            helpers.UI.showSnackbar({
                                text: 'Successfully removed host'
                            });

                            History.pushState(null, null, window.location.pathname + '?r=' + Math.random());
                        } else {
                            helpers.UI.showSnackbar('Error: Unable to remove host', true);
                            console.log('Error: ', response);
                        }
                    },
                    error: function(response) {
                        helpers.UI.showSnackbar('Error: ' + response.responseJSON.error, true);
                        console.log('Error: ', response);
                    }
                })
            });
        });

        function getChecked() {
            var $tableChecked = $('#plugin-ipam-hostTable input[type="checkbox"]:checked');
            var checkedIds = [];
            $tableChecked.each(function() {
                var vm = this;
                var self = $(vm);
                var $tableTR = self.parents('tr');
                if (!_.isUndefined($tableTR)) {
                    var subnetID = $tableTR.attr('data-ipam-ipObjOid');

                    if (!_.isUndefined(subnetID) && subnetID.length > 0) {
                        checkedIds.push(subnetID);
                    }
                }
            });

            return checkedIds;
        }

        function onWindowResize() {
            return _.debounce(function() {
                helpers.resizeDataTables('.plugin-ipam-subnetList');
                helpers.resizeAll();
            }, 100);
        }

        //Overdue Tickets
        var hexDigits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];

        //Function to convert hex format to a rgb color
        function rgb2hex(rgb) {
            rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
            return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]).toLowerCase();
        }

        function hex(x) {
            return isNaN(x) ? "00" : hexDigits[(x - x % 16) / 16] + hexDigits[x % 16];
        }
    });
});