const router = require('express').Router();
const auth   = require('../middleware/auth');
const v      = require('../middleware/validate');
const c      = require('../controllers/jobController');

// Public
router.get('/', c.getJobs);

// Customer
router.post('/',                   auth(['customer']), v.validateCreateJob,          c.createJob);
router.get('/my',                  auth(['customer']),                                c.getMyJobs);
router.get('/:id',                 auth(['customer','artisan','admin']),              c.getJob);
router.put('/:id/status',          auth(['customer']), v.validateJobStatus,          c.updateJobStatus);
router.put('/applications/:appId', auth(['customer']), v.validateApplicationStatus,  c.updateApplication);

// Artisan
router.post('/:id/apply', auth(['artisan']), v.validateApply, c.applyForJob);

module.exports = router;
