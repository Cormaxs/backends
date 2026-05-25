import { AfipService } from '../../services/certificados/certificados.service.js';
import FacturaPdfPreparerService from '../../services/facturas/facturaPdfPreparer.service.js';
import FacturaValidatorService from '../../services/facturas/facturaValidator.service.js';
import {FacturacionService} from '../../services/facturas/facturacion.service.js';
import { AnulacionService } from '../../services/facturas/anulacion.service.js';
import {DataUser} from '../../services/user-data/userData.service.js';
import {FacturaRepository} from '../../repositories/afip/factura.repository.js';
import QRService from '../../services/QRService.js';
import { Factura } from '../../models/factura.model.js';
import mongoose from 'mongoose';


import {TIPO_A_CAMPO} from '../../utils/mapeos/variables-globales.js';

function mapTipoComprobanteLabel(tipo) {
  const raw = tipo == null ? '' : String(tipo).trim();
  const numeric = Number(raw);
  if (!raw) return 'Desconocido';
  if (/(^TICKET$|^RECIBO$|^BOLETA$|^TICKET)/i.test(raw)) return 'Ticket';
  if (/FACTURA\s*A/i.test(raw) || [1, 2, 3].includes(numeric)) return 'Factura A';
  if (/FACTURA\s*B/i.test(raw) || [6, 7, 8].includes(numeric)) return 'Factura B';
  if (/FACTURA\s*C/i.test(raw) || [11, 13, 14].includes(numeric)) return 'Factura C';
  return raw;
}

const qrService = new QRService();
const dataUser = new DataUser();
const facturaRepository = new FacturaRepository();
const anulacionService = new AnulacionService();
const facturacionService = new FacturacionService();
const afipService = new AfipService();

export class FacturasController{
    



