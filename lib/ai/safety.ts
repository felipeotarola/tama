const SERIOUS_PATTERNS = [
  /\b(självmord|ta livet av mig|skada mig själv|vill dö|döda mig)\b/i,
  /\b(self harm|suicide|kill myself|want to die)\b/i,
  /\b(övergrepp|misshandlad|slår mig|rör mig|hemlighet från mamma|hemlighet från pappa)\b/i,
  /\b(abuse|hurting me|touching me|secret from my parents)\b/i,
  /\b(vilse|borttappad|hittar inte hem|rädd hemma|rädd för någon)\b/i,
  /\b(lost|can't find home|scared at home|afraid of someone)\b/i,
  /\b(akut|ambulans|kan inte andas|blöder mycket|brutit benet)\b/i,
  /\b(emergency|ambulance|can't breathe|bleeding a lot)\b/i,
  /\b(mobbad|mobbning|retad varje dag|hotad)\b/i,
  /\b(bullied|bullying|threatened)\b/i,
];

const PRIVATE_INFO_PATTERNS = [
  /\b(adress|telefonnummer|lösenord|vilken skola|var bor du|hemlighet)\b/i,
  /\b(address|phone number|password|what school|where do you live|secret)\b/i,
];

export const TRUSTED_GROWN_UP_RESPONSE =
  "Det där låter viktigt. Prata med en vuxen du litar på. Jag stannar här med dig.";

export const CHAT_FALLBACK_RESPONSE =
  "Hmm... jag blev lite sömnig. Kan du säga det igen?";

export function hasSeriousSafetySignal(message: string) {
  return SERIOUS_PATTERNS.some((pattern) => pattern.test(message));
}

export function repairAssistantResponse(response: string) {
  if (!response.trim()) {
    return CHAT_FALLBACK_RESPONSE;
  }

  if (PRIVATE_INFO_PATTERNS.some((pattern) => pattern.test(response))) {
    return "Jag behöver inte veta privata saker. Vi kan prata om något mysigt eller leka en liten lek.";
  }

  if (hasSeriousSafetySignal(response)) {
    return TRUSTED_GROWN_UP_RESPONSE;
  }

  return response.trim();
}

export function limitAssistantResponse(response: string) {
  const trimmed = response.trim().replace(/\s+/g, " ");
  return trimmed.length > 360 ? `${trimmed.slice(0, 357).trim()}...` : trimmed;
}
