import app from "./app";
import config from "./Config/envs";

app.listen(config.port, () => console.log(`Listening on http://localhost:${config.port}`));