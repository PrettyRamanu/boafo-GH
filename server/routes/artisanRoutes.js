const router = require('express').Router();
const auth   = require('../middleware/auth');
const v      = require('../middleware/validate');
const c      = require('../controllers/artisanController');

// Public
router.get('/',    c.getArtisans);
router.get('/:id', c.getArtisan);

// Artisan protected
router.put('/profile/me',      auth(['artisan']), v.validateProfileUpdate, c.updateProfile);
router.get('/dashboard/stats', auth(['artisan']), c.getDashboardStats);
router.get('/my/applications', auth(['artisan']), c.getMyApplications);
router.get('/my/reviews',      auth(['artisan']), c.getMyReviews);

module.exports = router;
