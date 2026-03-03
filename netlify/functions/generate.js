exports.handler = async function(event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  try {
    const body = JSON.parse(event.body);
    const profile = body.profile;

    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

    if (!ANTHROPIC_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "API key not configured." })
      };
    }

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
        system: "You are a retirement relocation research specialist creating educational retirement blueprints for Northeast US retirees. Content is educational only, not financial advice. Use ranges not specific figures. Use people in similar situations typically language. Always refer to licensed professionals. Format with headers like === SECTION NAME ===. Target 1500-2000 words.",
        messages: [{
          role: "user",
          content: "Create a Retirement Relocation Blueprint for: " + profile.firstName + ", age " + profile.age + ", from " + profile.location + ", retiring in " + profile.timeline + ", home " + profile.homeOwner + " worth " + profile.homeValue + ", income " + profile.income + ", savings: " + profile.savings + ", priority: " + profile.priority + ", concern: " + profile.concern + ", destination: " + profile.destination + ", lifestyle: " + profile.lifestyle + ", proximity: " + profile.proximity + ", rent first: " + profile.rentFirst + ". Include: 1) SNAPSHOT 2) COST OF STAYING VS MOVING 3) TOP 3 DESTINATION MATCHES 4) SOCIAL SECURITY OVERVIEW end with CFP referral 5) BUDGET SCENARIOS three levels end with CFP referral 6) HOME TRANSITION OPTIONS 3 paths 7) LEGAL AND TAX CONSIDERATIONS domicile NY NJ audit risk 8) ACTION PLAN 90 day 6 month 1 year 9) QUESTIONS FOR YOUR PROFESSIONALS 10) EDUCATIONAL DISCLAIMER"
        }]
      })
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch(e) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Unexpected response: " + text.substring(0, 300) })
      };
    }

    if (data.error) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: data.error.message })
      };
    }

    const blueprint = (data.content && data.content[0] && data.content[0].text) ? data.content[0].text : "No content returned";

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
