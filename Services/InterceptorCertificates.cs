using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;

namespace SUEQ_API.Services
{
    public class InterceptorCertificates
    {
        private readonly IHttpClientFactory _clientFactory;
        public InterceptorCertificates(IHttpClientFactory clientFactory)
        {
            _clientFactory = clientFactory;
        }
        public async Task<JsonDocument> OnGet()
        {
            var client = _clientFactory.CreateClient("CertificatedInterceptor");
            Console.WriteLine("Wow, I'am here!");
            var request = new HttpRequestMessage()
            {
                RequestUri = new Uri($"{Startup.Configuration["urls"].Split(new char[] { '^' }, 1)[0]}/api/values"),
                Method = HttpMethod.Get,
            };
            var response = await client.SendAsync(request);
            if (response.IsSuccessStatusCode)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                var data = JsonDocument.Parse(responseContent);
                return data;
            }

            throw new ApplicationException($"Status code: {response.StatusCode}, Error: {response.ReasonPhrase}");
        }
    }
}
