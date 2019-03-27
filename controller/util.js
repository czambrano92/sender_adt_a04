var request = require('request')
function fechaString(callback) {
    let date = new Date();
    let ano = date.getFullYear();
    let mes = "0" + (date.getMonth() + 1);
    let dia = date.getDate();
    let hora = date.getHours();
    let min = date.getMinutes();
    let seg = date.getSeconds();

    callback(ano + '' + mes + '' + dia + '' + hora + '' + min + '' + seg)
}


function buscarComunaById(codigo, callback) {
    request("http://10.6.109.48:3716/consulta/comuna/" + codigo, (err, res, body) => {
        let comuna = JSON.parse(body)
        callback(comuna)
    })
}

function buscarPaisById(codigo, callback) {
    console.log('codigo')
    console.log(codigo)
    request("http://10.6.109.48:3714/pais/" + codigo, (err, res, body) => {
        let pais = JSON.parse(body)
        let result = {}
        result = pais.pais[0]
        callback(result)
    })
}
module.exports = {
    fechaString,
    buscarComunaById,
    buscarPaisById
}