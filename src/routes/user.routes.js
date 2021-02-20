module.exports = (app) => {
    const controller = require('../controllers/user.controller.js');

    const router = require('express').Router();

    router.post('/forgot-password', controller.forgotPassword);
    router.post('/registration', controller.registration);
    router.post('/login', controller.login);
    router.post('/login/refresh', controller.refresh);
    router.get('/info', controller.info);
    router.put('/update', controller.update);
    router.delete('/delete', controller.delete);
    router.delete('/logout', controller.logout);

    app.use('/api/v2/user', router);
};
