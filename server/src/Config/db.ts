import { Pool } from 'pg'
const pool = new Pool({
    user: 'postgres'
    ,
    host: "localhost"
    ,
    database: "postgres"
    ,
    password: "0000"
    ,
    port: 5432
    ,
})
export default pool