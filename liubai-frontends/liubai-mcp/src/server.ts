import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js"
import { LiubaiClient } from "./client.js"
import type { LiubaiMcpConfig } from "./config.js"
import { tools } from "./tools.js"

export async function startServer(config: LiubaiMcpConfig) {
  const client = new LiubaiClient(config)

  const server = new Server(
    {
      name: "liubai-mcp",
      version: "0.31.0",
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
    const tool = tools.find((t) => t.name === request.params.name)
    if (!tool) {
      return {
        content: [{ type: "text", text: `Unknown tool: ${request.params.name}` }],
        isError: true,
      }
    }

    try {
      const args = (request.params.arguments ?? {}) as Record<string, unknown>
      const text = await tool.handler(client, args)
      return {
        content: [{ type: "text", text }],
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return {
        content: [{ type: "text", text: `Error: ${message}` }],
        isError: true,
      }
    }
  })

  const transport = new StdioServerTransport()
  await server.connect(transport)
}
