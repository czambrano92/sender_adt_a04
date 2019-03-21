var hl7 = require('simple-hl7');
var env = require('../env_util')
var db = require('../pg-promise/pg-con')

function senderhl7(req, res) {

    /*crear "cliente" 
    es quien tiene los datos hacia donde se enviará mensaje hl7 */    
    var client = hl7.Server.createTcpClient(env.servidor_receptor, 1234);

    /* msg
    mensaje quien lleva los datos del paciente */
    var msg = new hl7.Message(
        "EPIC",
        "EPICADT",
        "SMS",
        "199912271408",
        "CHARRIS",
        ["ADT", "A04"], //This field has 2 components
        "1817457",
        "D",
        "2.5"
    );

    let mensaje_texto = JSON.stringify(msg);
    let pk = Date().toString();

    /* registrar mensaje generado sin enviar 
    en base de datos para llevar control */
    db.db.none('INSERT INTO main_hl7.main_saliente(' +
        'id_main_saliente,fecha_generado, fecha_completado, mensaje_hl7, ack_completado, estado_general, codigo_emisor, codigo_receptor) ' +
        ' VALUES ($1, $2, $3, $4, $5, $6, $7,$8); ', [
            pk,
            new Date(),
            null,
            msg,
            null,
            false,
            '01',
            '02'
        ]);

    console.log('******sending message*****')

    /* enviar mensaje */
    client.send(msg, function (err, ack) {
        if (ack) {
            console.log('******ack received*****')
            console.log(ack.log());
            //editar registro bd de mensaje para notificar correcto ack
        } else {
            if (err) {
                console.log('***error***')
                console.log(err)
                //editar notificando error en mensaje
            }
        }

    });

    //res.send({status:'ok'})
}

module.exports = {
    senderhl7
}