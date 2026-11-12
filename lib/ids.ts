import crypto from "crypto";

/** A short random id for new records. */
export const newId = () => crypto.randomBytes(6).toString("hex");
