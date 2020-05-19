using System.Collections.Generic;

namespace SUEQ_API.Models
{
    public class Refresh
    {
        public int UserId { get; set; }
        public List<User> Users { get; set; }

        public string RefreshToken { get; set; }
    }
}
