import { create_point_sales_services, get_point_sales_services, update_point_sale_services, delete_point_sale_services, get_point_sale_by_id_services } from "../../services/point_sales_services.js";

export async function createPointSale(req, res) {
    try {
        const creado = await create_point_sales_services(req.body);
        if (creado) {
            return res.status(201).json({ message: "Punto de venta creado correctamente", data: creado });
        }
        return res.status(400).json({ message: "No se pudo crear el punto de venta. Verifique los datos enviados." });
    } catch (err) {
        console.error("Error al crear el punto de venta:", err);
        return res.status(500).json({ message: "Error interno del servidor. Intente nuevamente más tarde." });
    }
}

export async function getPointSales(req, res) {
    try {
        const { id } = req.params; // ID de la empresa
        const puntos = await get_point_sales_services(id, req.query);

        if (puntos) {
            return res.status(200).json(puntos);
        }
        return res.status(200).json({ puntosDeVenta: [], pagination: {} });
    } catch (err) {
        console.error("Error en getPointSales:", err);
        res.status(500).json({ message: "Error interno del servidor", error: err.message });
    }
}

export async function getPointSaleById(req, res) {
    try {
        const { id } = req.params;
        const punto = await get_point_sale_by_id_services(id);
        if (!punto) {
            return res.status(404).json({ message: "Punto de venta no encontrado." });
        }
        return res.status(200).json(punto);
    } catch (err) {
        console.error("Error en getPointSaleById:", err);
        res.status(500).json({ message: "Error interno del servidor", error: err.message });
    }
}

export async function updatePointSale(req, res) {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const updated = await update_point_sale_services(id, updateData);
        if (!updated) {
            return res.status(404).json({ message: "Punto de venta no encontrado para actualizar." });
        }
        return res.status(200).json({ message: "Punto de venta actualizado correctamente.", data: updated });
    } catch (err) {
        console.error("Error en updatePointSale:", err);
        res.status(500).json({ message: "Error interno del servidor", error: err.message });
    }
}

export async function deletePointSale(req, res) {
    try {
        const { id } = req.params;
        const deleted = await delete_point_sale_services(id);
        if (!deleted) {
            return res.status(404).json({ message: "Punto de venta no encontrado para eliminar." });
        }
        return res.status(200).json({ message: "Punto de venta eliminado correctamente.", data: deleted });
    } catch (err) {
        console.error("Error en deletePointSale:", err);
        res.status(500).json({ message: "Error interno del servidor", error: err.message });
    }
}
