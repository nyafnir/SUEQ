using System.IO;
using System.Security.Cryptography.X509Certificates;

namespace SUEQ_API.Services
{
    public class CertificateValidation
    {
        public bool ValidateCertificate(X509Certificate2 clientCertificate)
        {
            var cert = new X509Certificate2(
                Path.Combine(Startup.Configuration["Certificate:Path"]), Startup.Configuration["Certificate:Password"]);

            if (clientCertificate.Thumbprint == cert.Thumbprint)
            {
                return true;
            }

            return false;
        }
    }
}
