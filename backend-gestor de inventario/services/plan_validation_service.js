import PLANES_STATIC from '../config/planes.js';
import { Empresa, Product, User, Ticket, NotaPedido, PuntoDeVenta, Caja, Plan, HistorialPago } from '../models/index.js';

class PlanValidationService {
    /**
     * Obtiene los límites del plan de una empresa desde la DB o fallback a static
     */
    async getPlanoLimites(empresa) {
        let plan;
        if (empresa.planId) {
            plan = await Plan.findById(empresa.planId).lean();
        } else {
            // Intentar buscar por el slug (planActual)
            plan = await Plan.findOne({ slug: empresa.planActual }).lean();
        }

        if (!plan) {
            // Fallback a configuración estática si no está en la DB
            const staticPlan = PLANES_STATIC[empresa.planActual] || PLANES_STATIC.free;
            return {
                nombre: staticPlan.nombre,
                slug: empresa.planActual,
                productosLimite: staticPlan.productosLimite,
                usuariosLimite: staticPlan.usuariosLimite,
                facturasMensualesLimite: staticPlan.facturasMenu || 0,
                ticketsMensualesLimite: staticPlan.ticketsLimite || 0,
                notasPedidoMensualesLimite: staticPlan.notasPedidoLimite || 0,
                puntosVentaLimite: staticPlan.puntosVentaLimite || 1,
                cajasLimite: staticPlan.cajasLimite || 1,
                exportXlsx: staticPlan.exportXlsx || false,
                soportePrioritario: staticPlan.soportePrioritario || false,
                precio: staticPlan.precio || 0
            };
        }

        return plan;
    }

    /**
     * Verifica si el plan está vigente
     */
    isPlanActivo(empresa) {
        if (empresa.estadoPlan !== 'activo') {
            return false;
        }

        // Si la empresa tiene fecha de finalización, verificar que no haya vencido
        if (empresa.fechaPlanFinalizacion) {
            return new Date() <= new Date(empresa.fechaPlanFinalizacion);
        }

        return true;
    }

    /**
     * Obtiene el uso actual de la empresa en tiempo real
     */
    async getEmpresaUsage(empresaId) {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // IMPORTANTE: idEmpresa vs empresa según cada modelo
        const [
            productCount, 
            userCount, 
            afipCount,
            ticketCount, 
            notaPedidoCount, 
            pdvCount, 
            cajaCount
        ] = await Promise.all([
            Product.countDocuments({ empresa: empresaId }),
            User.countDocuments({ empresa: empresaId }),
            Ticket.countDocuments({ 
                idEmpresa: empresaId, 
                source: 'AFIP', 
                $or: [
                    { fechaHora: { $gte: firstDayOfMonth } },
                    { createdAt: { $gte: firstDayOfMonth } }
                ]
            }),
            Ticket.countDocuments({ 
                idEmpresa: empresaId, 
                source: { $ne: 'AFIP' }, 
                $or: [
                    { fechaHora: { $gte: firstDayOfMonth } },
                    { createdAt: { $gte: firstDayOfMonth } }
                ]
            }),
            NotaPedido.countDocuments({ idEmpresa: empresaId, createdAt: { $gte: firstDayOfMonth } }),
            PuntoDeVenta.countDocuments({ empresa: empresaId }),
            Caja.countDocuments({ empresa: empresaId })
        ]);

        return {
            productos: productCount,
            usuarios: userCount,
            facturasAfipMes: afipCount,
            ticketsMes: ticketCount,
            notasPedidoMes: notaPedidoCount,
            puntosVenta: pdvCount,
            cajas: cajaCount
        };
    }

    /**
     * Obtiene un resumen completo del plan, consumo e historial de pagos
     */
    async getResumenCompleto(empresaId) {
        // Intentar buscar por _id primero, y por idDbAfip después para mayor compatibilidad
        let empresa = await Empresa.findById(empresaId).lean();
        
        if (!empresa) {
            empresa = await Empresa.findOne({ idDbAfip: empresaId }).lean();
        }

        if (!empresa) {
            console.error(`--- [PLAN SERVICE] Empresa no encontrada con ID: ${empresaId} ---`);
            return null;
        }

        const realEmpresaId = empresa._id;

        const [limites, uso, pagos, todosLosPlanes] = await Promise.all([
            this.getPlanoLimites(empresa),
            this.getEmpresaUsage(realEmpresaId),
            HistorialPago.find({ empresa: realEmpresaId }).sort({ fechaPago: -1 }).limit(10).lean(),
            Plan.find({ activo: true }).sort({ precio: 1 }).lean()
        ]);

        return {
            empresa: {
                nombre: empresa.nombreEmpresa,
                planActual: empresa.planActual,
                estadoPlan: empresa.estadoPlan || 'activo',
                fechaPlanInicio: empresa.fechaPlanInicio,
                fechaPlanFinalizacion: empresa.fechaPlanFinalizacion
            },
            plan: limites,
            consumo: uso,
            pagos: pagos,
            planesDisponibles: todosLosPlanes
        };
    }

