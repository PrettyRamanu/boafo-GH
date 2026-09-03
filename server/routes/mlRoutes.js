const router = require('express').Router();
const auth   = require('../middleware/auth');
const v      = require('../middleware/validate');
const ml     = require('../controllers/mlController');

router.post('/recommend',            ml.recommend);
router.post('/sentiment',            auth(['customer','artisan','admin']), v.validateSentiment, ml.sentiment);
router.get('/artisan/:id/sentiment', ml.artisanSentiment);

module.exports = router;
