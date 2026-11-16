import { Router } from 'express';
import * as findingsController from '../controllers/findings.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', findingsController.getFindings);
router.post('/', findingsController.createFinding);

router.get('/:id', findingsController.getFinding);
router.put('/:id', findingsController.updateFinding);
router.patch('/:id', findingsController.updateFinding);
router.delete('/:id', findingsController.deleteFinding);

export default router;
