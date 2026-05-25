import axios from "axios";
import { updateUser_services } from '../../services/auth_services.js';
import {update_company } from '../../services/company_services.js';
import API_BASE_URL from './api-direccion.js';

export default class AfipUsers {
    //crea los datos de la empresa de afip, y devuelve el id para guardar en el propietario y tener los datos fiscales guardados
    async createCompany(empresa, idPropietario, idUser) {
        try {
            const response = await axios.post(API_BASE_URL+"usuario/datos-fiscales", { empresa });

            if (response?.data?.guardado?._id) {
                                // ✅ Pasar un objeto con el campo idDatosFiscales
                await update_company(idPropietario, { idDbAfip: response.data.guardado._id });
                await updateUser_services(idUser, { idDbAfip: response.data.guardado._id });
            }
            return response.data;
        } catch (error) {
            console.error("Error al crear el usuario en el backend de AFIP:", error);
            throw error.response.data;
        }
    }

    async editarCompany(datosActualizar, idEmpresaAfip) {
        try {
            const response = await axios.post(API_BASE_URL+"usuario/datos-fiscales/" + idEmpresaAfip ,  datosActualizar );
            return response.data;
        } catch (error) {
            console.error("Error al actualizar datos en el backend de AFIP:", error);
            throw error.response.data;
        }
    }

    async ultimoComprobanteLocal(datos) {
        try {
            const response = await axios.post(API_BASE_URL+"usuario/comprobantes/ultimo-db",  datos );

            if (response?.data?.guardado?._id) {
                // ✅ Pasar un objeto con el campo idDatosFiscales
                await updateUser_services(idPropietario, { idDatosFiscales: response.data.guardado._id });
            }
            return response.data;
        } catch (error) {
            console.error("Error al crear el usuario en el backend de AFIP:", error);
            throw error.response.data;
        }
    }

    async updateContador(datos) {
        try {
            const response = await axios.post(API_BASE_URL+"usuario/comprobantes/contador", datos);

            if (response?.data?.guardado?._id) {
                // ✅ Pasar un objeto con el campo idDatosFiscales
                await updateUser_services(idPropietario, { idDatosFiscales: response.data.guardado._id });
            }
            return response.data;
        } catch (error) {
            console.error("Error al crear el usuario en el backend de AFIP:", error);
            throw error.response.data;
        }
    }

    async createUlistarTodosLosNumerossuario(idUser) {
        try {
           
            const response = await axios.get(API_BASE_URL+"usuario/comprobantes/puntos/" + idUser);

            if (response?.data?.guardado?._id) {
                // ✅ Pasar un objeto con el campo idDatosFiscales
                await updateUser_services(idPropietario, { idDatosFiscales: response.data.guardado._id });
            }
            return response.data;
        } catch (error) {
            console.error("Error al crear el usuario en el backend de AFIP:", error);
            throw error.response.data;
        }
    }
    async actualizarNumero(datos) {
        try {
           
            const response = await axios.post(API_BASE_URL+"usuario/comprobantes/numero", datos);

            if (response?.data?.guardado?._id) {
                // ✅ Pasar un objeto con el campo idDatosFiscales
                await updateUser_services(idPropietario, { idDatosFiscales: response.data.guardado._id });
            }
            return response.data;
        } catch (error) {
            console.error("Error al crear el usuario en el backend de AFIP:", error);
            throw error.response.data;
        }
    }
    async sincronizarContadorDB(datos) {
        try {
            const response = await axios.post(API_BASE_URL+"usuario/comprobantes/sincronizar", datos);

            if (response?.data?.guardado?._id) {
                // ✅ Pasar un objeto con el campo idDatosFiscales
                await updateUser_services(idPropietario, { idDatosFiscales: response.data.guardado._id });
            }
            return response.data;
        } catch (error) {
            console.error("Error al crear el usuario en el backend de AFIP:", error);
            throw error.response.data;
        }
    }
    async proximoComprobante(datos) {
        try {
           
            const response = await axios.post(API_BASE_URL+"usuario/comprobantes/proximo-numero", datos);

            if (response?.data?.guardado?._id) {
                // ✅ Pasar un objeto con el campo idDatosFiscales
                await updateUser_services(idPropietario, { idDatosFiscales: response.data.guardado._id });
            }
            return response.data;
        } catch (error) {
            console.error("Error al crear el usuario en el backend de AFIP:", error);
            throw error.response.data;
        }
    }
    async reservarNumero(datos) {
        try {
           
            const response = await axios.post(API_BASE_URL+"usuario/comprobantes/incrementar-contador", datos);

            if (response?.data?.guardado?._id) {
                // ✅ Pasar un objeto con el campo idDatosFiscales
                await updateUser_services(idPropietario, { idDatosFiscales: response.data.guardado._id });
            }
            return response.data;
        } catch (error) {
            console.error("Error al crear el usuario en el backend de AFIP:", error);
            throw error.response.data;
        }
    }
    async eliminarPuntodeventaComprbantes(datos) {
        try {
            const response = await axios.delete(API_BASE_URL+"usuario/comprobantes/contador", {
                data: datos  // Correcto para enviar cuerpo en DELETE
            });

            if (response?.data?.guardado?._id) {
                // ✅ Pasar un objeto con el campo idDatosFiscales
                await updateUser_services(idPropietario, { idDatosFiscales: response.data.guardado._id });
            }
            return response.data;
        } catch (error) {
            console.error("Error al crear el usuario en el backend de AFIP:", error);
            throw error.response.data;
        }
    }
    async obtenerDatosDelUsuarioComprobantes(UserId) {
        try {
           
            const response = await axios.post(API_BASE_URL+"usuario/datos-fiscales/" + UserId);

            if (response?.data?.guardado?._id) {
                // ✅ Pasar un objeto con el campo idDatosFiscales
                await updateUser_services(idPropietario, { idDatosFiscales: response.data.guardado._id });
            }
            return response.data;
        } catch (error) {
            console.error("Error al crear el usuario en el backend de AFIP:", error);
            throw error.response.data;
        }
    }
    async obtenerDatosDeEmpresa(EmpresaId) {
        try {
           
            const response = await axios.get(API_BASE_URL+"usuario/datos-fiscales/" + EmpresaId);

            if (response?.data?.guardado?._id) {
                // ✅ Pasar un objeto con el campo idDatosFiscales
                await updateUser_services(idPropietario, { idDatosFiscales: response.data.guardado._id });
            }
            return response.data;
        } catch (error) {
            console.error("Error al crear el usuario en el backend de AFIP:", error);
            throw error.response.data;
        }
    }


// ult numero comprobante desde afip
    async ultimoComprobanteAfip(datos) {
        try {
            const response = await axios.post(API_BASE_URL+"afip/parametros/ultimo-comprobante",datos );

            return response.data;
        } catch (error) {
            console.error("Error al consultar ultimo comprobante de  AFIP:", error);
            throw error.response.data;
        }
    }
}
