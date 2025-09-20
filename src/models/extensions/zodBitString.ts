import { z } from "zod";

/** Generic factory if you want to reuse elsewhere */
export const zodBitString = (len: number) =>
  z
    .string()
    .length(len)
    .regex(/^[01]+$/);
