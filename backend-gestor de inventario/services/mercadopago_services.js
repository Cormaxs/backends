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
            
            // Para suscripciones, MP recomienda usar PreApproval
            // Esto permite cobros recurrentes automáticos.
            const body = {
                reason: `Suscripción FacStock - Plan ${plan.nombre}`,
                external_reference: `${empresaId}:${planId}:subscription`,
                payer_email: payerEmail.trim().toLowerCase(),
                auto_recurring: {
                    frequency: 1,
                    frequency_type: 'months',
                    transaction_amount: plan.precio,
                    currency_id: 'ARS'
                },
                back_url: process.env.FRONTEND_URL || 'https://front.facstock.com/',
                notification_url: `${process.env.BACKEND_URL}/api/v1/payments/webhook`,
                status: 'pending'
            };

            console.log('--- Iniciando creación de suscripción en MP ---');
            const response = await preApproval.create({ body });
            console.log('✅ Suscripción creada exitosamente:', response.id);
            
            // Guardar el ID de pre-aprobación en la empresa para seguimiento
            await Empresa.findByIdAndUpdate(empresaId, {
                mpPreapprovalId: response.id,
                mpStatus: response.status,
                // No cambiamos el plan aún, esperamos al webhook 'authorized'
            });

            return response;
        } catch (error) {
            console.error('❌ Error en MercadoPagoService.createSubscription:', error);
            throw error;
        }
    }

    /**
     * Crea una preferencia de pago único (Checkout Pro)
     * Ideal para cobrar con QR, Dinero en cuenta, Débito, Efectivo (Rapipago/Pago Fácil)
     * sin necesidad de suscripción recurrente.
     */
    async createOneTimePayment(empresaId, planId, payerEmail) {
        try {
            const empresa = await Empresa.findById(empresaId);
            const plan = await Plan.findById(planId);

            if (!empresa || !plan) throw new Error('Empresa o Plan no encontrado');

            const preference = new Preference(client);

            const body = {
                items: [
                    {
                        id: planId,
                        title: `Plan ${plan.nombre} - FacStock (Pago Manual)`,
                        quantity: 1,
                        unit_price: plan.precio,
                        currency_id: 'ARS',
                        description: `Acceso por 30 días al plan ${plan.nombre}. Renovación manual.`
                    }
                ],
                payer: {
                    email: payerEmail.trim().toLowerCase(),
                    name: empresa.nombreEmpresa || 'Cliente FacStock',
                    surname: 'Empresa',
                },
                external_reference: `${empresaId}:${planId}:onetime`,
                back_urls: {
                    success: `${process.env.FRONTEND_URL}/dashboard?payment=success`,
                    failure: `${process.env.FRONTEND_URL}/dashboard?payment=failure`,
                    pending: `${process.env.FRONTEND_URL}/dashboard?payment=pending`
                },
                auto_return: 'approved',
                notification_url: `${process.env.BACKEND_URL}/api/v1/payments/webhook`,
                metadata: {
                    empresa_id: empresaId,
                    plan_id: planId,
                    type: 'onetime'
                }
            };

            const response = await preference.create({ body });
            return response;
        } catch (error) {
            console.error('❌ Error creando preferencia de pago único:', error);
            throw error;
        }
    }

    /**
     * Procesa la notificación de Webhook de Mercado Pago
     */
    async handleWebhook(topic, id) {
        try {
            console.log(`🔔 Webhook recibido: ${topic} - ID: ${id}`);

            // Normalizar el tópico si viene de diferentes versiones de la API
            let actualTopic = topic;
            if (topic === 'subscription_preapproval') actualTopic = 'preapproval';
            if (topic === 'subscription_authorized_payment') actualTopic = 'payment';

            // CASO 1: Actualización de la suscripción (PreApproval)
            if (actualTopic === 'preapproval') {
                const preApproval = new PreApproval(client);
                const subscription = await preApproval.get({ id });

                if (!subscription.external_reference) return { success: true };

                const [empresaId, planId] = subscription.external_reference.split(':');
                const status = subscription.status;

                console.log(`📝 Suscripción ${id} cambió a estado: ${status}`);

                const updateData = { mpStatus: status };

                if (status === 'authorized') {
                    // La suscripción fue autorizada (el usuario vinculó su tarjeta)
                    updateData.estadoPlan = 'activo';
                    
                    const plan = await Plan.findById(planId);
                    if (plan) {
                        updateData.planId = planId;
                        updateData.planActual = plan.slug;
                    }
                    
                    // Extender fecha de finalización (30 días)
                    const nextDate = new Date();
                    nextDate.setDate(nextDate.getDate() + 30);
                    updateData.fechaPlanFinalizacion = nextDate;
                    updateData.proximoPago = nextDate;
                    updateData.ultimoPagoExitoso = new Date();

                    await Empresa.findByIdAndUpdate(empresaId, updateData);
                    await this.recordPayment(empresaId, planId, subscription, 'subscription');
                } else if (status === 'cancelled' || status === 'paused') {
                    await Empresa.findByIdAndUpdate(empresaId, { 
                        mpStatus: status,
                        estadoPlan: 'vencido' 
                    });
                }
            }
            
            // CASO 2: Cobro individual (Payment)
            // Se dispara para pagos únicos (QR, etc.) y para CADA cobro mensual de una suscripción
            if (actualTopic === 'payment') {
                const payment = new Payment(client);
                const paymentData = await payment.get({ id });

                if (paymentData.status === 'approved') {
                    let empresaId, planId, isOneTime = false;

                    // Intentar obtener datos de external_reference
                    if (paymentData.external_reference) {
                        const parts = paymentData.external_reference.split(':');
                        empresaId = parts[0];
                        planId = parts[1];
                        isOneTime = parts[2] === 'onetime';
                    }

                    // Si no hay external_reference, buscar por metadata o suscripción
                    if (!empresaId && paymentData.metadata) {
                        empresaId = paymentData.metadata.empresa_id;
                        planId = paymentData.metadata.plan_id;
                        isOneTime = paymentData.metadata.type === 'onetime';
                    }

                    if (empresaId && planId) {
                        console.log(`💰 Pago aprobado (${isOneTime ? 'Único' : 'Recurrente'}): ${id} para empresa ${empresaId}`);
                        
                        const plan = await Plan.findById(planId);
                        if (!plan) throw new Error('Plan no encontrado en el pago');

                        // Actualizar empresa
                        const nextDate = new Date();
                        nextDate.setDate(nextDate.getDate() + 30);

                        await Empresa.findByIdAndUpdate(empresaId, {
                            estadoPlan: 'activo',
                            planId: planId,
                            planActual: plan.slug,
                            fechaPlanFinalizacion: nextDate,
                            ultimoPagoExitoso: new Date(),
                            proximoPago: nextDate
                        });

                        await this.recordPayment(empresaId, planId, paymentData, isOneTime ? 'onetime' : 'recurring');
                    }
                }
            }
            
            return { success: true };
        } catch (error) {
            console.error('❌ Error procesando webhook MP:', error);
            throw error;
        }
    }

    /**
     * Registra el pago en el historial (Evita duplicados)
     */
    async recordPayment(empresaId, planId, mpData, type) {
        try {
            const mpId = mpData.id.toString();
            
            const existingPayment = await HistorialPago.findOne({ referenciaPago: mpId });
            if (existingPayment) {
                console.log(`⚠️ El pago con referencia ${mpId} ya fue registrado.`);
                return;
            }

            const periodoInicio = new Date();
            const periodoFin = new Date();
            periodoFin.setDate(periodoFin.getDate() + 30);

            let monto = 0;
            let moneda = 'ARS';

            if (type === 'subscription') {
                monto = mpData.auto_recurring?.transaction_amount || 0;
                moneda = mpData.auto_recurring?.currency_id || 'ARS';
            } else {
                monto = mpData.transaction_amount || 0;
                moneda = mpData.currency_id || 'ARS';
            }

            const historial = new HistorialPago({
                empresa: empresaId,
                plan: planId,
                monto: monto,
                moneda: moneda,
                fechaPago: new Date(),
                periodoInicio,
                periodoFin,
                metodoPago: `mercadopago_${type}`,
                referenciaPago: mpId,
                estado: 'completado',
                detallesMP: {
                    status: mpData.status,
                    payment_type: mpData.payment_type_id || (type === 'subscription' ? 'recurring' : 'unknown')
                }
            });

            await historial.save();
            console.log(`✅ Pago registrado exitosamente para la empresa ${empresaId}`);
        } catch (error) {
            console.error('❌ Error registrando pago en historial:', error);
        }
    }
}

export default new MercadoPagoService();
