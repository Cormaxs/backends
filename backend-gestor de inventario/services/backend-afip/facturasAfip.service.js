import axios from "axios";
import API_BASE_URL from "./api-direccion.js";

export default class FacturasAfipService {
    //manda facturas ABC 
async emitirFacturas(id, cuit, servicio, factura, idEmpresa) {
    try {
        // Limpiar guiones del CUIT antes de enviar al backend de AFIP
        const cuitLimpio = typeof cuit === 'string' ? cuit.replace(/-/g, '') : cuit;

        const response = await axios.post(
            API_BASE_URL + "facturas/crear",
            { id, cuit: cuitLimpio, servicio, factura, idEmpresa },
            { responseType: 'arraybuffer' }
        );
        return response.data; // Éxito: retorna el Buffer del PDF
    } catch (error) {
        if (error.response && error.response.data) {
            const raw = error.response.data;
            let errorJson = null;

            try {
                if (raw instanceof ArrayBuffer) {
                    const text = new TextDecoder('utf-8').decode(raw);
                    errorJson = JSON.parse(text);
                } else if (typeof raw === 'string') {
                    errorJson = JSON.parse(raw);
                } else {
                    errorJson = raw;
                }
            } catch (parseError) {
                // No se pudo parsear el body de error, conservamos el texto crudo
                const text = raw instanceof ArrayBuffer ? new TextDecoder('utf-8').decode(raw) : String(raw);
                errorJson = { message: text };
            }

            const errores = [];
            if (Array.isArray(errorJson.errores)) {
                errores.push(...errorJson.errores);
            } else if (errorJson.errores) {
                errores.push(errorJson.errores);
            } else if (Array.isArray(errorJson.error)) {
                errores.push(...errorJson.error);
            } else if (errorJson.error) {
                errores.push(errorJson.error);
            }

            const observaciones = [];
            if (Array.isArray(errorJson.observaciones)) {
                observaciones.push(...errorJson.observaciones.map(obs => obs?.Msg || obs?.mensaje || obs || String(obs)));
            } else if (errorJson.observaciones) {
                observaciones.push(errorJson.observaciones);
            }

            const messageParts = [];
            if (errorJson.message) messageParts.push(errorJson.message);
            if (!errorJson.message && errorJson.error) messageParts.push(typeof errorJson.error === 'string' ? errorJson.error : JSON.stringify(errorJson.error));
            if (observaciones.length > 0 && errores.length === 0) messageParts.push('Observaciones: ' + observaciones.join('; '));

            const customizedError = new Error(messageParts.length > 0 ? messageParts.join(' | ') : 'Factura rechazada');
            customizedError.status = error.response.status || 500;
            customizedError.erroresAfip = errores;
            customizedError.observacionesAfip = observaciones;
            customizedError.raw = errorJson;
            throw customizedError;
        }
        
        // Si no hay respuesta del servidor (error de red)
        throw new Error("No se pudo conectar con el servidor de facturación");
    }
}

    async recuperar(idFactura) {
        try {
           
            const response = await axios.get(API_BASE_URL+"facturas/recuperarFactura/" + idFactura ,{     
                responseType: 'arraybuffer' // para recibir el PDF
              });
            return response.data;
        } catch (error) {
            //console.error("Error al crear el usuario en el backend de AFIP:", error);
            throw error.response.data;
        }
    }


   async reintentar(id, cuit, servicio, facturaId) {
    try {
        const response = await axios.post(
            `${API_BASE_URL}facturas/reintentar/${facturaId}`, 
            { id, cuit, servicio }
        );
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) {
            const serverError = error.response.data;
            const customError = new Error(serverError.message || 'Error al reintentar factura');
            customError.status = error.response.status || 500;
            customError.response = { data: serverError };
            customError.errores = serverError.errores || [];
            throw customError;
        }
        throw error;
    }
}


    async buscar(filtros) {
        try {
            // Pasa el objeto filtros directamente, no {filtros}
            const response = await axios.get(API_BASE_URL+"facturas/buscar", {
                params: filtros  // axios convertirá cada propiedad en query string
            });
            return response.data; // { success, data, paginacion }
        } catch (error) {
            console.error("Error al buscar facturas en microservicio AFIP:", error.response?.data || error.message);
            
            if (error.response && error.response.data) {
                throw error.response.data;
            }
            
            throw {
                success: false,
                message: error.message || "Error al conectar con el microservicio de AFIP"
            };
        }
    }


    async recCae(id, cuit, servicio, factura, puntoVenta, tipoComprobante, numeroFactura) {
        try {
           
            const response = await axios.post(API_BASE_URL+"afip/parametros/CAE", {id, cuit, servicio, factura, puntoVenta, tipoComprobante, numeroFactura},
            );
            return response.data;
        } catch (error) {
            //console.error("Error al crear el usuario en el backend de AFIP:", error.response.data);
            throw error.response.data;
        }
    }



    async anular(id, cuit, servicio, facturaOriginal) {
        try {
           
            const response = await axios.post(API_BASE_URL+"facturas/anular", {id, cuit, servicio, facturaOriginal},
 );
            return response.data;
        } catch (error) {
            //console.error("Error al crear el usuario en el backend de AFIP:", error.response.data);
            throw error.response.data;
        }
    }

}
