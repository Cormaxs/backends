import {
    get_admin_companies_summary,
    get_admin_company_details,
    get_admin_company_products,
    get_admin_company_tickets,
    get_admin_company_facturas,
    get_admin_company_notas_pedido,
    get_admin_company_cajas,
    get_admin_company_puntos_venta,
    get_admin_company_pagos_proveedor,
    get_admin_company_cuentas_pagar,
    get_admin_company_payments,
    get_admin_company_plan_info,
    get_admin_company_plan_limits,
    get_admin_users,
    get_all_plans,
    create_plan,
    update_plan,
    update_company_plan_admin,
    delete_plan
} from '../../services/admin_services.js';

export async function getAdminPlans(req, res) {
    try {
        console.log('--- [BACKEND] GET /admin/plans ---');
        const plans = await get_all_plans();
        
        if (!plans) {
            console.log('--- [BACKEND] No se devolvieron planes del servicio ---');
            return res.status(200).json([]);
        }

        console.log(`--- [BACKEND] Enviando ${plans.length} planes al frontend ---`);
        return res.status(200).json(plans);
    } catch (error) {
        console.error('--- [BACKEND] Error crítico en GET /admin/plans:', error);
        return res.status(500).json({ message: 'Error interno del servidor al obtener planes.', error: error.message });
    }
}

