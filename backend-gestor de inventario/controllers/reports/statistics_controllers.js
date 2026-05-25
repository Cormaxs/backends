import {
    getSalesSummary_service,
    getBestSellers_service,
    getWorstSellers_service,
    getStockAlerts_service,
    getProductReport_service,
    getSalesHistory_service,
    getFinancialSummary_service,
    getTicketList_service
} from '../../services/statistics_services.js';

export async function getSalesSummary(req, res) {
    try {
        const data = await getSalesSummary_service(req.params.idEmpresa, req.query);
        return res.status(200).json(data);
    } catch (error) {
        console.error('Error al obtener resumen de ventas:', error);
        return res.status(500).json({ error: 'Error interno al obtener el resumen de ventas.' });
    }
}

export async function getBestSellers(req, res) {
    try {
        const data = await getBestSellers_service(req.params.idEmpresa, req.query);
        return res.status(200).json(data);
    } catch (error) {
        console.error('Error al obtener los mejores productos vendidos:', error);
        return res.status(500).json({ error: 'Error interno al obtener los mejores productos vendidos.' });
    }
}

export async function getWorstSellers(req, res) {
    try {
        const data = await getWorstSellers_service(req.params.idEmpresa, req.query);
        return res.status(200).json(data);
    } catch (error) {
        console.error('Error al obtener los productos menos vendidos:', error);
        return res.status(500).json({ error: 'Error interno al obtener los productos menos vendidos.' });
    }
}

export async function getStockAlerts(req, res) {
    try {
        const data = await getStockAlerts_service(req.params.idEmpresa, req.query);
        return res.status(200).json(data);
    } catch (error) {
        console.error('Error al obtener alertas de stock:', error);
        return res.status(500).json({ error: 'Error interno al obtener alertas de stock.' });
    }
}

export async function getProductReport(req, res) {
    try {
        const data = await getProductReport_service(req.params.idEmpresa, req.query);
        return res.status(200).json(data);
    } catch (error) {
        console.error('Error al obtener reporte de productos:', error);
        return res.status(500).json({ error: 'Error interno al obtener reporte de productos.' });
    }
}

export async function getSalesHistory(req, res) {
    try {
        const data = await getSalesHistory_service(req.params.idEmpresa, req.query);
        return res.status(200).json(data);
    } catch (error) {
        console.error('Error al obtener historial de ventas por producto:', error);
        return res.status(500).json({ error: 'Error interno al obtener el historial de ventas.' });
    }
}

export async function getTicketList(req, res) {
    try {
        const data = await getTicketList_service(req.params.idEmpresa, req.query);
        return res.status(200).json(data);
    } catch (error) {
        console.error('Error al obtener listado de tickets:', error);
        return res.status(500).json({ error: 'Error interno al obtener el listado de tickets.' });
    }
}

export async function getFinancialSummary(req, res) {
    try {
        const data = await getFinancialSummary_service(req.params.idEmpresa, req.query);
        return res.status(200).json(data);
    } catch (error) {
        console.error('Error al obtener resumen financiero:', error);
        return res.status(500).json({ error: 'Error interno al obtener resumen financiero.' });
    }
}
