import { Router } from 'express';
import {
    getSalesSummary,
    getBestSellers,
    getWorstSellers,
    getStockAlerts,
    getSalesHistory,
    getProductReport,
    getFinancialSummary,
    getTicketList
} from '../../../controllers/reports/statistics_controllers.js';

const reportsRoutes = Router();

reportsRoutes.get('/sales-summary/:idEmpresa', getSalesSummary);
reportsRoutes.get('/best-sellers/:idEmpresa', getBestSellers);
reportsRoutes.get('/worst-sellers/:idEmpresa', getWorstSellers);
reportsRoutes.get('/stock-alerts/:idEmpresa', getStockAlerts);
reportsRoutes.get('/sales-history/:idEmpresa', getSalesHistory);
reportsRoutes.get('/product-report/:idEmpresa', getProductReport);
reportsRoutes.get('/financial-summary/:idEmpresa', getFinancialSummary);
reportsRoutes.get('/tickets/:idEmpresa', getTicketList);

export default reportsRoutes;
