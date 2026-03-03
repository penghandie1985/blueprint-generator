exports.handler = async function(event, context) {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // CORS headers so your frontend can call this
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  try {
    const { profile } = JSON.parse(event.body);

    // Your API key lives here on the SERVER - never exposed to users
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

    if (!ANTHROPIC_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "API key not configured. Add it in Netlify environment variables." })
      };
    }

    const systemPrompt = `You are a retirement relocation research specialist creating educational retirement blueprints for Northeast US retirees considering relocation to lower-cost, lower-tax states.

CRITICAL RULES:
1. EDUCATIONAL content only — NOT financial, investment, tax, or legal advice
2. NEVER tell someone specifically what to do with their money
3. NEVER recommend specific investment products, funds, or securities
4. Always use ranges and general figures, never specific personalized projections
5. Use "people in similar situations typically..." not "you should..."
6. Every section touching money MUST end with referral to a licensed professional
7. Frame everything as considerations and scenarios to explore
8. Warm, plain English — no jargon. Target 1,500-2,000 words.
Format with headers like: === SECTION NAME ===`;

    const userPrompt = `Create a personalized Retirement Relocation Blueprint using the THREE SCENARIO MODEL for major decisions.

CLIENT: ${profile.firstName}, age ${profile.age}, lives in ${profile.location}
Timeline: ${profile.timeline} | Home: ${profile.homeOwner} worth ${profile.homeValue}
Income: ${profile.income} | Savings: ${profile.savings} | Priority: ${profile.priority}
Concern: ${profile.concern} | Destination: ${profile.destination} | Lifestyle: ${profile.lifestyle}
Proximity important: ${profile.proximity} | Rent first: ${profile.rentFirst}

Sections:
1) SNAPSHOT - warm personalized summary
2) COST OF STAYING VS MOVING - tax and cost comparisons with ranges
3) TOP 3 DESTINATION MATCHES - with pros, cons, cities, costs for each
4) SOCIAL SECURITY OVERVIEW - educational only, end with CFP referral
5) BUDGET SCENARIOS - conservative/moderate/comfortable with ranges, end with CFP referral
6) HOME TRANSITION OPTIONS - 3 paths (sell+buy / sell+rent first / test the move)
7) LEGAL & TAX CONSIDERATIONS - domicile, NY/NJ audit risk, timing, recommend attorney+CPA
8) ACTION PLAN - 90 day, 6 month, 1 year checklists
9) QUESTIONS TO ASK YOUR PROFESSIONALS - for CPA, CFP, real estate attorney
10) EDUCATIONAL DISCLAIMER`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 3000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }]
      })
    });

    const data = await response.json();

    if (data.error) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: data.error.message })
      };
    }

    const blueprint = data.content?.map(b => b.text || "").join("") || "";

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ blueprint })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Server error: " + err.message })
    };
  }
};
