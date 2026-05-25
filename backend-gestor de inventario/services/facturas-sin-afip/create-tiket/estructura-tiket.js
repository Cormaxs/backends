import pdfMake from 'pdfmake/build/pdfmake.js';
import pdfFonts from 'pdfmake/build/vfs_fonts.js';

pdfMake.vfs = pdfFonts.vfs;

function generarDefinicionTicket(datos, datosEmpresa) {
    // Desestructuración de datos más concisa y con valores por defecto donde aplica.
    const {
        ventaId,
        fechaHora,
        tipoComprobante,
        numeroComprobante,
        items = [],
        totales = {},
        pago = {},
        cliente = {},
        observaciones,
        cajero = 'N/A', // Valor por defecto si no se proporciona
        transaccionId, // Se mantiene para referencia, pero no se usará en TRANS. ID si se prefiere ventaId
        sucursal = 'Principal' // Valor por defecto si no se proporciona
    } = datos;

    const safeTotales = {
        subtotal: Number(totales.subtotal ?? 0),
        descuento: Number(totales.descuento ?? 0),
        totalPagar: Number(totales.totalPagar ?? 0)
    };

    const safePago = {
        metodo: String(pago.metodo || 'Contado'),
        montoRecibido: pago.montoRecibido != null ? Number(pago.montoRecibido) : null,
        cambio: pago.cambio != null ? Number(pago.cambio) : null
    };

    const safeItems = items.map(item => {
        const cantidad = Number(item.cantidad || 0);
        const precioUnitario = Number(item.precioUnitario || 0);
        const totalItem = Number(item.totalItem != null ? item.totalItem : cantidad * precioUnitario);
        return {
            ...item,
            cantidad,
            precioUnitario,
            totalItem
        };
    });

    const totalItemsCount = safeItems.reduce((sum, item) => sum + item.cantidad, 0);

    // Separador: función auxiliar para evitar repetición y mejorar la legibilidad.
    // Se extrae fuera del `docDefinition` para mayor claridad.
    const getSeparator = (char = '-', length = 38) => ({
        text: char.repeat(length),
        alignment: 'center',
        fontSize: 6,
        color: '#BBBBBB',
        margin: [0, 2, 0, 2]
    });

    // Construcción de las filas de la tabla de ítems de forma más directa.
    // El encabezado es fijo, las filas se mapean.
    const itemsTableBody = [
        [{ text: 'CANT.', style: 'tableHeader', alignment: 'center' },
         { text: 'DESCRIPCIÓN', style: 'tableHeader' },
         { text: 'P. UNIT.', style: 'tableHeader', alignment: 'right' },
         { text: 'TOTAL', style: 'tableHeader', alignment: 'right' }],
        ...safeItems.map(item => [
            { text: item.cantidad.toString(), alignment: 'center', fontSize: 7 },
            { text: (item.descripcion || 'Producto sin descripción').toUpperCase(), fontSize: 7 },
            { text: `${item.precioUnitario.toFixed(2)}`, alignment: 'right', fontSize: 7 },
            { text: `${item.totalItem.toFixed(2)}`, alignment: 'right', fontSize: 7 }
        ])
    ];

    // Separa fecha y hora solo una vez al principio para evitar repetirlo.
    const [fecha, hora] = String(fechaHora || '').split(' ');

    const docDefinition = {
        pageSize: { width: 226.77, height: 'auto' }, // 80mm de ancho (226.77 puntos), altura automática
        pageMargins: [ 5, 8, 5, 8 ], // Márgenes laterales reducidos a 5 puntos

        content: [
            // --- Encabezado del Comercio ---
            { text: `${datosEmpresa.nombreEmpresa}`, style: 'shopHeader', alignment: 'center', margin: [0, 0, 0, 2] },
            { text: `DIRECCION : ${datosEmpresa.direccion}`, alignment: 'center', fontSize: 7, color: '#444444' },
            { text: `CUIT : ${datosEmpresa.cuit}`, alignment: 'center', fontSize: 7, color: '#444444', margin: [0, 0, 0, 5] },
            { text: `Sucursal: ${sucursal}`, alignment: 'center', fontSize: 7, color: '#444444', margin: [0, 0, 0, 8] },

            getSeparator('='),

            // --- Detalles del Comprobante (uso de array para condicionales más limpios) ---
            // Se agrupan los elementos comunes y se añaden condicionalmente si existen.
            {
                columns: [
                    { text: 'TICKET:', bold: true, fontSize: 8.5 },
                    { text: String(tipoComprobante || '').toUpperCase(), fontSize: 8.5, alignment: 'right' }
                ],
                margin: [0, 2, 0, 1]
            },
            {
                columns: [
                    { text: 'Nº COMPROBANTE:', bold: true, fontSize: 8.5 },
                    { text: numeroComprobante, fontSize: 8.5, alignment: 'right' }
                ],
                margin: [0, 0, 0, 1]
            },
            {
                columns: [
                    { text: 'FECHA:', bold: true, fontSize: 7.5, color: '#555555' },
                    { text: fecha, fontSize: 7.5, alignment: 'right', color: '#555555' }
                ],
                margin: [0, 0, 0, 1]
            },
            {
                columns: [
                    { text: 'HORA:', bold: true, fontSize: 7.5, color: '#555555' },
                    { text: hora, fontSize: 7.5, alignment: 'right', color: '#555555' }
                ],
                margin: [0, 0, 0, 1]
            },
            {
                columns: [
                    { text: 'CAJERO:', bold: true, fontSize: 7.5, color: '#555555' },
                    { text: cajero.toUpperCase(), fontSize: 7.5, alignment: 'right', color: '#555555' }
                ],
                margin: [0, 0, 0, 1]
            },
            {
                // CAMBIO AQUÍ: Ajuste de alineación para TRANS. ID
                columns: [
                    { text: 'TRANS. ID:', bold: true, fontSize: 7.5, color: '#555555', width: 'auto' }, // Ancho automático para la etiqueta
                    { text: ventaId, fontSize: 7.5, alignment: 'right', color: '#555555', width: '*' } // El resto del espacio y alineación a la izquierda
                ],
                columnGap: 2, // Pequeño espacio entre la etiqueta y el valor
                margin: [0, 0, 0, 8]
            },

            getSeparator('-'),

            // --- Tabla de Ítems ---
            {
                table: {
                    widths: ['auto', '*', 'auto', 'auto'],
                    body: itemsTableBody
                },
                layout: {
                    hLineWidth: (i, node) => (i === 0 || i === 1 || i === node.table.body.length) ? 0.8 : 0,
                    vLineWidth: () => 0,
                    hLineColor: () => '#BBBBBB',
                    paddingLeft: () => 2,
                    paddingRight: () => 2,
                    paddingTop: () => 3,
                    paddingBottom: () => 3
                },
                margin: [0, 5, 0, 5]
            },

            // Total de ítems
            { text: `TOTAL DE ARTÍCULOS: ${totalItemsCount}`, alignment: 'right', fontSize: 7.5, bold: true, margin: [0, 2, 0, 8] },

            getSeparator('='),

            // --- Totales ---
            {
                columns: [
                    { text: 'SUBTOTAL:', alignment: 'right', bold: true, fontSize: 9.5, color: '#333333' },
                    { text: `$ ${safeTotales.subtotal.toFixed(2)}`, alignment: 'right', bold: true, fontSize: 9.5, color: '#333333' }
                ],
                margin: [0, 0, 0, 2]
            },
            // Se usa un spread operator (...) para incluir condicionalmente el objeto del descuento.
            ...(totales.descuento > 0 ? [{
                columns: [
                    { text: 'DESCUENTO:', alignment: 'right', bold: true, fontSize: 9.5, color: '#E53935' },
                    { text: `- $ ${safeTotales.descuento.toFixed(2)}`, alignment: 'right', bold: true, fontSize: 9.5, color: '#E53935' }
                ],
                margin: [0, 0, 0, 2]
            }] : []),
            { canvas: [{ type: 'line', x1: 120, y1: 0, x2: 206.77, y2: 0, lineWidth: 0.7, lineColor: '#666666' }], margin: [0, 3, 0, 3] },
            {
                columns: [
                    { text: 'TOTAL A PAGAR', alignment: 'right', bold: true, fontSize: 14, color: '#000000' },
                    { text: `$ ${safeTotales.totalPagar.toFixed(2)}`, alignment: 'right', bold: true, fontSize: 14, color: '#000000' }
                ],
                margin: [0, 5, 0, 10]
            },

            getSeparator('='),

            // --- Información de Pago (uso de array para condicionales más limpios) ---
            {
                columns: [
                    { text: 'MÉTODO DE PAGO:', bold: true, fontSize: 8.5 },
                    { text: safePago.metodo.toUpperCase(), fontSize: 8.5, alignment: 'right' }
                ],
                margin: [0, 0, 0, 2]
            },
            ...(safePago.metodo === 'Efectivo' && safePago.montoRecibido != null ? [{
                columns: [
                    { text: 'MONTO RECIBIDO:', bold: true, fontSize: 8.5 },
                    { text: `$ ${safePago.montoRecibido.toFixed(2)}`, fontSize: 8.5, alignment: 'right' }
                ],
                margin: [0, 0, 0, 2]
            }] : []),
            ...(safePago.metodo === 'Efectivo' && safePago.cambio != null ? [{
                columns: [
                    { text: 'CAMBIO:', bold: true, fontSize: 8.5 },
                    { text: `$ ${safePago.cambio.toFixed(2)}`, fontSize: 8.5, alignment: 'right' }
                ],
                margin: [0, 0, 0, 8]
            }] : []),

            // --- Información del Cliente (Opcional - uso de array para condicionales más limpios) ---
            // Se usa `cliente?.nombre` para encadenamiento opcional si `cliente` es nulo o indefinido.
            ...(cliente?.nombre ? [
                getSeparator('-'),
                {
                    text: 'CLIENTE:',
                    fontSize: 8.5,
                    bold: true,
                    margin: [0, 5, 0, 2],
                    color: '#444444'
                },
                {
                    columns: [
                        { text: 'Nombre:', fontSize: 7.5, color: '#555555' },
                        { text: cliente.nombre.toUpperCase(), fontSize: 7.5, alignment: 'right', color: '#555555' }
                    ],
                    margin: [0, 0, 0, 1]
                }
            ] : []),
            ...(cliente?.dniCuit ? [{
                columns: [
                    { text: 'DNI/CUIT:', fontSize: 7.5, color: '#555555' },
                    { text: cliente.dniCuit, fontSize: 7.5, alignment: 'right', color: '#555555' }
                ],
                margin: [0, 0, 0, 1]
            }] : []),
            ...(cliente?.condicionIVA ? [{
                columns: [
                    { text: 'IVA:', fontSize: 7.5, color: '#555555' },
                    { text: cliente.condicionIVA.toUpperCase(), fontSize: 7.5, alignment: 'right', color: '#555555' }
                ],
                margin: [0, 0, 0, 5]
            }] : []),

            // --- Observaciones (Opcional - uso de array para condicionales más limpios) ---
            ...(observaciones ? [
                getSeparator('-'),
                {
                    text: 'OBSERVACIONES:',
                    fontSize: 8.5,
                    bold: true,
                    margin: [0, 5, 0, 2],
                    color: '#444444'
                },
                {
                    text: observaciones,
                    fontSize: 7.5,
                    margin: [0, 0, 0, 10],
                    color: '#555555'
                }
            ] : []),

            getSeparator('='),

            // --- Pie de Página Profesional ---
            { text: '¡GRACIAS POR SU COMPRA!', style: 'footerGracias', alignment: 'center', margin: [0, 5, 0, 2] },
            { text: 'Conserve este ticket para cambios o devoluciones.', alignment: 'center', fontSize: 7.5, color: '#555555', margin: [0, 0, 0, 5] },
            { text: 'Cód. Verif. ' + ventaId, alignment: 'center', fontSize: 6, color: '#999999', margin: [0, 5, 0, 0] },

            // --- ATRIBUCIÓN FACSTOCK ---
            { text: 'Sistema de Facturación desarrollado por Facstock.com', alignment: 'center', fontSize: 6, color: '#888888', margin: [0, 5, 0, 0] }
        ],
        styles: {
            shopHeader: {
                fontSize: 14,
                bold: true,
                color: '#333333'
            },
            tableHeader: {
                bold: true,
                fontSize: 7.5,
                color: 'black',
                fillColor: '#DDDDDD',
                alignment: 'left',
                paddingBottom: 4
            },
            footerGracias: {
                fontSize: 10.5,
                bold: true,
                color: '#000000'
            }
        },
        defaultStyle: {
            fontSize: 7.5,
            color: '#333333'
        }
    };

    return docDefinition;
}


export async function createTicketSinAfip(datos, datosEmpresa) {
    try {

        const docDefinition = generarDefinicionTicket(datos, datosEmpresa);
        const pdfDoc = pdfMake.createPdf(docDefinition);

        // Envuelve el callback en una Promesa para usar async/await si es necesario
        // en funciones que llamen a createTicketSinAfip.
        return new Promise((resolve, reject) => {
            pdfDoc.getBuffer((buffer) => {
                // Si el buffer es nulo o indefinido, esto podría indicar un problema.
                if (buffer) {
                    resolve(buffer);
                } else {
                    reject(new Error('No se pudo obtener el buffer del PDF.'));
                }
            });
        });
    } catch (error) {
        // Mejor manejo de errores: loguear el stack trace para depuración en producción.
        console.error('Error al generar el ticket PDF:', error.message, error.stack);
        throw error; // Propaga el error para que pueda ser manejado por el llamador.
    }
}
