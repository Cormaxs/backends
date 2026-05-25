import { Router } from "express";
import {add_product, update_product, delete_product, get_product_by_id, 
    get_all_products, get_all_products_company_controllers, get_product_codBarra,
    delete_product_all, get_all_category_company_controllers, get_all_marca_company_controllers,
    get_product_agotados, get_product_stock_bajo, get_products_vencidos, get_products_por_vencer, get_totalInventario, get_movimientos_producto, ingresar_mercaderia, delete_marca_controllers, delete_categoria_controllers,
    create_or_update_categoria_controllers, create_or_update_marca_controllers, searchProductos, exportCsv, exportXlsx} from "../../../controllers/productos/product_controllers.js";


const product_Router = Router();

product_Router.post("/add",add_product);
product_Router.post("/ingresar-mercaderia", ingresar_mercaderia);

product_Router.post("/update/:id", update_product);

// Export endpoints
product_Router.get('/export.csv', exportCsv);
product_Router.get('/export.xlsx', exportXlsx);

product_Router.delete("/delete/:productId",delete_product);
product_Router.delete("/delete/all/:idEmpresa",delete_product_all);

//nuevo buscador general todo en 1
product_Router.get("/buscar", searchProductos);


product_Router.get("/get/:id",get_product_by_id);//producto especifico

product_Router.get("/get", get_all_products);//todos los productos de todas las empresas

product_Router.get("/get/all/category/:idEmpresa",get_all_category_company_controllers);
product_Router.get("/get/all/marca/:idEmpresa",get_all_marca_company_controllers);
product_Router.delete("/delete/marca/:marca/:idEmpresa",delete_marca_controllers); //eliminar marca
product_Router.delete("/delete/categoria/:categoria/:idEmpresa",delete_categoria_controllers); //eliminar marca

product_Router.post("/categorias/",create_or_update_categoria_controllers); //editar o crear categoria
product_Router.post("/marcas/",create_or_update_marca_controllers); //editar o crear marca

product_Router.get("/get/:codBarra/:idEmpresa/:puntoVenta", get_product_codBarra);
product_Router.get("/agotados/:idEmpresa/:idPuntoVenta", get_product_agotados);
product_Router.get("/stock-bajo/:idEmpresa/:idPuntoVenta", get_product_stock_bajo);
product_Router.get("/vencidos/:idEmpresa/:idPuntoVenta", get_products_vencidos);
product_Router.get("/movimientos/:idProducto", get_movimientos_producto);
product_Router.get("/proximos-vencimientos/:idEmpresa/:idPuntoVenta", get_products_por_vencer);
product_Router.get("/totalInventario/:idEmpresa/:idPuntoVenta", get_totalInventario);

product_Router.get("/:id",get_all_products_company_controllers); //obtiene todos los productos de una empresa 
                                                                //especifica solo o con filtros, nombre, categoria, etc



export default product_Router;
