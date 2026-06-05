import mongoose from 'mongoose';
import {Caja, Ticket} from "../models/index.js";
import {User} from "../models/index.js";

class CajaRepository{

    async findById(cajaId) {
        return await Caja.findById(cajaId).exec();
    }

    async findOpenCaja(idEmpresa, idPuntoVenta) {
        try {
            // Validar idEmpresa antes de intentar convertirlo
            if (!idEmpresa) return null;
            
            const query = {
                empresa: mongoose.Types.ObjectId.isValid(idEmpresa) ? new mongoose.Types.ObjectId(idEmpresa) : idEmpresa,
                estado: 'Abierta'
            };

            if (idPuntoVenta) {
                if (mongoose.Types.ObjectId.isValid(idPuntoVenta)) {
                    query.puntoDeVenta = new mongoose.Types.ObjectId(idPuntoVenta);
                } else {
                    // Si el punto de venta es un número o string no-ObjectId (ej: "1" o "Nombre Punto")
                    const { PuntoDeVenta } = await import('../models/index.js');
                    
                    const numPunto = Number(idPuntoVenta);
                    let punto;

                    if (!isNaN(numPunto)) {
                        punto = await PuntoDeVenta.findOne({
                            empresa: query.empresa,
                            numero: numPunto
                        });
                    }

                    // Si no se encontró por número (o no era un número), intentar por nombre
                    if (!punto) {
                        punto = await PuntoDeVenta.findOne({
                            empresa: query.empresa,
                            nombre: String(idPuntoVenta)
                        });
                    }

                    if (punto) {
                        query.puntoDeVenta = punto._id;
                    } else {
                        // Si no encontramos el punto de venta, el filtro fallará
                        // lo cual es correcto ya que no habría una caja abierta para ese punto.
                        return null;
                    }
                }
            }

            return await Caja.findOne(query).sort({ fechaApertura: -1 }).exec();
        } catch (error) {
            console.error("Error en findOpenCaja:", error);
            return null;
        }
    }

    async getResumenCaja(cajaId) {
        const caja = await Caja.findById(cajaId);
        if (!caja) throw new Error('Caja no encontrada');

        const companyId = new mongoose.Types.ObjectId(caja.empresa);
        const cajaObjectId = new mongoose.Types.ObjectId(cajaId);

        // Agregación para obtener ventas por método de pago
        const ventasPorMetodo = await Ticket.aggregate([
            { 
                $match: { 
                    $or: [
                        { cajaId: cajaObjectId },
                        { cajaId: cajaId } // Por si acaso se guardó como string
                    ],
                    idEmpresa: companyId, 
                    estadoFactura: 'Aprobada' 
                } 
            },
            {
                $group: {
                    _id: "$pago.metodo",
                    total: { $sum: "$totales.totalPagar" },
                    cantidad: { $sum: 1 }
                }
            }
        ]);

        const resumenMetodos = ventasPorMetodo.reduce((acc, curr) => {
            // Normalizar el nombre del método para consistencia
            const metodoRaw = curr._id || 'Otros';
            acc[metodoRaw] = {
                total: curr.total,
                cantidad: curr.cantidad
            };
            return acc;
        }, {});

        const ingresosManuales = caja.transacciones
            .filter(t => t.tipo === 'ingreso')
            .reduce((sum, t) => sum + t.monto, 0);

        const egresosManuales = caja.transacciones
            .filter(t => t.tipo === 'egreso')
            .reduce((sum, t) => sum + t.monto, 0);

        // Mapeo exacto según AFIP_FORMAS_PAGO
        const efectivoVentas = resumenMetodos['Contado']?.total || 0;
        
        // Sumar todos los que no son efectivo
        const totalVentas = Object.values(resumenMetodos).reduce((sum, m) => sum + m.total, 0);

        // Obtener el listado detallado de tickets/ventas para esta caja
        const historialVentas = await Ticket.find({ 
            $or: [
                { cajaId: cajaObjectId },
                { cajaId: cajaId }
            ],
            idEmpresa: companyId, 
            estadoFactura: 'Aprobada' 
        }).sort({ fechaHora: -1 }).lean();

        return {
            montoInicial: caja.montoInicial,
            ventas: {
                total: totalVentas,
                detallePorMetodo: resumenMetodos, // Enviamos el objeto completo para que el front lo itere
                historial: historialVentas // Lista de ventas con sus items
            },
            movimientosManuales: {
                ingresos: ingresosManuales,
                egresos: egresosManuales,
                detalle: caja.transacciones // Agregamos el detalle de transacciones manuales
            },
            totales: {
                ingresosTotales: caja.montoInicial + totalVentas + ingresosManuales,
                egresosTotales: egresosManuales,
                saldoEfectivoEsperado: caja.montoInicial + efectivoVentas + ingresosManuales - egresosManuales,
                montoFinalEsperado: caja.montoInicial + totalVentas + ingresosManuales - egresosManuales
            }
        };
    }

