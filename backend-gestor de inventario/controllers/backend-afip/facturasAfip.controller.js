import FacturasAfipService from '../../services/backend-afip/facturasAfip.service.js';
import { createSaleTicket } from '../../services/ticket_services.js';
import { Empresa, User } from '../../models/index.js';

const facturasAfipService = new FacturasAfipService();

function buildFacturaTicketData({ empresaId, factura }) {
    const items = Array.isArray(factura.items)
        ? factura.items.map(item => ({
            idProduct: item.idProduct || item._id || null,
            codigo: item.codigo || item.idProduct || item.codigoInterno || 'SIN-CODIGO',
            descripcion: item.descripcion || item.nombre || 'Sin descripción',
            cantidad: Number(item.cantidad || 0),
            precioUnitario: Number(item.precioUnitario || item.precio || 0),
            totalItem: Number(item.totalItem || item.subtotal || ((Number(item.precioUnitario || item.precio || 0) * Number(item.cantidad || 0))))
        }))
        : [];

    // Determine ticket fechaHora: prefer explicit ISO fechaHora, fall back to YYYYMMDD or generic parse
    let fechaHoraValue = new Date();
    if (factura.fechaHora) {
        const parsed = new Date(factura.fechaHora);
        if (!isNaN(parsed.getTime())) fechaHoraValue = parsed;
    } else if (factura.fecha && /^\d{8}$/.test(String(factura.fecha))) {
        // factura.fecha in YYYYMMDD
        const y = Number(factura.fecha.slice(0, 4));
        const m = Number(factura.fecha.slice(4, 6));
        const d = Number(factura.fecha.slice(6, 8));
        fechaHoraValue = new Date(Date.UTC(y, m - 1, d));
    } else if (factura.fecha) {
        const parsed = new Date(factura.fecha);
        if (!isNaN(parsed.getTime())) fechaHoraValue = parsed;
    }

    return {
        idEmpresa: empresaId,
        puntoDeVenta: String(factura.puntoDeVenta || '1'),
        ventaId: factura.numeroFactura ? `AFIP-${factura.puntoDeVenta || '00'}-${factura.numeroFactura}` : `AFIP-${Date.now()}`,
        fechaHora: fechaHoraValue,
        tipoComprobante: String(factura.tipoComprobante || 'FACTURA'),
        numeroComprobante: factura.numeroFactura || '',
        items,
        totales: {
            subtotal: Number(factura.importeNeto || factura.subtotal || 0),
            descuento: Number(factura.descuento || 0),
            totalPagar: Number(factura.importeTotal || 0)
        },
        pago: {
            metodo: factura.formaPago || 'AFIP',
            montoRecibido: Number(factura.importeTotal || 0),
            cambio: 0
        },
        cliente: {
            nombre: factura.cliente?.nombre || factura.cliente?.nombreReceptor || '',
            dniCuit: String(factura.docNro || factura.cliente?.dniCuit || ''),
            condicionIVA: factura.condicionIVAReceptor || ''
        },
        observaciones: factura.observaciones || '',
        cajero: factura.cajero || '',
        transaccionId: factura.transaccionId || '',
        sucursal: factura.sucursal || '',
        pdfPath: ''
    };
}


export default class FacturasAfip{

    async emitirFacturas(req, res) {
        
        try{
            //pasar todos los datos completos al otro backend
                    const {id, cuit, servicio, factura, idEmpresa, cajaId, userId} = req.body;

                        const resultado = await facturasAfipService.emitirFacturas(id, cuit, servicio, factura, idEmpresa);

                        if (idEmpresa) {
                            const ticketData = buildFacturaTicketData({ empresaId: idEmpresa, factura });
                            const cajaReference = cajaId || factura.cajaId || null;
                            const realUserId = userId || req.user?._id || null;
                            
                            await createSaleTicket({
                                idEmpresa,
                                puntoDeVenta: ticketData.puntoDeVenta,
                                ticketData,
                                cajaId: cajaReference,
                                stockUpdate: true,
                                registrarCaja: !!cajaReference,
                                source: 'AFIP',
                                estadoFactura: 'Aprobada',
                                idDbAfip: id, // El id del cuerpo es el idDbAfip
                                userId: realUserId
                            });
                        }
            //guardar el _id devuelto para tener los datos fiscales, guardar en propietario la referencia l id
          // Configurar headers para devolver el PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=factura.pdf');
        res.send(resultado); // envía el buffer directamente
        } catch (error) {
            console.error("error pasado a controller", error);
            const status = error.status || error.response?.status || 500;
            const response = {
                success: false,
                message: error.message || 'Error al emitir la factura'
            };
            if (error.erroresAfip) {
                response.errores = error.erroresAfip;
            } else if (error.response?.data?.errores) {
                response.errores = error.response.data.errores;
            }
            if (error.observacionesAfip) {
                response.observaciones = error.observacionesAfip;
            } else if (error.response?.data?.observaciones) {
                response.observaciones = error.response.data.observaciones;
            }
            res.status(status).json(response);
        }
    }



