import { Router } from 'express';
import * as accountsController from '../controllers/accounts.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', accountsController.getAccounts);
router.post('/', accountsController.createAccount);

// Direct account routes (supports :id and :accountId)
router.get('/:id/transactions', accountsController.getAccountTransactions);
router.get('/:id/neighbors', accountsController.getAccountNeighbors);
router.get('/:id', accountsController.getAccount);
router.put('/:id', accountsController.updateAccount);
router.patch('/:id', accountsController.updateAccount);

export default router;