    async findByIdEmpresa(empresaId, options = {}) {
        // 1. Desestructurar opciones (se añade 'estado')
        const {
            page = 1,
            limit = 10,
            sortBy,
            order,
            puntoVenta,
            vendedor,
            fechaDesde,
            fechaHasta,
            estado, // <-- AÑADIDO: puede ser 'abierta', 'cerrada' o undefined/null para 'todas'
            search // <-- Nuevo campo de búsqueda general
        } = options;
    
        // 2. Construir la consulta base
        const query = { empresa: new mongoose.Types.ObjectId(empresaId) };
    
        try {
            // 3. Añadir filtros a la consulta dinámicamente
    
            // --- Filtro de búsqueda general ---
            if (search) {
                query.$or = [
                    { nombreCaja: new RegExp(search, 'i') },
                    { observacionesCierre: new RegExp(search, 'i') }
                ];
            }
    
            // --- Filtro por Vendedor (búsqueda por nombre) ---
            if (vendedor) {
                const vendedorIds = await User.find({
                    nombre: new RegExp(vendedor, 'i')
                }).select('_id');
                
                if (vendedorIds.length > 0) {
                    query.vendedorAsignado = { $in: vendedorIds.map(u => u._id) };
                } else {
                    return { cajas: [], pagination: { totalDocs: 0, totalPages: 0, currentPage: 1 } };
                }
            }
    
            // --- Filtro por Punto de Venta ---
            if (puntoVenta) {
                query.puntoDeVenta = puntoVenta;
            }
    
            // --- Filtro por Estado (Abierta / Cerrada) ---  // <-- SECCIÓN AÑADIDA
            if (estado) {
                if (estado === 'abierta') {
                    // Si la caja está abierta, 'fechaCierre' no debe existir.
                    query.fechaCierre = { $exists: false };
                } else if (estado === 'cerrada') {
                    // Si la caja está cerrada, 'fechaCierre' debe existir.
                    query.fechaCierre = { $exists: true };
                }
                // Si 'estado' es cualquier otro valor ('todas', etc.), no se aplica este filtro.
            }
    
            // --- Filtro por Rango de Fechas ---
            const dateFilter = {};
            if (fechaDesde) {
                dateFilter.$gte = new Date(fechaDesde);
            }
            if (fechaHasta) {
                const endDate = new Date(fechaHasta);
                endDate.setUTCHours(23, 59, 59, 999);
                dateFilter.$lte = endDate;
            }
    
            if (Object.keys(dateFilter).length > 0) {
                query.fechaApertura = dateFilter;
            }
    
            // 4. Ejecutar la consulta con paginación, orden y 'populate'
            const totalDocs = await Caja.countDocuments(query);
            const totalPages = Math.ceil(totalDocs / limit);
            
            let cajasQuery = Caja.find(query)
                .populate('puntoDeVenta', 'nombre')
                .populate('vendedorAsignado', 'nombre')
                .sort({ [sortBy || 'fechaApertura']: order === 'asc' ? 1 : -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit));

            const cajas = await cajasQuery.lean().exec();

            return { 
                cajas, 
                pagination: { 
                    totalDocs, 
                    totalPages, 
                    currentPage: parseInt(page),
                    limit: parseInt(limit)
                } 
            };
        } catch (error) {
            console.error("Error en findByIdEmpresa:", error);
            throw error;
        }
    }


