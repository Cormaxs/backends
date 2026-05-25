import { Router } from 'express';
import { syncSales } from '../../../controllers/offline/offline.controller.js';

const router = Router();

router.post('/sync', syncSales);

export default router;
