import { Empresa, User, Product, Client, Ticket, NotaPedido, PuntoDeVenta, Caja, CuentaPorPagar, PagoProveedor } from '../models/index.js';

class AdminRepository {
    async getCompaniesSummary() {
        const companies = await Empresa.find().lean();
        return await Promise.all(companies.map(async (company) => {
            const counts = await this._countRelatedData(company._id);
            return {
                ...company,
                counts
            };
        }));
    }

    async getCompanyDetails(id) {
        const company = await Empresa.findById(id).lean();
        if (!company) return null;

        const users = await User.find({ empresa: company._id })
            .select('username email rol activo nombre apellido')
            .lean();

        const counts = await this._countRelatedData(company._id);

        return {
            company,
            users,
            counts
        };
    }

    async getCompanyProducts(id) {
        return await Product.find({ empresa: id })
            .select('producto codigoInterno precioCosto precioLista stock_disponible alic_IVA categoria marca')
            .lean();
    }

    async getCompanyTickets(id) {
        return await Ticket.find({ idEmpresa: id })
            .select('numeroComprobante fechaHora tipoComprobante estadoFactura totales cliente items source')
            .sort({ fechaHora: -1 })
            .limit(100)
            .lean();
    }

    async getCompanyFacturas(id) {
        return await Ticket.find({
            idEmpresa: id,
            tipoComprobante: { $regex: /factura/i }
        })
            .select('numeroComprobante fechaHora tipoComprobante estadoFactura totales cliente items')
            .sort({ fechaHora: -1 })
            .limit(100)
            .lean();
    }

    async getCompanyNotasPedido(id) {
        return await NotaPedido.find({ idEmpresa: id })
            .select('pedidoId fechaHora cliente estado totales items vendedor')
            .sort({ fechaHora: -1 })
            .limit(100)
            .lean();
    }

    async getCompanyCajas(id) {
        return await Caja.find({ empresa: id })
            .select('nombreCaja estado fechaApertura fechaCierre montoInicial ingresos egresos montoFinalReal diferencia')
            .limit(50)
            .lean();
    }

    async getCompanyPuntosVenta(id) {
        return await PuntoDeVenta.find({ empresa: id })
            .select('nombre numero activo ultimoCbteAutorizado fechaUltimoCbte direccion')
            .lean();
    }

    async getCompanyPagosProveedor(id) {
        return await PagoProveedor.find({ empresa: id })
            .select('proveedor montoPagado metodoPago fechaPago observaciones')
            .sort({ fechaPago: -1 })
            .limit(100)
            .lean();
    }

    async getCompanyCuentasPagar(id) {
        return await CuentaPorPagar.find({ empresa: id })
            .select('proveedor montoTotal montoPendiente estado fechaVencimiento fechaEmision')
            .sort({ fechaVencimiento: -1 })
            .limit(100)
            .lean();
    }

    async getAllUsers() {
        return await User.find()
            .populate('empresa', 'nombreEmpresa razonSocial')
            .select('username email rol activo nombre apellido empresa')
            .lean();
    }

    async _countRelatedData(companyId) {
        const countWithFallback = async (countFn, defaultValue = 0) => {
            try {
                return await countFn();
            } catch (err) {
                console.error('Error contando datos:', err.message);
                return defaultValue;
            }
        };

        const [users, products, clients, tickets, facturas, notasPedido, puntosVenta, cajas, cuentasPagar, pagosProveedor] = await Promise.all([
            countWithFallback(() => User.countDocuments({ empresa: companyId })),
            countWithFallback(() => Product.countDocuments({ empresa: companyId })),
            countWithFallback(() => Client.countDocuments({ empresa: companyId })),
            countWithFallback(() => Ticket.countDocuments({ idEmpresa: companyId })),
            countWithFallback(() => Ticket.countDocuments({
                idEmpresa: companyId,
                tipoComprobante: { $regex: /factura/i }
            })),
            countWithFallback(() => NotaPedido.countDocuments({ idEmpresa: companyId })),
            countWithFallback(() => PuntoDeVenta.countDocuments({ empresa: companyId })),
            countWithFallback(() => Caja.countDocuments({ empresa: companyId })),
            countWithFallback(() => CuentaPorPagar.countDocuments({ empresa: companyId })),
            countWithFallback(() => PagoProveedor.countDocuments({ empresa: companyId }))
        ]);

        return {
            users,
            products,
            clients,
            tickets,
            facturas,
            notasPedido,
            puntosVenta,
            cajas,
            cuentasPagar,
            pagosProveedor
        };
    }

    async getCompanyPlanInfo(empresaId) {
        const empresa = await Empresa.findById(empresaId)
            .select('planActual estadoPlan fechaPlanInicio fechaPlanFinalizacion')
            .lean();

        if (!empresa) return null;

        return empresa;
    }

    async getCompanyPlanLimits(empresaId) {
        const empresa = await Empresa.findById(empresaId)
            .select('planActual estadoPlan fechaPlanInicio fechaPlanFinalizacion')
            .lean();

        if (!empresa) return null;

        // Importar PlanValidationService aquí para evitar circular dependencies
        const PlanValidationService = (await import('../services/plan_validation_service.js')).default;
        return await PlanValidationService.getResumenPlan(empresaId);
    }
}

export default new AdminRepository();
