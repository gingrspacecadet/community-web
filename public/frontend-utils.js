export async function getCookieValue(cookieHeader, key) {
  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  for (const cookie of cookies) {
    const [name, value] = cookie.split("=");
    if (name === key) {
      return value;
    }
  }
  return null;
}