export async function updateCompanyPlanAdmin(req, res) {
    try {
        const { id } = req.params;
        const result = await update_company_plan_admin(id, req.body);
        return res.status(200).json({ success: true, company: result });
    } catch (error) {
        console.error('Error al actualizar plan de empresa por admin:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

export async function createAdminPlan(req, res) {
    try {
        console.log('--- [BACKEND] POST /admin/plans --- Recibido:', JSON.stringify(req.body, null, 2));
        const plan = await create_plan(req.body);
        
        if (!plan) {
            console.error('--- [BACKEND] El servicio no devolvió el plan creado ---');
            return res.status(400).json({ message: 'No se pudo crear el plan.' });
        }

        console.log('--- [BACKEND] Plan creado exitosamente:', plan.nombre, '(ID:', plan._id, ')');
        return res.status(201).json(plan);
    } catch (error) {
        console.error('--- [BACKEND] Error en POST /admin/plans:', error);
        return res.status(500).json({ 
            message: 'Error al crear plan.', 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}

export async function updateAdminPlan(req, res) {
    try {
        const { id } = req.params;
        const plan = await update_plan(id, req.body);
        return res.status(200).json(plan);
    } catch (error) {
        console.error('Error al actualizar plan:', error);
        return res.status(500).json({ message: 'Error al actualizar plan.' });
    }
}

export async function deleteAdminPlan(req, res) {
    try {
        const { id } = req.params;
        await delete_plan(id);
        return res.status(200).json({ message: 'Plan eliminado.' });
    } catch (error) {
        console.error('Error al eliminar plan:', error);
        return res.status(500).json({ message: 'Error al eliminar plan.' });
    }
}

export async function getAdminCompaniesSummary(req, res) {
    try {
        const companies = await get_admin_companies_summary();
        return res.status(200).json({ companies });
    } catch (error) {
        console.error('Error al obtener resumen de empresas:', error);
        return res.status(500).json({ message: 'Error interno al obtener el listado de empresas.' });
    }
}

export async function getAdminCompanyDetails(req, res) {
    try {
        const { id } = req.params;
        
        if (!id || id === 'undefined') {
            return res.status(400).json({ message: 'ID de empresa inválido.' });
        }
        
        const details = await get_admin_company_details(id);
        if (!details) {
            return res.status(404).json({ message: 'Empresa no encontrada.' });
        }
        
        return res.status(200).json(details);
    } catch (error) {
        console.error('Error al obtener detalles de la empresa:', error);
        return res.status(500).json({ 
            message: 'Error interno al obtener detalles de la empresa.',
            error: error.message 
        });
    }
}

export async function getAdminCompanyProducts(req, res) {
    try {
        const { id } = req.params;
        
        if (!id || id === 'undefined') {
            return res.status(400).json({ message: 'ID de empresa inválido.' });
        }
        
        const products = await get_admin_company_products(id);
        return res.status(200).json({ products, count: products.length });
    } catch (error) {
        console.error('Error al obtener productos:', error);
        return res.status(500).json({ message: 'Error al obtener productos de la empresa.' });
    }
}

export async function getAdminCompanyTickets(req, res) {
    try {
        const { id } = req.params;
        
        if (!id || id === 'undefined') {
            return res.status(400).json({ message: 'ID de empresa inválido.' });
        }
        
        const tickets = await get_admin_company_tickets(id);
        return res.status(200).json({ tickets, count: tickets.length });
    } catch (error) {
        console.error('Error al obtener tickets:', error);
        return res.status(500).json({ message: 'Error al obtener tickets de la empresa.' });
    }
}

export async function getAdminCompanyFacturas(req, res) {
    try {
        const { id } = req.params;
        
        if (!id || id === 'undefined') {
            return res.status(400).json({ message: 'ID de empresa inválido.' });
        }
        
        const facturas = await get_admin_company_facturas(id);
        return res.status(200).json({ facturas, count: facturas.length });
    } catch (error) {
        console.error('Error al obtener facturas:', error);
        return res.status(500).json({ message: 'Error al obtener facturas de la empresa.' });
    }
}

export async function getAdminCompanyNotasPedido(req, res) {
    try {
        const { id } = req.params;
        
        if (!id || id === 'undefined') {
            return res.status(400).json({ message: 'ID de empresa inválido.' });
        }
        
        const notas = await get_admin_company_notas_pedido(id);
        return res.status(200).json({ notas, count: notas.length });
    } catch (error) {
        console.error('Error al obtener notas de pedido:', error);
        return res.status(500).json({ message: 'Error al obtener notas de pedido de la empresa.' });
    }
}

export async function getAdminCompanyCajas(req, res) {
    try {
        const { id } = req.params;
        
        if (!id || id === 'undefined') {
            return res.status(400).json({ message: 'ID de empresa inválido.' });
        }
        
        const cajas = await get_admin_company_cajas(id);
        return res.status(200).json({ cajas, count: cajas.length });
    } catch (error) {
        console.error('Error al obtener cajas:', error);
        return res.status(500).json({ message: 'Error al obtener cajas de la empresa.' });
    }
}

export async function getAdminCompanyPuntosVenta(req, res) {
    try {
        const { id } = req.params;
        
        if (!id || id === 'undefined') {
            return res.status(400).json({ message: 'ID de empresa inválido.' });
        }
        
        const puntos = await get_admin_company_puntos_venta(id);
        return res.status(200).json({ puntos, count: puntos.length });
    } catch (error) {
        console.error('Error al obtener puntos de venta:', error);
        return res.status(500).json({ message: 'Error al obtener puntos de venta de la empresa.' });
    }
}

export async function getAdminCompanyPagosProveedor(req, res) {
    try {
        const { id } = req.params;
        
        if (!id || id === 'undefined') {
            return res.status(400).json({ message: 'ID de empresa inválido.' });
        }
        
        const pagos = await get_admin_company_pagos_proveedor(id);
        return res.status(200).json({ pagos, count: pagos.length });
    } catch (error) {
        console.error('Error al obtener pagos a proveedores:', error);
        return res.status(500).json({ message: 'Error al obtener pagos a proveedores.' });
    }
}

export async function getAdminCompanyCuentasPagar(req, res) {
    try {
        const { id } = req.params;
        
        if (!id || id === 'undefined') {
            return res.status(400).json({ message: 'ID de empresa inválido.' });
        }
        
        const cuentas = await get_admin_company_cuentas_pagar(id);
        return res.status(200).json({ cuentas, count: cuentas.length });
    } catch (error) {
        console.error('Error al obtener cuentas por pagar:', error);
        return res.status(500).json({ message: 'Error al obtener cuentas por pagar.' });
    }
}

export async function getAdminCompanyPayments(req, res) {
    try {
        const { id } = req.params;
        
        if (!id || id === 'undefined') {
            return res.status(400).json({ message: 'ID de empresa inválido.' });
        }
        
        const payments = await get_admin_company_payments(id);
        return res.status(200).json({ payments, count: payments.length });
    } catch (error) {
        console.error('Error al obtener pagos de MP:', error);
        return res.status(500).json({ message: 'Error al obtener pagos de MP.' });
    }
}

export async function getAdminUsers(req, res) {
    try {
        const users = await get_admin_users();
        return res.status(200).json({ users });
    } catch (error) {
        console.error('Error al obtener usuarios de administración:', error);
        return res.status(500).json({ message: 'Error interno al obtener la lista de usuarios.' });
    }
}

export async function getCompanyPlanInfo(req, res) {
    try {
        const { id } = req.params;
        
        if (!id || id === 'undefined') {
            return res.status(400).json({ message: 'ID de empresa inválido.' });
        }
        
        const planInfo = await get_admin_company_plan_info(id);
        
        if (!planInfo) {
            return res.status(404).json({ message: 'Empresa no encontrada.' });
        }
        
        return res.status(200).json({
            success: true,
            planInfo
        });
    } catch (error) {
        console.error('Error al obtener info del plan:', error);
        return res.status(500).json({ 
            success: false,
            message: 'Error al obtener info del plan.' 
        });
    }
}

export async function getCompanyPlanLimits(req, res) {
    try {
        const { id } = req.params;

        if (!id || id === 'undefined') {
            return res.status(400).json({ message: 'ID de empresa inválido.' });
        }

        const planLimits = await get_admin_company_plan_limits(id);

        if (!planLimits) {
            return res.status(404).json({ message: 'No se encontró información del plan para esta empresa.' });
        }

        return res.status(200).json({ 
            success: true,
            planLimits 
        });
    } catch (error) {
        console.error('Error al obtener límites del plan:', error);
        return res.status(500).json({ 
            success: false,
            message: 'Error al obtener límites del plan.',
            error: error.message 
        });
    }
}
