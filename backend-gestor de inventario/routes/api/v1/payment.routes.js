import { Router } from 'express';
import PaymentController from '../../../controllers/payment/payment_controller.js';
// import { authMiddleware } from '../../../middlewares/auth.js'; // Podrías usarlo para proteger rutas

const router = Router();

// Iniciar suscripción recurrente (Requiere Tarjeta)
router.post('/subscribe', PaymentController.startSubscription);

// Pago único (Soporta QR, Débito, Efectivo, Dinero en cuenta)
router.post('/pay-once', PaymentController.createPreference);

// Webhook de Mercado Pago (público)
router.post('/webhook', PaymentController.webhook);

// Historial de pagos
router.get('/history/:empresaId', PaymentController.getPaymentHistory);

// Estado del plan
router.get('/status/:empresaId', PaymentController.getPlanStatus);

export default router;
