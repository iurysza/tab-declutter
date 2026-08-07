const server = Bun.serve({
  port: 0,
  async fetch(request) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders() })
    if (new URL(request.url).pathname !== '/v1/chat/completions' || request.method !== 'POST') {
      return Response.json({ error: { message: 'Not found' } }, { status: 404, headers: corsHeaders() })
    }
    return Response.json({
      id: 'tab-declutter-fixture',
      object: 'chat.completion',
      created: 0,
      model: 'tab-declutter-fixture',
      choices: [{ index: 0, message: { role: 'assistant', content: JSON.stringify({ groups: [{ name: 'Fixture workstream', tabs: ['T1', 'T2'] }] }) }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    }, { headers: corsHeaders() })
  },
})

function corsHeaders() {
  return { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'POST, OPTIONS' }
}

console.log(`Tab Declutter fixture: http://localhost:${server.port}/v1`)
