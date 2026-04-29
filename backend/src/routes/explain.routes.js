const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { generateQuestions, evaluateAnswers } = require('../controllers/explain.controller');

router.post('/generate', authenticate, generateQuestions);
router.post('/evaluate', authenticate, evaluateAnswers);

module.exports = router;
