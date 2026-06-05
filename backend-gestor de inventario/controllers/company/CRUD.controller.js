import { register_company, update_company,delete_company, get_company, get_company_all, get_company_plan_status } from "../../services/company_services.js";

// Crear una nueva empresa
export async function CreateCompany(req, res) {
    try {
        const datos = req.body;
        
        const creada = await register_company(datos);
        if (creada) {
            return res.status(201).json(creada);
        }
        res.status(400).json("Company not created");
    } catch (error) {
        if (error.errors?.cuit) {
            return res.status(409).json({ message: "el cuit esta mal formateado" }); // 409 Conflict
        }
        else if (error.message.includes("duplicate key") || error.message.includes("usuario ya existe")) {
            return res.status(409).json({ message: "El nombre de usuario o cuit ya está en uso. Por favor, elige otro." }); // 409 Conflict
        } else {
            return res.status(500).json({ message: "No se pudo registrar la empresa. Inténtalo de nuevo más tarde." }); // 500 Genérico
        }
    }
}

export async function updateCompany(req, res) {
    try {
        const {idEmpresa} = req.params; 
        const updated = await update_company(idEmpresa, req.body);

        if (updated) {
            return res.status(200).json({message: "empresa actualizada con exito",status: "success",  empresa : updated}); // 200 OK para una actualización exitosa
        }
        return res.status(404).json({ message: "Empresa no encontrada para actualizar." });


    } catch (error) {
        if (error.message.includes("No se pudo actualizar la empresa")) {
            return res.status(400).json({ message: error.message }); 
        }
        console.error("Error al actualizar la empresa:", error);
        return res.status(500).json({ message: "Error interno del servidor al intentar actualizar la empresa." });
    }
}

export async function deleteCompany(req, res) {
    try{
        const {id} = req.params; 
        const result = await delete_company(id);
        if (result) {
            return res.status(200).json(result); 
        }
        return res.status(404).json({ "message": "No se pudo eliminar la empresa." });
    }catch(err){
        console.error("Error al eliminar la empresa:", err);
        return res.status(500).json({ message: "Error interno del servidor al intentar eliminar la empresa." });
    }
}

export async function getCompany(req, res) {
    try{
        const {id} = req.params;
        const result = await get_company(id);
        if(result){
            return res.status(200).json(result); 
        }
        return res.status(404).json({ message: "Empresa no encontrada." });
    }catch(err){
        console.error("Error al obtener la empresa:", err);
        return res.status(500).json({ message: "Error interno del servidor al intentar obtener la empresa." });
    }
}

export async function getCompanyAll(req, res) {
    try{
        const result = await get_company_all();
        if(result){
            return res.status(200).json(result); 
        }
        return res.status(404).json({ message: "No se encontraron empresas." });
    }catch(err){
        console.error("Error al obtener las empresas:", err);
        return res.status(500).json({ message: "Error interno del servidor al intentar obtener las empresas." });
    }
}

export async function getCompanyPlanStatus(req, res) {
    try {
        const { id } = req.params;
        console.log(`--- [CONTROLLER] Solicitando estado de plan para ID: ${id} ---`);
        const result = await get_company_plan_status(id);
        if (result) {
            return res.status(200).json(result);
        }
        return res.status(404).json({ message: "No se pudo obtener el estado del plan para el ID proporcionado." });
    } catch (err) {
        console.error(`--- [CONTROLLER] Error al obtener el estado del plan (ID: ${req.params.id}):`, err);
        return res.status(500).json({ message: err.message || "Error interno del servidor." });
    }
}
