import axios from "axios";
import { updateUser_services } from '../../services/auth_services.js';
import { update_company } from '../../services/company_services.js';
import API_BASE_URL from './api-direccion.js';

export default class AfipUsers {
    // crea los datos de la empresa de afip, y devuelve el id para guardar en el propietario y tener los datos fiscales guardados
    async createCompany(empresa, idPropietario, idUser) {
        try {
            // Limpiar guiones del CUIT antes de enviar al backend de AFIP
            if (empresa && empresa.cuit) {
                empresa.cuit = empresa.cuit.replace(/-/g, '');
            }

            const response = await axios.post(API_BASE_URL + "usuario/datos-fiscales", { empresa });

            if (response?.data?.guardado?._id) {
                // ✅ Actualizar empresa y usuario con el ID de datos fiscales de AFIP
                if (idPropietario) await update_company(idPropietario, { idDbAfip: response.data.guardado._id });
                if (idUser) await updateUser_services(idUser, { idDbAfip: response.data.guardado._id });
            }
            return response.data;
        } catch (error) {
            console.error("Error al crear el usuario en el backend de AFIP:", error);
            throw error.response?.data || error;
        }
    }

    async editarCompany(datosActualizar, idEmpresaAfip) {
        try {
            const response = await axios.post(API_BASE_URL + "usuario/datos-fiscales/" + idEmpresaAfip, datosActualizar);
            return response.data;
        } catch (error) {
            console.error("Error al actualizar datos en el backend de AFIP:", error);
            throw error.response?.data || error;
        }
    }

    async ultimoComprobanteLocal(datos) {
        try {
            const response = await axios.post(API_BASE_URL + "usuario/comprobantes/ultimo-db", datos);
            return response.data;
        } catch (error) {
            console.error("Error en ultimoComprobanteLocal:", error);
            throw error.response?.data || error;
        }
    }

    async ultimoComprobanteAfip(datos) {
        try {
            const response = await axios.post(API_BASE_URL + "afip/parametros/ultimo-comprobante", datos);
            return response.data;
        } catch (error) {
            console.error("Error al consultar ultimo comprobante de AFIP:", error);
            throw error.response?.data || error;
        }
    }

    async updateContador(datos) {
        try {
            const response = await axios.post(API_BASE_URL + "usuario/comprobantes/contador", datos);
            return response.data;
        } catch (error) {
            console.error("Error en updateContador:", error);
            throw error.response?.data || error;
        }
    }

    async listarPuntosDeVenta(idUser) {
        try {
            const response = await axios.get(API_BASE_URL + "usuario/comprobantes/puntos/" + idUser);
            return response.data;
        } catch (error) {
            console.error("Error en listarPuntosDeVenta:", error);
            throw error.response?.data || error;
        }
    }

    async actualizarNumero(datos) {
        try {
            const response = await axios.post(API_BASE_URL + "usuario/comprobantes/numero", datos);
            return response.data;
        } catch (error) {
            console.error("Error en actualizarNumero:", error);
            throw error.response?.data || error;
        }
    }

    async sincronizarContadorDB(datos) {
        try {
            const response = await axios.post(API_BASE_URL + "usuario/comprobantes/sincronizar", datos);
            return response.data;
        } catch (error) {
            console.error("Error en sincronizarContadorDB:", error);
            throw error.response?.data || error;
        }
    }

    async proximoComprobante(datos) {
        try {
            const response = await axios.post(API_BASE_URL + "usuario/comprobantes/proximo-numero", datos);
            return response.data;
        } catch (error) {
            console.error("Error en proximoComprobante:", error);
            throw error.response?.data || error;
        }
    }

    async reservarNumero(datos) {
        try {
            const response = await axios.post(API_BASE_URL + "usuario/comprobantes/incrementar-contador", datos);
            return response.data;
        } catch (error) {
            console.error("Error en reservarNumero:", error);
            throw error.response?.data || error;
        }
    }

    async eliminarPuntodeventaComprbantes(datos) {
        try {
            const response = await axios.delete(API_BASE_URL + "usuario/comprobantes/contador", {
                data: datos
            });
            return response.data;
        } catch (error) {
            console.error("Error en eliminarPuntodeventaComprbantes:", error);
            throw error.response?.data || error;
        }
    }

    async obtenerDatosDelUsuarioComprobantes(UserId) {
        try {
            const response = await axios.get(API_BASE_URL + "usuario/comprobantes/puntos/" + UserId);
            return response.data;
        } catch (error) {
            console.error("Error en obtenerDatosDelUsuarioComprobantes:", error);
            throw error.response?.data || error;
        }
    }

    async obtenerDatosDeEmpresa(EmpresaId) {
        try {
            const response = await axios.get(API_BASE_URL + "usuario/datos-fiscales/" + EmpresaId);
            return response.data;
        } catch (error) {
            console.error("Error en obtenerDatosDeEmpresa:", error);
            throw error.response?.data || error;
        }
    }
}