    async abrirCaja(datos){
        const { empresa, puntoDeVenta, vendedorAsignado, montoInicial, fechaApertura, nombreCaja } = datos;
        try {
            // Crear una nueva instancia del modelo Caja
            const nuevaCaja = new Caja({
                empresa,
                puntoDeVenta,
                vendedorAsignado,
                montoInicial,
                nombreCaja,
                fechaApertura: fechaApertura || Date.now(), // Si no se proporciona, se usa la fecha actual
                // fechaApertura se establecerá por defecto con Date.now() en el esquema
                // estado se establecerá por defecto como 'Abierta' en el esquema
                // ingresos, egresos, montoFinalEsperado, diferencia, transacciones comenzarán en 0 o vacíos
            });
    
            // Guardar la nueva caja en la base de datos
            const cajaGuardada = await nuevaCaja.save();
    
            return cajaGuardada;
    
        } catch (error) {
            console.error("Error al abrir la caja:", error.message);
            // Puedes lanzar el error original o uno más específico
            throw new Error(`No se pudo abrir la caja: ${error.message}`);
        }
    }


    async cerrarCaja(cajaId, datosCierre) {
        const { montoFinalReal, observacionesCierre, ingresos, egresos } = datosCierre;
        try {
            // 3. Buscar la caja por ID y asegurar que esté abierta
            const caja = await Caja.findById(cajaId);
    
            if (!caja) {
                throw new Error('Caja no encontrada.');
            }
    
            if (caja.estado === 'Cerrada') {
                throw new Error('La caja ya se encuentra cerrada.');
            }
    
            // 5. Calcular el monto final esperado
            caja.montoFinalEsperado = caja.montoInicial + caja.ingresos - caja.egresos;
    
            // 6. Asignar el monto final real y calcular la diferencia
            caja.montoFinalReal = montoFinalReal;
            caja.diferencia = caja.montoFinalReal - caja.montoFinalEsperado;
    
            // 7. Establecer la fecha y el estado de cierre
            caja.fechaCierre = new Date(); // Establece la fecha y hora de cierre actuales
            caja.estado = 'Cerrada';
    
            // 8. Añadir observaciones si existen
            if (observacionesCierre) {
                caja.observacionesCierre = observacionesCierre;
            }
    
            // 9. Guardar los cambios en la base de datos
            const cajaCerrada = await caja.save();
    
            return cajaCerrada;
    
        } catch (error) {
            console.error(`Error al cerrar la caja ${cajaId}:`, error.message);
            throw new Error(`No se pudo cerrar la caja: ${error.message}`);
        }
    }


    async agregarTransaccion(cajaId, transaccionData) {
        const { tipo, monto, descripcion, referencia } = transaccionData;

        if (!['ingreso', 'egreso'].includes(tipo)) {
            throw new Error('Tipo de transacción inválido. Debe ser "ingreso" o "egreso".');
        }
        try {
            const caja = await Caja.findById(cajaId);

            if (!caja) {
                throw new Error('Caja no encontrada.');
            }
            if (caja.estado === 'Cerrada') {
                throw new Error('No se pueden agregar transacciones a una caja cerrada.');
            }

            const nuevaTransaccion = {
                tipo,
                monto,
                descripcion,
                fecha: new Date(), // Fecha actual para la transacción
                ...(referencia && { referencia: new mongoose.Types.ObjectId(referencia) }) // Agrega referencia si existe
            };

            caja.transacciones.push(nuevaTransaccion);

            // Actualizar los totales de ingresos/egresos de la caja principal
            if (tipo === 'ingreso') {
                caja.ingresos += monto;
            } else if (tipo === 'egreso') {
                caja.egresos += monto;
            }

            // Opcional: Puedes optar por recalcular montoFinalEsperado aquí,
            // o solo al final del cierre. Depende de si quieres que ese campo
            // refleje el estado actual en tiempo real o solo al finalizar.
            // caja.montoFinalEsperado = caja.montoInicial + caja.ingresos - caja.egresos;

            return await caja.save();

        } catch (error) {
            console.error(`Error en CajaRepository.agregarTransaccion (${cajaId}):`, error.message);
            throw new Error(`Error al agregar transacción: ${error.message}`);
        }
    }
}

export default new CajaRepository();
