import Bland from "../client";

class AdminSdk extends Bland {
    routes: { [x: string]: { path: string; method: string; }; };
    constructor(options: any) {
        super(options)
        this.routes = {
            sessions: {
                path: "/v1/inbound/session",
                method: "POST"
            }
        }
        this.endpoint = options?.endpoint || "https://api.bland.ai"
    }


    private async request(path: string, method = "GET", body: any = null) {
        if (!this.endpoint) throw new Error("Admin SDK endpoint is not set")
        const url = `${this.endpoint}${path}`
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        }
        if (this.admin?.apiKey) {
            headers["Authorization"] = `${this.admin.apiKey}`
        } else {
            throw new Error("Admin SDK API key is not set")
        }

        const request = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : null,
        })

        if (!request.ok) {
            const errorText = await request.text()
            throw new Error(`Request failed: ${request.status} ${request.statusText} - ${errorText}`)
        }

        if (request.status === 204) {
            return null
        }

        return request.json()
    }

    sessions = {
        create: async (context: Record<string, any> = {}): Promise<{
            token: string
            expiresAt: string
        }> => {
            let request = await this.request(this.routes.sessions.path, this.routes.sessions.method, { context })

            if (!request.token) {
                throw new Error("No session token returned")
            }

            return {
                token: request.token,
                expiresAt: request.expiresAt
            }
        }
    }

}

export default AdminSdk