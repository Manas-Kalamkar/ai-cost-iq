// src/lib/tools.ts

export type Plan = {
  label: string
  price: number | null
  perSeat: boolean
  isApi?: boolean
}

export type Tool = {
  id: string
  name: string
  color: string
  isApi: boolean
  plans: Plan[]
}

export type ToolEntry = {
  id: number
  company: string
  plan: string
  seats: string
  spend: string
}

export const TOOLS: Record<string, Tool> = {
  Cursor: {
    id: 'cursor',
    name: 'Cursor',
    color: '#534AB7',
    isApi: false,
    plans: [
      { label: 'Hobby (Free)', price: 0, perSeat: false },
      { label: 'Pro', price: 20, perSeat: false },
      { label: 'Ultra', price: 200, perSeat: false },
      { label: 'Teams', price: 40, perSeat: true },
      { label: 'Enterprise', price: null, perSeat: true },
    ],
  },
  'GitHub Copilot': {
    id: 'copilot',
    name: 'GitHub Copilot',
    color: '#2C2C2A',
    isApi: false,
    plans: [
      { label: 'Free', price: 0, perSeat: false },
      { label: 'Pro', price: 10, perSeat: false },
      { label: 'Pro+', price: 39, perSeat: false },
      { label: 'Business', price: 19, perSeat: true },
      { label: 'Enterprise', price: 39, perSeat: true },
    ],
  },
  Claude: {
    id: 'claude',
    name: 'Claude',
    color: '#BA7517',
    isApi: false,
    plans: [
      { label: 'Free', price: 0, perSeat: false },
      { label: 'Pro', price: 17, perSeat: false },
      { label: 'Max', price: 100, perSeat: false },
      { label: 'Team - Standard', price: 20, perSeat: true },
      { label: 'Team - Premium', price: 100, perSeat: true },
      { label: 'Enterprise', price: null, perSeat: true },
      { label: 'API direct', price: null, perSeat: false, isApi: true },
    ],
  },
  ChatGPT: {
    id: 'chatgpt',
    name: 'ChatGPT',
    color: '#1D9E75',
    isApi: false,
    plans: [
      { label: 'Free', price: 0, perSeat: false },
      { label: 'Go (~$5/mo)', price: 5, perSeat: false },
      { label: 'Plus (~$24/mo)', price: 24, perSeat: false },
      { label: 'Pro (~$128/mo)', price: 128, perSeat: false },
      { label: 'Business', price: 22, perSeat: true },
      { label: 'Enterprise', price: null, perSeat: true },
      { label: 'API direct', price: null, perSeat: false, isApi: true },
    ],
  },
  'Anthropic API': {
    id: 'anthropic-api',
    name: 'Anthropic API',
    color: '#BA7517',
    isApi: true,
    plans: [
      { label: 'Pay-as-you-go', price: null, perSeat: false, isApi: true },
    ],
  },
  'OpenAI API': {
    id: 'openai-api',
    name: 'OpenAI API',
    color: '#1D9E75',
    isApi: true,
    plans: [
      { label: 'Pay-as-you-go', price: null, perSeat: false, isApi: true },
    ],
  },
  Gemini: {
    id: 'gemini',
    name: 'Gemini',
    color: '#185FA5',
    isApi: false,
    plans: [
      { label: 'Free', price: 0, perSeat: false },
      { label: 'AI Premium ($20/mo)', price: 20, perSeat: false },
      { label: 'API direct', price: null, perSeat: false, isApi: true },
    ],
  },
  Windsurf: {
    id: 'windsurf',
    name: 'Windsurf',
    color: '#0F6E56',
    isApi: false,
    plans: [
      { label: 'Free', price: 0, perSeat: false },
      { label: 'Pro', price: 20, perSeat: false },
      { label: 'Max', price: 200, perSeat: false },
      { label: 'Teams', price: 40, perSeat: true },
      { label: 'Enterprise', price: null, perSeat: true },
    ],
  },
}

export const COMPANY_NAMES = Object.keys(TOOLS)

export function getPriceHint(company: string, planLabel: string, seats: string): string {
  const tool = TOOLS[company]
  if (!tool) return ''
  const p = tool.plans.find((pl) => pl.label === planLabel)
  if (!p) return ''
  if (p.isApi) return 'Pay only for what you use — enter your last monthly bill'
  if (p.price === null) return 'Custom pricing — enter your contract amount'
  if (p.perSeat) {
    const n = parseInt(seats || '0')
    if (n > 0) return `$${p.price} x ${n} seats = $${p.price * n}/mo (auto-filled)`
    return `$${p.price}/seat/month — enter number of seats`
  }
  return `$${p.price}/month flat rate (auto-filled)`
}