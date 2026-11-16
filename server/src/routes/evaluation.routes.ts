import { Router } from 'express';
import * as evaluationController from '../controllers/evaluation.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.post('/run', evaluationController.runBenchmark);
router.get('/results', evaluationController.getResults);
router.post('/cross-validate', evaluationController.crossValidate);
router.get('/:investigationId', evaluationController.evaluate);

export default router;
