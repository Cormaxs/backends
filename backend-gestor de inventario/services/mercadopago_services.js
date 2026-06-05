import { MercadoPagoConfig, Preference, PreApproval } from 'mercadopago';
import dotenv from 'dotenv';
import { Empresa, Plan, HistorialPago } from '../models/index.js';

dotenv.config();

const client = new MercadoPagoConfig({ 
    accessToken: process.env.MP_Producc || process.env.MP_ACCESS_TOKEN || 'TEST-YOUR-ACCESS-TOKEN' 
});

class MercadoPagoService {
    /**
     * Crea una suscripción (PreApproval) para un plan específico
     */
    async createSubscription(empresaId, planId, payerEmail) {
        try {
            const empresa = await Empresa.findById(empresaId);
            const plan = await Plan.findById(planId);

            if (!empresa || !plan) {
                throw new Error('Empresa o Plan no encontrado');
            }

            if (plan.precio <= 0) {
                throw new Error('El plan gratuito no requiere suscripción de pago');
            }

            const preApproval = new PreApproval(client);
            
            const body = {
                reason: `Suscripción FacStock - Plan ${plan.nombre}`,
                external_reference: `${empresaId}:${planId}`,
                payer_email: payerEmail || empresa.emailContacto || 'test_user_123@testuser.com',
                auto_recurring: {
                    frequency: 1,
                    frequency_type: 'months',
                    transaction_amount: plan.precio,
                    currency_id: 'ARS'
                },
                back_url: process.env.FRONTEND_URL || 'https://front.facstock.com/',
                status: 'pending'
            };

            console.log('--- Iniciando creación de suscripción en MP ---');
            const response = await preApproval.create({ body });
            console.log('✅ Suscripción creada exitosamente:', response.id);
            
            // Guardar el ID de pre-aprobación en la empresa
            await Empresa.findByIdAndUpdate(empresaId, {
                mpPreapprovalId: response.id,
                mpStatus: response.status
            });

            return response;
        } catch (error) {
            console.error('❌ Error en MercadoPagoService.createSubscription:');
            if (error.response) {
                console.error('Status:', error.status);
                console.error('Data:', JSON.stringify(error.response.data, null, 2));
                
                // Lanzar un error más descriptivo basado en la respuesta de MP
                const mpError = new Error(error.response.data?.message || error.message || 'Error en Mercado Pago');
                mpError.status = error.status || 401;
                mpError.details = error.response.data;
                throw mpError;
            }
            throw error;
        }
    }

    /**
     * Procesa la notificación de Webhook de Mercado Pago
     */
    async handleWebhook(topic, id) {
        try {
            console.log(`🔔 Webhook recibido: ${topic} - ID: ${id}`);

            if (topic === 'preapproval') {
                const preApproval = new PreApproval(client);
                const subscription = await preApproval.get({ id });

                const [empresaId, planId] = subscription.external_reference.split(':');
                const status = subscription.status;

                // Actualizar estado en la empresa
                const updateData = { mpStatus: status };

                if (status === 'authorized') {
                    // Si está autorizado, renovamos el plan
                    updateData.estadoPlan = 'activo';
                    
                    // Si el pago es por un nuevo plan, lo actualizamos
                    if (planId) {
                        const plan = await Plan.findById(planId);
                        if (plan) {
                            updateData.planId = planId;
                            updateData.planActual = plan.slug;
                        }
                    }
                    
                    // Calcular fecha de vencimiento (1 mes desde ahora)
                    const nextDate = new Date();
                    nextDate.setMonth(nextDate.getMonth() + 1);
                    updateData.fechaPlanFinalizacion = nextDate;
                    updateData.proximoPago = nextDate;
                    updateData.ultimoPagoExitoso = new Date();

                    // Registrar en historial
                    await this.recordPayment(empresaId, planId, subscription);
                } else if (status === 'cancelled' || status === 'paused') {
                    updateData.estadoPlan = 'vencido';
                }

                await Empresa.findByIdAndUpdate(empresaId, updateData);
            }
            
            return { success: true };
        } catch (error) {
            console.error('Error procesando webhook MP:', error);
            throw error;
        }
    }

    /**
     * Registra el pago en el historial
     */
    async recordPayment(empresaId, planId, subscription) {
        try {
            const periodoInicio = new Date();
            const periodoFin = new Date();
            periodoFin.setMonth(periodoFin.getMonth() + 1);

            const historial = new HistorialPago({
                empresa: empresaId,
                plan: planId,
                monto: subscription.auto_recurring.transaction_amount,
                moneda: subscription.auto_recurring.currency_id,
                fechaPago: new Date(),
                periodoInicio,
                periodoFin,
                metodoPago: 'mercadopago',
                referenciaPago: subscription.id,
                estado: 'completado'
            });

            await historial.save();
        } catch (error) {
            console.error('Error registrando pago en historial:', error);
        }
    }
}

export default new MercadoPagoService();
