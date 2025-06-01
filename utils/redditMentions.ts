export async function getRedditMentions(phrase: string) {
  // Mocked Reddit mention count
  return {
    count: Math.floor(Math.random() * 50),
  };
}
