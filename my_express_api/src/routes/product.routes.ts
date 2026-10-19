import { Router } from 'express';
import {
  createProduct,
  deleteProduct,
  getProductByBarcode,
  getProductById,
  listCategories,
  listProducts,
  updateProduct,
} from '../controllers/product.controller';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createProductSchema, updateProductSchema } from '../validators/product.schemas';

const router = Router();

// Semua rute produk butuh token.
router.use(requireAuth);

// URUTAN PENTING: rute statis/spesifik harus sebelum /:id,
// agar "categories" dan "barcode" tidak tertangkap sebagai parameter :id.
router.get('/categories', listCategories);
router.get('/barcode/:barcode', getProductByBarcode);
router.get('/', listProducts);
router.get('/:id', getProductById);

router.post('/', validateBody(createProductSchema), createProduct);
router.put('/:id', validateBody(updateProductSchema), updateProduct);
router.delete('/:id', deleteProduct);

export default router;
