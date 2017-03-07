window.truRequire(['jquery', 'helpers', 'datatables', 'dt_ipaddress', 'uikit', 'underscore'], function(loadedModules) {
    var $ = loadedModules[0];
    var helpers = loadedModules[1];
    var UIKit = loadedModules[4];
    var _ = loadedModules[5];

    $(document).ready(function() {
        var table = $('#plugin-ipam-subnetTable');
        if (! $.fn.dataTable.isDataTable(table)) {
            table.dataTable({
                searching: false,
                bLengthChange: false,
                paging: false,
                iDisplayLength: 99999,
                bInfo: false,
                scrollY: '100%',
                columnDefs: [
                    {"width": "50px", "targets": 0},
                    {"width": "200px", "targets": 1},
                    {"type": "ip-address", "width": "200px", "targets": 2},
                    {"width": "100px", "targets": 4, "sortable": false}
                ],
                order: [[2, "asc"]],
                "oLanguage": {
                    "sEmptyTable": "No IP subnets have been configured."
                }
            });
        }

        helpers.resizeAll();

        table.find('tbody').on('click', 'td', function () {
            var i = $(this).parents('tr').attr('data-ipam-subnet');
            var j = $(this).find('input[type=checkbox]');
            if ($(j).length !== 0)
                return true;

            if (i == undefined)
                return true;

            //handle ticket link here
            History.pushState(null, 'IPAM - ' + i, '/plugins/ipam/' + i);
        });

        var modal;

        $('*[data-open-modal]').click(function(event) {
            event.preventDefault();

            var modal = $(this).attr('data-open-modal');
            if (modal.length < 1) return true;

            modal =  UIKit.modal('#' + modal);
            modal.show();
        });

        $('*[data-delete-subnet]').click(function(event) {
            event.preventDefault();

            var checkedSubnets = getChecked();
            _.each(checkedSubnets, function(i) {
                $.ajax({
                    url: '/plugins/ipam/api/removesubnet/' + i,
                    method: 'DELETE',
                    success: function(response) {
                        if (response.success) {
                            helpers.UI.showSnackbar({
                                text: 'Successfully removed subnet'
                            });

                            History.pushState(null, null, window.location.pathname + '?r=' + Math.random());
                        } else {
                            helpers.UI.showSnackbar('Error: Unable to remove subnet', true);
                            console.log('Error: ', response);
                        }
                    },
                    error: function(response) {
                        helpers.UI.showSnackbar('Error: ' + response.responseJSON.error, true);
                        console.log('Error: ', response);
                    }
                });
            });
        });

        var $createSubnetForm = $('form#createSubnetForm');
        $createSubnetForm.off('submit');
        $createSubnetForm.on('submit', function(event) {
            var data = {};
            if (!$createSubnetForm.isValid(null, null, false)) return true;
            event.preventDefault();
            $createSubnetForm.serializeArray().map(function(x){data[x.name] = x.value;});


            $.ajax({
                url: '/plugins/ipam/api/addsubnet',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                data: JSON.stringify(data),
                success: function(response) {
                    if (response.success) {
                        helpers.UI.showSnackbar({
                            text: 'Successfully Created Subnet'
                        });

                        if (modal) modal.hide();
                        History.pushState(null, null, window.location.pathname + '?r=' + Math.random());
                    } else {
                        helpers.UI.showSnackbar('Error: Unable to create subnet', true);
                    }
                },
                error: function(response) {
                    helpers.UI.showSnackbar('Error: ' + response.responseJSON.error, true);
                    console.log('Error:', response);
                }
            })
        });




        function clearChecked() {
            var $tableChecked = $('#plugin-ipam-subnetTable input[type="checkbox"]:checked');
            $tableChecked.each(function() {
                var vm = this;
                var self = $(vm);
                self.prop('checked', false);
            });
        }

        function getChecked() {
            var $tableChecked = $('#plugin-ipam-subnetTable input[type="checkbox"]:checked');
            var checkedIds = [];
            $tableChecked.each(function() {
                var vm = this;
                var self = $(vm);
                var $tableTR = self.parents('tr');
                if (!_.isUndefined($tableTR)) {
                    var subnetID = $tableTR.attr('data-ipam-subnet');

                    if (!_.isUndefined(subnetID) && subnetID.length > 0) {
                        checkedIds.push(subnetID);
                    }
                }
            });

            return checkedIds;
        }

        function removeCheckedFromGrid() {
            var $tableChecked = $('#plugin-ipam-subnetTable input[type="checkbox"]:checked');
            $tableChecked.each(function() {
                var vm = this;
                var self = $(vm);
                var $tableTR = self.parents('tr');
                if (!_.isUndefined($tableTR)) {
                    $tableTR.remove();
                }
            });
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