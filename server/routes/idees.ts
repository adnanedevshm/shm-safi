import querystring from "querystring";

export const handleIdee: RequestHandler = async (req, res) => {
  try {
    const sid = process.env.TWILIO_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM;
    const to = process.env.TWILIO_TO;

    if (!sid || !token || !from || !to) {
      return res.status(500).json({ error: "Twilio not configured on server" });
    }

    const { shortIdea, development, resources, budget, name, contact } = req.body as Record<string, any>;
    if (!shortIdea) return res.status(400).json({ error: "shortIdea is required" });

    // Build message body
    const lines = [] as string[];
    if (name) lines.push(`Nom: ${name}`);
    if (contact) lines.push(`Contact: ${contact}`);
    lines.push(`Idée (<=100): ${shortIdea}`);
    if (development) lines.push(`Développement (<=860): ${development}`);
    if (resources) lines.push(`Ressources (<=400): ${resources}`);
    if (budget !== undefined) lines.push(`Estimation budget: ${budget}`);

    const body = lines.join("\n\n");

    // Send via Twilio WhatsApp API
    const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
    const payload = {
      From: `whatsapp:${from}`,
      To: `whatsapp:${to}`,
      Body: body,
    };

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
      },
      body: querystring.stringify(payload),
    });

    const txt = await resp.text();
    let parsed: any = null;
    try { parsed = JSON.parse(txt); } catch (e) { parsed = null; }

    if (!resp.ok) {
      return res.status(500).json({ error: "Failed to send message", detail: parsed || txt });
    }

    return res.json({ success: true, message: parsed });
  } catch (err: any) {
    console.error("idees error", err);
    return res.status(500).json({ error: err?.message || "unknown" });
  }
};
