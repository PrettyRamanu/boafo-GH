const router = require('express').Router();
const auth   = require('../middleware/auth');
const v      = require('../middleware/validate');
const rv     = require('../controllers/reviewController');
const mg     = require('../controllers/messageController');
const ad     = require('../controllers/adminController');

// ── Reviews ───────────────────────────────────────────────────────────────
router.post('/reviews',                    auth(['customer']), v.validateReview, rv.createReview);
router.get('/reviews/artisan/:artisan_id', rv.getArtisanReviews);

// ── Messages ──────────────────────────────────────────────────────────────
router.get('/jobs/:job_id/messages',  auth(['customer','artisan']), mg.getMessages);
router.post('/jobs/:job_id/messages', auth(['customer','artisan']), v.validateMessage, mg.sendMessage);

// ── Categories (public read) ──────────────────────────────────────────────
router.get('/categories', ad.getCategories);

// ── Admin ─────────────────────────────────────────────────────────────────
router.get('/admin/analytics',           auth(['admin']), ad.getAnalytics);
router.get('/admin/artisans',            auth(['admin']), ad.getArtisans);
router.put('/admin/artisans/:id/verify', auth(['admin']), v.validateVerify, ad.verifyArtisan);
router.delete('/admin/artisans/:id',     auth(['admin']), ad.deleteArtisan);
router.get('/admin/customers',           auth(['admin']), ad.getCustomers);
router.get('/admin/jobs',                auth(['admin']), ad.getJobs);
router.post('/admin/categories',         auth(['admin']), v.validateCategory, ad.createCategory);
router.delete('/admin/categories/:id',   auth(['admin']), ad.deleteCategory);

module.exports = router;
