import { fromNodeHandler } from "nitro/h3";
import app from "secure_api/src/app";

export default fromNodeHandler(app);