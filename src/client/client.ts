import { BlandClientOptions } from "../types/client";
import AdminSdk from "./admin/admin";
import Webchat from "./webchat/webchat";

class Bland {
    admin: BlandClientOptions["admin"]
    webchat: BlandClientOptions["webchat"]
    endpoint: null | string = null
    constructor(options: BlandClientOptions) {
        this.admin = options.admin
        this.webchat = options.webchat
    }

    public AdminClient(){
        return new AdminSdk(this.admin)
    }

    public WebchatClient(){
        return new Webchat(this.webchat)
    }

}

export default Bland