    async recuperar(req, res) {
        
        try{
            //pasar todos los datos completos al otro backend
         
            const {idFactura} = req.params;
            const resultado = await facturasAfipService.recuperar(idFactura);
            //guardar el _id devuelto para tener los datos fiscales, guardar en propietario la referencia l id
          // Configurar headers para devolver el PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=factura.pdf');
        res.send(resultado); // envía el buffer directamente
        }catch(error){
            console.error(error);
            res.status(500).json({message: "Error al generar las credenciales"});
        }
    }


    async reintentar(req, res) {
        try {
            const { id, cuit, servicio } = req.body;
            const { factura } = req.params;
            const resultado = await facturasAfipService.reintentar(id, cuit, servicio, factura);
            res.json(resultado);
        } catch (error) {
            console.error('Error en reintentar factura:', error);
            const status = error.response?.status || 500;
            const response = error.response?.data || {
                success: false,
                message: error.message || 'Error al reintentar la factura'
            };
            res.status(status).json(response);
        }
    }


    async buscar(req, res) {
        try {
            const { estado, tipoComprobante, desde, hasta, numero, puntoVenta, cuitReceptor, cae, page, limit, idEmpresa } = req.query;
            let { userId } = req.query;

            // Si se proporciona idEmpresa, intentamos resolver el ID de AFIP (idDbAfip)
            // Esto es crucial porque el backend de AFIP usa su propio ID de usuario para buscar facturas antiguas
            // que podrían no tener el campo idEmpresa guardado.
            if (idEmpresa && !userId) {
                // 1. Intentar obtenerlo de la Empresa
                const empresa = await Empresa.findById(idEmpresa);
                if (empresa && empresa.idDbAfip) {
                    userId = empresa.idDbAfip;
                } else {
                    // 2. Intentar obtenerlo del usuario administrador de esa empresa
                    const user = await User.findOne({ empresa: idEmpresa, idDbAfip: { $exists: true, $ne: null } });
                    if (user) {
                        userId = user.idDbAfip;
                    }
                }
            }
            
            // Validar que al menos uno de los dos esté presente
            if (!userId && !idEmpresa) {
                return res.status(400).json({ 
                    success: false, 
                    message: "userId o idEmpresa es requerido" 
                });
            }

            const filtros = {
                userId,
                idEmpresa,
                estado,
                tipoComprobante,
                desde,
                hasta,
                numero,
                puntoVenta,
                cuitReceptor,
                cae,
                page,
                limit
            };

            // Limpiar filtros indefinidos o vacíos
            Object.keys(filtros).forEach(key => {
                if (filtros[key] === undefined || filtros[key] === "" || filtros[key] === null) {
                    delete filtros[key];
                }
            });

            const resultado = await facturasAfipService.buscar(filtros);
            res.json(resultado);
        } catch (error) {
            console.error("Error en buscar facturas:", error);
            res.status(500).json({ 
                success: false,
                message: error.message || "Error al buscar facturas" 
            });
        }
    }


    async recCae(req, res) {
        
        try{
            //pasar todos los datos completos al otro backend
          const {id, cuit, servicio, factura, puntoVenta, tipoComprobante, numeroFactura} = req.body;

            const resultado = await facturasAfipService.recCae(id, cuit, servicio, factura, puntoVenta, tipoComprobante, numeroFactura);
            //guardar el _id devuelto para tener los datos fiscales, guardar en propietario la referencia l id
          // Configurar headers para devolver el PDF
       
        res.json(resultado); // envía el buffer directamente
        }catch(error){
            console.error(error);
            res.status(500).json({message: "Error al generar las credenciales"});
        }
    }


    async anular(req, res) {
        
        try{
            //pasar todos los datos completos al otro backend
          const {id, cuit, servicio, facturaOriginal} = req.body;

            const resultado = await facturasAfipService.anular(id, cuit, servicio, facturaOriginal);
            //guardar el _id devuelto para tener los datos fiscales, guardar en propietario la referencia l id
          // Configurar headers para devolver el PDF
    
        res.json(resultado); // envía el buffer directamente
        }catch(error){
            console.error(error);
            res.status(500).json({message: "Error al generar las credenciales"});
        }
    }
}
