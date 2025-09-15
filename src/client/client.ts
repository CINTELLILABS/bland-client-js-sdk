import { BlandClientOptions } from "../types/client";
import type { IAdminSdk } from "./admin/admin";
import type { IWebchatPublic } from "./webchat/webchat";

class Bland {
  admin: BlandClientOptions["admin"];
  webchat: BlandClientOptions["webchat"];
  endpoint: string | null = null;

  constructor(options: BlandClientOptions) {
    this.admin = options.admin;
    this.webchat = options.webchat;
  }

  public async AdminClient(): Promise<IAdminSdk> {
    const mod = await import("./admin/admin");
    const Admin = mod.default;
    const inst: IAdminSdk = new Admin(this);
    return inst;
  }

  public async WebchatClient(): Promise<IWebchatPublic> {
    const mod = await import("./webchat/webchat");
    const Webchat = mod.default;
    const inst: IWebchatPublic = new Webchat(this);
    return inst;
  }
}

export default Bland;
