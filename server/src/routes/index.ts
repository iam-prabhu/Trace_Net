import { Router } from 'express';
import authRoutes from './auth.routes';
import accountsRoutes from './accounts.routes';
import graphRoutes from './graph.routes';
import investigationsRoutes from './investigations.routes';
import findingsRoutes from './findings.routes';
import notesRoutes from './notes.routes';
import datasetsRoutes from './datasets.routes';
import evaluationRoutes from './evaluation.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/accounts', accountsRoutes);
router.use('/graph', graphRoutes);
router.use('/investigations', investigationsRoutes);
router.use('/findings', findingsRoutes);
router.use('/notes', notesRoutes);
router.use('/datasets', datasetsRoutes);
router.use('/evaluation', evaluationRoutes);

export default router;
