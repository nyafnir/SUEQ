using SUEQ_API.Models;
using System.Net;
using System.Web.Helpers;

namespace SUEQ_API.Services
{
    public class GoogleCaptcha
    {
        public static bool ValidateCaptcha(string response)
        {
            if (response == null)
                return false;

            var client = new WebClient();
            var reply = client.DownloadString(
                    string.Format(
                        "https://www.google.com/recaptcha/api/siteverify?secret={0}&response={1}", Startup.Configuration["GoogleCaptcha:PrivateKey"],
                    response));

            var captchaResponse = Json.Decode(reply);
            if (captchaResponse?.success)
            {
                return true;
            }
            return false;
        }

        public static Response NotValidCaptcha()
        {
            return new Response
            {
                Code = 422,
                DevMessage = "Captcha invalid.",
                UserMessage = "Необходимо правильно пройти каптчу!"
            };
        }
    }
}
