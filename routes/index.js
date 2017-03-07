var fs          = require('fs'),
    path        = require('path'),
    rimraf      = require('rimraf');


var controller = require('../controllers/index');

module.exports = function(router, middleware) {
    router.get('/plugins/ipam', middleware.redirectToLogin, registerPartials, middleware.loadCommonData, controller.get);
    router.get('/plugins/ipam/uploadhosts', function(req, res) { res.redirect('/plugins/ipam/'); });
    router.post('/plugins/ipam/uploadhosts', controller.import.uploadHosts);
    router.get('/plugins/ipam/:subnet', middleware.redirectToLogin, registerPartials, middleware.loadCommonData, controller.singleSubnet);
    router.get('/plugins/ipam/host/:hostid', middleware.redirectToLogin, registerPartials, middleware.loadCommonData, controller.singleHost);


    router.post('/plugins/ipam/api/addsubnet', middleware.api, controller.api.addSubnet);
    router.delete('/plugins/ipam/api/removesubnet/:id', middleware.api, controller.api.removeSubnet);
    router.post('/plugins/ipam/api/addhost', middleware.api, controller.api.addHost);
    router.delete('/plugins/ipam/api/removehost/:id', middleware.api, controller.api.removeHost);
    router.post('/plugins/ipam/api/addextra/:id', middleware.api, controller.api.addHostExtra);
    router.put('/plugins/ipam/api/updateextra/:id', middleware.api, controller.api.updateExtra);
    router.delete('/plugins/ipam/api/deleteextra/:id', middleware.api, controller.api.deleteExtra);

    //Clean up Tmp Uploads
    rimraf(path.join(__dirname, '../tmp_imports'), function(){});
};

function registerPartials (req, res, next) {
    //Register Views
    global.HandleBars.registerPartial('createHostWindow', fs.readFileSync(path.join(__dirname, '/../views/modals/createHostWindow.hbs')).toString());
    global.HandleBars.registerPartial('createSubnetModal', fs.readFileSync(path.join(__dirname, '/../views/modals/createSubnetModal.hbs')).toString());
    global.HandleBars.registerPartial('uploadImportModal', fs.readFileSync(path.join(__dirname, '/../views/modals/uploadImport.hbs')).toString());

    next();
}