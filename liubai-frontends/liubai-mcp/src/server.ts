import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js"
import {
  LiubaiClient,
  LoginRequiredError,
  LOGIN_REQUIRED_MESSAGE,
} from "./client.js"
import type { LiubaiMcpConfig } from "./config.js"
import { LoginManager } from "./login.js"
import { tools } from "./tools.js"
import { LIUBAI_MCP_PACKAGE_VERSION } from "./version.js"

export async function handleToolCall(
  client: LiubaiClient,
  login: LoginManager,
  name: string,
  args: Record<string, unknown> = {},
) {
  const tool = tools.find((item) => item.name === name)
  if (!tool) {
    return {
      content: [{ type: "text" as const, text: `Unknown tool: ${name}` }],
      isError: true,
    }
  }

  try {
    const text = await tool.handler(client, args, login)
    return {
      content: [{ type: "text" as const, text }],
    }
  } catch (err) {
    if (err instanceof LoginRequiredError) {
      return {
        content: [{ type: "text" as const, text: LOGIN_REQUIRED_MESSAGE }],
        isError: true,
      }
    }
    const message = err instanceof Error ? err.message : String(err)
    return {
      content: [{ type: "text" as const, text: `Error: ${message}` }],
      isError: true,
    }
  }
}

export async function startServer(config: LiubaiMcpConfig) {
  const client = new LiubaiClient(config)
  const login = new LoginManager(config)

  const server = new Server(
    {
      name: "liubai-mcp",
      version: LIUBAI_MCP_PACKAGE_VERSION,
    },
    {
      capabilities: {
        tools: {},
      },
    },
  )

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
  }))

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const args = (request.params.arguments ?? {}) as Record<string, unknown>
    return handleToolCall(client, login, request.params.name, args)
  })

  const transport = new StdioServerTransport()
  await server.connect(transport)
}
