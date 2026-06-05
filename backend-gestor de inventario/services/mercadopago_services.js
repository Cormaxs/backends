import { MercadoPagoConfig, Preference, PreApproval, Payment } from 'mercadopago';
import dotenv from 'dotenv';
import { Empresa, Plan, HistorialPago } from '../models/index.js';

dotenv.config();

const accessToken = process.env.MP_Producc || process.env.MP_ACCESS_TOKEN;

if (!accessToken) {
    console.warn('⚠️ No se encontró MP_Producc ni MP_ACCESS_TOKEN en el entorno.');
} else {
    const maskedToken = `${accessToken.substring(0, 8)}...${accessToken.substring(accessToken.length - 4)}`;
    console.log(`✅ Mercado Pago configurado con token: ${maskedToken}`);
}

const client = new MercadoPagoConfig({ 
    accessToken: accessToken || 'TEST-YOUR-ACCESS-TOKEN' 
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
                payer_email: payerEmail.trim().toLowerCase(),
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

            // Caso 1: Actualización de la suscripción (PreApproval)
            if (topic === 'preapproval') {
                const preApproval = new PreApproval(client);
                const subscription = await preApproval.get({ id });

                if (!subscription.external_reference) return { success: true };

                const [empresaId, planId] = subscription.external_reference.split(':');
                const status = subscription.status;

                const updateData = { mpStatus: status };

                if (status === 'authorized') {
                    updateData.estadoPlan = 'activo';
                    
                    if (planId) {
                        const plan = await Plan.findById(planId);
                        if (plan) {
                            updateData.planId = planId;
                            updateData.planActual = plan.slug;
                        }
                    }
                    
                    const nextDate = new Date();
                    nextDate.setMonth(nextDate.getMonth() + 1);
                    updateData.fechaPlanFinalizacion = nextDate;
                    updateData.proximoPago = nextDate;
                    updateData.ultimoPagoExitoso = new Date();

                    await this.recordPayment(empresaId, planId, subscription);
                } else if (status === 'cancelled' || status === 'paused') {
                    updateData.estadoPlan = 'vencido';
                }

                await Empresa.findByIdAndUpdate(empresaId, updateData);
            }
            
            // Caso 2: Cobro individual (Payment) - Útil para registrar cada cobro mensual
            if (topic === 'payment') {
                const payment = new Payment(client);
                const paymentData = await payment.get({ id });

                // Si el pago viene de una suscripción, tendrá preapproval_id
                const preapprovalId = paymentData.metadata?.preapproval_id || paymentData.order?.id;
                
                if (paymentData.status === 'approved') {
                    // Aquí podrías buscar la empresa por el preapprovalId o external_reference
                    // y registrar el pago en el historial si no se hizo en el caso de 'preapproval'
                    console.log(`💰 Pago aprobado: ${id} para suscripción/orden: ${preapprovalId}`);
                }
            }
            
            return { success: true };
        } catch (error) {
            console.error('Error procesando webhook MP:', error);
            throw error;
        }
    }

    /**
     * Registra el pago en el historial (Evita duplicados)
     */
    async recordPayment(empresaId, planId, subscription) {
        try {
            // Verificar si ya existe un registro para esta suscripción (ID de MP)
            // Para suscripciones, el ID de MP es único por ciclo de cobro o por la suscripción misma
            // Nota: subscription.id es el ID de la PreApproval
            
            const existingPayment = await HistorialPago.findOne({ referenciaPago: subscription.id });
            if (existingPayment) {
                console.log(`⚠️ El pago con referencia ${subscription.id} ya fue registrado.`);
                return;
            }

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
            console.log(`✅ Pago registrado exitosamente para la empresa ${empresaId}`);
        } catch (error) {
            console.error('Error registrando pago en historial:', error);
        }
    }
}

export default new MercadoPagoService();
