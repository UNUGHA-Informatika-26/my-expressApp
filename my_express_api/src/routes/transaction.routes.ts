import { Router } from 'express';
import { checkout, getTransactionById, listTransactions } from '../controllers/transaction.controller';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { checkoutSchema } from '../validators/transaction.schemas';

const router = Router();

// Semua rute transaksi butuh token.
router.use(requireAuth);

// Riwayat dikelompokkan per hari (Fase 6).
// Query divalidasi di controller karena req.query Express 5 hanya bisa dibaca.
router.get('/', listTransactions);

// Detail transaksi beserta itemnya (04-api.md) — dipakai tampilan struk.
// Tidak bentrok dengan /checkout karena rute itu hanya POST.
router.get('/:id', getTransactionById);

// Checkout (Fase 5).
router.post('/checkout', validateBody(checkoutSchema), checkout);

export default router;
