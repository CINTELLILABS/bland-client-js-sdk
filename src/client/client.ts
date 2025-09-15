import { BlandClientOptions } from "../types/client";

class Bland {
  admin: BlandClientOptions["admin"];
  webchat: BlandClientOptions["webchat"];
  endpoint: string | null = null;

  constructor(options: BlandClientOptions) {
    this.admin = options.admin;
    this.webchat = options.webchat;
  }

  public async AdminClient() {
    const mod = await import("./admin/admin");
    const AdminSdk = mod.default;
    return /* @__PURE__ */ new AdminSdk(this.admin);
  }

  public async WebchatClient() {
    const mod = await import("./webchat/webchat");
    const Webchat = mod.default;
    return /* @__PURE__ */ new Webchat(this.webchat);
  }
}

export default Bland;
