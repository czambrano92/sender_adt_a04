const pgp = require('pg-promise')();
var cn


if(process.env.DEV == 'true'){
    cn = {
        host: '10.6.109.185',
        port: 5432,
        database: 'mdb_integracion',
        user: 'desarrollo',
        password: 'dgtidev*'
    }
}else if(process.env.QA == 'true'){
    cn = {
        host: '10.6.109.230',
        port: 5432,
        database: 'mdb_paciente',
        user: 'postgres',
        password: 'p05t9r35*'
    }
}else if(process.env.PROD == 'true'){
    cn = {
        host: '10.6.109.44',
        port: 5432,
        database: 'mdb_paciente',
        user: 'postgres',
        password: 'p05t9r35*'
    }
}else{
    cn = {
        host: '10.6.109.185',
        port: 5432,
        database: 'mdb_integracion',
        user: 'desarrollo',
        password: 'dgtidev*'
    }
}


const db = pgp(cn);
 
module.exports = db;
