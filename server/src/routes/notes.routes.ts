import { Router } from 'express';
import * as notesController from '../controllers/notes.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/:investigationId', notesController.getNotes);
router.post('/', notesController.createNote);

router.patch('/:id', notesController.updateNote);
router.put('/:id', notesController.updateNote);
router.delete('/:id', notesController.deleteNote);

export default router;
