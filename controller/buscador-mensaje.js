var db = require('../pg-con')

function buscarMensajePendiente(callback) {
    let mensajePendiente = null;
    //buscar en tabla esq_ris.
    let sql = "select * " +
        " from esq_ris.tb_mensaje msj " +
        " where mensaje_id_estado = 1 " +
        " and mensaje_tipo = 'ADT_A04' " +
        " order by mensaje_fecha_solicitado desc " +
        " limit 1;"

    db.one(sql)
        .then((mensajePendiente) => {
            
            callback(mensajePendiente);
        })
        .catch((error) => {
           
            callback(mensajePendiente);
        })

}

module.exports = {
    buscarMensajePendiente
}