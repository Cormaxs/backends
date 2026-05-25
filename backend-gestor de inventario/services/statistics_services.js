import { Ticket, Product, Caja, MovimientoInventario, CuentaPorPagar, PagoProveedor } from '../models/index.js';
import ProductRepository from '../repositories/repo_product.js';
import mongoose from 'mongoose';

function mapTipoComprobanteLabel(tipo) {
    const raw = tipo == null ? '' : String(tipo).trim();
    const upper = raw.toUpperCase();

    if (!raw) return 'Desconocido';
    if (/(^TICKET$|^RECIBO$|^BOLETA$|^TICKET)/i.test(raw)) return 'Ticket';
    if (/FACTURA\s*A/i.test(raw)) return 'Factura A';
    if (/FACTURA\s*B/i.test(raw)) return 'Factura B';
    if (/FACTURA\s*C/i.test(raw)) return 'Factura C';

    const numeric = Number(raw);
    if (!Number.isNaN(numeric)) {
        if ([1, 2, 3].includes(numeric)) return 'Factura A';
        if ([6, 7, 8].includes(numeric)) return 'Factura B';
        if ([11, 13, 14].includes(numeric)) return 'Factura C';
    }

    return raw;
}

export async function getSalesSummary_service(idEmpresa, query = {}) {
    const companyId = new mongoose.Types.ObjectId(idEmpresa);
    const match = { idEmpresa: companyId };

    if (query.puntoVenta) {
        match.puntoDeVenta = query.puntoVenta;
    }

    if (query.start || query.end) {
        match.fechaHora = {};
        if (query.start) {
            match.fechaHora.$gte = new Date(query.start);
        }
        if (query.end) {
            match.fechaHora.$lte = new Date(query.end);
        }
    }

    const facetResult = await Ticket.aggregate([
        { $match: match },
        {
            $facet: {
                summary: [
                    {
                        $group: {
                            _id: null,
                            totalRevenue: { $sum: '$totales.totalPagar' },
                            totalTickets: { $sum: 1 },
                            averageTicket: { $avg: '$totales.totalPagar' }
                        }
                    }
                ],
                paymentMethods: [
                    {
                        $group: {
                            _id: { $ifNull: ['$pago.metodo', 'DESCONOCIDO'] },
                            totalAmount: { $sum: '$totales.totalPagar' },
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { totalAmount: -1, count: -1 } }
                ],
                documentTypes: [
                    {
                        $group: {
                            _id: { $ifNull: ['$tipoComprobante', 'DESCONOCIDO'] },
                            totalAmount: { $sum: '$totales.totalPagar' },
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { count: -1, totalAmount: -1 } }
                ]
            }
        }
    ]);

    const { summary = [], paymentMethods = [], documentTypes = [] } = facetResult[0] || {};
    const totals = (summary && summary[0]) || { totalRevenue: 0, totalTickets: 0, averageTicket: 0 };
    return {
        totalRevenue: totals.totalRevenue || 0,
        totalTickets: totals.totalTickets || 0,
        averageTicket: totals.averageTicket || 0,
        paymentMethods: (paymentMethods || []).map(item => ({
            metodo: item._id,
            totalAmount: item.totalAmount || 0,
            count: item.count || 0
        })),
        documentTypes: (documentTypes || []).map(item => ({
            tipo: mapTipoComprobanteLabel(item._id),
            rawTipo: item._id,
            totalAmount: item.totalAmount || 0,
            count: item.count || 0
        })),
        period: {
            start: query.start || null,
            end: query.end || null
        }
    };
}

export async function getBestSellers_service(idEmpresa, query = {}) {
    const companyId = new mongoose.Types.ObjectId(idEmpresa);
    const match = { idEmpresa: companyId };
    if (query.puntoVenta) {
        match.puntoDeVenta = query.puntoVenta;
    }

    const bestSellers = await Ticket.aggregate([
        { $match: match },
        { $unwind: '$items' },
        {
            $group: {
                _id: { codigo: '$items.codigo', descripcion: '$items.descripcion' },
                quantity: { $sum: '$items.cantidad' },
                revenue: { $sum: '$items.totalItem' }
            }
        },
        { $sort: { quantity: -1, revenue: -1 } },
        { $limit: Number(query.limit) || 10 }
    ]);

    return {
        sellers: bestSellers.map(item => ({
            nombre: item._id.descripcion || item._id.codigo,
            cantidad: item.quantity,
            total: item.revenue || 0
        })),
        period: {
            start: query.start || null,
            end: query.end || null
        }
    };
}

export async function getWorstSellers_service(idEmpresa, query = {}) {
    const companyId = new mongoose.Types.ObjectId(idEmpresa);
    const match = { idEmpresa: companyId };
    if (query.puntoVenta) {
        match.puntoDeVenta = query.puntoVenta;
    }

    const worstSellers = await Ticket.aggregate([
        { $match: match },
        { $unwind: '$items' },
        {
            $group: {
                _id: { codigo: '$items.codigo', descripcion: '$items.descripcion' },
                quantity: { $sum: '$items.cantidad' },
                revenue: { $sum: '$items.totalItem' }
            }
        },
        { $sort: { quantity: 1, revenue: 1 } },
        { $limit: Number(query.limit) || 10 }
    ]);

    return {
        sellers: worstSellers.map(item => ({
            nombre: item._id.descripcion || item._id.codigo,
            cantidad: item.quantity,
            total: item.revenue || 0
        })),
        period: {
            start: query.start || null,
            end: query.end || null
        }
    };
}

export async function getStockAlerts_service(idEmpresa, query = {}) {
    const companyId = new mongoose.Types.ObjectId(idEmpresa);
    const puntoVenta = query.puntoVenta;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const dias = Number(query.dias) || 30;

    const outOfStock = await ProductRepository.getProductAgotados(idEmpresa, puntoVenta, page, limit);
    const lowStockWarning = await ProductRepository.getProductsStockBajo(idEmpresa, puntoVenta, page, limit);
    const expiredProducts = await ProductRepository.getProductsVencidos(idEmpresa, puntoVenta, page, limit);
    const soonToExpire = await ProductRepository.getProductsPorVencer(idEmpresa, puntoVenta, dias, page, limit);

    const mapProductAlert = (product, tipo) => ({
        id: product._id,
        nombre: product.producto || product.descripcion || 'Producto sin nombre',
        stockActual: product.stock_disponible || 0,
        stockMinimo: product.stockMinimo || 0,
        tipo,
        codigo: product.codigoInterno || product.codigoBarra || null
    });

    const alerts = [
        ...outOfStock.docs.map(product => mapProductAlert(product, 'AGOTADO')),
        ...lowStockWarning.docs.map(product => mapProductAlert(product, 'BAJO'))
    ];

    return {
        alerts,
        outOfStock: outOfStock.docs || [],
        lowStockWarning: lowStockWarning.docs || [],
        expiredProducts: expiredProducts.docs || [],
        expiringSoon: soonToExpire.docs || [],
        overview: {
            outOfStockCount: outOfStock.totalDocs || 0,
            lowStockWarningCount: lowStockWarning.totalDocs || 0,
            expiredCount: expiredProducts.totalDocs || 0,
            expiringSoonCount: soonToExpire.totalDocs || 0,
            days: dias
        }
    };
}

export async function getTicketList_service(idEmpresa, query = {}) {
    const companyId = new mongoose.Types.ObjectId(idEmpresa);
    const match = { idEmpresa: companyId };
    if (query.puntoVenta) {
        match.puntoDeVenta = query.puntoVenta;
    }
    if (query.start || query.end) {
        match.fechaHora = {};
        if (query.start) match.fechaHora.$gte = new Date(query.start);
        if (query.end) match.fechaHora.$lte = new Date(query.end);
    }

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;

    const [tickets, totalTickets] = await Promise.all([
        Ticket.find(match)
            .sort({ fechaHora: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Ticket.countDocuments(match)
    ]);

    return {
        period: { start: query.start || null, end: query.end || null },
        tickets,
        pagination: {
            total: totalTickets,
            page,
            limit,
            totalPages: Math.max(1, Math.ceil(totalTickets / limit))
        }
    };
}

export async function getProductReport_service(idEmpresa, query = {}) {
    const companyId = new mongoose.Types.ObjectId(idEmpresa);
    const products = await Product.find({ empresa: companyId }).lean();

    // Aggregate sold quantities in period if provided
    const match = { idEmpresa: companyId };
    if (query.start || query.end) {
        match.fechaHora = {};
        if (query.start) match.fechaHora.$gte = new Date(query.start);
        if (query.end) match.fechaHora.$lte = new Date(query.end);
    }

    const soldAgg = await Ticket.aggregate([
        { $match: match },
        { $unwind: '$items' },
        {
            $group: {
                _id: '$items.codigo',
                quantitySold: { $sum: '$items.cantidad' },
                revenue: { $sum: '$items.totalItem' }
            }
        }
    ]);

    const soldMap = {};
    soldAgg.forEach(s => { soldMap[String(s._id)] = s; });

    const report = products.map(p => {
        const code = p.codigoInterno ? String(p.codigoInterno) : (p.codigoBarra ? String(p.codigoBarra) : null);
        const sold = code && soldMap[code] ? soldMap[code] : { quantitySold: 0, revenue: 0 };
        const gananciaUnitaria = (p.precioLista || 0) - (p.precioCosto || 0);
        const valorTotalCostoStock = (p.stock_disponible || 0) * (p.precioCosto || 0);
        const potencialRevenueStock = (p.stock_disponible || 0) * (p.precioLista || 0);
        const potencialProfitStock = potencialRevenueStock - valorTotalCostoStock;

        return {
            _id: p._id,
            producto: p.producto,
            descripcion: p.descripcion,
            codigoInterno: p.codigoInterno || null,
            codigoBarra: p.codigoBarra || null,
            stock_disponible: p.stock_disponible || 0,
            precioCosto: p.precioCosto || 0,
            precioLista: p.precioLista || 0,
            gananciaUnitaria,
            valorTotalCostoStock,
            potencialRevenueStock,
            potencialProfitStock,
            cantidadVendida: sold.quantitySold || 0,
            revenueFromSales: sold.revenue || 0
        };
    });

    const expiredProducts = await ProductRepository.getProductsVencidos(idEmpresa, query.puntoVenta, 1, Number(query.limitExpiry) || 50);
    const expiringSoon = await ProductRepository.getProductsPorVencer(idEmpresa, query.puntoVenta, Number(query.dias) || 30, 1, Number(query.limitExpiry) || 50);

    return {
        period: { start: query.start || null, end: query.end || null },
        totalProducts: report.length,
        products: report,
        expiredProducts: expiredProducts.docs || [],
        expiringSoonProducts: expiringSoon.docs || [],
        expiredCount: expiredProducts.totalDocs || 0,
        expiringSoonCount: expiringSoon.totalDocs || 0
    };
}

export async function getSalesHistory_service(idEmpresa, query = {}) {
    const companyId = new mongoose.Types.ObjectId(idEmpresa);
    const match = { idEmpresa: companyId };
    if (query.puntoVenta) {
        match.puntoDeVenta = query.puntoVenta;
    }
    if (query.start || query.end) {
        match.fechaHora = {};
        if (query.start) match.fechaHora.$gte = new Date(query.start);
        if (query.end) match.fechaHora.$lte = new Date(query.end);
    }

    const limit = Number(query.limit) || 100;
    const history = await Ticket.aggregate([
        { $match: match },
        { $unwind: '$items' },
        {
            $group: {
                _id: { codigo: '$items.codigo', descripcion: '$items.descripcion' },
                quantitySold: { $sum: '$items.cantidad' },
                revenue: { $sum: '$items.totalItem' },
                tickets: { $addToSet: '$ventaId' },
                firstSale: { $min: '$fechaHora' },
                lastSale: { $max: '$fechaHora' }
            }
        },
        {
            $project: {
                codigo: '$_id.codigo',
                descripcion: '$_id.descripcion',
                quantitySold: 1,
                revenue: 1,
                ticketsSold: { $size: '$tickets' },
                firstSale: 1,
                lastSale: 1,
                averagePrice: {
                    $cond: [
                        { $gt: ['$quantitySold', 0] },
                        { $divide: ['$revenue', '$quantitySold'] },
                        0
                    ]
                }
            }
        },
        { $sort: { quantitySold: -1, revenue: -1 } },
        { $limit: limit }
    ]);

    return {
        period: { start: query.start || null, end: query.end || null },
        totalProducts: history.length,
        products: history
    };
}

export async function getFinancialSummary_service(idEmpresa, query = {}) {
    const companyId = new mongoose.Types.ObjectId(idEmpresa);
    const match = { idEmpresa: companyId };
    if (query.puntoVenta) {
        match.puntoDeVenta = query.puntoVenta;
    }
    if (query.start || query.end) {
        match.fechaHora = {};
        if (query.start) match.fechaHora.$gte = new Date(query.start);
        if (query.end) match.fechaHora.$lte = new Date(query.end);
    }

    // Ingresos por ventas
    const incomeAgg = await Ticket.aggregate([
        { $match: match },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: '$totales.totalPagar' },
                totalTickets: { $sum: 1 },
                averageTicket: { $avg: '$totales.totalPagar' }
            }
        }
    ]);
    const income = (incomeAgg[0] && incomeAgg[0].totalRevenue) || 0;
    const averageTicket = (incomeAgg[0] && incomeAgg[0].averageTicket) || 0;

    // Caja
    const cajaMatch = { empresa: companyId };
    if (query.puntoVenta) {
        cajaMatch.puntoDeVenta = query.puntoVenta;
    }
    if (query.start || query.end) {
        cajaMatch.fechaApertura = {};
        if (query.start) cajaMatch.fechaApertura.$gte = new Date(query.start);
        if (query.end) cajaMatch.fechaApertura.$lte = new Date(query.end);
    }

    const cajasAgg = await Caja.aggregate([
        { $match: cajaMatch },
        {
            $group: {
                _id: null,
                totalEgresos: { $sum: '$egresos' },
                totalIngresos: { $sum: '$ingresos' },
                totalCajasAbiertas: { $sum: { $cond: [{ $eq: ['$estado', 'Abierta'] }, 1, 0] } },
                totalCajasCerradas: { $sum: { $cond: [{ $eq: ['$estado', 'Cerrada'] }, 1, 0] } }
            }
        }
    ]);
    const cajaEgresos = (cajasAgg[0] && cajasAgg[0].totalEgresos) || 0;
    const cajaIngresos = (cajasAgg[0] && cajasAgg[0].totalIngresos) || 0;
    const cajasAbiertas = (cajasAgg[0] && cajasAgg[0].totalCajasAbiertas) || 0;
    const cajasCerradas = (cajasAgg[0] && cajasAgg[0].totalCajasCerradas) || 0;

    // Compras / entradas de inventario
    const movMatch = { empresa: companyId, tipoMovimiento: { $in: ['entrada', 'transferencia_entrada'] } };
    if (query.start || query.end) {
        movMatch.fechaMovimiento = {};
        if (query.start) movMatch.fechaMovimiento.$gte = new Date(query.start);
        if (query.end) movMatch.fechaMovimiento.$lte = new Date(query.end);
    }
    const movimientosAgg = await MovimientoInventario.aggregate([
        { $match: movMatch },
        {
            $group: {
                _id: null,
                totalCompras: { $sum: '$valorTotalMovimiento' }
            }
        }
    ]);
    const compras = (movimientosAgg[0] && movimientosAgg[0].totalCompras) || 0;

    // Compras a proveedores y pagos
    const purchaseMatch = { empresa: companyId };
    if (query.start || query.end) {
        purchaseMatch.fechaEmision = {};
        if (query.start) purchaseMatch.fechaEmision.$gte = new Date(query.start);
        if (query.end) purchaseMatch.fechaEmision.$lte = new Date(query.end);
    }

    const pagosMatch = { empresa: companyId };
    if (query.start || query.end) {
        pagosMatch.fechaPago = {};
        if (query.start) pagosMatch.fechaPago.$gte = new Date(query.start);
        if (query.end) pagosMatch.fechaPago.$lte = new Date(query.end);
    }

    const cuentasPorPagarAgg = await CuentaPorPagar.aggregate([
        { $match: purchaseMatch },
        {
            $group: {
                _id: null,
                totalComprasProveedor: { $sum: '$montoTotal' },
                totalPendienteProveedor: { $sum: '$montoPendiente' },
                totalDocumentos: { $sum: 1 },
                totalVencidos: { $sum: { $cond: [{ $and: [{ $lt: ['$fechaVencimiento', new Date()] }, { $gt: ['$montoPendiente', 0] }] }, '$montoPendiente', 0] } }
            }
        }
    ]);
    const comprasProveedores = (cuentasPorPagarAgg[0] && cuentasPorPagarAgg[0].totalComprasProveedor) || 0;
    const pendienteProveedores = (cuentasPorPagarAgg[0] && cuentasPorPagarAgg[0].totalPendienteProveedor) || 0;
    const vencidoProveedores = (cuentasPorPagarAgg[0] && cuentasPorPagarAgg[0].totalVencidos) || 0;

    const pagosProveedorAgg = await PagoProveedor.aggregate([
        { $match: pagosMatch },
        {
            $group: {
                _id: null,
                totalPagadoProveedor: { $sum: '$montoPagado' },
                totalPagos: { $sum: 1 }
            }
        }
    ]);
    const totalPagadoProveedor = (pagosProveedorAgg[0] && pagosProveedorAgg[0].totalPagadoProveedor) || 0;
    const totalPagosProveedor = (pagosProveedorAgg[0] && pagosProveedorAgg[0].totalPagos) || 0;

    const purchaseHistory = await CuentaPorPagar.find(purchaseMatch)
        .populate('proveedor', 'nombre')
        .sort({ fechaEmision: -1 })
        .limit(10)
        .lean();

    const providerPayments = await PagoProveedor.find(pagosMatch)
        .populate('proveedor', 'nombre')
        .populate('cuentaPorPagar')
        .sort({ fechaPago: -1 })
        .limit(10)
        .lean();

    const cajaHistory = await Caja.find({ empresa: companyId })
        .sort({ fechaApertura: -1 })
        .limit(10)
        .lean();

    // Cost of Goods Sold (COGS) y ganancias
    const soldItemsAgg = await Ticket.aggregate([
        { $match: match },
        { $unwind: '$items' },
        {
            $group: {
                _id: '$items.codigo',
                quantity: { $sum: '$items.cantidad' },
                revenue: { $sum: '$items.totalItem' }
            }
        }
    ]);

    let cogs = 0;
    let totalProfit = 0;
    for (const s of soldItemsAgg) {
        const code = String(s._id);
        const maybeBarcode = Number(code);
        const queryOr = [{ codigoInterno: code }];
        if (!Number.isNaN(maybeBarcode)) {
            queryOr.push({ codigoBarra: maybeBarcode });
        }

        const product = await Product.findOne({ empresa: companyId, $or: queryOr }).lean();
        const costo = product ? (product.precioCosto || 0) : 0;
        cogs += costo * (s.quantity || 0);
        totalProfit += (s.revenue || 0) - (costo * (s.quantity || 0));
    }

    const grossProfit = totalProfit;
    const netProfit = grossProfit - (cajaEgresos + compras);
    const margin = income > 0 ? (grossProfit / income) * 100 : 0;

    const paymentMethodsAgg = await Ticket.aggregate([
        { $match: match },
        {
            $group: {
                _id: { $ifNull: ['$pago.metodo', 'DESCONOCIDO'] },
                totalAmount: { $sum: '$totales.totalPagar' },
                count: { $sum: 1 }
            }
        },
        { $sort: { totalAmount: -1, count: -1 } }
    ]);

    const documentTypesAgg = await Ticket.aggregate([
        { $match: match },
        {
            $group: {
                _id: { $ifNull: ['$tipoComprobante', 'DESCONOCIDO'] },
                totalAmount: { $sum: '$totales.totalPagar' },
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1, totalAmount: -1 } }
    ]);

    const result = {
        period: { start: query.start || null, end: query.end || null },
        totals: {
            income,
            cajaIngresos,
            cajaEgresos,
            compras,
            comprasProveedores,
            pendienteProveedores,
            totalPagadoProveedor,
            cogs,
            grossProfit,
            netProfit,
            margin
        },
        tickets: {
            totalTickets: (incomeAgg[0] && incomeAgg[0].totalTickets) || 0,
            averageTicket
        },
        cash: {
            cajasAbiertas,
            cajasCerradas,
            cajaHistory
        },
        suppliers: {
            purchaseHistory,
            providerPayments,
            totalDocumentosProveedor: (cuentasPorPagarAgg[0] && cuentasPorPagarAgg[0].totalDocumentos) || 0,
            totalPagosProveedor,
            vencidoProveedores
        },
        paymentMethods: (paymentMethodsAgg || []).map(item => ({
            metodo: item._id,
            totalAmount: item.totalAmount || 0,
            count: item.count || 0
        })),
        documentTypes: (documentTypesAgg || []).map(item => ({
            tipo: mapTipoComprobanteLabel(item._id),
            rawTipo: item._id,
            totalAmount: item.totalAmount || 0,
            count: item.count || 0
        }))
    };

    if (query.granularity) {
        const gran = String(query.granularity).toLowerCase();
        let fmt = '%Y-%m-%d';
        if (gran === 'weekly') fmt = '%G-%V';
        if (gran === 'monthly') fmt = '%Y-%m';

        const incomeSeries = await Ticket.aggregate([
            { $match: match },
            {
                $group: {
                    _id: { $dateToString: { format: fmt, date: '$fechaHora' } },
                    revenue: { $sum: '$totales.totalPagar' },
                    tickets: { $sum: 1 }
                }
            },
            { $sort: { '_id': 1 } }
        ]);

        const cajaSeries = await Caja.aggregate([
            { $match: cajaMatch },
            {
                $group: {
                    _id: { $dateToString: { format: fmt, date: '$fechaApertura' } },
                    egresos: { $sum: '$egresos' },
                    ingresos: { $sum: '$ingresos' }
                }
            },
            { $sort: { '_id': 1 } }
        ]);

        const comprasSeries = await MovimientoInventario.aggregate([
            { $match: movMatch },
            {
                $group: {
                    _id: { $dateToString: { format: fmt, date: '$fechaMovimiento' } },
                    compras: { $sum: '$valorTotalMovimiento' }
                }
            },
            { $sort: { '_id': 1 } }
        ]);

        const periods = {};
        incomeSeries.forEach(i => { periods[i._id] = { period: i._id, revenue: i.revenue, tickets: i.tickets, egresos: 0, compras: 0 }; });
        cajaSeries.forEach(c => { if (!periods[c._id]) periods[c._id] = { period: c._id }; periods[c._id].egresos = c.egresos || 0; periods[c._id].ingresosCaja = c.ingresos || 0; });
        comprasSeries.forEach(c => { if (!periods[c._id]) periods[c._id] = { period: c._id }; periods[c._id].compras = c.compras || 0; });

        const series = Object.values(periods).map(p => ({
            period: p.period,
            revenue: p.revenue || 0,
            tickets: p.tickets || 0,
            egresos: p.egresos || 0,
            compras: p.compras || 0,
            netProfit: (p.revenue || 0) - ((p.egresos || 0) + (p.compras || 0))
        }));

        result.series = series;
    }

    return result;
}
