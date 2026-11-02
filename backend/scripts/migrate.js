const { pool } = require("../src/config/db");
const { SCHEMA_SQL } = require("../src/config/schema");


(async () => {
    try{
        await pool.query(SCHEMA_SQL);
        console.log("schema applied.");
    }catch (err) {
        console.error("migration failed", err.message);
        process.exitCode =1;
    
    }finally{
        await pool.end();
    }
})();

