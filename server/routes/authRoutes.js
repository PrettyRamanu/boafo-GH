const router = require('express').Router();
const auth   = require('../middleware/auth');
const v      = require('../middleware/validate');
const c      = require('../controllers/authController');

router.post('/artisan/register',  v.validateArtisanRegister,  c.registerArtisan);
router.post('/artisan/login',     v.validateLogin,             c.loginArtisan);
router.post('/customer/register', v.validateCustomerRegister,  c.registerCustomer);
router.post('/customer/login',    v.validateLogin,             c.loginCustomer);
router.post('/admin/register',    v.validateAdminRegister,     c.registerAdmin);
router.post('/admin/login',       v.validateLogin,             c.loginAdmin);
router.get('/me',                 auth(['artisan','customer','admin']), c.getMe);

module.exports = router;
