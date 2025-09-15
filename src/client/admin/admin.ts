import Base from "../base";

class AdminSdk extends Base {
  routes: { [x: string]: { path: string; method: string } };

  constructor(options: any) {
    super(options);
    this.routes = {
      sessions: { path: "/v1/inbound/session", method: "POST" },
      authorize: { path: "/v1/agents/:agentId/authorize", method: "POST" },
    };
    this.endpoint = options?.endpoint || "https://api.bland.ai";
  }

  private async request(path: string, method = "GET", body: any = null) {
    if (!this.endpoint) throw new Error("Admin SDK endpoint is not set");
    const url = `${this.endpoint}${path}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.admin?.apiKey) {
      headers["authorization"] = `${this.admin.apiKey}`;
    } else {
      throw new Error("Admin SDK API key is not set");
    }

    const request = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });

    if (!request.ok) {
      const errorText = await request.text();
      throw new Error(
        `Request failed: ${request.status} ${request.statusText} - ${errorText}`
      );
    }

    if (request.status === 204) {
      return null;
    }

    return request.json();
  }

  sessions = {
    create: async ({
      phoneNumber,
      requestData = {},
    }: {
      phoneNumber: string;
      requestData?: Record<string, any>;
    }): Promise<{ token: string; expires_at: string }> => {
      const payload = { phone_number: phoneNumber, request_data: requestData };
      const response = await this.request(
        this.routes.sessions.path,
        this.routes.sessions.method,
        payload
      );
      if (!response?.token) throw new Error("No session token returned");
      return { token: response.token, expires_at: response.expires_at };
    },
  };

  agents = {
    authorize: async ({
      agentId,
      context = {},
    }: {
      agentId: string;
      context?: Record<string, any>;
    }): Promise<{ token: string; expires_at?: string }> => {
      const path = this.routes.authorize.path.replace(
        ":agentId",
        encodeURIComponent(agentId)
      );
      const response = await this.request(path, this.routes.authorize.method, {
        context,
      });
      if (!response?.token) throw new Error("No authorization token returned");
      return { token: response.token, expires_at: response.expires_at };
    },
  };
}

export default AdminSdk;
