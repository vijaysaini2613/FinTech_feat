import dotenv from 'dotenv';
dotenv.config();

export interface CustomerNudge {
  nudgeId: string;
  taskId: string;
  nudgeSequence: 1 | 2;
  channel: 'WHATSAPP' | 'SMS';
  recipientPhone: string;
  recipientEmail: string;
  messageText: string;
  actionUrl: string;
  createdAt: string;
  status: 'SENT' | 'HALTED_BY_KILL_SWITCH';
}

export class NudgeService {
  private nudgeTracker: Map<string, CustomerNudge[]> = new Map();

  /**
   * Generates a rate-limited WhatsApp nudge powered by Google Gemini 2.5 Flash AI.
   */
  public async generateUPIMigrationNudgeAsync(params: {
    taskId: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    amount: number;
    merchantName: string;
    mandateLink: string;
    nudgeSequence?: 1 | 2;
  }): Promise<CustomerNudge | null> {
    const existingNudges = this.nudgeTracker.get(params.taskId) || [];

    // Rate-limiting Policy: Max 2 notifications per failed invoice
    if (existingNudges.length >= 2) {
      console.log(`[Dunning Policy Engine] Max nudges (2/2) reached for task ${params.taskId}. Suppressing further notifications.`);
      return null;
    }

    const sequence = (existingNudges.length + 1) as 1 | 2;
    const formattedAmount = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(params.amount);

    let messageText = '';
    try {
      const aiCopy = await this.callGeminiNudgeCopy(params.customerName, formattedAmount, params.merchantName, params.mandateLink, sequence);
      if (aiCopy) {
        messageText = aiCopy;
      }
    } catch (err) {
      console.warn('Gemini Nudge Copy API failed, falling back to template copy:', err);
    }

    if (!messageText) {
      if (sequence === 1) {
        messageText = `Hi ${params.customerName}, your recurring subscription of ${formattedAmount} for ${params.merchantName} was paused due to a bank token expiration under RBI guidelines. Click here to instantly re-authorize using UPI AutoPay in 1-tap: ${params.mandateLink}`;
      } else {
        messageText = `[Final Reminder] Hi ${params.customerName}, your subscription of ${formattedAmount} for ${params.merchantName} will be cancelled in 24 hours. Re-authorize your UPI AutoPay mandate now to maintain uninterrupted access: ${params.mandateLink}`;
      }
    }

    const nudge: CustomerNudge = {
      nudgeId: `nudge_${Date.now()}_seq${sequence}`,
      taskId: params.taskId,
      nudgeSequence: sequence,
      channel: 'WHATSAPP',
      recipientPhone: params.customerPhone,
      recipientEmail: params.customerEmail,
      messageText,
      actionUrl: params.mandateLink,
      createdAt: new Date().toISOString(),
      status: 'SENT',
    };

    existingNudges.push(nudge);
    this.nudgeTracker.set(params.taskId, existingNudges);

    return nudge;
  }

  public generateUPIMigrationNudge(params: {
    taskId: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    amount: number;
    merchantName: string;
    mandateLink: string;
    nudgeSequence?: 1 | 2;
  }): CustomerNudge | null {
    // Synchronous fallback wrapper
    const existingNudges = this.nudgeTracker.get(params.taskId) || [];
    if (existingNudges.length >= 2) return null;
    const sequence = (existingNudges.length + 1) as 1 | 2;
    const formattedAmount = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(params.amount);

    const messageText = sequence === 1
      ? `Hi ${params.customerName}, your recurring subscription of ${formattedAmount} for ${params.merchantName} was paused due to a bank token expiration under RBI guidelines. Click here to instantly re-authorize using UPI AutoPay in 1-tap: ${params.mandateLink}`
      : `[Final Reminder] Hi ${params.customerName}, your subscription of ${formattedAmount} for ${params.merchantName} will be cancelled in 24 hours. Re-authorize your UPI AutoPay mandate now: ${params.mandateLink}`;

    const nudge: CustomerNudge = {
      nudgeId: `nudge_${Date.now()}_seq${sequence}`,
      taskId: params.taskId,
      nudgeSequence: sequence,
      channel: 'WHATSAPP',
      recipientPhone: params.customerPhone,
      recipientEmail: params.customerEmail,
      messageText,
      actionUrl: params.mandateLink,
      createdAt: new Date().toISOString(),
      status: 'SENT',
    };

    existingNudges.push(nudge);
    this.nudgeTracker.set(params.taskId, existingNudges);
    return nudge;
  }

  private async callGeminiNudgeCopy(customerName: string, amountStr: string, merchantName: string, mandateLink: string, sequence: 1 | 2): Promise<string | null> {
    const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyBfBuE5z_PVgpzEJXL4nD0myhpU5o-PDGE';
    if (!apiKey) return null;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const prompt = `Write a high-converting, polite WhatsApp recovery message for an Indian customer.
Customer Name: ${customerName}
Subscription Amount: ${amountStr}
Merchant: ${merchantName}
Action Link: ${mandateLink}
Sequence: ${sequence === 1 ? 'Initial notification' : 'Final 24h urgency reminder'}

Keep it under 35 words. Explain that the card mandate was paused per RBI e-mandate guidelines and provide the 1-tap UPI AutoPay link.
Return ONLY the raw message string without quotes or markdown.`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 }
      })
    });

    if (!res.ok) return null;
    const data = await res.json();
    const copy = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return copy ? copy.trim() : null;
  }

  public triggerKillSwitch(taskId: string): void {
    const nudges = this.nudgeTracker.get(taskId) || [];
    nudges.forEach(n => { n.status = 'HALTED_BY_KILL_SWITCH'; });
    this.nudgeTracker.set(taskId, nudges);
    console.log(`[Dunning Kill Switch] Halting all automated notifications for task ${taskId}. Subscription cancelled by customer.`);
  }

  public getNudgesForTask(taskId: string): CustomerNudge[] {
    return this.nudgeTracker.get(taskId) || [];
  }
}

export const nudgeService = new NudgeService();
