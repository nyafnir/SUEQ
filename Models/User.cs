using System.Collections.Generic;

namespace SUEQ_API.Models
{
    public class User
    {
        public int UserId { get; set; }

        public string Email { get; set; }
        // public bool Confirm { get; set; }

        public string PasswordHash { get; set; }
        public byte[] PasswordSalt { get; set; }

        public string FirstName { get; set; }
        public string SurName { get; set; }
        public string LastName { get; set; }

        public List<Queue> Queues { get; set; }
    }
}
