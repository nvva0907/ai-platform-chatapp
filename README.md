# App Chat

Business-layer chat app consuming AKAgent public chat API.

## Bootstrap

```bash
cp .env.example .env.local
# edit .env.local: AKAGENT_AGENT_ID + AKAGENT_KEY từ AKAgent builder UI
npm install
npx prisma migrate dev --name init
npm run dev  # localhost:3001
```

## Architecture

- Next.js 15 App Router full-stack.
- `AKAGENT_KEY` chỉ server-side. Browser gọi `/api/*` routes → proxy tới AKAgent.
- Anonymous identity qua cookie `chat_aid` (HTTP-only, 1 year).
- `thread_id` = UUID sinh chat app, truyền vào AKAgent làm LangGraph checkpointer key.
