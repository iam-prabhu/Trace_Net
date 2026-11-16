import { Router } from 'express';
import multer from 'multer';
import os from 'os';
import * as datasetsController from '../controllers/datasets.controller';
import { authenticate } from '../middleware/auth.middleware';

const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

const router = Router();
router.use(authenticate);

router.get('/', datasetsController.listDatasets);
router.post('/import', upload.single('file'), datasetsController.importDataset);
router.post('/upload', upload.single('file'), datasetsController.uploadDataset);

router.get('/:id', datasetsController.getDataset);
router.post('/:id/process', datasetsController.processDataset);
router.delete('/:id', datasetsController.deleteDataset);

export default router;
