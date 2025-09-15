import { BlandClientOptions } from "../types/client";

class Base {
  admin: BlandClientOptions["admin"];
  webchat: BlandClientOptions["webchat"];
  endpoint: string | null = null;

  constructor(options: BlandClientOptions) {
    this.admin = options.admin;
    this.webchat = options.webchat;
  }
}

export default Base;
