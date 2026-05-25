import axios from "axios";
import API_BASE_URL from "./api-direccion.js";

export default class AfipCredencialesService {
    async generarKeyCsr(datos, idPropietario) {
        try {
           
            const response = await axios.post(API_BASE_URL +"afip/certificado/generar", idPropietario,  datos );
            return response.data;
        } catch (error) {
            console.error("Error al crear el usuario en el backend de AFIP:", error);
            throw error.response.data;
        }
    }


    async guardarCrt(idUser, certificado) {
        try {
           
            const response = await axios.post(API_BASE_URL +"afip/certificado/guardar",  idUser, certificado );
            return response.data;
        } catch (error) {
            console.error("Error al crear el usuario en el backend de AFIP:", error);
            throw error.response.data;
        }
    }

    async obtenerTA(id, cuit, servicio) {
        try {
            const response = await axios.post(API_BASE_URL +"afip/ticket/acceso", { id, cuit, servicio} );
            return response.data;
        } catch (error) {
            console.error("Error al crear el usuario en el backend de AFIP:", error);
            throw error.response.data;
        }
    }
    async obtenerTaPadron(id, cuit, servicio) {
        try {
            const response = await axios.post(API_BASE_URL +"afip/padron/ticket/obtener", { id, cuit, servicio} );
            return response.data;
        } catch (error) {
            console.error("Error al crear el usuario en el backend de AFIP:", error);
            throw error.response.data;
        }
    }

    async verificarAccesos(id, cuit, servicio) {
        try {
            const response = await axios.post(API_BASE_URL +"afip/acceso/verificar", { id, cuit, servicio} );
            return response.data;
        } catch (error) {
            console.error("Error al crear el usuario en el backend de AFIP:", error);
            throw error.response.data;
        }
    }

    async consultarCuitAfip(id, cuit, cuitAConsultar, servicio) {
        try {
            const response = await axios.post(API_BASE_URL +"afip/cuit/consultar", { id, cuit, cuitAConsultar, servicio} );
            return response.data;
        } catch (error) {
            console.error("Error al crear el usuario en el backend de AFIP:", error);
            throw error.response.data;
        }
    }


}
