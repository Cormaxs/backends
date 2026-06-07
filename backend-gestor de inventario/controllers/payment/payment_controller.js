import MercadoPagoService from '../../services/mercadopago_services.js';
import { Empresa, Plan, HistorialPago } from '../../models/index.js';

class PaymentController {
    /**
     * Inicia el proceso de suscripción a un plan (Recurrente)
     */
    async startSubscription(req, res) {
        try {
            const { empresaId, planId, email } = req.body;

            if (!empresaId || !planId || !email) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'empresaId, planId y email son requeridos' 
                });
            }

            const plan = await Plan.findById(planId);
            if (!plan) {
                return res.status(404).json({ success: false, message: 'Plan no encontrado' });
            }

            // Si el plan es gratuito, lo actualizamos directamente
            if (plan.precio <= 0) {
                await Empresa.findByIdAndUpdate(empresaId, {
                    planId: plan._id,
                    planActual: plan.slug,
                    estadoPlan: 'activo',
                    fechaPlanFinalizacion: null, // Sin vencimiento para el free
                    mpPreapprovalId: null,
                    mpStatus: null
                });

                return res.json({
                    success: true,
                    message: 'Plan actualizado a Free exitosamente',
                    isFree: true
                });
            }

            const subscription = await MercadoPagoService.createSubscription(empresaId, planId, email);
            
            res.json({
                success: true,
                init_point: subscription.init_point, // URL para redirigir al usuario
                subscriptionId: subscription.id,
                message: 'Redirija al usuario a init_point para completar la suscripción'
            });
        } catch (error) {
            console.error('❌ Error en startSubscription controller:', error);
            res.status(500).json({ 
                success: false, 
                message: error.message || 'Error al iniciar suscripción'
            });
        }
    }

    /**
     * Crea una preferencia para pago único (QR, Débito, Efectivo, etc.)
     */
    async createPreference(req, res) {
        try {
            const { empresaId, planId, email } = req.body;

            if (!empresaId || !planId || !email) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'empresaId, planId y email son requeridos' 
                });
            }

            const preference = await MercadoPagoService.createOneTimePayment(empresaId, planId, email);
            
            res.json({
                success: true,
                init_point: preference.init_point,
                preferenceId: preference.id,
                message: 'Redirija al usuario a init_point para realizar el pago único'
            });
        } catch (error) {
            console.error('❌ Error en createPreference controller:', error);
            res.status(500).json({ 
                success: false, 
                message: error.message || 'Error al crear preferencia de pago'
            });
        }
    }

    /**
     * Recibe notificaciones de Mercado Pago
     */
    async webhook(req, res) {
        try {
            // Mercado Pago envía datos en query o body según el tipo
            const { topic, type } = req.query;
            const id = req.query.id || req.body.data?.id;

            // MP usa 'type' para webhooks v2 y 'topic' para los antiguos
            const actualTopic = type || topic;

            if (actualTopic && id) {
                await MercadoPagoService.handleWebhook(actualTopic, id);
            }

            // MP requiere siempre un 200 o 201 para confirmar recepción
            res.sendStatus(200);
        } catch (error) {
            console.error('Error en webhook controller:', error);
            // Aunque falle, a veces es mejor devolver 200 para que MP no reintente infinitamente
            // si el error es de lógica nuestra y no de red.
            res.sendStatus(200);
        }
    }

    /**
     * Obtiene el historial de pagos de una empresa
     */
    async getPaymentHistory(req, res) {
        try {
            const { empresaId } = req.params;
            const historial = await HistorialPago.find({ empresa: empresaId })
                .populate('plan')
                .sort({ fechaPago: -1 });

            res.json({
                success: true,
                data: historial
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Obtiene el estado actual del plan y próximo pago
     */
    async getPlanStatus(req, res) {
        try {
            const { empresaId } = req.params;
            const empresa = await Empresa.findById(empresaId).populate('planId');

            if (!empresa) {
                return res.status(404).json({ success: false, message: 'Empresa no encontrada' });
            }

            res.json({
                success: true,
                data: {
                    plan: empresa.planId,
                    estado: empresa.estadoPlan,
                    proximoPago: empresa.proximoPago,
                    ultimoPago: empresa.ultimoPagoExitoso,
                    mpStatus: empresa.mpStatus
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

export default new PaymentController();
