using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace SUEQ_API.Models
{
    public class User
    {
        [Key]
        public int UserId { get; set; }
        [Required]
        public string Email { get; set; }
        public bool EmailConfirmed { get; set; }
        [Required]
        public string PasswordHash { get; set; }
        [Required]
        public byte[] PasswordSalt { get; set; }

        public string FirstName { get; set; }
        public string SurName { get; set; }
        public string LastName { get; set; }

        public List<Queue> Queues { get; set; }
        public List<Position> Positions { get; set; }
        public Refresh RefreshRecord { get; set; }
    }
}