  async anularFactura(req, res) {
    try {
      const { id, cuit, facturaOriginal } = req.body;
      console.log("ingreso a anular -> ", req.body)
      if (!facturaOriginal || !facturaOriginal.numero) {
        return res.status(400).json({ success: false, message: 'Faltan datos de la factura original' });
      }
  
      // 1. Mapear tipo de comprobante original al campo de nota de crédito en el contador
     
      const campoNC = TIPO_A_CAMPO[facturaOriginal.tipoComprobante];
      if (!campoNC) {
        return res.status(400).json({ success: false, message: 'Tipo de comprobante no soportado para anulación' });
      }
  
      // 2. Obtener próximo número de nota de crédito de forma atómica desde el contador local
      //    Esto incrementa el contador y devuelve el nuevo número.
      const nuevoNumeroNC = await dataUser.incrementarContador(
        id,
        facturaOriginal.puntoVenta,
        campoNC
      );
  
      // 3. Agregar el número a la factura original para que el servicio de anulación lo use
      facturaOriginal.numeroNotaCredito = nuevoNumeroNC;
  
      // 4. Obtener Token y Sign vigentes desde AFIP
      const auth = await afipService.obtenerTicketAcceso(id, cuit, 'wsfe');
  
      // 5. Ejecutar anulación, pasando la factura original (que ahora incluye el número de NC)
      const resultado = await anulacionService.anularFacturaTotal(
        auth.token,
        auth.sign,
        auth.cuit,
        facturaOriginal,  // ← contiene numeroNotaCredito
        id
      );
  
      if (resultado.success) {
        return res.status(200).json(resultado);
      } else {
        return res.status(400).json(resultado);
      }
    } catch (error) {
      console.error('❌ Error en anulación:', error);
      res.status(500).json({
        success: false,
        message: 'Error procesando la anulación',
        error: error.message
      });
    }
  }
  
  
    // En afip.controller.js
    crearFacturaElectronica = async (req, res) => {
      try {
        const { id, cuit, factura } = req.body;
        const datosUser = await dataUser.obtenerEmpresaUserId(id);
        const token = req.token;
        //console.log("entro a controllers para generar facturta")
        //valida los ivas segun el tipo de usuario, y los datos correctos para que afip lo acepte
      // console.log("datos de usuario -> ", datosUser)
        // Mapear tipo de comprobante al campo del contador
  
    const tipoCampo = TIPO_A_CAMPO[factura.tipoComprobante];
    if (!tipoCampo) {
      return res.status(400).json({ success: false, message: 'Tipo de comprobante no soportado para numeración' });
    }

    // Obtener próximo número de forma atómica
    const nuevoNumero = await dataUser.incrementarContador(
      id,
      factura.puntoVenta,
      tipoCampo
    );

    // Asignar el número a la factura
    factura.numeroFactura = nuevoNumero;

       const facturaValidada = FacturaValidatorService.procesarFactura(factura, datosUser);
       
       //console.log("factura validada.factura -> ", facturaValidada.factura)
       //guardar en db
       const guardada = await facturaRepository.guardarFactura(facturaValidada.factura, id);
        //mando a afip
        const resultado = await facturacionService.crearFactura(
          token.token,
          token.sign,
          cuit,
          facturaValidada.factura,
          datosUser.data
        );

        //genero el qr64
        const QrAfip = await qrService.generar(factura,resultado, cuit );

        //actualizo en db con los datos dados por afip, basicamente agrego los datos como cae, etc
        await facturaRepository.actualizarFacturaConAfip(guardada._id, resultado, QrAfip);
        
        if (resultado.resultado === 'A') {
          // USAR EL PREPARER SERVICE PARA GENERAR EL PDF CON LOS DATOS VALIDOS Y LOS DATOS DE AFIP
          const pdfBuffer = await FacturaPdfPreparerService.generarPDF(
            facturaValidada.factura,     // datos del frontend
            resultado,   // resultado de AFIP
            cuit,        // cuit del emisor
            id,           // id del usuario
            datosUser,
            QrAfip           // datos fiscales del usuario para el PDF
          );
    
          // Enviar PDF al cliente
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename=factura-${resultado.numero}.pdf`);
          res.send(pdfBuffer);
    
        } else {
          console.log('❌ Factura rechazada:', resultado.errores);
          res.status(400).json({
            success: false,
            message: '❌ Factura rechazada',
            errores: resultado.errores,
            observaciones: resultado.observaciones
          });
        }
        
      } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    };

//Regenerar el pdf con solo el id de factura -> devuelve buffer pdf
   async GenerarNuevaFacturaPDf(req, res) {
    try {
      const { facturaId } = req.params;
      console.log("id factura ->", facturaId)
      //recupera los datos ya formateados
      const datos = await facturaRepository.generarPDFDesdeFactura(facturaId);
      //manda al mismo de generar factura en pdf
     // console.log("datos antes de generar PDF -> controllers", datos)
      const pdfBuffer = await FacturaPdfPreparerService.generarPDF(
        datos.facturaParaPDF,
        datos.resultadoAfip,
        datos.cuit,
        datos.userId,
        datos.datosUser,
        datos.qrBase64
      );
  
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=factura-${facturaId}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('❌ Error regenerando PDF:', error);
      res.status(500).json({ error: error.message });
    }
  }
    

  async reintentarFactura(req, res) {
    try {
      const { idFactura } = req.params;
      const { id, cuit } = req.body;
  
      const facturaRecuperada = await facturaRepository.buscarFacturaPorId(idFactura);
      if (!facturaRecuperada) {
        return res.status(404).json({ success: false, message: 'Factura no encontrada' });
      }
  
      if (facturaRecuperada.estado === 'APROBADA') {
        return res.status(400).json({ success: false, message: 'La factura ya está aprobada' });
      }
  
      // 1. Formatear sin número y con fecha actual
      let facturaParaAFIP = facturacionService.formatearFacturaParaReintento(facturaRecuperada);
  
      // 2. Obtener datos del usuario
      const datosUser = await dataUser.obtenerEmpresaUserId(id);
  
      // 3. Si la factura estaba RECHAZADA, obtenemos un nuevo número
      if (facturaRecuperada.estado === 'RECHAZADA') {
        
        const tipoCampo = TIPO_A_CAMPO[facturaRecuperada.afip.tipoComprobante];
        if (!tipoCampo) {
          return res.status(400).json({ success: false, message: 'Tipo de comprobante no soportado para numeración' });
        }
  
        const nuevoNumero = await dataUser.incrementarContador(
          id,
          facturaRecuperada.afip.puntoVenta,
          tipoCampo
        );
  
        facturaParaAFIP.numeroFactura = nuevoNumero;
      }
      // Si está PENDIENTE, no se envía número (AFIP asignará el próximo)
  
      // 4. Validar la factura (validador puro, no debe modificar números)
      const validado = FacturaValidatorService.procesarFactura(facturaParaAFIP, datosUser.data);
      if (!validado.valida) {
        return res.status(400).json({ success: false, message: 'Datos inválidos', errores: validado.errors });
      }
      facturaParaAFIP = validado.factura;
  
      // 5. Obtener token
      const token = req.token;
  
      // 6. Enviar a AFIP
      const resultado = await facturacionService.crearFactura(
        token.token,
        token.sign,
        cuit,
        facturaParaAFIP,
        datosUser.data
      );
  
      // 7. Actualizar BD
      if (resultado.success) {
        const qrBase64 = await qrService.generar(facturaParaAFIP, resultado, cuit);
        await facturaRepository.actualizarFacturaConAfip(facturaRecuperada._id, resultado, qrBase64);
      } else {
        await facturaRepository.actualizarFacturaConAfip(facturaRecuperada._id, resultado);
      }
  
      if (resultado.success) {
        res.json({ success: true, message: 'Factura aprobada', data: resultado });
      } else {
        res.status(400).json({ success: false, message: 'Rechazada', errores: resultado.errores });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: error.message });
    }
  }



  async buscarFacturas(req, res) {
    try {
      // Idealmente el userId viene del token de autenticación
      // Por ahora lo tomamos de req.query, pero deberías validar que coincida con el usuario autenticado
      const { estado, tipoComprobante, desde, hasta, numero, puntoVenta, cuitReceptor, cae, page, limit, userId } = req.query;
  
      if (!userId) {
        return res.status(400).json({ success: false, message: 'userId es requerido' });
      }
  
      const filtros = {
        userId,
        estado,
        tipoComprobante,
        desde,
        hasta,
        numero,
        puntoVenta,
        cuitReceptor,
        cae
      };
  
      const paginacion = { page, limit };
  
      const resultado = await facturaRepository.buscarFacturas(filtros, paginacion);
  
      res.json({
        success: true,
        data: resultado.facturas,
        paginacion: resultado.paginacion
      });
    } catch (error) {
      console.error('Error en buscarFacturas:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async financialSummary(req, res) {
    try {
      const { userId } = req.params;
      const { start, end, granularity, puntoVenta } = req.query;

      if (!userId) {
        return res.status(400).json({ success: false, message: 'userId es requerido' });
      }

      const companyId = mongoose.Types.ObjectId.isValid(userId)
        ? new mongoose.Types.ObjectId(userId)
        : userId;

      const match = { userId: companyId };
      if (puntoVenta) {
        const punto = Number(puntoVenta);
        match['afip.puntoVenta'] = Number.isNaN(punto) ? puntoVenta : punto;
      }
      if (start || end) {
        match.createdAt = {};
        if (start) match.createdAt.$gte = new Date(start);
        if (end) match.createdAt.$lte = new Date(end);
      }

      const facetResult = await Factura.aggregate([
        { $match: match },
        {
          $facet: {
            summary: [
              {
                $group: {
                  _id: null,
                  totalRevenue: { $sum: '$totales.total' },
                  totalInvoices: { $sum: 1 },
                  averageInvoice: { $avg: '$totales.total' }
                }
              }
            ],
            paymentMethods: [
              {
                $group: {
                  _id: { $ifNull: ['$pagos.formaPago', '$formaPago'] },
                  totalAmount: { $sum: '$totales.total' },
                  count: { $sum: 1 }
                }
              },
              { $sort: { totalAmount: -1, count: -1 } }
            ],
            documentTypes: [
              {
                $group: {
                  _id: '$afip.tipoComprobante',
                  totalAmount: { $sum: '$totales.total' },
                  count: { $sum: 1 }
                }
              },
              { $sort: { count: -1, totalAmount: -1 } }
            ]
          }
        }
      ]);

      const { summary = [], paymentMethods = [], documentTypes = [] } = facetResult[0] || {};
      const totals = summary[0] || { totalRevenue: 0, totalInvoices: 0, averageInvoice: 0 };

      const result = {
        period: { start: start || null, end: end || null },
        totals: {
          income: totals.totalRevenue || 0,
          cajaEgresos: 0,
          compras: 0,
          cogs: 0,
          grossProfit: totals.totalRevenue || 0,
          netProfit: totals.totalRevenue || 0
        },
        invoices: {
          totalInvoices: totals.totalInvoices || 0,
          averageInvoice: totals.averageInvoice || 0
        },
        paymentMethods: paymentMethods.map(item => ({
          metodo: item._id || 'DESCONOCIDO',
          totalAmount: item.totalAmount || 0,
          count: item.count || 0
        })),
        documentTypes: documentTypes.map(item => ({
          tipo: mapTipoComprobanteLabel(item._id),
          rawTipo: item._id,
          totalAmount: item.totalAmount || 0,
          count: item.count || 0
        }))
      };

      if (granularity) {
        const gran = String(granularity).toLowerCase();
        let fmt = '%Y-%m-%d';
        if (gran === 'weekly') fmt = '%G-%V';
        if (gran === 'monthly') fmt = '%Y-%m';

        const series = await Factura.aggregate([
          { $match: match },
          {
            $group: {
              _id: { $dateToString: { format: fmt, date: '$createdAt' } },
              revenue: { $sum: '$totales.total' },
              invoices: { $sum: 1 }
            }
          },
          { $sort: { '_id': 1 } }
        ]);

        result.series = series.map(item => ({
          period: item._id,
          revenue: item.revenue || 0,
          invoices: item.invoices || 0,
          netProfit: item.revenue || 0
        }));
      }

      res.json({ success: true, data: result });
    } catch (error) {
      console.error('Error en financialSummary:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}