import { Router } from 'express';
import * as investigationsController from '../controllers/investigations.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', investigationsController.getInvestigations);
router.post('/', investigationsController.createInvestigation);

router.get('/:id', investigationsController.getInvestigation);
router.put('/:id', investigationsController.updateInvestigation);
router.patch('/:id', investigationsController.updateInvestigation);
router.delete('/:id', investigationsController.deleteInvestigation);

// Nested findings & notes on investigation
router.get('/:id/findings', investigationsController.getFindings);
router.post('/:id/findings', investigationsController.createFinding);

router.get('/:id/notes', investigationsController.getNotes);
router.post('/:id/notes', investigationsController.createNote);

export default router;
