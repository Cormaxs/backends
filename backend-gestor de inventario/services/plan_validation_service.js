import PLANES from '../config/planes.js';
import { Empresa, Product, User, Ticket, PuntoDeVenta, Caja } from '../models/index.js';

class PlanValidationService {
    /**
     * Obtiene los límites del plan de una empresa
     */
    getPlanoLimites(nombrePlan) {
        if (!PLANES[nombrePlan]) {
            return PLANES.free;
        }
        return PLANES[nombrePlan];
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
     * Obtiene el uso actual de la empresa
     */
    async getEmpresaUsage(empresaId) {
        const [productCount, userCount, facturaCount, pdvCount, cajaCount] = await Promise.all([
            Product.countDocuments({ empresa: empresaId }),
            User.countDocuments({ empresa: empresaId }),
            Ticket.countDocuments({ idEmpresa: empresaId }),
            PuntoDeVenta.countDocuments({ empresa: empresaId }),
            Caja.countDocuments({ empresa: empresaId })
        ]);

        return {
            productos: productCount,
            usuarios: userCount,
            facturas: facturaCount,
            puntosVenta: pdvCount,
            cajas: cajaCount
        };
    }

    /**
     * Verifica si una empresa puede realizar una acción
     * @param {string} empresaId - ID de la empresa
     * @param {string} accion - Tipo de acción: 'crear_producto', 'crear_usuario', 'crear_factura', etc.
     */
    async puedoRealizarAccion(empresaId, accion) {
        const empresa = await Empresa.findById(empresaId).lean();

        if (!empresa) {
            return {
                permitido: false,
                razon: 'Empresa no encontrada'
            };
        }

        // Verificar si el plan está activo
        if (!this.isPlanActivo(empresa)) {
            return {
                permitido: false,
                razon: `Plan ${empresa.estadoPlan}. No se pueden realizar operaciones.`,
                estadoPlan: empresa.estadoPlan
            };
        }

        const limites = this.getPlanoLimites(empresa.planActual);
        const uso = await this.getEmpresaUsage(empresaId);

        // Validaciones según la acción
        switch (accion) {
            case 'crear_producto':
                if (uso.productos >= limites.productosLimite) {
                    return {
                        permitido: false,
                        razon: `Límite de productos alcanzado (${limites.productosLimite})`,
                        tipo: 'limite_alcanzado'
                    };
                }
                break;

            case 'crear_usuario':
                if (uso.usuarios >= limites.usuariosLimite) {
                    return {
                        permitido: false,
                        razon: `Límite de usuarios alcanzado (${limites.usuariosLimite})`,
                        tipo: 'limite_alcanzado'
                    };
                }
                break;

            case 'crear_factura':
            case 'crear_ticket':
                if (uso.facturas >= limites.facturasMenu) {
                    return {
                        permitido: false,
                        razon: `Límite de facturas/mes alcanzado (${limites.facturasMenu})`,
                        tipo: 'limite_alcanzado'
                    };
                }
                break;

            case 'crear_punto_venta':
                if (uso.puntosVenta >= limites.puntosVentaLimite) {
                    return {
                        permitido: false,
                        razon: `Límite de puntos de venta alcanzado (${limites.puntosVentaLimite})`,
                        tipo: 'limite_alcanzado'
                    };
                }
                break;

            case 'crear_caja':
                if (uso.cajas >= limites.cajasLimite) {
                    return {
                        permitido: false,
                        razon: `Límite de cajas alcanzado (${limites.cajasLimite})`,
                        tipo: 'limite_alcanzado'
                    };
                }
                break;

            case 'exportar_xlsx':
                if (!limites.exportXlsx) {
                    return {
                        permitido: false,
                        razon: 'Tu plan no permite exportar a Excel',
                        tipo: 'feature_no_disponible'
                    };
                }
                break;

            default:
                break;
        }

        return {
            permitido: true,
            razon: 'Acción permitida'
        };
    }

    /**
     * Obtiene un resumen del uso vs límites de la empresa
     */
    async getResumenPlan(empresaId) {
        const empresa = await Empresa.findById(empresaId).lean();

        if (!empresa) return null;

        const limites = this.getPlanoLimites(empresa.planActual);
        const uso = await this.getEmpresaUsage(empresaId);

        const calcularPorcentaje = (actual, limite) => {
            if (limite >= 999999) return 100; // Ilimitado
            return Math.round((actual / limite) * 100);
        };

        return {
            plan: empresa.planActual,
            nombrePlan: limites.nombre,
            estadoPlan: empresa.estadoPlan,
            fechaInicio: empresa.fechaPlanInicio,
            fechaVencimiento: empresa.fechaPlanFinalizacion,
            esActivo: this.isPlanActivo(empresa),
            limites: {
                productos: {
                    usado: uso.productos,
                    limite: limites.productosLimite,
                    porcentaje: calcularPorcentaje(uso.productos, limites.productosLimite),
                    esIlimitado: limites.productosLimite >= 999999
                },
                usuarios: {
                    usado: uso.usuarios,
                    limite: limites.usuariosLimite,
                    porcentaje: calcularPorcentaje(uso.usuarios, limites.usuariosLimite),
                    esIlimitado: limites.usuariosLimite >= 999999
                },
                facturas: {
                    usado: uso.facturas,
                    limite: limites.facturasMenu,
                    porcentaje: calcularPorcentaje(uso.facturas, limites.facturasMenu),
                    esIlimitado: limites.facturasMenu >= 999999
                },
                puntosVenta: {
                    usado: uso.puntosVenta,
                    limite: limites.puntosVentaLimite,
                    porcentaje: calcularPorcentaje(uso.puntosVenta, limites.puntosVentaLimite),
                    esIlimitado: limites.puntosVentaLimite >= 999999
                },
                cajas: {
                    usado: uso.cajas,
                    limite: limites.cajasLimite,
                    porcentaje: calcularPorcentaje(uso.cajas, limites.cajasLimite),
                    esIlimitado: limites.cajasLimite >= 999999
                }
            },
            características: {
                exportXlsx: limites.exportXlsx,
                soportePrioritario: limites.soportePrioritario
            }
        };
    }
}

export default new PlanValidationService();