    /**
     * Obtiene un resumen detallado del plan y consumo para la vista de administración
     */
    async getResumenPlan(empresaId) {
        const empresa = await Empresa.findById(empresaId).lean();
        if (!empresa) return null;

        const [limites, uso] = await Promise.all([
            this.getPlanoLimites(empresa),
            this.getEmpresaUsage(empresaId)
        ]);

        return {
            nombrePlan: limites.nombre,
            slugPlan: limites.slug,
            estadoPlan: empresa.estadoPlan || 'activo',
            esActivo: this.isPlanActivo(empresa),
            fechaInicio: empresa.fechaPlanInicio,
            fechaVencimiento: empresa.fechaPlanFinalizacion,
            limites: {
                productos: {
                    usado: uso.productos,
                    limite: limites.productosLimite,
                    porcentaje: this.calculatePercent(uso.productos, limites.productosLimite),
                    esIlimitado: limites.productosLimite === 999999
                },
                usuarios: {
                    usado: uso.usuarios,
                    limite: limites.usuariosLimite,
                    porcentaje: this.calculatePercent(uso.usuarios, limites.usuariosLimite),
                    esIlimitado: limites.usuariosLimite === 999999
                },
                facturas: {
                    usado: uso.facturasAfipMes,
                    limite: limites.facturasMensualesLimite,
                    porcentaje: this.calculatePercent(uso.facturasAfipMes, limites.facturasMensualesLimite),
                    esIlimitado: limites.facturasMensualesLimite === 999999
                },
                tickets: {
                    usado: uso.ticketsMes,
                    limite: limites.ticketsMensualesLimite,
                    porcentaje: this.calculatePercent(uso.ticketsMes, limites.ticketsMensualesLimite),
                    esIlimitado: limites.ticketsMensualesLimite === 999999
                },
                notasPedido: {
                    usado: uso.notasPedidoMes,
                    limite: limites.notasPedidoMensualesLimite,
                    porcentaje: this.calculatePercent(uso.notasPedidoMes, limites.notasPedidoMensualesLimite),
                    esIlimitado: limites.notasPedidoMensualesLimite === 999999
                },
                puntosVenta: {
                    usado: uso.puntosVenta,
                    limite: limites.puntosVentaLimite,
                    porcentaje: this.calculatePercent(uso.puntosVenta, limites.puntosVentaLimite),
                    esIlimitado: limites.puntosVentaLimite === 999999
                },
                cajas: {
                    usado: uso.cajas,
                    limite: limites.cajasLimite,
                    porcentaje: this.calculatePercent(uso.cajas, limites.cajasLimite),
                    esIlimitado: limites.cajasLimite === 999999
                }
            },
            características: {
                exportXlsx: limites.exportXlsx,
                soportePrioritario: limites.soportePrioritario
            }
        };
    }

    calculatePercent(usado, limite) {
        if (!limite || limite === 999999) return 0;
        return Math.min(Math.round((usado / limite) * 100), 100);
    }

    /**
     * Verifica si una empresa puede realizar una acción
     */
    async puedoRealizarAccion(empresaId, accion) {
        const empresa = await Empresa.findById(empresaId).lean();

        if (!empresa) {
            return { permitido: false, razon: 'Empresa no encontrada' };
        }

        if (!this.isPlanActivo(empresa)) {
            return {
                permitido: false,
                razon: `Plan ${empresa.estadoPlan || 'inactivo'}. No se pueden realizar operaciones.`,
                estadoPlan: empresa.estadoPlan || 'inactivo'
            };
        }

        const limites = await this.getPlanoLimites(empresa);
        const uso = await this.getEmpresaUsage(empresaId);

        // Validaciones según la acción
        switch (accion) {
            case 'crear_producto':
                if (limites.productosLimite !== 999999 && uso.productos >= limites.productosLimite) {
                    return { permitido: false, razon: `Límite de productos alcanzado (${limites.productosLimite})` };
                }
                break;

            case 'crear_usuario':
                if (limites.usuariosLimite !== 999999 && uso.usuarios >= limites.usuariosLimite) {
                    return { permitido: false, razon: `Límite de usuarios alcanzado (${limites.usuariosLimite})` };
                }
                break;

            case 'emitir_factura_afip':
                if (limites.facturasMensualesLimite !== 999999 && uso.facturasAfipMes >= limites.facturasMensualesLimite) {
                    return { permitido: false, razon: `Límite de facturas AFIP alcanzado (${limites.facturasMensualesLimite})` };
                }
                break;

            case 'emitir_ticket':
                if (limites.ticketsMensualesLimite !== 999999 && uso.ticketsMes >= limites.ticketsMensualesLimite) {
                    return { permitido: false, razon: `Límite de tickets alcanzado (${limites.ticketsMensualesLimite})` };
                }
                break;

            case 'crear_nota_pedido':
                if (limites.notasPedidoMensualesLimite !== 999999 && uso.notasPedidoMes >= limites.notasPedidoMensualesLimite) {
                    return { permitido: false, razon: `Límite de notas de pedido alcanzado (${limites.notasPedidoMensualesLimite})` };
                }
                break;
            
            case 'crear_punto_venta':
                if (limites.puntosVentaLimite !== 999999 && uso.puntosVenta >= limites.puntosVentaLimite) {
                    return { permitido: false, razon: `Límite de puntos de venta alcanzado (${limites.puntosVentaLimite})` };
                }
                break;
            
            case 'crear_caja':
                if (limites.cajasLimite !== 999999 && uso.cajas >= limites.cajasLimite) {
                    return { permitido: false, razon: `Límite de cajas alcanzado (${limites.cajasLimite})` };
                }
                break;
            
            case 'exportar_xlsx':
                if (!limites.exportXlsx) {
                    return { permitido: false, razon: 'Tu plan no permite exportar a Excel' };
                }
                break;
        }

        return { permitido: true };
    }
}

export default new PlanValidationService();
