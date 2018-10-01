import { InfluxDB } from "influx";

export default new InfluxDB({
    host: process.env.INFLUXDB_HOST,
    port: parseInt(process.env.INFLUXDB_PORT),
    username: process.env.INFLUXDB_USERNAME,
    password: process.env.INFLUXDB_PASSWORD,
    database: process.env.INFLUXDB_DATABASE
});
