export async function googleTrendsFetcher(phrase: string) {
  // Mocked Google Trends response
  return {
    score: Math.floor(Math.random() * 100),
  };
}
